import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createChartFromBin } from "../src/node_js/rift_essentials.mjs";

globalThis.window = {};
for (const script of ["chart_metadata.js", "chart_store.js"]) {
  vm.runInThisContext(fs.readFileSync(new URL(`../src/js/${script}`, import.meta.url), "utf8"));
}
const { ChartStore, readChartMetadata } = window;
const source = JSON.parse(fs.readFileSync(new URL("../data/charts/chart_list.json", import.meta.url)));
const catalogPath = "data/charts/chart_list.json";
const pathOf = (p) => p.replace(/^\.\.\/\.\.\//, "");
const arrayBuffer = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const bytesOf = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url));
const fields = { update_date: "2026-11-09", dlc: "Test pack", free_dlc: true };

// Model the browser's directory handles and write-on-close streams entirely in
// memory. No test writes to the real repository, catalog, charts or artwork.
class MemoryRepository {
  constructor() { this.files = new Map(); this.directories = new Set([""]); this.fail = null; this.afterWrite = null; }
  put(path, bytes) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) this.directories.add(parts.slice(0, i).join("/"));
    this.files.set(path, Buffer.from(bytes));
  }
  directory(prefix = "") {
    const root = this;
    const full = (name) => prefix ? `${prefix}/${name}` : name;
    return {
      async getDirectoryHandle(name, { create = false } = {}) {
        const path = full(name);
        if (!root.directories.has(path) && !create) throw new DOMException("Missing directory", "NotFoundError");
        root.directories.add(path);
        return root.directory(path);
      },
      async getFileHandle(name, { create = false } = {}) {
        const path = full(name);
        if (!root.files.has(path)) {
          if (!create) throw new DOMException("Missing file", "NotFoundError");
          root.files.set(path, Buffer.alloc(0));
        }
        return {
          async getFile() { return new File([root.files.get(path)], name); },
          async createWritable() {
            let pending;
            return {
              async write(data) { pending = Buffer.from(await new Blob([data]).arrayBuffer()); },
              async close() {
                if (root.fail?.(path)) throw new Error("Injected write failure");
                root.files.set(path, pending);
                root.afterWrite?.(path);
              },
              async abort() {}
            };
          }
        };
      },
      async removeEntry(name) {
        if (root.failRemove?.(full(name))) throw new Error("Injected cleanup failure");
        if (!root.files.delete(full(name))) throw new DOMException("Missing file", "NotFoundError");
      }
    };
  }
}

function fixture(sharedArtwork = false) {
  const root = new MemoryRepository();
  const catalog = { RRDiscoDisaster: structuredClone(source.RRDiscoDisaster) };
  if (sharedArtwork) catalog.RRAmalgamaniac = { ...structuredClone(source.RRAmalgamaniac), art: catalog.RRDiscoDisaster.art };
  for (const entry of Object.values(catalog)) {
    for (const path of [entry.art, ...Object.values(entry.chart)]) root.put(pathOf(path), bytesOf(pathOf(path)));
  }
  const text = JSON.stringify(catalog, null, 4) + "\n";
  root.put(catalogPath, text);
  return { root, catalog, text };
}

function binaries(key, replacements = true) {
  return new Map(Object.entries(source[key].chart).map(([, path], index) => {
    const bytes = bytesOf(pathOf(path));
    return [index + 1, { file: new File([bytes], path.split("/").at(-1)), metadata: readChartMetadata(arrayBuffer(bytes), true), replacement: replacements }];
  }));
}
const actualAssets = (root) => [...root.files.keys()].filter((p) => p.startsWith("data/") && p !== catalogPath);

test("full validation agrees with the existing decoder for all 468 captures", () => {
  let count = 0;
  for (const entry of Object.values(source)) for (const path of Object.values(entry.chart)) {
    const buffer = arrayBuffer(bytesOf(pathOf(path)));
    const metadata = readChartMetadata(buffer, true);
    const decoded = createChartFromBin(buffer);
    assert.equal(metadata.title, decoded.chartName);
    assert.equal(metadata.levelID, decoded.levelID);
    assert.equal(metadata.difficulty, decoded.difficulty);
    assert.equal(metadata.intensity, decoded.intensity);
    count++;
  }
  assert.equal(count, 468);
});

test("rejects truncated payloads, trailing bytes, unsupported versions and invalid lanes", () => {
  const bytes = bytesOf(pathOf(source.RRDiscoDisaster.chart.easy));
  for (const length of [0, 1, 20, 80, bytes.length - 1]) assert.throws(() => readChartMetadata(arrayBuffer(bytes.subarray(0, length)), true));
  assert.throws(() => readChartMetadata(arrayBuffer(Buffer.concat([bytes, Buffer.from([0])])), true), /trailing/);
  const changed = Buffer.from(bytes);
  changed.writeInt32LE(999, 1 + changed[0]);
  assert.throws(() => readChartMetadata(arrayBuffer(changed), true), /Unsupported/);
  let offset = 1 + bytes[0] + 4;
  offset += 1 + bytes[offset]; offset += 1 + bytes[offset];
  offset += 4 + 4 + 1 + 4 + 4 + 4 + 4;
  const bpmCount = bytes.readInt32LE(offset); offset += 4 + bpmCount * 20;
  const beatCount = bytes.readInt32LE(offset); offset += 4 + beatCount * 8;
  assert(bytes.readInt32LE(offset) > 0); offset += 4;
  const invalidLane = Buffer.from(bytes); invalidLane.writeInt32LE(9, offset + 32 + 4);
  assert.throws(() => readChartMetadata(arrayBuffer(invalidLane), true), /lane/);
});

test("adds four binaries, artwork and all catalog fields with a recovery backup", async () => {
  const { root, text } = fixture();
  const b = binaries("RRAmalgamaniac");
  const result = await ChartStore.commit(root.directory(), { mode: "add", expectedText: text, binaries: b, artwork: new Blob(["webp"]), fields });
  const entry = result.catalog.RRAmalgamaniac;
  assert.equal(entry.title, "AMALGAMANIAC");
  assert.equal(entry.update_date, fields.update_date);
  assert.equal(entry.dlc, fields.dlc);
  assert.equal(entry.free_dlc, true);
  assert.deepEqual(entry.intensity, [...b.values()].map((e) => e.metadata.intensity));
  for (const path of Object.values(entry.chart)) assert.match(path, /_RRAmalgamaniac_(Easy|Medium|Hard|Impossible)\.bin$/);
  for (const [index, path] of Object.values(entry.chart).entries()) assert.deepEqual(root.files.get(pathOf(path)), Buffer.from(await b.get(index + 1).file.arrayBuffer()));
  assert.equal(root.files.get(`${result.backupPath}/chart_list.json`).toString(), text);
  assert.equal(root.files.get(catalogPath).toString(), result.text);
  assert.equal(actualAssets(root).length, 10);
});

test("metadata-only edit preserves paths, curated title, artist and unrelated fields", async () => {
  const { root, catalog } = fixture();
  catalog.RRDiscoDisaster.custom_field = "preserve me";
  const text = JSON.stringify(catalog); root.put(catalogPath, text);
  const before = actualAssets(root).sort();
  const result = await ChartStore.commit(root.directory(), { mode: "edit", key: "RRDiscoDisaster", expectedText: text, binaries: binaries("RRDiscoDisaster", false), artwork: null, fields });
  assert.deepEqual(result.catalog.RRDiscoDisaster.chart, catalog.RRDiscoDisaster.chart);
  assert.equal(result.catalog.RRDiscoDisaster.title, catalog.RRDiscoDisaster.title);
  assert.equal(result.catalog.RRDiscoDisaster.custom_field, "preserve me");
  assert.equal(result.catalog.RRDiscoDisaster.free_dlc, true);
  assert.deepEqual(actualAssets(root).sort(), before);
});

test("replacement edit backs up old files, preserves shared artwork and replaces one difficulty", async () => {
  const { root, catalog, text } = fixture(true);
  const b = binaries("RRDiscoDisaster", false); b.get(3).replacement = true;
  const oldPath = pathOf(catalog.RRDiscoDisaster.chart.hard);
  const oldBytes = root.files.get(oldPath);
  const result = await ChartStore.commit(root.directory(), { mode: "edit", key: "RRDiscoDisaster", expectedText: text, binaries: b, artwork: new Blob(["new art"]), fields });
  const updated = result.catalog.RRDiscoDisaster;
  assert.notEqual(updated.chart.hard, catalog.RRDiscoDisaster.chart.hard);
  assert.equal(updated.chart.easy, catalog.RRDiscoDisaster.chart.easy);
  assert(!root.files.has(oldPath));
  assert.deepEqual(root.files.get(`${result.backupPath}/${oldPath}`), oldBytes);
  assert(root.files.has(pathOf(catalog.RRDiscoDisaster.art)), "shared artwork retained");
});

test("delete removes unshared charts and keeps artwork referenced by another song", async () => {
  const { root, catalog, text } = fixture(true);
  const result = await ChartStore.commit(root.directory(), { mode: "delete", key: "RRDiscoDisaster", expectedText: text });
  assert(!Object.hasOwn(result.catalog, "RRDiscoDisaster"));
  assert(root.files.has(pathOf(catalog.RRDiscoDisaster.art)));
  for (const path of Object.values(catalog.RRDiscoDisaster.chart)) {
    assert(!root.files.has(pathOf(path)));
    assert(root.files.has(`${result.backupPath}/${pathOf(path)}`));
  }
});

test("rejects stale catalogs, duplicate keys, mixed songs, invalid dates and corrupt replacement payloads", async () => {
  const { root, text } = fixture();
  const base = { mode: "add", expectedText: text, binaries: binaries("RRDiscoDisaster"), artwork: new Blob(["webp"]), fields };
  await assert.rejects(ChartStore.commit(root.directory(), { ...base, expectedText: "old" }), /changed on disk/);
  await assert.rejects(ChartStore.commit(root.directory(), base), /already exists/);
  const mixed = binaries("RRAmalgamaniac"); mixed.set(1, binaries("RRDiscoDisaster").get(1));
  await assert.rejects(ChartStore.commit(root.directory(), { ...base, binaries: mixed }), /same song/);
  await assert.rejects(ChartStore.commit(root.directory(), { ...base, binaries: binaries("RRAmalgamaniac"), fields: { ...fields, update_date: "2026-02-30" } }), /valid update date/);
  const corrupt = binaries("RRAmalgamaniac"); corrupt.get(1).file = new File(["invalid"], "bad.bin");
  await assert.rejects(ChartStore.commit(root.directory(), { ...base, binaries: corrupt }));
  assert.equal(root.files.get(catalogPath).toString(), text);
  assert.equal(actualAssets(root).length, 5);
});

test("failed catalog write retains original catalog/assets and removes staged replacements", async () => {
  const { root, text } = fixture();
  const before = actualAssets(root).sort();
  root.fail = (path) => path === catalogPath;
  await assert.rejects(ChartStore.commit(root.directory(), { mode: "add", expectedText: text, binaries: binaries("RRAmalgamaniac"), artwork: new Blob(["webp"]), fields }), /Original catalog retained/);
  assert.equal(root.files.get(catalogPath).toString(), text);
  assert.deepEqual(actualAssets(root).sort(), before);
  assert([...root.files.keys()].some((p) => p.startsWith(".chart-manager-backups/") && p.endsWith("chart_list.json")));
});

test("detects a catalog change while staging files without overwriting it", async () => {
  const { root, text } = fixture();
  const before = actualAssets(root).sort();
  root.afterWrite = (path) => { if (path.startsWith("data/album_arts/")) root.put(catalogPath, "{}"); };
  await assert.rejects(ChartStore.commit(root.directory(), { mode: "add", expectedText: text, binaries: binaries("RRAmalgamaniac"), artwork: new Blob(["webp"]), fields }), /catalog state could not be confirmed/);
  assert.equal(root.files.get(catalogPath).toString(), "{}");
  for (const path of before) assert(root.files.has(path));
});

test("cleanup failure reports a warning after a successful catalog commit", async () => {
  const { root, text } = fixture();
  root.failRemove = () => true;
  const result = await ChartStore.commit(root.directory(), { mode: "delete", key: "RRDiscoDisaster", expectedText: text });
  assert.equal(result.warnings.length, 5);
  assert.equal(root.files.get(catalogPath).toString(), result.text);
});

test("an ambiguous close error does not roll back assets used by a committed catalog", async () => {
  const { root, text } = fixture();
  root.afterWrite = (path) => { if (path === catalogPath) throw new Error("Close reported failure after commit"); };
  const result = await ChartStore.commit(root.directory(), { mode: "add", expectedText: text, binaries: binaries("RRAmalgamaniac"), artwork: new Blob(["webp"]), fields });
  for (const path of Object.values(result.catalog.RRAmalgamaniac.chart)) assert(root.files.has(pathOf(path)));
  assert.equal(root.files.get(catalogPath).toString(), result.text);
});

// Exercise the actual manager event handlers with a small DOM adapter. The
// browser's image decoding/picker/permissions are mocked; repository I/O still
// passes through the same store used by the shipped page.
function managerUI(root) {
  class Node {
    constructor(tag = "div") {
      this.tagName = tag; this.children = []; this.handlers = {}; this.className = "";
      this.value = ""; this.checked = false; this.files = []; this.disabled = false;
      this.style = { setProperty() {} };
      this.classList = {
        toggle: (name, force) => {
          const classes = new Set(this.className.split(/\s+/).filter(Boolean));
          const enabled = force ?? !classes.has(name);
          if (enabled) classes.add(name); else classes.delete(name);
          this.className = [...classes].join(" "); return enabled;
        }
      };
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this[name] = value; }
    removeAttribute(name) { delete this[name]; }
    addEventListener(name, handler) { (this.handlers[name] ??= []).push(handler); }
    async emit(name) { for (const handler of this.handlers[name] || []) await handler({ currentTarget: this, preventDefault() {} }); }
    querySelectorAll(selector) {
      const matches = [];
      for (const child of this.children) {
        if (selector.startsWith(".") ? child.className.split(/\s+/).includes(selector.slice(1)) : child.tagName === selector) matches.push(child);
        matches.push(...child.querySelectorAll(selector));
      }
      return matches;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0]; }
    showModal() { this.open = true; }
    close() { this.open = false; this.emit("close"); }
  }
  const html = fs.readFileSync(new URL("../site.html", import.meta.url), "utf8");
  const nodes = Object.fromEntries([...html.matchAll(/id="([\w-]+)"/g)].map((m) => [m[1], new Node()]));
  assert.equal(Object.keys(nodes).length, [...html.matchAll(/id="([\w-]+)"/g)].length, "unique HTML ids");
  nodes.empty.append(new Node("h3"), new Node("p"));
  nodes["chart-form"].elements = Object.fromEntries(["update_date", "dlc", "free_dlc"].map((name) => [name, new Node("input")]));
  nodes["chart-form"].reset = () => {
    for (const field of Object.values(nodes["chart-form"].elements)) { field.value = ""; field.checked = false; }
    nodes["art-file"].files = []; nodes["binary-files"].files = [];
  };
  const document = {
    getElementById(id) { assert(nodes[id], `Missing HTML id: ${id}`); return nodes[id]; },
    createElement(tag) {
      const node = new Node(tag);
      if (tag === "canvas") {
        node.getContext = () => ({ drawImage() {} });
        node.toBlob = (callback) => callback(new Blob(["webp"], { type: "image/webp" }));
      }
      return node;
    },
    querySelectorAll(selector) { return Object.values(nodes).flatMap((node) => node.querySelectorAll(selector)); }
  };
  const handle = root.directory(); handle.name = "Test repo";
  handle.requestPermission = async () => root.permission ?? "granted";
  Object.defineProperty(nodes, "alerts", { value: [] });
  const context = vm.createContext({ document, window: { location: { protocol: "file:" }, showDirectoryPicker: async () => handle, confirm: () => true, alert: (message) => nodes.alerts.push(message) }, URL: { createObjectURL: () => "blob:preview", revokeObjectURL() {} }, File, Blob, TextDecoder, DataView, Uint8Array, crypto, createImageBitmap: async () => ({ width: 64, height: 64, close() {} }) });
  for (const script of ["chart_metadata.js", "chart_store.js", "manager.js"]) vm.runInContext(fs.readFileSync(new URL(`../src/js/${script}`, import.meta.url), "utf8"), context);
  return nodes;
}
async function waitFor(predicate) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("UI operation did not finish");
}

test("Add form enables saving only after validation, date and artwork; writes through to catalog", async () => {
  const { root } = fixture();
  const nodes = managerUI(root);
  await nodes["select-folder"].emit("click");
  await nodes["add-chart"].emit("click");
  assert.equal(nodes["save-chart"].disabled, true);
  nodes["binary-files"].files = [...binaries("RRAmalgamaniac").values()].map((e) => e.file).reverse();
  await nodes["binary-files"].emit("change");
  assert.equal(nodes["chart-details"].disabled, false);
  assert.equal(nodes["save-chart"].disabled, true);
  nodes["chart-form"].elements.update_date.value = fields.update_date;
  nodes["chart-form"].elements.dlc.value = fields.dlc;
  nodes["chart-form"].elements.free_dlc.checked = true;
  await nodes["chart-form"].emit("input");
  assert.equal(nodes["save-chart"].disabled, true);
  nodes["art-file"].files = [new File(["image"], "cover.png")];
  await nodes["art-file"].emit("change");
  assert.equal(nodes["save-chart"].disabled, false);
  await nodes["chart-form"].emit("submit");
  await waitFor(() => !nodes["chart-dialog"].open);
  const saved = JSON.parse(root.files.get(catalogPath));
  assert.equal(saved.RRAmalgamaniac.free_dlc, true);
  assert.equal(saved.RRAmalgamaniac.dlc, fields.dlc);
  assert.match(nodes.status.textContent, /Saved RRAmalgamaniac/);
});

test("Edit loads persisted values, denied permission leaves disk unchanged, then Save and Delete work", async () => {
  const { root, text } = fixture();
  const nodes = managerUI(root);
  await nodes["select-folder"].emit("click");
  let edit = nodes.catalog.querySelector("button");
  await edit.emit("click");
  assert.equal(nodes["save-chart"].disabled, false);
  assert.equal(nodes["delete-chart"].hidden, false);
  assert.equal(nodes["chart-form"].elements.update_date.value, source.RRDiscoDisaster.update_date);
  nodes["chart-form"].elements.free_dlc.checked = true;
  root.permission = "denied";
  await nodes["chart-form"].emit("submit");
  await waitFor(() => nodes["form-note"].textContent.includes("permission was not granted"));
  assert.equal(root.files.get(catalogPath).toString(), text);
  assert.equal(nodes["chart-dialog"].open, true);
  root.permission = "granted";
  await nodes["chart-form"].emit("submit");
  await waitFor(() => !nodes["chart-dialog"].open);
  assert.equal(JSON.parse(root.files.get(catalogPath)).RRDiscoDisaster.free_dlc, true);
  edit = nodes.catalog.querySelector("button");
  await edit.emit("click");
  assert.equal(nodes["chart-form"].elements.free_dlc.checked, true);
  await nodes["delete-chart"].emit("click");
  await waitFor(() => !nodes["chart-dialog"].open);
  assert.deepEqual(JSON.parse(root.files.get(catalogPath)), {});
  assert.match(nodes.status.textContent, /Deleted RRDiscoDisaster/);
});

test("adding an existing chart shows a popup and leaves the draft and repository intact", async () => {
  const { root, text } = fixture();
  const nodes = managerUI(root);
  await nodes["select-folder"].emit("click");
  await nodes["add-chart"].emit("click");
  nodes["binary-files"].files = [...binaries("RRDiscoDisaster").values()].map((e) => e.file);
  await nodes["binary-files"].emit("change");
  nodes["chart-form"].elements.update_date.value = fields.update_date;
  nodes["art-file"].files = [new File(["image"], "cover.png")];
  await nodes["art-file"].emit("change");
  await nodes["chart-form"].emit("submit");
  await waitFor(() => nodes.alerts.length === 1);
  assert.match(nodes.alerts[0], /RRDiscoDisaster already exists.*Use Edit/);
  assert.doesNotMatch(nodes["form-note"].textContent, /already exists/);
  assert.equal(nodes["chart-dialog"].open, true);
  assert.equal(root.files.get(catalogPath).toString(), text);
  assert.equal(actualAssets(root).length, 5);
});

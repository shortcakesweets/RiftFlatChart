/* Repository writes use browser directory handles; no server is involved. */
(() => {
  "use strict";
  const catalogPath = "data/charts/chart_list.json";
  const difficulties = ["easy", "medium", "hard", "impossible"];

  function assetPath(value) {
    if (typeof value !== "string") throw new Error("Missing asset path.");
    const path = value.replace(/^(\.\.\/)+/, "");
    if (!/^(data\/charts\/bin\/|data\/album_arts\/)/.test(path) || path.includes("\\") || path.includes(":") || path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Invalid asset path.");
    return path;
  }

  async function parent(root, path, create = false) {
    const parts = path.split("/");
    let directory = root;
    for (const part of parts.slice(0, -1)) directory = await directory.getDirectoryHandle(part, { create });
    return { directory, name: parts.at(-1) };
  }
  async function read(root, path) {
    const { directory, name } = await parent(root, path);
    return (await directory.getFileHandle(name)).getFile();
  }
  async function exists(root, path) {
    try { await read(root, path); return true; }
    catch (error) { if (error.name === "NotFoundError") return false; throw error; }
  }
  async function write(root, path, data) {
    const { directory, name } = await parent(root, path, true);
    const file = await directory.getFileHandle(name, { create: true });
    const stream = await file.createWritable();
    try { await stream.write(data); await stream.close(); }
    catch (error) { try { await stream.abort(); } catch {} throw error; }
  }
  async function remove(root, path) {
    const { directory, name } = await parent(root, path);
    await directory.removeEntry(name);
  }
  function references(catalog) {
    const paths = new Set();
    for (const entry of Object.values(catalog)) {
      for (const path of [entry.art, ...Object.values(entry.chart || {})]) {
        if (path) paths.add(assetPath(path).toLowerCase());
      }
    }
    return paths;
  }
  function safeName(value) {
    const name = value.normalize("NFKC").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/[. ]+$/g, "").slice(0, 60).trim();
    if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(name)) return "chart";
    return name;
  }
  function validateSet(binaries) {
    if (binaries.size !== 4) throw new Error("All four difficulties are required.");
    const values = [1, 2, 3, 4].map((difficulty) => {
      const entry = binaries.get(difficulty);
      if (!entry || entry.metadata.difficulty !== difficulty) throw new Error("Missing or mismatched difficulty.");
      return entry.metadata;
    });
    if (new Set(values.map((m) => m.levelID)).size !== 1 || new Set(values.map((m) => m.title)).size !== 1) throw new Error("All four binaries must have the same song name and level ID.");
    return values[0];
  }
  function validateDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`)) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) throw new Error("Enter a valid update date.");
  }

  // Write assets under fresh names, then commit the catalog last. Existing assets
  // are never overwritten, including artwork shared by several catalog entries.
  // A durable backup is made before any catalog change or old-asset removal.
  async function commit(root, { mode, key, expectedText, binaries, artwork, fields }) {
    if (!["add", "edit", "delete"].includes(mode)) throw new Error("Unknown catalog operation.");
    const currentText = await (await read(root, catalogPath)).text();
    if (currentText !== expectedText) throw new Error("The catalog changed on disk. Refresh and reopen the form before saving.");
    const catalog = JSON.parse(currentText);
    const original = key ? catalog[key] : null;
    if (mode !== "add" && !original) throw new Error("This chart no longer exists.");
    const stamp = `${Date.now()}-${crypto.randomUUID()}`;
    const backupPath = `.chart-manager-backups/${stamp}`;
    const assets = [];
    let nextEntry;
    if (mode !== "delete") {
      // Validate again at the write boundary rather than trusting UI state.
      const checked = new Map();
      for (const [difficulty, entry] of binaries) {
        checked.set(difficulty, { ...entry, metadata: window.readChartMetadata(await entry.file.arrayBuffer(), true) });
      }
      const metadata = validateSet(checked);
      validateDate(fields.update_date);
      const adding = mode === "add";
      if (adding) {
        key = metadata.levelID;
        if (Object.keys(catalog).some((existing) => existing.toLowerCase() === key.toLowerCase())) {
          const error = new Error(`Chart key ${key} already exists. Use Edit instead.`);
          error.code = "DUPLICATE_CHART";
          throw error;
        }
        if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Invalid chart key.");
      } else {
        // Existing catalog keys sometimes differ from embedded level IDs.
        const firstOld = await read(root, assetPath(original.chart.easy));
        const oldMetadata = window.readChartMetadata(await firstOld.arrayBuffer(), true);
        if (metadata.levelID !== oldMetadata.levelID) throw new Error("Replacement binaries belong to a different song / level ID.");
      }
      // Keep _<key>_<Difficulty>.bin at the end for list_gen.mjs.
      const stem = `${safeName(metadata.title)}-${stamp}_${safeName(key)}`;
      nextEntry = { ...(original || {}), title: adding ? metadata.title : original.title, artist: original?.artist || "", art: original?.art || "", chart: { ...(original?.chart || {}) }, intensity: [1, 2, 3, 4].map((d) => checked.get(d).metadata.intensity), update_date: fields.update_date, dlc: fields.dlc.trim(), free_dlc: fields.free_dlc === true };
      for (const [index, difficulty] of difficulties.entries()) {
        const entry = checked.get(index + 1);
        if (!adding && !entry.replacement) continue;
        const title = difficulty[0].toUpperCase() + difficulty.slice(1);
        const path = `data/charts/bin/${stem}_${title}.bin`;
        nextEntry.chart[difficulty] = `../../${path}`;
        assets.push({ path, data: entry.file });
      }
      if (artwork) {
        const path = `data/album_arts/${safeName(key)}_${stamp}.webp`;
        nextEntry.art = `../../${path}`;
        assets.push({ path, data: artwork });
      } else if (adding) throw new Error("Album art is required.");
      catalog[key] = nextEntry;
    } else delete catalog[key];

    const remaining = references(catalog);
    const oldPaths = original ? [original.art, ...Object.values(original.chart)].filter(Boolean).map(assetPath) : [];
    const obsolete = [...new Set(oldPaths)].filter((path) => !remaining.has(path.toLowerCase()));
    // Back up the exact old catalog and every asset that will be removed.
    await write(root, `${backupPath}/chart_list.json`, currentText);
    for (const path of obsolete) {
      try { await write(root, `${backupPath}/${path}`, await read(root, path)); }
      catch (error) { if (mode === "delete" && error.name === "NotFoundError") continue; throw error; }
    }
    const nextText = JSON.stringify(catalog, null, 4) + "\n";
    await write(root, `${backupPath}/operation.json`, JSON.stringify({ mode, key, created: assets.map((a) => a.path), removed: obsolete }, null, 2));
    const created = [];
    let committed = false;
    const warnings = [];
    try {
      for (const asset of assets) {
        if (await exists(root, asset.path)) throw new Error(`Destination already exists: ${asset.path}`);
        created.push(asset.path);
        await write(root, asset.path, asset.data);
      }
      if (await (await read(root, catalogPath)).text() !== currentText) throw new Error("The catalog changed during saving. Refresh and try again.");
      await write(root, catalogPath, nextText);
      committed = true;
    } catch (error) {
      // A failed close can be ambiguous: inspect before removing assets that a
      // successfully committed catalog could already reference.
      let diskText;
      try { diskText = await (await read(root, catalogPath)).text(); } catch {}
      if (diskText === nextText) committed = true;
      else if (diskText === currentText) {
        for (const path of created) {
          try { await remove(root, path); }
          catch (cleanupError) { if (cleanupError.name !== "NotFoundError") warnings.push(path); }
        }
      } else {
        throw new Error(`${error.message} Recovery files are in ${backupPath}; new assets were kept because the catalog state could not be confirmed.`);
      }
      if (!committed) throw new Error(`${error.message} Original catalog retained. Backup: ${backupPath}.${warnings.length ? ` Unused staged files could not be removed: ${warnings.join(", ")}` : ""}`);
    }
    if (committed) {
      for (const path of obsolete) {
        try { await remove(root, path); }
        catch (error) { if (error.name !== "NotFoundError") warnings.push(`Could not remove ${path}: ${error.message}`); }
      }
    }
    return { catalog, text: nextText, key, backupPath, warnings };
  }
  window.ChartStore = { commit, validateSet, validateDate, safeName };
})();

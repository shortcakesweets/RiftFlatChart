// edit_intensity_precise.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createChartFromBin } from "./rift_essentials.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Defaults (relative to this script)
const DEFAULT_CHARTS_DIR = path.resolve(__dirname, "../../data/charts/bin");
const chartsDir = path.resolve(process.argv[2] || DEFAULT_CHARTS_DIR);

const DIFFS = /** @type {const} */ (["easy", "medium", "hard", "impossible"]);

// ---------- helpers shared with your extractor ----------
function parseBinName(filePath) {
  const base = path.basename(filePath, ".bin");
  const diffMatch = base.match(/_(Easy|Medium|Hard|Impossible)$/);
  if (!diffMatch) return null;
  const difficulty = diffMatch[1].toLowerCase(); // easy|medium|hard|impossible
  const withoutDiff = base.slice(0, base.length - diffMatch[0].length);
  const u = withoutDiff.lastIndexOf("_");
  if (u < 0) return null;
  const title = withoutDiff.slice(0, u);
  const key = withoutDiff.slice(u + 1);
  return { title, key, difficulty };
}

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// ---------- precise offset math for intensity ----------
/**
 * Given a Buffer/Uint8Array of a chart .bin, return the byte offset
 * of the intensity (float32, little-endian).
 * Layout: magic(string) | version(i32) | chartName(string) | levelID(string) | difficulty(i32) | intensity(f32)
 */
function getIntensityOffset(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let o = 0;

  // string(): uint8 length + bytes
  const readString = () => {
    const len = view.getUint8(o); o += 1;
    // Validate bounds
    if (o + len > view.byteLength) throw new Error("Corrupt string length");
    o += len;
  };

  // magic
  const magicLen = view.getUint8(o);
  let m = "";
  if (o + 1 + magicLen <= view.byteLength) {
    m = new TextDecoder().decode(
      new Uint8Array(view.buffer, view.byteOffset + o + 1, magicLen)
    );
  }
  readString();
  if (m !== "RIFT_CHART_DATA") {
    throw new Error(`Wrong header: "${m}"`);
  }

  // version (int32 LE)
  o += 4;

  // chartName (string)
  readString();

  // levelID (string)
  readString();

  // difficulty (int32)
  o += 4;

  // o now points to intensity(float32)
  if (o + 4 > view.byteLength) throw new Error("Truncated before intensity");
  return o;
}

function readIntensity(buf) {
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const off = getIntensityOffset(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getFloat32(off, true);
}

async function writeIntensity(filePath, newValue) {
  const buf = await fs.readFile(filePath);
  const bytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const off = getIntensityOffset(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // backup
  await fs.copyFile(filePath, `${filePath}.bak`);

  view.setFloat32(off, Number(newValue), true);
  await fs.writeFile(filePath, Buffer.from(bytes));

  // verify by re-parsing with your parser
  const after = readIntensity(await fs.readFile(filePath));
  if (!Number.isFinite(after) || Math.abs(after - Number(newValue)) > 1e-5) {
    throw new Error(`Verify failed: expected ${newValue}, got ${after}`);
  }
}

// ---------- main flow ----------
async function main() {
  // scan .bin
  try {
    const st = await fs.stat(chartsDir);
    if (!st.isDirectory()) throw new Error("not a directory");
  } catch {
    console.error(`Charts dir not found: ${chartsDir}`);
    process.exit(1);
  }

  const entries = await fs.readdir(chartsDir, { withFileTypes: true });
  const binFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".bin"))
    .map((e) => path.join(chartsDir, e.name));

  // group by key
  /** @type {Record<string, {title:string, files:Record<'easy'|'medium'|'hard'|'impossible', string|undefined>}>>} */
  const groups = {};
  for (const fp of binFiles) {
    const parsed = parseBinName(fp);
    if (!parsed) continue;
    const { title, key, difficulty } = parsed;
    (groups[key] ??= {
      title,
      files: { easy: undefined, medium: undefined, hard: undefined, impossible: undefined },
    }).files[difficulty] = fp;
  }

  const keys = Object.keys(groups).sort((a, b) =>
    a.localeCompare(b, "en", { sensitivity: "base" })
  );
  if (keys.length === 0) {
    console.log("No .bin files found.");
    return;
  }

  // show intensities and prompt
  const rl = readline.createInterface({ input, output });
  try {
    for (const key of keys) {
      const { title, files } = groups[key];

      // read per-difficulty intensity (via exact offset)
      const vals = [];
      for (const d of DIFFS) {
        const fp = files[d];
        if (!fp) { vals.push(null); continue; }
        try {
          const raw = await fs.readFile(fp);
          vals.push(readIntensity(raw));
        } catch {
          vals.push(null);
        }
      }

      const fmt = (v) => (v == null ? "__" : Number.isInteger(v) ? `${v}` : v.toFixed(3));
      console.log(`${key} | ${title}  (${fmt(vals[0])} / ${fmt(vals[1])} / ${fmt(vals[2])} / ${fmt(vals[3])})`);

      // ask: four integers space-delimited (Enter to skip)
      const ans = await rl.question(
        `New intensities for "${key}" as "ee mm hh ii" (Enter to skip): `
      );
      if (!ans.trim()) {
        console.log("  skipped.");
        continue;
      }

      const parts = ans.trim().split(/\s+/);
      if (parts.length !== 4 || parts.some((p) => !/^-?\d+$/.test(p))) {
        console.log("  Invalid input. Expected four integers separated by spaces. Skipped.");
        continue;
      }
      const [ee, mm, hh, ii] = parts.map((p) => parseInt(p, 10));

      // write per present difficulty
      const desired = { easy: ee, medium: mm, hard: hh, impossible: ii };
      for (const d of DIFFS) {
        const fp = files[d];
        if (!fp) continue;
        try {
          await writeIntensity(fp, desired[d]);
          console.log(`  ${d.padEnd(10)}: OK  -> ${desired[d]}`);
        } catch (e) {
          console.log(`  ${d.padEnd(10)}: FAIL - ${e?.message ?? e}`);
        }
      }
    }
  } finally {
    rl.close();
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error("Error:", e?.stack || e);
  process.exitCode = 1;
});

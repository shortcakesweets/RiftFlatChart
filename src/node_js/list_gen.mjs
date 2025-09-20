import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createChartFromBin } from "rift_essentials.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Defaults (relative to this script)
const DEFAULT_CHARTS_DIR = path.resolve(__dirname, "../../data/charts/bin");
const DEFAULT_OUT_JSON = path.resolve(
	__dirname,
	"../../data/charts/chart_list.json"
);

// CLI args (optional)
const chartsDir = path.resolve(process.argv[2] || DEFAULT_CHARTS_DIR);
const outJson = path.resolve(process.argv[3] || DEFAULT_OUT_JSON);

function toArrayBuffer(buf) {
	return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

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

async function main() {
	// 1) Read existing list (if any)
	let existing = {};
	try {
		const raw = await fs.readFile(outJson, "utf8");
		existing = JSON.parse(raw);
	} catch {
		existing = {};
	}

	// 2) Collect bins
	const entries = await fs.readdir(chartsDir, { withFileTypes: true });
	const binFiles = entries
		.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".bin"))
		.map((e) => path.join(chartsDir, e.name));

	// 3) Group bins by Key
	/** @type {Record<string, {title:string, files:Record<'easy'|'medium'|'hard'|'impossible', string|undefined>}>>} */
	const groups = {};
	for (const fp of binFiles) {
		const parsed = parseBinName(fp);
		if (!parsed) continue;
		const { title, key, difficulty } = parsed;
		if (!groups[key])
			groups[key] = {
				title,
				files: {
					easy: undefined,
					medium: undefined,
					hard: undefined,
					impossible: undefined,
				},
			};
		groups[key].files[difficulty] = fp;
	}

	// 4) Build additions (skip existing keys) — presort for nice logs
	const additions = {};
	const sortedKeys = Object.keys(groups).sort((a, b) =>
		a.localeCompare(b, "en", { sensitivity: "base" })
	);

	const DIFFS = /** @type {const} */ ([
		"easy",
		"medium",
		"hard",
		"impossible",
	]);

	// Always output like: "../../data/charts/bin/<file>.bin"
	const relBin = (p) =>
		p ? path.posix.join("../../data/charts/bin", path.basename(p)) : "";

	for (const key of sortedKeys) {
		const { title, files } = groups[key];

		if (Object.prototype.hasOwnProperty.call(existing, key)) {
			console.log(`${key} -skipped-`);
			continue;
		}

		// Compute intensities per difficulty; 0 when not reconstructable
		const intensities = [];
		for (const d of DIFFS) {
			const fp = files[d];
			if (!fp) {
				intensities.push(0);
				continue;
			}
			try {
				const buf = await fs.readFile(fp);
				const ab = toArrayBuffer(buf);
				const chart = createChartFromBin(ab);
				const val = Number(chart?.intensity);
				intensities.push(Number.isFinite(val) ? val : 0);
			} catch {
				intensities.push(0);
			}
		}

		additions[key] = {
			title,
			art: `../../data/album_arts/${key}.webp`, // convention-based guess
			chart: {
				easy: files.easy ? relBin(files.easy) : "",
				medium: files.medium ? relBin(files.medium) : "",
				hard: files.hard ? relBin(files.hard) : "",
				impossible: files.impossible ? relBin(files.impossible) : "",
			},
			update_date: "", // not reconstructable → blank
			dlc: "", // unknown → blank
			artist: "", // unknown → blank
			intensity: intensities,
		};

		console.log(`${key} +added+`);
	}

	// 5) Merge and write (preserve existing; append new)
	const merged = { ...existing, ...additions };
	const sorted = Object.fromEntries(
		Object.keys(merged)
			.sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
			.map((k) => [k, merged[k]])
	);

	await fs.mkdir(path.dirname(outJson), { recursive: true });
	await fs.writeFile(outJson, JSON.stringify(sorted, null, 4) + "\n", "utf8");

	console.log(
		`Done. Wrote ${Object.keys(additions).length} new entr${
			Object.keys(additions).length === 1 ? "y" : "ies"
		} to ${outJson}`
	);
}

main().catch((e) => {
	console.error("Error:", e?.stack || e);
	process.exitCode = 1;
});

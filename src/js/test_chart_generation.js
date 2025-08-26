import { createChartFromBin } from "./rift_essentials.js";

const DIFF_STRING = ["easy", "medium", "hard", "impossible"];

async function test() {
	const chartListBin = await fetch(
		"../../data/charts/chart_list.json"
	).then((r) => r.json());
	const keysBin = Object.keys(chartListBin);

	for (const key of ["RRDiscoDisaster"]) {
		const pathsBin = chartListBin[key].chart;
		for (const diff of DIFF_STRING) {
			const dataBin = await fetch(pathsBin[diff]).then((r) =>
				r.arrayBuffer()
			);
			const t0 = performance.now();
			const chartBin = createChartFromBin(dataBin);
			const t1 = performance.now();
            console.log(`Performance: ${(t1 - t0).toFixed(1)} milliseconds`);
			console.log(chartBin);
		}
	}
}

document.addEventListener("DOMContentLoaded", test);

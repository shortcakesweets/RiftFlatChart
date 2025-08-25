import { createChartFull } from "./rift_essentials_bin.js";

const DIFF_STRING = ["easy", "medium", "hard", "impossible"];

async function test() {
    const chartListBin = await fetch("../../data/charts/chart_list_bin.json").then((r) => r.json());
    const keysBin = Object.keys(chartListBin);

    /*
    for(const key of keysBin){
        const pathsBin = chartListBin[key].chart;
        for (const diff of DIFF_STRING){
            const dataBin = await fetch(pathsBin[diff]).then((r) =>
                r.arrayBuffer()
            );
            const t0 = performance.now();
            const chartBin = createChartFull(dataBin);
            const t1 = performance.now();
            console.log(chartBin, (t1-t0).toFixed(3));
        }
    }
    */

    for(const key of ["RRDiscoDisaster"]){
        const pathsBin = chartListBin[key].chart;
        for (const diff of DIFF_STRING){
            const dataBin = await fetch(pathsBin[diff]).then((r) =>
                r.arrayBuffer()
            );
            const t0 = performance.now();
            const chartBin = createChartFull(dataBin);
            const t1 = performance.now();
        }
    }
}

document.addEventListener("DOMContentLoaded", test);
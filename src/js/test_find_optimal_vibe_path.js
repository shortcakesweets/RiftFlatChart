import { createChartFull } from "./rift_essentials_bin.js";

const DIFF_STRING = ["easy", "medium", "hard", "impossible"];

async function test() {
    const chartListBin = await fetch("../../data/charts/chart_list_bin.json").then((r) => r.json());
    const keysBin = Object.keys(chartListBin);

    for(const key of keysBin){
        const pathsBin = chartListBin[key].chart;
        for (const diff of DIFF_STRING){
            const dataBin = await fetch(pathsBin[diff]).then((r) =>
                r.arrayBuffer()
            );
            const chartBin = createChartFull(dataBin);
            console.log(chartBin);

            break;
        }

        break;
    }
}

// Finds optimal vibe and register to chart.
// return value: void
function getOptimalVibe(chart){
    const vibeGainPoints = chartBin.vibeGainPoints;

}

// Gets vibe end time
function getVibeEndPoint(timeTrigger, vibePower, chart){
    const vibeGainPoints = chartBin.vibeGainPoints;

    let timeProgressed = 0;


    

    // extension = [hit window] - [largest multiple of a subdivision that is shorter than the hit window]

}

// helper function that rounds some time value to a subdivision
function getNearestSubdivTime(time, subdivision, bpm){
    const timeSubdivision = 60 / 5;
}

document.addEventListener("DOMContentLoaded", test);
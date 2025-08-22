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

            // Create a segment group by "vibe gain points"
            /*
            const allVibes = [...chartBin.singleVibes, ...chartBin.doubleVibes].sort((a, b) => a.beatEnd - b.beatEnd);
            const vibeGainPoints = chartBin.vibeGainPoints.map(vibe => vibe.beatEnd).concat(999999);
            const groups = Array.from({length: vibeGainPoints.length}, () => []);
            let i = 0;
            for(let g = 0; g < vibeGainPoints.length - 1; g++){
                const beatLow = vibeGainPoints[g];
                const beatHigh = vibeGainPoints[g+1];

                while(i < allVibes.length){
                    const vibeBeat = allVibes[i].beatEnd;
                    if(vibeBeat < beatLow){ i++; continue; }

                    if(vibeBeat < beatHigh) groups[g].push(allVibes[i++]);
                    else break;
                }
            }

            console.log(vibeGainPoints);
            console.log(groups);
            */

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
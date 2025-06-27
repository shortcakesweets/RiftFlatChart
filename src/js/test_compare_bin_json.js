import { createChart } from "./rift_essentials_json.js";
import { createChartFull } from "./rift_essentials_bin.js";

async function test() {
    // Wait for both fetches to resolve, then destructure the results
    const [chartListJson, chartListBin] = await Promise.all([
        fetch("../../data/charts/chart_list.json").then((r) => r.json()),
        fetch("../../data/charts/chart_list_bin.json").then((r) => r.json()),
    ]);

    // These run only after both files are downloaded and parsed
    console.log(chartListJson);
    console.log(chartListBin);

    // Test 1. Key check
    console.log("Test 1: Key Check");
    const keysJson = Object.keys(chartListJson);
    const keysBin = Object.keys(chartListBin);

    const areKeysSame =
        keysJson.length === keysBin.length &&
        keysJson.every((key) => keysBin.includes(key));

    if (areKeysSame) console.log("- PASS");
    else {
        console.log("- FAIL");
        return;
    }

    // Test 2. Chart check
    console.log("Test 2: Chart Check");
    const mismatches = [];
    for (const key of keysJson) {
        const pathsJson = chartListJson[key].chart;
        const pathsBin = chartListBin[key].chart;

        for (const diff of ["easy", "medium", "hard", "impossible"]) {
            const dataJson = await fetch(pathsJson[diff]).then((r) => r.json());
            const dataBin = await fetch(pathsBin[diff]).then((r) =>
                r.arrayBuffer()
            );

            const chartJson = createChart(dataJson);
            const chartBin = createChartFull(dataBin);

            // helper to register a mismatch
            const check = (fieldJson, fieldBin, fieldName) => {
                if (fieldJson !== fieldBin) {
                    mismatches.push({
                        key,
                        difficulty: diff,
                        field: fieldName,
                        jsonValue: fieldJson,
                        binValue: fieldBin,
                    });
                }
            };

            check(chartJson.difficulty, chartBin.difficulty, "difficulty");
            check(chartJson.intensity, chartBin.intensity, "intensity");
            check(chartJson.baseBpm, chartBin.baseBpm, "baseBpm");
            check(chartJson.divisions, chartBin.division, "division");
            check(chartJson.maxCombo, chartBin.maxCombo, "maxCombo");
            check(chartJson.maxScore, chartBin.maxScoreWithoutVibe + chartBin.maxScoreBonusVibe, "maxScore");
        }
    }
    console.log(mismatches);
}

document.addEventListener("DOMContentLoaded", test);

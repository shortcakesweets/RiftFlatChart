import { createChartFromBin, createChartFromJson } from './rift_essentials.js';
import { renderChart } from './render.js';

const dropZone = document.getElementById('drop-zone');

function updateTable(chart) {
    const rows = document.querySelectorAll('.description-table tr');
    for(let i=0; i<5; i++){
        rows[i].cells[1].textContent = "";
    }
    
    if (chart) {
        rows[0].cells[1].textContent = chart.shortName;
        rows[1].cells[1].textContent = `${DIFF_STRING[chart.difficulty - 1]}(${chart.intensity})`;
        const maxBpm = Math.max(...chart.bpmChanges.map(bpmChange => bpmChange.bpm));
        const minBpm = Math.min(...chart.bpmChanges.map(bpmChange => bpmChange.bpm));
        const bpmStr = (minBpm === maxBpm) ? `${chart.baseBpm}` : `${minBpm}-${maxBpm} (${chart.baseBpm})`;
        rows[2].cells[1].textContent = bpmStr;
        rows[3].cells[1].textContent = chart.maxCombo;
        rows[4].cells[1].textContent = chart.maxScore;
    }
}

function processFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('Please upload a JSON file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            chartData = JSON.parse(e.target.result);
            const chart = createChart(chartData);
            const canvas1 = document.getElementById('chart-canvas');
            const canvas2 = document.getElementById('chart-canvas-er');
            if (chart) {
                renderChart(canvas1, chart, false);
                renderChart(canvas2, chart, true);
                updateTable(chart);
                console.log('Chart object:', chart);
            } else {
                alert('Error: Could not create chart from JSON.');
            }
        } catch (error) {
            alert(`Error parsing JSON: ${error.message}`);
            console.error(error);
        }
    };
    reader.onerror = () => {
        alert('Error reading file.');
    };
    reader.readAsText(file);
}

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        processFile(file);
    }
});

dropZone.addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
        document.body.removeChild(fileInput);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
});
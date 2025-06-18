let isEnemyRenderOn = false;
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

function updateAlbumArt(artPath){
    const albumArt = document.getElementById('album-art');
    albumArt.src = artPath;
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
            renderBothCanvas(chart);
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

function addDropZoneFeature() {
    if(dropZone == null){
        return;
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
}

function updateCanvasHeight() {
    const canvas1 = document.getElementById('chart-canvas');
    const canvas2 = document.getElementById('chart-canvas-er');
    canvas1.style.height = `${window.innerHeight}px`;
    canvas2.style.height = `${window.innerHeight}px`;

    canvas1.style.display = "inline";
    canvas2.style.display = "none";
}

function addToggleFeature() {
    const toggleButton = document.getElementById("toggle-button");
    const canvas1 = document.getElementById('chart-canvas');
    const canvas2 = document.getElementById('chart-canvas-er');
    toggleButton.addEventListener("click", function () {
        isEnemyRenderOn = !isEnemyRenderOn; // Toggle state
        if (isEnemyRenderOn) {
            toggleButton.textContent = "Enemy Render ON";
            toggleButton.classList.add("on");
            canvas1.style.display = "none";
            canvas2.style.display = "inline";
        } else {
            toggleButton.textContent = "Enemy Render OFF";
            toggleButton.classList.remove("on");
            canvas1.style.display = "inline";
            canvas2.style.display = "none";
        }
    });
}

function parseParam(){
    const params = new URLSearchParams(window.location.search);
    const key = params.get("key")
    const diff = parseInt(params.get("diff"), 10);

    if(!key || !diff){
        return;
    }

    fetch('chart_info.json')
        .then(response => response.json())
        .then(data => {
            const subData = data[key];
            // console.log(subData);
            const chartPath = subData['hit'][DIFF_STRING[diff-1]];
            const artPath = subData['art'];
            // console.log(chartPath, artPath);

            fetch(chartPath)
                .then(response => response.json())
                .then(chartJson => createChart(chartJson))
                .then(chart => {
                    console.log(chart);
                    renderBothCanvas(chart);
                });
            updateAlbumArt(artPath);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    addDropZoneFeature();
    updateCanvasHeight();
    addToggleFeature();
    parseParam();
});
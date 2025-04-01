// Get DOM elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');

let chartData = null;

// Constants for rendering (simplified from flatten.py)
const LANE_WIDTH = 64;
const LANE_GAP = 4;
const LANE_MARGIN = 100;
const LANE_HEIGHT = 700;
const NOTE_SIZE = 48;
const NOTE_THICK = 8;
const BG_COLOR = '#000000';
const LANE_COLOR = '#323232';
const NOTE_COLOR = '#FFFFFF';
const WYRM_BODY_COLOR = '#009F64';
const WYRM_HEAD_COLOR = '#006432';

// Function to render the chart
function renderChart(chart) {
    // Clear canvas
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes
    let xStart = LANE_MARGIN + LANE_GAP;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = LANE_COLOR;
        ctx.fillRect(xStart, 0, LANE_WIDTH, LANE_HEIGHT);
        xStart += LANE_WIDTH + LANE_GAP;
    }

    // Calculate note position
    function getNoteXY(column, beat) {
        const noteMargin = (LANE_WIDTH - NOTE_SIZE) / 2;
        const x = LANE_MARGIN + LANE_GAP * (column + 1) + LANE_WIDTH * column + noteMargin;
        const beatHeight = LANE_HEIGHT / 16; // 16 beats visible
        const y = LANE_HEIGHT - (beat * beatHeight);
        return [x, y];
    }

    // Draw short notes
    chart.shortNotes.forEach(note => {
        const [x, y] = getNoteXY(note.column, note.beatStart);
        ctx.fillStyle = NOTE_COLOR;
        ctx.fillRect(x, y - NOTE_THICK, NOTE_SIZE, NOTE_THICK);
    });

    // Draw wyrm notes
    chart.wyrmNotes.forEach(note => {
        const [xStart, yStart] = getNoteXY(note.column, note.beatStart);
        const [, yFinish] = getNoteXY(note.column, note.beatFinish);
        ctx.fillStyle = WYRM_BODY_COLOR;
        ctx.fillRect(xStart, yFinish, NOTE_SIZE, yStart - yFinish);

        ctx.fillStyle = WYRM_HEAD_COLOR;
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xStart + NOTE_SIZE, yStart);
        ctx.lineTo(xStart + NOTE_SIZE / 2, yStart - 24); // Wyrm head height
        ctx.closePath();
        ctx.fill();
    });
}

// Function to handle file processing
function processFile(file) {
    if (!file.name.endsWith('.json')) {
        uploadStatus.textContent = 'Please upload a JSON file.';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            chartData = JSON.parse(e.target.result);
            const chart = createChart(chartData);
            if (chart) {
                uploadStatus.textContent = `Chart loaded: ${file.name}`;
                renderChart(chart);
                console.log('Chart object:', chart);
            } else {
                uploadStatus.textContent = 'Error: Could not create chart from JSON.';
            }
        } catch (error) {
            uploadStatus.textContent = `Error parsing JSON: ${error.message}`;
            console.error(error);
        }
    };
    reader.onerror = () => {
        uploadStatus.textContent = 'Error reading file.';
    };
    reader.readAsText(file);
}

// Drag-and-drop event listeners
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

// Click to open file picker
dropZone.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
});
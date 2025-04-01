const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');

// size constants
// margin - gap - lane - gap - lane - gap - lane - gap - margin
const LANE_WIDTH      = 16*4
const LANE_GAP        = 1*4
const LANE_MARGIN     = 42*4
const LANE_HEIGHT     = 1200*4
const LANE_PADDING    = 8*4           // slightly longer lanes for previewing next notes
const NOTE_SIZE       = 12*4
const NOTE_THICK      = 2*4
const FONT_SIZE       = 12*4
const FONT_MARGIN     = 4*4           // also applies to vibe indicators
const WYRM_HEAD_SIZE  = 6*4           // wyrm head (triangle) height
const VIBE_IND_SIZE   = 12*4          // vibe indicator (triagnle pointing right)'s width & height

// color constants
const BG_COLOR           = 'rgb(0, 0, 0)';       // black
const LANE_COLOR         = 'rgb(50, 50, 50)';    // dark dark grey
const MAIN_DIV_COLOR     = 'rgb(128, 128, 128)'; // grey (50%)
const SUB_DIV_COLOR      = 'rgb(75, 75, 75)';    // dark grey
const GAP_COLOR          = 'rgb(75, 75, 75)';    // dark grey
const FONT_MEASURE_COLOR = 'rgb(211, 211, 211)'; // light grey
const FONT_BPM_COLOR     = 'rgb(0, 255, 0)';     // green
const WYRM_BODY_COLOR    = 'rgb(0, 159, 100)';   // actual palette from in-game
const WYRM_HEAD_COLOR    = 'rgb(0, 100, 50)';    // darker than body
const NOTE_COLOR         = 'rgb(255, 255, 255)'; // white
const OVERLAP_COLOR      = 'rgb(255, 0, 0)';     // red
const VIBE_COLOR         = 'rgb(255, 255, 0)';   // yellow

let chartData = null;

function getNoteXY(column, relBeat) {
    const noteMargin = (LANE_WIDTH - NOTE_SIZE) / 2;
    const x = LANE_MARGIN + LANE_GAP * (column + 1) + LANE_WIDTH * column + noteMargin;

    const beatHeight = LANE_HEIGHT / 16;
    const yRelBeatZero = LANE_MARGIN + LANE_PADDING + LANE_HEIGHT;
    const y = yRelBeatZero - relBeat * beatHeight;
    return [x, y];
}

function renderText(x, y, text, color, align_right = false){
    ctx.font = `${FONT_SIZE}px Arial`;
    ctx.fillStyle = color;
    if (align_right){
        const textWidth = ctx.measureText(text).width;
        x -= textWidth;
    }
    ctx.fillText(text, x, y);
}

function renderSegment(segmentIndex, chart, render_enemies){
    let beatIndex = segmentIndex * 4 + 1;
    let X_OFFSET = (LANE_MARGIN * 2 + LANE_GAP * 4 + LANE_WIDTH * 3) * segmentIndex;

    // render lanes
    ctx.fillStyle = LANE_COLOR;
    for(let i=0; i<3; i++){
        let xStart = LANE_MARGIN + LANE_GAP + (LANE_WIDTH + LANE_GAP) * i;
        ctx.fillRect(
            X_OFFSET + xStart,
            LANE_MARGIN,
            LANE_WIDTH,
            LANE_HEIGHT + LANE_PADDING * 2
        );
        xStart += LANE_WIDTH + LANE_GAP;
    }

    // draw beat divisions
    // - main division & beat count texts
    for(let relBeat = 0; relBeat < 17; relBeat+=4){
        const [, yFinish] = getNoteXY(0, relBeat);

        ctx.fillStyle = MAIN_DIV_COLOR;
        ctx.fillRect(
            X_OFFSET + LANE_MARGIN,
            yFinish - LANE_GAP,
            LANE_WIDTH * 3 + LANE_GAP * 4,
            LANE_GAP
        );

        const actBeat = relBeat + beatIndex;
        if(!chart.optimalVibes.includes(actBeat)){
            renderText(
                X_OFFSET + LANE_MARGIN - FONT_MARGIN,
                yFinish,
                String(actBeat).padStart(3, '0'),
                FONT_MEASURE_COLOR,
                true
            );
        }
    }

    // TODO : draw vibe trigger indicaters and beats

    // - sub division
    ctx.fillStyle = SUB_DIV_COLOR;
    for(let relBeat = 0; relBeat < 17; relBeat++){
        if(relBeat % 4 != 0){
            [, yFinish] = getNoteXY(0, relBeat);
            ctx.fillRect(
                X_OFFSET + LANE_MARGIN,
                yFinish - LANE_GAP,
                LANE_WIDTH * 3 + LANE_GAP * 4,
                LANE_GAP
            );
        }
    }

    // draw gaps
    for(let i=0; i<4; i++){
        let xStart = LANE_MARGIN + (LANE_GAP + LANE_WIDTH) * i;
        ctx.fillStyle = GAP_COLOR;
        ctx.fillRect(
            X_OFFSET + xStart,
            LANE_MARGIN,
            LANE_GAP,
            LANE_PADDING * 2 + LANE_HEIGHT
        );
    }

    // TODO : draw bpm change texts

    

}

function renderChart(chart) {
    const allBeats = [
        ...chart.shortNotes.map(note => note.beatFinish),
        ...chart.wyrmNotes.map(note => note.beatFinish)
    ];
    const beatsPerSegment = 16;
    const maxBeat = allBeats.length > 0 ? Math.max(...allBeats) : beatsPerSegment;
    const segmentCount = Math.ceil(maxBeat / beatsPerSegment);

    const segmentWidth = LANE_MARGIN * 2 + LANE_GAP * 4 + LANE_WIDTH * 3;
    canvas.width = segmentWidth * segmentCount;
    canvas.height = LANE_HEIGHT + LANE_PADDING * 2 + LANE_MARGIN * 2;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(let segmentIndex=0; segmentIndex<segmentCount; segmentIndex++){
        renderSegment(segmentIndex, chart, false);
    }
}

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
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
});
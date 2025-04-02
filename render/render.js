/*
let canvas = document.getElementById('chart-canvas');
let ctx = canvas.getContext('2d');
*/
let canvas = null;
let ctx = null;

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

const PATH_ENEMIES = "enemies/";
function getEnemyNameById(id){
    for(const key in enemyId){
        if(enemyId[key] === id){
            return key;
        }
    }
    return null;
}

function renderShortNote(xOffset, column, relBeat, color, enemyId, isFacingRight, isRenderEnemies){
    const [xStart, yStart] = getNoteXY(column, relBeat);

    ctx.fillStyle = color;
    ctx.fillRect(xOffset + xStart, yStart - NOTE_THICK, NOTE_SIZE, NOTE_THICK);

    if(isRenderEnemies){
        const enemyName = getEnemyNameById(enemyId);
        if (enemyName) {
            const enemyImg = new Image();
            const suffix = isFacingRight ? "_flipped.png" : ".png";
            enemyImg.src = PATH_ENEMIES + enemyName.toLowerCase() + suffix;

            const drawEnemy = () => {
                ctx.drawImage(
                    enemyImg,
                    xOffset + xStart,
                    yStart - NOTE_SIZE / 2,
                    NOTE_SIZE,
                    NOTE_SIZE
                );
            };

            if(enemyImg.complete){
                drawEnemy();
            } else {
                enemyImg.onload = drawEnemy;
                enemyImg.onerror = function(error) {
                    console.error("Error loading enemy image:", enemyImg.src, error);
                };
            }
        } else {
            console.error("No enemy name found for enemyId:", enemyId);
        }
    }
}

function renderWyrmBody(xOffset, column, relBeatStart, relBeatFinish, isRenderEnemies){
    const [xStart, yStart] = getNoteXY(column, relBeatStart);
    const [, yFinish] = getNoteXY(column, relBeatFinish);
    
    ctx.fillStyle = WYRM_BODY_COLOR;
    ctx.fillRect(xOffset + xStart, yFinish, NOTE_SIZE, yStart - yFinish);
}

function renderWyrmHead(xOffset, column, relBeat, isRenderEnemies){
    // change to "not render enemies" if wyrm is prettier
    if(true){
        const [xStart, yStart] = getNoteXY(column, relBeat);
        const vertices = [
            [xOffset + xStart, yStart],
            [xOffset + xStart + NOTE_SIZE, yStart],
            [xOffset + xStart + NOTE_SIZE / 2, yStart - WYRM_HEAD_SIZE]
        ];
        
        ctx.beginPath();
        ctx.moveTo(vertices[0][0], vertices[0][1]);
        ctx.lineTo(vertices[1][0], vertices[1][1]);
        ctx.lineTo(vertices[2][0], vertices[2][1]);
        ctx.closePath();
        
        ctx.fillStyle = WYRM_HEAD_COLOR;
        ctx.fill();
    }
    else{
        // wyrm head id : 7794
        renderShortNote(xOffset, column, relBeat, WYRM_HEAD_COLOR, 7794, false);
    }
}

function renderSegment(segmentIndex, chart, isRenderEnemies){
    const beatIndex = segmentIndex * 16 + 1;
    const X_OFFSET = (LANE_MARGIN * 2 + LANE_GAP * 4 + LANE_WIDTH * 3) * segmentIndex;

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

    // - draw vibe trigger indicaters and beats
    const optimalVibes = chart.optimalVibes;
    optimalVibes.forEach(optimalVibe => {
        let relBeat = optimalVibe - beatIndex;
        if(0 <= relBeat && relBeat < 16){
            [, yStart] = getNoteXY(0, relBeat);
            vertices = [
                [X_OFFSET + LANE_MARGIN - FONT_MARGIN, yStart],
                [X_OFFSET + LANE_MARGIN - FONT_MARGIN - VIBE_IND_SIZE, yStart + VIBE_IND_SIZE / 2],
                [X_OFFSET + LANE_MARGIN - FONT_MARGIN - VIBE_IND_SIZE, yStart - VIBE_IND_SIZE / 2]
            ];

            ctx.beginPath();
            ctx.moveTo(vertices[0][0], vertices[0][1]);
            ctx.lineTo(vertices[1][0], vertices[1][1]);
            ctx.lineTo(vertices[2][0], vertices[2][1]);
            ctx.closePath();
            
            ctx.fillStyle = VIBE_COLOR;
            ctx.fill();

            renderText(
                X_OFFSET + LANE_MARGIN - FONT_MARGIN,
                yStart - FONT_SIZE / 2 - VIBE_IND_SIZE - FONT_MARGIN,
                optimalVibe.toFixed(2).padStart(6, '0'),
                VIBE_COLOR,
                true
            );
        }
    });

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

    // draw bpm change texts
    const bpmChanges = chart.bpmChanges;
    bpmChanges.forEach(bpmChange => {
        let relBeat = bpmChange.beat - beatIndex;
        if(0 <= relBeat && relBeat < 16){
            [, yFinish] = getNoteXY(0, relBeat);
            renderText(
                X_OFFSET + FONT_MARGIN + LANE_MARGIN + LANE_GAP + LANE_WIDTH * 3,
                yFinish,
                String(bpmChange.bpm).padStart(3, '0'),
                FONT_BPM_COLOR
            );
        }
    });

    // filter only in-range notes
    const beatFrom = beatIndex;
    const beatTo = beatIndex + 16;

    const filteredShortNotes = chart.shortNotes.filter(note => 
        beatFrom <= note.beatStart && note.beatStart <= beatTo
    );
    const filteredWyrmNotes = chart.wyrmNotes.filter(note => 
        (beatFrom <= note.beatStart && note.beatStart <= beatTo) || 
        (beatFrom <= note.beatFinish && note.beatFinish <= beatTo)
    );

    // render wyrm notes
    filteredWyrmNotes.forEach(note => {
        const beatPadding = LANE_PADDING / (LANE_HEIGHT / 16);
        
        const relBeatStart = Math.max(note.beatStart - beatIndex, -beatPadding);
        const relBeatFinish = Math.min(note.beatFinish - beatIndex, 16 + beatPadding);

        renderWyrmBody(X_OFFSET, note.column, relBeatStart, relBeatFinish, isRenderEnemies);

        const relBeatStartWithoutPadding = note.beatStart - beatIndex;
        if(relBeatStartWithoutPadding >= -beatPadding){
            renderWyrmHead(X_OFFSET, note.column, relBeatStartWithoutPadding, isRenderEnemies);
        }
    });

    // render short notes
    filteredShortNotes.forEach(note => {
        const relBeat = note.beatStart - beatIndex;
        let overlap_count = 0;

        filteredShortNotes.forEach(otherNote => {
            if(note.column == otherNote.column && note.beatStart == otherNote.beatStart){
                overlap_count += 1;
            }
            const color = overlap_count == 1 ? NOTE_COLOR : OVERLAP_COLOR;
            renderShortNote(X_OFFSET, note.column, relBeat, color, note.enemyId, note.isFacingRight, isRenderEnemies);
        });
    });
}

function renderChart(canvas, chart, isRenderEnemies) {
    ctx = canvas.getContext('2d');

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
        renderSegment(segmentIndex, chart, isRenderEnemies);
    }
}

function createChart(jsonData) {
    try {
        const data = jsonData;

        const chart = new Chart();
        chart.key = data.name;
        chart.name = data.name;
        chart.shortName = data.name; // TODO : fix this
        chart.difficulty = data.diff;
        chart.intensity = data.intensity;

        // Extract note data
        const hitEvents = (data.events || [])
            .filter(e => e.Event === "HitEnemy" || e.Event === "WyrmEnd")
            .sort((a, b) => parseFloat(a.Beat) - parseFloat(b.Beat) || parseInt(a.X) - parseInt(b.X));

        for (const event of hitEvents) {
            if (event.Event === "HitEnemy") {
                const note = new Note();
                note.enemyUid = event.GUID;
                note.enemyId = parseInt(event.ID);
                note.beatStart = parseFloat(event.Beat);
                note.column = parseInt(event.X);
                note.isFacingRight = event.Facing === "Right";
                if (note.enemyId !== enemyId.WYRM) {
                    note.beatFinish = note.beatStart;
                    chart.shortNotes.push(note);
                } else {
                    chart.wyrmNotes.push(note);
                }
            } else if (event.Event === "WyrmEnd") {
                for (const wyrmNote of chart.wyrmNotes) {
                    if (wyrmNote.enemyUid === event.GUID) {
                        wyrmNote.beatFinish = parseFloat(event.Beat);
                    }
                }
            }
        }
        chart.maxCombo = chart.shortNotes.length + chart.wyrmNotes.length;

        chart.divisions = data.beatDivisions;
        chart.baseBpm = data.bpm;
        chart.bpmChanges.push(new BpmChange(1, chart.baseBpm));
        const bpmEvents = (data.BpmEvents || [])
        bpmEvents.forEach(bpmEvent => {
            chart.bpmChanges.push(new BpmChange(bpmEvent[0], bpmEvent[1]));
        });

        // TODO : get maximum score and optimal vibe points

        return chart;
    } catch (error) {
        console.error(`Failed while processing chart data: ${error.message}`);
        console.error(error.stack);
        return null;
    }
}
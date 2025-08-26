let ctx = null;

import { EnemyType } from "./rift_essentials.js";

// size constants
// margin - gap - lane - gap - lane - gap - lane - gap - margin
const LANE_WIDTH      = 16*4
const LANE_GAP        = 1*4
const LANE_MARGIN     = 42*4
const LANE_HEIGHT     = 1200*4
const LANE_PADDING    = 8*4           // slightly longer lanes for previewing next notes
const NOTE_SIZE       = 12*4
const NOTE_THICK      = 2*4
const FONT_SIZE       = 14*4
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

function numberRounder(bpm){
	return bpm.toFixed(3).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, '$1');
}

function getNoteXY(column, relBeat) {
	const noteMargin = (LANE_WIDTH - NOTE_SIZE) / 2;
	const x =
		LANE_MARGIN +
		LANE_GAP * (column + 1) +
		LANE_WIDTH * column +
		noteMargin;

	const beatHeight = LANE_HEIGHT / 16;
	const yRelBeatZero = LANE_MARGIN + LANE_PADDING + LANE_HEIGHT;
	const y = yRelBeatZero - relBeat * beatHeight;
	return [x, y];
}

function renderText(x, y, text, color, align_right = false) {
	ctx.font = `bold ${FONT_SIZE}px Arial`;
	ctx.fillStyle = color;
	if (align_right) {
		const textWidth = ctx.measureText(text).width;
		x -= textWidth;
	}
	ctx.fillText(text, x, y);
}

const PATH_ENEMIES = "../../data/enemies/";
function getEnemyNameByType(type) {
	for (const key in EnemyType) {
		if (EnemyType[key] === type) return key;
	}
	return null;
}

function renderShortNote(
	xOffset,
	column,
	relBeat,
	color,
	enemyType,
	isFacingLeft,
	isRenderEnemies
) {
	const [xStart, yStart] = getNoteXY(column, relBeat);

	ctx.fillStyle = color;
	ctx.fillRect(xOffset + xStart, yStart - NOTE_THICK, NOTE_SIZE, NOTE_THICK);

	if (isRenderEnemies) {
		const enemyName = getEnemyNameByType(enemyType);
		if (enemyName) {
			const enemyImg = new Image();
			const suffix = isFacingLeft ? ".png" : "_flipped.png";
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

			if (enemyImg.complete) {
				drawEnemy();
			} else {
				enemyImg.onload = drawEnemy;
				enemyImg.onerror = function (error) {
					console.error(
						"Error loading enemy image:",
						enemyImg.src,
						error
					);
				};
			}
		} else {
			console.error("No enemy name found for enemyType:", enemyType);
		}
	}
}

// Not used for the time being
function renderWyrmBody(
	xOffset,
	column,
	relBeatBegin,
	relBeatEnd,
	isRenderEnemies
) {
	const [xStart, yStart] = getNoteXY(column, relBeatBegin);
	const [, yFinish] = getNoteXY(column, relBeatEnd);

	ctx.fillStyle = WYRM_BODY_COLOR;
	ctx.fillRect(xOffset + xStart, yFinish, NOTE_SIZE, yStart - yFinish);
}

function renderWyrmHead(xOffset, column, relBeat, isRenderEnemies) {
	// change to "not render enemies" if wyrm is prettier
	if (true) {
		const [xStart, yStart] = getNoteXY(column, relBeat);
		const vertices = [
			[xOffset + xStart, yStart],
			[xOffset + xStart + NOTE_SIZE, yStart],
			[xOffset + xStart + NOTE_SIZE / 2, yStart - WYRM_HEAD_SIZE],
		];

		ctx.beginPath();
		ctx.moveTo(vertices[0][0], vertices[0][1]);
		ctx.lineTo(vertices[1][0], vertices[1][1]);
		ctx.lineTo(vertices[2][0], vertices[2][1]);
		ctx.closePath();

		ctx.fillStyle = WYRM_HEAD_COLOR;
		ctx.fill();
	} else {
		// wyrm head id : 7794
		renderShortNote(xOffset, column, relBeat, WYRM_HEAD_COLOR, 7794, false);
	}
}

function renderSegment(segmentIndex, chart, isRenderEnemies) {
	const beatIndex = segmentIndex * 16 + 1;
	const X_OFFSET =
		(LANE_MARGIN * 2 + LANE_GAP * 4 + LANE_WIDTH * 3) * segmentIndex;

	// render lanes
	ctx.fillStyle = LANE_COLOR;
	for (let i = 0; i < 3; i++) {
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
	const bestOptimalVibeSequence = chart.bestOptimalVibeSequence.map((vibe) => ({
		...vibe,
		beatBeginLatest: Number(vibe.beatBeginLatest.toFixed(3)),
	}));
	const optimalVibeBeats = bestOptimalVibeSequence.map((v) => v.beatBeginLatest);
	for (let relBeat = 0; relBeat < 17; relBeat += 4) {
		const [, yFinish] = getNoteXY(0, relBeat);

		ctx.fillStyle = MAIN_DIV_COLOR;
		ctx.fillRect(
			X_OFFSET + LANE_MARGIN,
			yFinish - LANE_GAP,
			LANE_WIDTH * 3 + LANE_GAP * 4,
			LANE_GAP
		);

		const actBeat = relBeat + beatIndex;
		if (!optimalVibeBeats.includes(actBeat)) {
			renderText(
				X_OFFSET + LANE_MARGIN - FONT_MARGIN,
				yFinish,
				String(actBeat).padStart(3, "0"),
				FONT_MEASURE_COLOR,
				true
			);
		}
	}

	// - draw vibe trigger indicaters and beats
	for (const vibe of bestOptimalVibeSequence) {
		let actBeat = vibe.beatBeginLatest;
		let relBeat = actBeat - beatIndex;
		if (0 <= relBeat && relBeat < 16) {
			const [, yStart] = getNoteXY(0, relBeat);

			// First indicater
			const vertices = [
				[X_OFFSET + LANE_MARGIN - FONT_MARGIN, yStart],
				[
					X_OFFSET + LANE_MARGIN - FONT_MARGIN - VIBE_IND_SIZE,
					yStart + VIBE_IND_SIZE / 2,
				],
				[
					X_OFFSET + LANE_MARGIN - FONT_MARGIN - VIBE_IND_SIZE,
					yStart - VIBE_IND_SIZE / 2,
				],
			];

			ctx.beginPath();
			ctx.moveTo(vertices[0][0], vertices[0][1]);
			ctx.lineTo(vertices[1][0], vertices[1][1]);
			ctx.lineTo(vertices[2][0], vertices[2][1]);
			ctx.closePath();
			ctx.fillStyle = VIBE_COLOR;
			ctx.fill();
			
			// Second indicater, if needed
			if(vibe.vibePower == 2){
				const vertices2 = [
					[X_OFFSET + LANE_MARGIN - FONT_MARGIN * 1.5 - VIBE_IND_SIZE, yStart],
					[
						X_OFFSET + LANE_MARGIN - FONT_MARGIN * 1.5 - VIBE_IND_SIZE * 2,
						yStart + VIBE_IND_SIZE / 2,
					],
					[
						X_OFFSET + LANE_MARGIN - FONT_MARGIN * 1.5 - VIBE_IND_SIZE * 2,
						yStart - VIBE_IND_SIZE / 2,
					],
				]
				ctx.beginPath();
				ctx.moveTo(vertices2[0][0], vertices2[0][1]);
				ctx.lineTo(vertices2[1][0], vertices2[1][1]);
				ctx.lineTo(vertices2[2][0], vertices2[2][1]);
				ctx.closePath();
				ctx.fillStyle = VIBE_COLOR;
				ctx.fill();
			}

			// Beat text
			renderText(
				X_OFFSET + LANE_MARGIN - FONT_MARGIN,
				yStart - VIBE_IND_SIZE,
				numberRounder(actBeat),
				VIBE_COLOR,
				true
			);
			// Timing text
			const timeDiffMs = Math.round((vibe.timeBeginLatest - vibe.timeBeginEarliest) * 1000);
			renderText(
				X_OFFSET + LANE_MARGIN - FONT_MARGIN,
				yStart + VIBE_IND_SIZE * 2,
				`(${timeDiffMs.toString()}ms)`,
				VIBE_COLOR,
				true
			);
		}
	}

	// - sub division
	ctx.fillStyle = SUB_DIV_COLOR;
	for (let relBeat = 0; relBeat < 17; relBeat++) {
		if (relBeat % 4 != 0) {
			const [, yFinish] = getNoteXY(0, relBeat);
			ctx.fillRect(
				X_OFFSET + LANE_MARGIN,
				yFinish - LANE_GAP,
				LANE_WIDTH * 3 + LANE_GAP * 4,
				LANE_GAP
			);
		}
	}

	// draw gaps
	for (let i = 0; i < 4; i++) {
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
	for (const bpmChange of chart.bpmChanges) {
		let relBeat = bpmChange.beat - beatIndex;
		const bpmRounded = bpmChange.bpm.toFixed(3).replace(/(?:\.0+|(\.\d*?[1-9])0+)$/, '$1');
		if (0 <= relBeat && relBeat < 16) {
			const [, yFinish] = getNoteXY(0, relBeat);
			renderText(
				X_OFFSET +
					FONT_MARGIN +
					LANE_MARGIN +
					LANE_GAP +
					LANE_WIDTH * 3,
				yFinish,
				bpmRounded,
				FONT_BPM_COLOR
			);
		}
	}

	// filter only in-range notes
	const beatBegin = beatIndex;
	const beatEnd = beatIndex + 16;

	const filteredShortNotes = chart.shortNotes.filter(
		(note) => beatBegin <= note.beatBegin && note.beatBegin <= beatEnd
	);
	const filteredWyrmNotes = chart.wyrmNotes.filter(
		(note) =>
			(beatBegin <= note.beatBegin && note.beatBegin <= beatEnd) ||
			(beatBegin <= note.beatEnd && note.beatEnd <= beatEnd) ||
			(note.beatBegin <= beatBegin && beatBegin <= note.beatEnd)
	);

	// render wyrm notes
	for (const note of filteredWyrmNotes) {
		const beatPadding = LANE_PADDING / (LANE_HEIGHT / 16);

		const relBeatBegin = Math.max(note.beatBegin - beatIndex, -beatPadding);
		const relBeatEnd = Math.min(note.beatEnd - beatIndex, 16 + beatPadding);

		renderWyrmBody(
			X_OFFSET,
			note.column,
			relBeatBegin,
			relBeatEnd,
			isRenderEnemies
		);

		const relBeatBeginWithoutPadding = note.beatBegin - beatIndex;
		if (relBeatBeginWithoutPadding >= -beatPadding) {
			renderWyrmHead(
				X_OFFSET,
				note.column,
				relBeatBeginWithoutPadding,
				isRenderEnemies
			);
		}
	}

	// render short notes
	for (const note of filteredShortNotes) {
		const relBeat = note.beatBegin - beatIndex;
		let overlap_count = 0;

		for (const otherNote of filteredShortNotes) {
			if (
				note.column == otherNote.column &&
				note.beatBegin == otherNote.beatBegin
			) {
				overlap_count += 1;
			}
			const color = overlap_count == 1 ? NOTE_COLOR : OVERLAP_COLOR;
			renderShortNote(
				X_OFFSET,
				note.column,
				relBeat,
				color,
				note.enemyType,
				note.isFacingRight,
				isRenderEnemies
			);
		}
	}
}

export function renderChart(canvas, chart, isRenderEnemies) {
	ctx = canvas.getContext("2d");

	const allBeats = [
		...chart.shortNotes.map((note) => note.beatEnd),
		...chart.wyrmNotes.map((note) => note.beatEnd),
	];
	const beatsPerSegment = 16;
	const maxBeat =
		allBeats.length > 0 ? Math.max(...allBeats) : beatsPerSegment;
	const segmentCount = Math.ceil(maxBeat / beatsPerSegment);

	const segmentWidth = LANE_MARGIN * 2 + LANE_GAP * 4 + LANE_WIDTH * 3;
	canvas.width = segmentWidth * segmentCount;
	canvas.height = LANE_HEIGHT + LANE_PADDING * 2 + LANE_MARGIN * 2;

	ctx.fillStyle = BG_COLOR;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
		renderSegment(segmentIndex, chart, isRenderEnemies);
	}
}

export function renderBothCanvas(chart) {
	if (chart) {
		const canvas1 = document.getElementById("chart-canvas");
		const canvas2 = document.getElementById("chart-canvas-er");
		renderChart(canvas1, chart, false);
		renderChart(canvas2, chart, true);
	} else {
		alert("Error: chart is null");
	}
}

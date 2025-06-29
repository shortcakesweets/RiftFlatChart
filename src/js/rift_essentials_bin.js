const EPS = 1e-6; // Used for floating point comparisons

class Cursor {
	/** @param {DataView} view */
	constructor(view) {
		this.v = view;
		this.o = 0;
	}
	uint8() {
		const x = this.v.getUint8(this.o, true);
		this.o += 1;
		return x;
	}
	int32() {
		const x = this.v.getInt32(this.o, true);
		this.o += 4;
		return x;
	}
	uint32() {
		const x = this.v.getUint32(this.o, true);
		this.o += 4;
		return x;
	}
	float32() {
		const x = this.v.getFloat32(this.o, true);
		this.o += 4;
		return x;
	}
	float64() {
		const x = this.v.getFloat64(this.o, true);
		this.o += 8;
		return x;
	}
	bool() {
		return this.v.getUint8(this.o++) !== 0;
	}
	string() {
		const len = this.uint8();
		const bytes = new Uint8Array(this.v.buffer, this.v.byteOffset + this.o, len);
		const s = new TextDecoder().decode(bytes);
		this.o += len;
		return s;
	}
}

export const EnemyType = Object.freeze({
	None: 0,
	GreenSlime: 1,
	BlueSlime: 2,
	YellowSlime: 3,
	BlueBat: 4,
	YellowBat: 5,
	RedBat: 6,
	GreenZombie: 7,
	BlueZombie: 8,
	RedZombie: 9,
	WhiteSkeleton: 10,
	WhiteShieldSkeleton: 11,
	WhiteDoubleShieldSkeleton: 12,
	YellowSkeleton: 13,
	YellowShieldSkeleton: 14,
	BlackSkeleton: 15,
	BlackShieldSkeleton: 16,
	BlueArmadillo: 17,
	RedArmadillo: 18,
	YellowArmadillo: 19,
	Wyrm: 20,
	GreenHarpy: 21,
	BlueHarpy: 22,
	RedHarpy: 23,
	Blademaster: 24,
	BlueBlademaster: 25,
	YellowBlademaster: 26,
	WhiteSkull: 27,
	BlueSkull: 28,
	RedSkull: 29,
	Apple: 30,
	Cheese: 31,
	Drumstick: 32,
	Ham: 33,
});

export class NoteFull {
	constructor() {
		this.timeBegin = 0.0;
		this.beatBegin = 0.0;
		this.timeEnd = 0.0;
		this.beatEnd = 0.0;
		this.enemyType = 0;
		this.column = 0;
		this.isFacingLeft = false;
		this.score = 0;
		this.isVibeGain = false;
	}
}

export class BpmChangeFull {
	constructor() {
		this.time = 0.0;
		this.beat = 0.0;
		this.bpm = 0.0;
	}

	toString() {
		return `${this.beat.toFixed(2)}, ${this.bpm}`;
	}
}

export class VibeFull {
	constructor() {
		this.timeBeginEarliest = 0.0;
		this.beatBeginEarliest = 0.0;
		this.timeBeginLatest = 0.0;
		this.beatBeginLatest = 0.0;
		this.timeEnd = 0.0;
		this.beatEnd = 0.0;
		this.scoreBonus = 0;
		this.isOptimal = false;
		this.vibePower = 0;
	}
}

export class ChartFull {
	constructor() {
		this.chartName = "";
		this.levelID = "";
		this.difficulty = 0;
		this.intensity = 0.0;
		this.isCustom = false;
		this.maxScoreWithoutVibe = 0;
		this.maxCombo = 0;
		this.baseBpm = 0.0;
		this.division = 0;
		this.bpmChanges = [];
		this.beatTimings = [];
		this.notes = [];
		this.maxScoreBonusVibe = 0;
		this.singleVibes = [];
		this.doubleVibes = [];

		// Calculated properties (not stored in the binary file)
		this.shortNotes = [];
		this.wyrmNotes = [];
	}
}

export function createChartFull(binDataBuffer) {
	const chart = new ChartFull();
	const cur = new Cursor(new DataView(binDataBuffer));

	// Header
	const magic = cur.string();
	if (magic != "RIFT_CHART_DATA") throw new Error(`Wrong Header`);

	const version = cur.int32();

	// Read chart data
	chart.chartName = cur.string();
	chart.levelID = cur.string();
	chart.difficulty = cur.int32();
	chart.intensity = cur.float32();
	chart.isCustom = cur.bool();
	chart.maxScoreWithoutVibe = cur.int32();
	chart.maxCombo = cur.int32();
	chart.baseBpm = cur.float32();
	chart.division = cur.int32();

	const bpmChangeCount = cur.int32();
	for (let i = 0; i < bpmChangeCount; i++) {
		const bpmChange = new BpmChangeFull();
		bpmChange.time = cur.float64();
		bpmChange.beat = cur.float64();
		bpmChange.bpm = cur.float32();
		chart.bpmChanges.push(bpmChange);
	}

	const beatTimingCount = cur.int32();
	for (let i = 0; i < beatTimingCount; i++) {
		chart.beatTimings.push(cur.float64());
	}

	const hitCount = cur.int32();
	for (let i = 0; i < hitCount; i++) {
		const note = new NoteFull();
		note.timeBegin = cur.float64();
		note.beatBegin = cur.float64();
		note.timeEnd = cur.float64();
		note.beatEnd = cur.float64();
		note.enemyType = cur.int32();
		note.column = cur.int32();
		note.isFacingLeft = cur.bool();
		note.score = cur.int32();
		note.isVibeGain = cur.bool();
		chart.notes.push(note);
	}

	chart.maxScoreBonusVibe = cur.int32();

	const singleVibeCount = cur.int32();
	for (let i = 0; i < singleVibeCount; i++) {
		const vibe = new VibeFull();
		vibe.timeBeginEarliest = cur.float64();
		vibe.beatBeginEarliest = cur.float64();
		vibe.timeBeginLatest = cur.float64();
		vibe.beatBeginLatest = cur.float64();
		vibe.timeEnd = cur.float64();
		vibe.beatEnd = cur.float64();
		vibe.scoreBonus = cur.int32();
		vibe.isOptimal = cur.bool();
		vibe.vibePower = 1;
		chart.singleVibes.push(vibe);
	}

	const doubleVibeCount = cur.int32();
	for (let i = 0; i < doubleVibeCount; i++) {
		const vibe = new VibeFull();
		vibe.timeBeginEarliest = cur.float64();
		vibe.beatBeginEarliest = cur.float64();
		vibe.timeBeginLatest = cur.float64();
		vibe.beatBeginLatest = cur.float64();
		vibe.timeEnd = cur.float64();
		vibe.beatEnd = cur.float64();
		vibe.scoreBonus = cur.int32();
		vibe.isOptimal = cur.bool();
		vibe.vibePower = 2;
		chart.doubleVibes.push(vibe);
	}

	/*
	console.log("chartName:",   chart.chartName);
	console.log("levelID:",     chart.levelID);
	console.log("difficulty:",  chart.difficulty);
	console.log("intensity:",   chart.intensity);
	console.log("isCustom:",    chart.isCustom);
	console.log("baseBpm:",     chart.baseBpm);
	console.log("division:",    chart.division);
	console.log("beatTimings:", chart.beatTimings);
	console.log("hitCount:",    hitCount);
	console.log("maxScoreBonusVibe:", chart.maxScoreBonusVibe);
	console.log("singleVibes:", chart.singleVibes);
	console.log("doubleVibes:", chart.doubleVibes);
	*/

	// Calculate derived properties
	// 1. Notes
	chart.shortNotes = chart.notes.filter((n) => n.enemyType !== EnemyType.None && n.enemyType !== EnemyType.Wyrm);
	chart.wyrmNotes = chart.notes.filter((n) => n.enemyType === EnemyType.Wyrm);

	// 2. Vibes
	// TODO: reconsrtuct the optimal vibe paths from the single/double vibe data

	return chart;
}
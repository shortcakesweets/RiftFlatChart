//#region Classes
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
		const bytes = new Uint8Array(
			this.v.buffer,
			this.v.byteOffset + this.o,
			len
		);
		const s = new TextDecoder().decode(bytes);
		this.o += len;
		return s;
	}
}

// Enemy type from bin files. This is the default enum that we will use.
export const EnemyType = Object.freeze({
	NONE: 0,
	GREEN_SLIME: 1,
	BLUE_SLIME: 2,
	YELLOW_SLIME: 3,
	BLUE_BAT: 4,
	YELLOW_BAT: 5,
	RED_BAT: 6,
	GREEN_ZOMBIE: 7,
	BLUE_ZOMBIE: 8,
	RED_ZOMBIE: 9,
	WHITE_SKELETON: 10,
	WHITE_SHIELD_SKELETON: 11,
	WHITE_DOUBLE_SHIELD_SKELETON: 12,
	YELLOW_SKELETON: 13,
	YELLOW_SHIELD_SKELETON: 14,
	BLACK_SKELETON: 15,
	BLACK_SHIELD_SKELETON: 16,
	BLUE_ARMADILLO: 17,
	RED_ARMADILLO: 18,
	YELLOW_ARMADILLO: 19,
	WYRM: 20,
	GREEN_HARPY: 21,
	BLUE_HARPY: 22,
	RED_HARPY: 23,
	BLADEMASTER: 24,
	BLUE_BLADEMASTER: 25,
	YELLOW_BLADEMASTER: 26,
	WHITE_SKULL: 27,
	BLUE_SKULL: 28,
	RED_SKULL: 29,
	APPLE: 30,
	CHEESE: 31,
	DRUMSTICK: 32,
	HAM: 33,
});

// Enemy type from JSON files. Use idToEnemyType() to convert to EnemyType.
const enemyId = Object.freeze({
	GREEN_SLIME: 1722,
	BLUE_SLIME: 4355,
	YELLOW_SLIME: 9189,
	WHITE_SKELETON: 2202,
	WHITE_SHIELD_SKELETON: 1911,
	YELLOW_SKELETON: 6803,
	YELLOW_SHIELD_SKELETON: 4871,
	BLACK_SKELETON: 2716,
	BLACK_SHIELD_SKELETON: 3307,
	WHITE_DOUBLE_SHIELD_SKELETON: 6471,
	WYRM: 7794,
	WYRM_BODY: 8079,
	WYRM_TAIL: 9888,
	BLUE_BAT: 8675309,
	YELLOW_BAT: 717,
	RED_BAT: 911,
	GREEN_HARPY: 8519,
	RED_HARPY: 3826,
	BLUE_HARPY: 8156,
	BLADEMASTER: 929,
	BLUE_BLADEMASTER: 3685,
	YELLOW_BLADEMASTER: 7288,
	WHITE_SKULL: 4601,
	BLUE_SKULL: 3543,
	RED_SKULL: 7685,
	GREEN_ZOMBIE: 1234,
	BLUE_ZOMBIE: 1235,
	RED_ZOMBIE: 1236,
	CHEESE: 2054,
	APPLE: 7358,
	DRUMSTICK: 1817,
	HAM: 3211,
	BLUE_ARMADILLO: 7831,
	YELLOW_ARMADILLO: 6311,
	RED_ARMADILLO: 1707,
});

const ID_TO_TYPE = Object.freeze({
	[enemyId.GREEN_SLIME]: EnemyType.GREEN_SLIME,
	[enemyId.BLUE_SLIME]: EnemyType.BLUE_SLIME,
	[enemyId.YELLOW_SLIME]: EnemyType.YELLOW_SLIME,

	[enemyId.WHITE_SKELETON]: EnemyType.WHITE_SKELETON,
	[enemyId.WHITE_SHIELD_SKELETON]: EnemyType.WHITE_SHIELD_SKELETON,
	[enemyId.WHITE_DOUBLE_SHIELD_SKELETON]:
		EnemyType.WHITE_DOUBLE_SHIELD_SKELETON,
	[enemyId.YELLOW_SKELETON]: EnemyType.YELLOW_SKELETON,
	[enemyId.YELLOW_SHIELD_SKELETON]: EnemyType.YELLOW_SHIELD_SKELETON,
	[enemyId.BLACK_SKELETON]: EnemyType.BLACK_SKELETON,
	[enemyId.BLACK_SHIELD_SKELETON]: EnemyType.BLACK_SHIELD_SKELETON,

	[enemyId.BLUE_ARMADILLO]: EnemyType.BLUE_ARMADILLO,
	[enemyId.RED_ARMADILLO]: EnemyType.RED_ARMADILLO,
	[enemyId.YELLOW_ARMADILLO]: EnemyType.YELLOW_ARMADILLO,

	[enemyId.WYRM]: EnemyType.WYRM,
	[enemyId.WYRM_BODY]: EnemyType.WYRM,
	[enemyId.WYRM_TAIL]: EnemyType.WYRM,

	[enemyId.BLUE_BAT]: EnemyType.BLUE_BAT,
	[enemyId.YELLOW_BAT]: EnemyType.YELLOW_BAT,
	[enemyId.RED_BAT]: EnemyType.RED_BAT,

	[enemyId.GREEN_HARPY]: EnemyType.GREEN_HARPY,
	[enemyId.BLUE_HARPY]: EnemyType.BLUE_HARPY,
	[enemyId.RED_HARPY]: EnemyType.RED_HARPY,

	[enemyId.BLADEMASTER]: EnemyType.BLADEMASTER,
	[enemyId.BLUE_BLADEMASTER]: EnemyType.BLUE_BLADEMASTER,
	[enemyId.YELLOW_BLADEMASTER]: EnemyType.YELLOW_BLADEMASTER,

	[enemyId.WHITE_SKULL]: EnemyType.WHITE_SKULL,
	[enemyId.BLUE_SKULL]: EnemyType.BLUE_SKULL,
	[enemyId.RED_SKULL]: EnemyType.RED_SKULL,

	[enemyId.APPLE]: EnemyType.APPLE,
	[enemyId.CHEESE]: EnemyType.CHEESE,
	[enemyId.DRUMSTICK]: EnemyType.DRUMSTICK,
	[enemyId.HAM]: EnemyType.HAM,
});

export function idToEnemyType(id) {
	const n = Number(id);
	if (!Number.isFinite(n)) return EnemyType.NONE;
	return ID_TO_TYPE[n] ?? EnemyType.NONE;
}

export class Note {
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

		// only used in JSON data
		this.enemyGuid = "";
	}
}

export class BpmChange {
	constructor() {
		this.time = 0.0;
		this.beat = 0.0;
		this.bpm = 0.0;
	}

	toString() {
		return `${this.beat.toFixed(2)}, ${this.bpm}`;
	}
}

export class Vibe {
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

		// Derived properties (not stored in the binary file)
		this.beatDeltaFromPrevNote = 0;
	}

	/** Helper function
	 * evaluates trigger difficulty of this vibe, heuristically
	 */
	getTriggerDifficulty() {
		const beat = this.beatBeginLatest;

		// Trigger window (30%)
		const window = this.timeBeginLatest - this.timeBeginEarliest;
		const windowDifficulty = Math.min(1, window / 0.5);

		// Sparsity (30%)
		const sparsity = this.beatDeltaFromPrevNote;
		const sparseDifficulty = sparsity >= 1 ? 0 : sparsity >= 0.5 ? 0.5 : 0;

		// 4th beat closeness (20%)
		const nearest4thBeat = Math.round((beat - 1) / 4) * 4 + 1;
		const delta4thBeat = Math.abs(beat - nearest4thBeat);
		const onBeatDifficulty = delta4thBeat < 0.125 ? 0 : 1;

		// Integer closeness (20%)
		const nearestInt = Math.round(beat);
		const deltaInt = Math.abs(beat - nearestInt);
		const intDifficulty = deltaInt < 0.125 ? 0 : 1;

		const totalDifficulty =
			windowDifficulty * 0.3 +
			sparseDifficulty * 0.3 +
			onBeatDifficulty * 0.2 +
			intDifficulty * 0.2;
		return totalDifficulty;
	}
}

export class Chart {
	constructor() {
		this.chartName = "";
		this.levelID = "";
		this.difficulty = 0;
		this.intensity = 0.0;
		this.isCustom = false;
		this.maxScore = 0;
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

		// Derived properties (not stored in the binary file)
		this.shortNotes = [];
		this.wyrmNotes = [];
		this.groupedOptimalSingleVibes = [];
		this.groupedOptimalDoubleVibes = [];
		this.vibeGainPoints = [];
		this.allOptimalVibeSequences = [];
		this.bestOptimalVibeSequence = [];
	}
}
//#endregion

export function createChartFromBin(binDataBuffer) {
	const chart = new Chart();
	const cur = new Cursor(new DataView(binDataBuffer));

	// 1. Parse
	//#region Chart - parse
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
	const baseBpmChange = new BpmChange();
	baseBpmChange.time = 0;
	baseBpmChange.beat = 0;
	baseBpmChange.bpm = chart.baseBpm;
	chart.bpmChanges.push(baseBpmChange); // add basic bpm
	for (let i = 0; i < bpmChangeCount; i++) {
		const bpmChange = new BpmChange();
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
		const note = new Note();
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
	chart.maxScore = chart.maxScoreBonusVibe + chart.maxScoreWithoutVibe;

	const singleVibeCount = cur.int32();
	for (let i = 0; i < singleVibeCount; i++) {
		const vibe = new Vibe();
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
		const vibe = new Vibe();
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

	// Derived properties
	// Short notes
	chart.shortNotes = chart.notes.filter(
		(n) =>
			Number(n.enemyType) !== Number(EnemyType.NONE) &&
			Number(n.enemyType) !== Number(EnemyType.WYRM)
	);

	// Wyrm notes
	chart.wyrmNotes = chart.notes.filter(
		(n) => Number(n.enemyType) === Number(EnemyType.WYRM)
	);

	// Vibe gain points (as Note type)
	chart.vibeGainPoints = chart.notes.filter(
		(n) => Number(n.enemyType) === Number(EnemyType.NONE) && n.isVibeGain
	);

	// Optimal vibes
	for (let i = 0; i < chart.vibeGainPoints.length; i++) {
		const timeFrom = chart.vibeGainPoints[i].timeBegin;
		const timeTo =
			i == chart.vibeGainPoints.length - 1
				? Infinity
				: chart.vibeGainPoints[i + 1].timeBegin;

		chart.groupedOptimalSingleVibes.push(
			chart.singleVibes.filter((v) => {
				return (
					v.isOptimal &&
					timeFrom < v.timeBeginEarliest &&
					v.timeBeginLatest <= timeTo
				);
			})
		);
		chart.groupedOptimalDoubleVibes.push(
			chart.doubleVibes.filter((v) => {
				return (
					v.isOptimal &&
					timeFrom < v.timeBeginEarliest &&
					v.timeBeginLatest <= timeTo
				);
			})
		);
	}

	// Optimal vibe's beat delta from previous notes
	const allNotes = [...chart.shortNotes, ...chart.wyrmNotes].sort(
		(a, b) => a.beatBegin - b.beatBegin
	);
	for (const vibe of [...chart.singleVibes, ...chart.doubleVibes]) {
		let lo = 0;
		let hi = allNotes.length - 1;
		while (lo + 1 < hi) {
			const mid = (lo + hi) >> 1;
			if (allNotes[mid].beatBegin < vibe.beatBeginLatest) {
				lo = mid;
			} else hi = mid;
		}
		vibe.beatDeltaFromPrevNote =
			vibe.beatBeginLatest - allNotes[lo].beatBegin;
	}
	//#endregion

	// 2. Vibes
	//#region Chart - vibes
	/** Helper function
	 * returns next candidates, when vibe was ended at 'time'.
	 */
	function getCandidates(time) {
		const groupedIdx = chart.vibeGainPoints.findIndex(
			(vibe) => time <= vibe.timeBegin
		);
		if (groupedIdx == -1) return [];

		const singles = chart.groupedOptimalSingleVibes[groupedIdx] ?? [];
		const doubles = chart.groupedOptimalDoubleVibes[groupedIdx + 1] ?? [];
		return [...singles, ...doubles];
	}

	let sequence = [];
	function dfs(time) {
		const candidates = getCandidates(time);
		if (candidates.length == 0) {
			chart.allOptimalVibeSequences.push(sequence.slice());
		} else {
			for (const vibe of candidates) {
				sequence.push(vibe);
				dfs(vibe.timeEnd);
				sequence.pop();
			}
		}
	}
	dfs(0);

	chart.bestOptimalVibeSequence = chart.allOptimalVibeSequences.reduce(
		(smallest, current) => {
			const currentDifficulty = current.reduce(
				(sum, vibe) => sum + vibe.getTriggerDifficulty(),
				0
			);
			const smallestDifficulty = smallest.reduce(
				(sum, vibe) => sum + vibe.getTriggerDifficulty(),
				0
			);
			return currentDifficulty < smallestDifficulty ? current : smallest;
		},
		chart.allOptimalVibeSequences[0]
	);

	// Logging
	/*
	console.log(chart.chartName, chart.difficulty);
	console.log(
		chart.allOptimalVibeSequences.map((seq) => ({
			windows: seq.map((v) => ({
				timeBeginLatest: v.timeBeginLatest,
				timeEnd: v.timeEnd,
			})),
			totalBonus: seq.reduce((sum, v) => sum + (v.scoreBonus ?? 0), 0),
			triggerDifficulty: seq.reduce(
				(sum, v) => sum + v.getTriggerDifficulty(),
				0
			),
		}))
	);
	console.log(
		chart.bestOptimalVibeSequence.map((v) => ({
			timeDelta: v.timeBeginLatest - v.timeBeginEarliest,
			beat: v.beatBeginLatest,
		}))
	);
	console.log(chart);
	*/
	//#endregion

	return chart;
}

export function createChartFromJson(jsonData) {
	const data = jsonData;

	const chart = new Chart();
	chart.chartName = data.title;
	// WARNING: cannot track chart.levelID
	chart.difficulty = data.diff;
	chart.intensity = data.intensity;
	// WARNING: cannot track chart.isCustom
	chart.maxScore = data.maxScore ?? 0;
	// WARNING: cannot track chart.maxScoreWithoutVibe
	// WARNING: cannot track chart.maxScoreBonusVibe
	chart.baseBpm = data.bpm;
	chart.division = data.beatDivisions;
	
	const baseBpmChange = new BpmChange();
	baseBpmChange.beat = 0;
	baseBpmChange.bpm = chart.baseBpm;
	chart.bpmChanges.push(baseBpmChange); // add basic bpm
	const bpmEvents = data.BpmEvents || [];
	for(const bpmEvent of bpmEvents){
		const bpmChange = new BpmChange();
		// WARNING: cannot track bpmChange.time
		bpmChange.beat = bpmEvent[0];
		bpmChange.bpm = bpmEvent[1];
		chart.bpmChanges.push(bpmChange);
	}
	// TODO: implement beatTimings (optional)

	// WARNING : will not construct chart.notes
	const hitEvents = (data.events || [])
		.filter((e) => e.Event === "HitEnemy" || e.Event === "WyrmEnd")
		.sort(
			(a, b) =>
				parseFloat(a.Beat) - parseFloat(b.Beat) ||
				parseInt(a.X) - parseInt(b.X)
		);
	for (const event of hitEvents) {
		if (event.Event === "HitEnemy") {
			const note = new Note();
			const enemyId = parseInt(event.ID);
			note.enemyGuid = event.GUID;
			note.timeBegin = parseFloat(event.Time);
			note.beatBegin = parseFloat(event.Beat);
			note.enemyType = idToEnemyType(enemyId);
			// WARNING: cannot track note.score
			if (note.enemyType !== EnemyType.WYRM) {
				note.timeEnd = note.timeBegin;
				note.beatEnd = note.beatBegin;
				chart.shortNotes.push(note);
			} else {
				// will add information later with WyrmEnd
				chart.wyrmNotes.push(note);
			}
			note.column = parseInt(event.X);
			note.isFacingLeft = !(event.Facing === "Right");
			note.isVibeGain = (event.Vibe === "True");
			
		} else if (event.Event === "WyrmEnd") {
			for (const wyrmNote of chart.wyrmNotes) {
				if (wyrmNote.enemyGuid === event.GUID) {
					wyrmNote.timeEnd = parseFloat(event.Time);
					wyrmNote.beatEnd = parseFloat(event.Beat);
				}
			}
		}
	}
	chart.maxCombo = chart.shortNotes.length + chart.wyrmNotes.length;
	
	// optimal vibes
	// WARNING: cannot track chart.groupedOptimalSingleVibes
	// WARNING: cannot track chart.groupedOptimalDoubleVibes
	// WARNING: cannot track chart.vibeGainPoints
	// WARNING: cannot track chart.allOptimalVibeSequences
	const optimalVibeBeats = data.optimalVibes || [];
	for(const beat of optimalVibeBeats){
		const vibe = new Vibe();
		// WARNING: can only track beatBeginLatest
		vibe.beatBeginLatest = beat;
		chart.bestOptimalVibeSequence.push(vibe);
	}

	return chart;
}
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

class TimeStamp {
	constructor() {
		this.time = 0.0;
		this.beat = 0.0;
		this.bpm = 0.0;
	}

	toString() {
		return `${this.beat.toFixed(2)}, ${this.bpm}`;
	}
}

// enum, but better this way
const NO_TRIGGER_0 	= 0;
const NO_TRIGGER_1 	= 1;
const NO_TRIGGER_2 	= 2;
const TRIGGER_1		= 3;
const TRIGGER_2		= 4;

class VibeSegement {
	constructor() {
		// vibe trigger time information
		this.time = 0.0;
		this.beat = 0.0;

		// vibe power (this can be 0, which means we do not trigger vibe)
		this.vibePowerOnTrigger = 0; // 0, 50, 100
		// score bonus (if vibe power is 0, automatically 0)
		this.scoreBonus = 0;

		// The first note that is not vibed after this vibe.
		//  if vibe power is 0, this will automatically point to next index
		this.nextNonVibeNoteIdx = 0;

		// accumulated score bonus
		// DEFINITION:	By this vibe trigger (or non-trigger), attainable maximum score bonus
		//				from this point until the end of the song.
		this.accScoreBonus = 0;
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
		this.vibeGainPoints = [];
		this.timeStamps = [];
	}
}

export function createChartFull(binDataBuffer) {
	const chart = new ChartFull();
	const cur = new Cursor(new DataView(binDataBuffer));

	//#region Create Chart
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
	// add basic bpm
	const baseBpmChange = new BpmChangeFull();
	baseBpmChange.time = 0;
	baseBpmChange.beat = 0;
	baseBpmChange.bpm = chart.baseBpm;
	chart.bpmChanges.push(baseBpmChange);
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
	//#endregion

	//#region Create Derived Properties
	// Short notes
	chart.shortNotes = chart.notes.filter(
		(n) => Number(n.enemyType) !== Number(EnemyType.None) &&
			   Number(n.enemyType) !== Number(EnemyType.Wyrm)
	);
	
	// Wyrm notes
	chart.wyrmNotes = chart.notes.filter(
		(n) => Number(n.enemyType) === Number(EnemyType.Wyrm)
	);

	// vibe gain points (as Note type)
	chart.vibeGainPoints = chart.notes.filter(
		(n) => Number(n.enemyType) === Number(EnemyType.None) && n.isVibeGain
	);

	// vibe gain points (as timestamp type)
	const vibeGainTimeStamps = [];
	for(const note of chart.vibeGainPoints){
		const timeStamp = new TimeStamp();
		timeStamp.time = note.timeEnd;
		timeStamp.beat = note.beatEnd;
		// We will ignore bpm for this data
		vibeGainTimeStamps.push(timeStamp);
	}

	// timestamps (for all subdivisions)
	chart.timeStamps = [];
	const maxBeatShortNote = chart.shortNotes[chart.shortNotes.length - 1];
	const maxBeatWyrmNote = chart.wyrmNotes[chart.wyrmNotes.length - 1]; // potential bug: should sort by beatEnd first (currently sorted by beatStart)
	const maxBeat = Math.round(
		Math.max(
			maxBeatShortNote === undefined ? 0 : maxBeatShortNote.beatEnd,
			maxBeatWyrmNote === undefined ? 0 : maxBeatWyrmNote.beatEnd
		)
		+8 // add more beats at the end
	);
	for(let i=0; i<chart.bpmChanges.length; i++){
		const currBeat = chart.bpmChanges[i].beat;
		const currTime = chart.bpmChanges[i].time;
		const currBpm = chart.bpmChanges[i].bpm;
		const timePerBeat = 60 / chart.bpmChanges[i].bpm;
		const nextBeat = (i == chart.bpmChanges.length - 1 ? maxBeat : chart.bpmChanges[i+1].beat);
		for(let j=Math.round(currBeat * chart.division); j / chart.division < nextBeat; j++){
			const divisionDelta = j / chart.division - currBeat;
			const stamp = new TimeStamp();
			stamp.time = currTime + divisionDelta * timePerBeat;
			stamp.beat = j / chart.division;
			stamp.bpm = currBpm;
			chart.timeStamps.push(stamp);
		}
	}
	//#endregion

	// 2. Vibes
	// TODO: reconsrtuct the optimal vibe paths from the single/double vibe data
	const allNotes = [...chart.shortNotes, ...chart.wyrmNotes].sort((a, b) => {
		return a.beatBegin - b.beatBegin;
	});

	/*
	helper function
	returns the first next viable note's index that is not effected by this vibe trigger
	if there is no such note, returns the note array's size (N)
	*/
	function getVibeEndNoteIndex(vibeTriggerNoteIdx, vibePower) {
		let timeFrom = allNotes[vibeTriggerNoteIdx].timeBegin;

		// find next vibeGainingPoint
		let extendedByNextVibeGain = false;
		let roundedVibeEndTime = 0; // outside of while scope for future use
		while(true){
			const nextVibeGainPoint = (
				extendedByNextVibeGain ?
					chart.vibeGainPoints.find(vp => timeFrom < vp.timeBegin) :
					chart.vibeGainPoints.find(vp => timeFrom <= vp.timeBegin)
			);

			// vibe end timing (raw estimate)
			const estimatedVibeEndTime = timeFrom + vibePower / 10;

			// vibe end timing (subdivision rounding)
			let lo = 0;
			let hi = chart.timeStamps.length - 1;
			if(chart.timeStamps[lo].time >= estimatedVibeEndTime){ // yeah never gonna happen
				roundedVibeEndTime = chart.timeStamps[lo].time;
			}
			else if(chart.timeStamps[hi].time < estimatedVibeEndTime){
				roundedVibeEndTime = chart.timeStamps[hi].time;
			}
			else{
				while(lo + 1 < hi){
					const mid = (lo + hi) >> 1;
					if(chart.timeStamps[mid].time < estimatedVibeEndTime){
						lo = mid;
					}
					else hi = mid;
				}
				const loTime = chart.timeStamps[lo].time;
				const hiTime = chart.timeStamps[hi].time;
				roundedVibeEndTime = (
					Math.abs(loTime - estimatedVibeEndTime) < Math.abs(hiTime - estimatedVibeEndTime) ?
						loTime : hiTime
				);
			}

			// check if new vibe gain available. If so, recalcaulte from there
			if(nextVibeGainPoint !== undefined && nextVibeGainPoint.timeBegin <= roundedVibeEndTime){
				const timeDelta = nextVibeGainPoint.timeBegin - timeFrom;
				vibePower -= timeDelta * 10;
				vibePower += 50;
				timeFrom = nextVibeGainPoint.timeBegin;
				extendedByNextVibeGain = true;
			}
			else break;
		}

		// find the last effected note (except grace time)
		let lo = 0;
		let hi = allNotes.length - 1;
		let res = 0;
		if(allNotes[lo].timeBegin > roundedVibeEndTime){ // never gonna happen
			res = lo;
		}
		else if(allNotes[hi].timeBegin <= roundedVibeEndTime){
			res = hi;
		}
		else{
			while(lo + 1 < hi){
				const mid = (lo + hi) >> 1;
				if(allNotes[mid].timeBegin <= roundedVibeEndTime){
					lo = mid;
				}
				else hi = mid;
			}
			res = lo;
		}

		// early return if the effected note is the last note
		if(res + 1 == allNotes.length){
			return res;
		}
		
		// apply grace time, and check if the next note is in that range
		const subdivisionTime = (60 / chart.baseBpm / chart.division);
		const hitWindow = 0.175;
		const graceTime = hitWindow - (Math.floor(hitWindow / subdivisionTime) * subdivisionTime);

		if(allNotes[res+1] < roundedVibeEndTime + graceTime){
			return res+1;
		}
		else{
			return res;
		}
	}

	/* let's first test how the helper function works...
	On "Disco Disaster EASY", there are total 4 vibe gain points
		[85,	139,	265,	311]		(beat)
		[40.32, 66.24, 	126.72, 148.799]	(time)
	
	There are total 147 notes in this chart. (there are no Wyrm notes, all short notes)

	we will test by using note at index 43 (time: 60.48, beat: 127)
	using single vibe will stop at approx time 65.48
	using double vibe will be enlongated at second vibe gain
	*/
	//const singleVibeEndIndex = getVibeEndNoteIndex(43, 50);
	//const doubleVibeEndIndex = getVibeEndNoteIndex(43, 100);
	/* result
	single vibe end point = 230
	*/
	//console.log(singleVibeEndIndex, allNotes[singleVibeEndIndex]);
	//console.log(doubleVibeEndIndex, allNotes[doubleVibeEndIndex]);

	// 2-1. Create note array
	

	// dp[idx][vibeType]
	// DEFINITION:	VibeSegment information on note index 'idx', with vibe trigger type 'vibeType'.
	const dp = Array.from({length : allNotes.length }, () => 
		Array.from({ length: 5 }, () => new VibeSegement())
	);

	// DP initialization
	for(let idx=0; idx<allNotes.length; idx++){
		for(let vibeType=0; vibeType<5; vibeType++){
			const note = allNotes[idx];	
			dp[idx][vibeType].time = note.timeBegin;
			dp[idx][vibeType].beat = note.beatBegin;
			dp[idx][vibeType].vibePowerOnTrigger = () => {
				switch (vibeType) {
					case NO_TRIGGER_0:
					case NO_TRIGGER_1:
					case NO_TRIGGER_2:
						return 0;
			
					case TRIGGER_1:
						return 50;
			
					case TRIGGER_2:
						return 100;
			
					default:
						return 0; // or throw an error if unexpected
				}
			};
		}

		// for vibePower 0 only:
		for(let vibeType=0; vibeType<3; vibeType++){
			dp[idx][vibeType].nextNonVibeNoteIdx = idx+1;
		}

		// for vibePower 1: WIP
		
	}

	return chart;
}
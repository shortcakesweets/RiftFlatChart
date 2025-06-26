export const enemyId = Object.freeze({
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
    RED_ARMADILLO: 1707
});

export const DIFF_STRING = ["easy", "medium", "hard", "impossible"];

export class BpmChange {
    constructor(beat = 0, bpm = 0) {
        this.beat = beat;
        this.bpm = bpm;
    }

    toString() {
        return `${this.beat.toFixed(2)}, ${this.bpm}`;
    }
}

export class Note {
    constructor() {
        this.enemyUid = "";
        this.enemyId = 0;
        this.beatStart = 0;
        this.beatFinish = 0;
        this.column = 0;
        this.isFacingRight = false;
    }
}

export class Chart {
    constructor() {
        this.key = "";
        this.name = "";
        this.shortName = "";
        this.difficulty = 0;
        this.intensity = 0;
        this.maxCombo = 0;
        this.maxScore = 0;
        this.divisions = 0;
        this.baseBpm = 0;
        this.bpmChanges = [];
        this.optimalVibes = [];
        this.shortNotes = [];
        this.wyrmNotes = [];
    }

    toString() {
        return (
            `Chart(key='${this.key}', ` +
            `name='${this.name}', ` +
            `shortName='${this.shortName}', ` +
            `difficulty=${this.difficulty}, ` +
            `intensity=${this.intensity}, ` +
            `maxCombo=${this.maxCombo}, ` +
            `maxScore=${this.maxScore}, ` +
            `divisions=${this.divisions}, ` +
            `baseBpm=${this.baseBpm}, ` +
            `bpmChanges size=${this.bpmChanges.length}, ` +
            `optimalVibes=[${this.optimalVibes.join(", ")}], ` +
            `shortNotes size=${this.shortNotes.length}, ` +
            `wyrmNotes size=${this.wyrmNotes.length})`
        );
    }
}

export function createChart(jsonData) {
    try {
        const data = jsonData;

        const chart = new Chart();
        chart.key = data.name;
        chart.name = data.name;
        chart.shortName = data.name; // TODO : fix this
        chart.difficulty = data.diff;
        chart.intensity = data.intensity;

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
        chart.maxScore = data.maxScore ? data.maxScore : 0;

        chart.divisions = data.beatDivisions;
        chart.baseBpm = data.bpm;
        chart.bpmChanges.push(new BpmChange(1, chart.baseBpm));
        const bpmEvents = (data.BpmEvents || []);
        bpmEvents.forEach(bpmEvent => {
            chart.bpmChanges.push(new BpmChange(bpmEvent[0], bpmEvent[1]));
        });

        chart.optimalVibes = (data.optimalVibes || []);

        return chart;
    } catch (error) {
        console.error(`Failed while processing chart data: ${error.message}`);
        console.error(error.stack);
        return null;
    }
}

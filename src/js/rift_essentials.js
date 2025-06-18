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
    RED_ARMADILLO: 1707
});

const DIFF_STRING = ["easy", "medium", "hard", "impossible"];

class BpmChange {
    constructor(beat = 0, bpm = 0) {
        this.beat = beat;
        this.bpm = bpm;
    }

    toString() {
        return `${this.beat.toFixed(2)}, ${this.bpm}`;
    }
}

class Note {
    constructor() {
        this.enemyUid = "";
        this.enemyId = 0;
        this.beatStart = 0;
        this.beatFinish = 0;
        this.column = 0;
        this.isFacingRight = false;
    }
}

class Chart {
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
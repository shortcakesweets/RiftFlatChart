import json, csv, traceback
from enum import Enum

CHART_INFO_JSON = "chart_info.json"
VIBE_INFO_CSV = "vibe_path.csv"
PATH_ENEMIES = "Enemies"
PATH_FLAT = "FlatCharts"
DIFF_STRING = ["easy", "medium", "hard", "impossible"]
CHART_NAME = {

}

class EnemyId(Enum):
    GREEN_SLIME = 1722
    BLUE_SLIME = 4355
    YELLOW_SLIME = 9189
    WHITE_SKELETON = 2202
    WHITE_SHIELD_SKELETON = 1911
    YELLOW_SKELETON = 6803
    YELLOW_SHIELD_SKELETON = 4871
    BLACK_SKELETON = 2716
    BLACK_SHIELD_SKELETON = 3307
    WHITE_DOUBLE_SHIELD_SKELETON = 6471
    WYRM = 7794
    WYRM_BODY = 8079
    WYRM_TAIL = 9888
    BLUE_BAT = 8675309
    YELLOW_BAT = 717
    RED_BAT = 911
    GREEN_HARPY = 8519
    RED_HARPY = 3826
    BLUE_HARPY = 8156
    BLADEMASTER = 929
    BLUE_BLADEMASTER = 3685
    YELLOW_BLADEMASTER = 7288
    WHITE_SKULL = 4601
    BLUE_SKULL = 3543
    RED_SKULL = 7685
    GREEN_ZOMBIE = 1234
    BLUE_ZOMBIE = 1235
    RED_ZOMBIE = 1236
    CHEESE = 2054
    APPLE = 7358
    DRUMSTICK = 1817
    HAM = 3211
    BLUE_ARMADILLO = 7831
    YELLOW_ARMADILLO = 6311
    RED_ARMADILLO = 1707

class BpmChange():
    def __init__(self, beat: float = 0, bpm: int = 0):
        self.beat = beat
        self.bpm = bpm
    
    def __str__(self):
        return f"{self.beat:.2f}, {self.bpm}"

class Note:
    def __init__(self):
        self.enemy_uid: str = ""
        self.enemy_id: int = 0
        self.beat_start: float = 0
        self.beat_finish: float = 0
        self.column: int = 0
        self.is_facing_right: bool = False

class Chart():
    def __init__(self):
        self.key: str = ""
        self.name: str = ""
        self.short_name: str = ""
        self.difficulty: int = 0
        self.intensity: int = 0
        self.max_combo: int = 0
        self.max_score: int = 0
        self.divisions: int = 0
        self.base_bpm: int = 0
        self.bpm_changes: list[BpmChange] = []
        self.optimal_vibes: list[float] = []
        self.short_notes: list[Note] = []
        self.wyrm_notes: list[Note] = []

    def __str__(self):
        return (
            f"Chart(key='{self.key}', "
            f"name='{self.name}', "
            f"short_name='{self.short_name}', "
            f"difficulty={self.difficulty}, "
            f"intensity={self.intensity}, "
            f"max_combo={self.max_combo}, "
            f"max_score={self.max_score}, "
            f"divisions={self.divisions}, "
            f"base_bpm={self.base_bpm}, "
            f"bpm_changes size={len(self.bpm_changes)}, "
            f"optimal_vibes={self.optimal_vibes}, "
            f"short_notes size={len(self.short_notes)}, "
            f"wyrm_notes size={len(self.wyrm_notes)})"
        )

def create_chart(key: str, diff: int) -> Chart:
    try:
        with open(CHART_INFO_JSON, 'r') as f:
            full_data = json.load(f)[key]
            raw_path = full_data['raw'][DIFF_STRING[diff]]
            hit_path = full_data['hit'][DIFF_STRING[diff]]

            with open(raw_path, 'r') as g:
                raw_data = json.load(g)
            with open(hit_path, 'r') as g:
                hit_data = json.load(g)
    except Exception as e:
        print(f"Failed while reading JSON data: {e}")
        traceback.print_exc()
        return None

    chart: Chart = Chart()
    chart.key = key
    chart.name = full_data['name'] # wip
    chart.short_name = full_data['name'] # wip
    chart.difficulty = diff

    ## Extract bpm data, divisions
    chart.divisions = raw_data['beatDivisions']
    chart.base_bpm = raw_data['bpm']
    chart.bpm_changes.append(BpmChange(1,chart.base_bpm))
    events = raw_data['events']
    for event in events:
        if event['type'] == "AdjustBPM":
            bpm: int = int(event['dataPairs'][0]['_eventDataValue'])
            beat: float = float(event['endBeatNumber'])
            chart.bpm_changes.append(BpmChange(beat, bpm))

    ## Extract note data
    events = [e for e in hit_data['events'] if e.get('Event') in ["HitEnemy", "WyrmEnd"]]
    events = sorted(events, key=lambda e: (float(e['Beat']), int(e['X'])))
    for event in events:
        if event['Event'] == "HitEnemy":
            note: Note = Note()
            note.enemy_uid = event['GUID']
            note.enemy_id = int(event['ID'])
            note.beat_start = float(event['Beat'])
            note.column = int(event['X'])
            note.is_facing_right = (event['Facing'] == "Right")
            if note.enemy_id != EnemyId.WYRM.value:
                note.beat_finish = note.beat_start
                chart.short_notes.append(note)
            else:
                chart.wyrm_notes.append(note)
        else:
            for wyrm_note in chart.wyrm_notes:
                if wyrm_note.enemy_uid == event['GUID']:
                    wyrm_note.beat_finish = float(event['Beat'])
    chart.max_combo = len(chart.short_notes) + len(chart.wyrm_notes)

    # Extract score, vibe data from csv
    try:
        with open('vibe_path.csv', 'r', newline='') as csvfile:
            reader = csv.reader(csvfile)
            target_rows = []
            for row in reader:
                if row[0] == chart.name:
                    target_rows.append(row)
            target_row = target_rows[chart.difficulty]

        chart.max_score = int(target_row[2])
        for i in range(3, len(target_row), 4):
            if target_row[i] == '':
                continue
            beat = float(target_row[i+1][1:])
            chart.optimal_vibes.append(beat)
    except FileNotFoundError as e:
        print(f"Failed to open CSV file {VIBE_INFO_CSV}: {e}")
        print(f"Ignoring csv data")
    except IndexError as e:
        print(f"Failed to get vibe data: {e}")
        print(f"Ignoring csv data")
    except Exception as e:
        print(f"Unexpected Error: {e}")
        print(f"Ignoring csv data")
    
    return chart

# Example Code
if __name__ == "__main__":
    chart: Chart = create_chart(key="RRAmalgamaniac", diff=3)
    print(chart)
import json
from enum import Enum

URL = "riftchart.shortcake.kr"

PATH_RAW = "./raw"
PATH_JSON = "./json"
PATH_FLAT = "./flat"
PATH_HTML = "./html"

class DifficultyType(Enum):
    EASY = 0
    MEDIUM = 1
    HARD = 2
    IMPOSSIBLE = 3

class EventType(Enum):
    HIT = 0
    MISS = 1
    OVERPRESS = 2
    HOLD_SEGMENT = 3
    HOLD_COMPLETE = 4
    VIBE_GAINED = 5
    VIBE_ACTIVATED = 6
    VIBE_ENDED = 7

class EnemyType(Enum):
    NONE = 0
    GREEN_SLIME = 1
    BLUE_SLIME = 2
    YELLOW_SLIME = 3
    BLUE_BAT = 4
    YELLOW_BAT = 5
    RED_BAT = 6
    GREEN_ZOMBIE = 7
    BLUE_ZOMBIE = 8
    RED_ZOMBIE = 9
    WHITE_SKELETON = 10
    WHITE_SHIELD_SKELETON = 11
    WHITE_DOUBLE_SHIELD_SKELETON = 12
    YELLOW_SKELETON = 13
    YELLOW_SHIELD_SKELETON = 14
    BLACK_SKELETON = 15
    BLACK_SHIELD_SKELETON = 16
    BLUE_ARMADILLO = 17
    RED_ARMADILLO = 18
    YELLOW_ARMADILLO = 19
    WYRM = 20
    GREEN_HARPY = 21
    BLUE_HARPY = 22
    RED_HARPY = 23
    BLADEMASTER = 24
    BLUE_BLADEMASTER = 25
    YELLOW_BLADEMASTER = 26
    WHITE_SKULL = 27
    BLUE_SKULL = 28
    RED_SKULL = 29
    APPLE = 30
    CHEESE = 31
    DRUMSTICK = 32
    HAM = 33

class Event():
    event_type: EventType = EventType.MISS
    time: float = 0
    beat: float = 0
    target_time: float = 0
    target_beat: float = 0
    enemy_type: EnemyType = EnemyType.NONE
    column: int = 0
    total_score: int = 0
    base_score: int = 0
    base_score_multiplier: int = 0
    vibe_score_multiplier: int = 0
    bonus_score: int = 0
    is_vibe: bool = 0

class Note:
    def __init__(self, event: Event):
        self.beat_start: float = event.target_beat
        self.beat_finish: float = event.target_beat if event.enemy_type != EnemyType.WYRM else 0.0
        self.enemy_type: EnemyType = event.enemy_type
        self.column: int = event.column
        self.combo: int = 0
        # self.is_vibe: bool = event.is_vibe
        self.is_vibe: bool = False

def load_note(data: dict) -> Note:
    note = Note.__new__(Note)  # Bypass __init__
    note.beat_start = data.get("beat_start", 0)
    note.beat_finish = data.get("beat_finish", 0)
    enemy_str = data.get("enemy_type", "NONE")
    note.enemy_type = EnemyType[enemy_str]
    note.column = data.get("column", 0)
    note.combo = data.get("combo", 0)
    note.is_vibe = data.get("is_vibe", False)
    return note

class BpmChange():
    def __init__(self, beat: float = 0, bpm: int = 0):
        self.beat = beat
        self.bpm = bpm

def load_bpm_change(data: dict) -> BpmChange:
    bpm_change = BpmChange()
    bpm_change.beat = data.get("beat", 0)
    bpm_change.bpm = data.get("bpm", 0)

class VibeData():
    def __init__(self, beat: float = 0, enemies: int = 0):
        self.beat = beat
        self.enemies = enemies

def load_vibe_data(data: dict) -> VibeData:
    vibe_data = VibeData()
    vibe_data.beat = data.get("beat", 0)
    vibe_data.enemies = data.get("enemies", 0)

class Chart():
    id: str = ""
    name: str = ""
    short_name: str = ""
    difficulty: DifficultyType = DifficultyType.EASY
    intensity: int = 0
    max_combo: int = 0
    max_score: int = 0
    divisions: int = 0
    base_bpm: int = 0
    bpm_changes: list[BpmChange] = []
    optimal_vibes: list[VibeData] = []
    short_notes : list[Note] = []
    wyrm_notes : list[Note] =  []

def load_chart(data: dict) -> Chart:
    chart = Chart()
    chart.id = data.get("id", "")
    chart.name = data.get("name", "")
    chart.short_name = data.get("short_name", "")
    chart.difficulty = DifficultyType[data.get("difficulty", "EASY")]
    chart.intensity = data.get("intensity", 0)
    chart.max_combo = data.get("max_combo", 0)
    chart.max_score = data.get("max_score", 0)
    chart.divisions = data.get("divisions", 0)
    chart.base_bpm = data.get("base_bpm", 0)

    chart.bpm_changes = [load_bpm_change(sub_data) for sub_data in data.get("bpm_changes", [])]
    chart.optimal_vibes = [load_vibe_data(sub_data) for sub_data in data.get("optimal_vibes", [])]

    chart.short_notes = [load_note(sub_data) for sub_data in data.get("short_notes", [])]
    chart.wyrm_notes = [load_note(sub_data) for sub_data in data.get("wyrm_notes", [])]

    return chart

class CustomJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if (isinstance(obj, Note) or
            isinstance(obj, BpmChange) or
            isinstance(obj, VibeData) or
            isinstance(obj, Chart)):
            return obj.__dict__
        elif isinstance(obj, Enum):
            return obj.name
        return super().default(obj)

import json
from constants import EnemyType, EventType

class Note():
    def __init__(self):
        self.beat_start:    float = 0.0
        self.beat_finish:   float = 0.0
        self.is_wyrm:       bool  = False
        self.column:        int   = 0
        self.overlap:       int   = 1
        self.combo:         int   = 0

def filter_short_note(event) -> bool:
    return event['enemy_type'] != EnemyType.WYRM.value and event['event_type'] == EventType.HIT.value

def filter_wyrm_start(event) -> bool:
    return event['enemy_type'] == EnemyType.WYRM.value and event['event_type'] == EventType.HIT.value

def filter_wyrm_finish(event) -> bool:
    return event['enemy_type'] == EnemyType.WYRM.value and event['event_type'] == EventType.HOLD_COMPLETE.value

def extract_notes(file):
    with open(file, 'r') as f:
        data = json.load(f)
    
    # filter and sort events
    events = data['events']
    
    short_note_events = list(filter(filter_short_note, events))
    wyrm_start_events = list(filter(filter_wyrm_start, events))
    wyrm_finish_events = list(filter(filter_wyrm_finish, events))
    
    def sort_event(event):
        return (event['target_beat'], event['column'])
    
    short_note_events = sorted(short_note_events, key=sort_event)
    wyrm_start_events = sorted(wyrm_start_events, key=sort_event)
    wyrm_finish_events = sorted(wyrm_finish_events, key=sort_event)
    
    # create short notes
    short_notes = []
    for event in short_note_events:
        prev_note = short_notes[-1] if len(short_notes) != 0 else None
        
        if prev_note:
            if prev_note.beat_start == event['target_beat'] and prev_note.column == event['column']:
                prev_note.overlap += 1
                continue
        
        note = Note()
        note.beat_start = event['target_beat']
        note.beat_finish = event['target_beat']
        note.column = event['column']
        
        short_notes.append(note)
    
    # create wyrm notes
    wyrm_notes = []
    for event in wyrm_start_events:
        note = Note()
        note.beat_start = event['target_beat']
        note.column = event['column']
        
        wyrm_notes.append(note)
    
    for event in wyrm_finish_events:
        target: Note = None
        for note in wyrm_notes:
            if note.beat_finish == 0.0 and note.column == event['column']:
                target = note
                break
        
        if target:
            target.beat_finish = event['target_beat']
        else:
            print("WYRM ERROR")
    
    # assign combo values for each notes
    short_note_index = 0
    wyrm_note_index = 0
    combo = 0
    while short_note_index < len(short_notes) or wyrm_note_index < len(wyrm_notes):
        target_beat = 1e9
        if short_note_index < len(short_notes):
            target_beat = min(target_beat, short_notes[short_note_index].beat_start)
        if wyrm_note_index < len(wyrm_notes):
            target_beat = min(target_beat, wyrm_notes[wyrm_note_index].beat_start)

        target_notes = []
        while short_note_index < len(short_notes) and short_notes[short_note_index].beat_start == target_beat:
            target_notes.append(short_notes[short_note_index])
            short_note_index += 1
        while wyrm_note_index < len(wyrm_notes) and wyrm_notes[wyrm_note_index].beat_start == target_beat:
            target_notes.append(wyrm_notes[wyrm_note_index])
            wyrm_note_index += 1
        
        combo += len(target_notes)
        for note in target_notes:
            note.combo = combo

    return short_notes, wyrm_notes

if __name__ == "__main__":
    import glob, os
    from constants import PATH_JSON
    
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        with open(file, 'r') as f:
            data = json.load(f)
        
        name = data['name']
        difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]
        
        short_notes, wyrm_notes = extract_notes(file)
        overlap_count = 0
        for note in short_notes:
            if note.overlap != 1:
                overlap_count += 1
        
        print(f"===={name} {difficulty}====")
        print(f"- short notes(overlaps): {len(short_notes)}({overlap_count})")
        print(f"- wyrm  notes          : {len(wyrm_notes)}")
        for note in wyrm_notes:
            print(f" wyrm start/finish beat: {note.beat_start:.2f} / {note.beat_finish:.2f}")
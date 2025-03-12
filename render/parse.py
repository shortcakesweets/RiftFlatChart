"""
Converts raw file (.bin) to JSON format
"""

import json, struct, glob, os, traceback
from rift_essentials import *

def read_int(f) -> int:
    return struct.unpack('<i', f.read(4))[0]

def read_double(f) -> float:
    return struct.unpack('<d', f.read(8))[0]

def read_bool(f) -> bool:
    return struct.unpack('<?', f.read(1))[0]

def read_string(f) -> str:
    length = struct.unpack('<b', f.read(1))[0]
    return f.read(length).decode('utf-8')

def parse(file) -> None:
    # read bin file
    with open(file, "rb") as f:
        header = read_string(f)

        if header != "RIFT_EVENT_CAPTURE":
            print(f"Warning: unexpected header {header}. Skipping current file.")
            return None
        
        # version
        version = read_int(f)

        # name, level_id
        name = read_string(f)
        level_id = read_string(f)

        # difficulty
        difficulty = DifficultyType(read_int(f))

        # pins(modifiers)
        pin_count = read_int(f)
        for _ in range(pin_count):
            pin = read_string(f)

        # bpm, divisions, beat count, beat timings
        base_bpm = read_int(f)
        divisions = read_int(f)
        beat_count = read_int(f)
        for _ in range(beat_count):
            beat_timing = read_double(f)
        
        # events
        events: list[Event] = []
        event_count = read_int(f)
        for _ in range(event_count):
            event = Event()
            event.event_type = EventType(read_int(f))
            event.time = read_double(f)
            event.beat = read_double(f)
            event.target_time = read_double(f)
            event.target_beat = round(read_double(f), 3) # rounds up to 3 decimal points
            event.enemy_type = EnemyType(read_int(f))
            event.column = read_int(f)
            event.total_score = read_int(f)
            event.base_score = read_int(f)
            event.base_score_multiplier = read_int(f)
            event.vibe_score_multiplier = read_int(f)
            event.bonus_score = read_int(f)
            event.is_vibe = read_bool(f)

            events.append(event)
    
    # create notes
    short_note_events = list(filter(lambda event: event.event_type == EventType.HIT and event.enemy_type != EnemyType.WYRM, events))
    wyrm_start_events = list(filter(lambda event: event.event_type == EventType.HIT and event.enemy_type == EnemyType.WYRM, events))
    wyrm_finish_events = list(filter(lambda event: event.event_type == EventType.HOLD_COMPLETE and event.enemy_type == EnemyType.WYRM, events))
    
    def sort_event(event: Event):
        return (event.target_beat, event.column)
    
    short_note_events = sorted(short_note_events, key=sort_event)
    wyrm_start_events = sorted(wyrm_start_events, key=sort_event)
    wyrm_finish_events = sorted(wyrm_finish_events, key=sort_event)

    short_notes: list[Note] = [Note(event) for event in short_note_events]
    wyrm_notes: list[Note] = [Note(event) for event in wyrm_start_events]
    
    for event in wyrm_finish_events:
        target: Note = None
        for note in wyrm_notes:
            if note.beat_finish == 0.0 and note.column == event.column:
                target = note
                break
        
        if target:
            target.beat_finish = event.target_beat
        else:
            print("WYRM ERROR")
    
    for note in wyrm_notes:
        if note.beat_finish == 0.0:
            print("WYRM ERROR")
            break

    # assign combo
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
    
    # create chart class
    output_file = f"{name}_{difficulty.value}.json"
    output_path = f"{PATH_JSON}/{output_file}"

    try:
        with open(output_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        chart = load_chart(data)
    except Exception as e:
        chart = Chart()
        print(f"- Failed to load data for {output_file}: {e}")

    chart = Chart()
    chart.id = f"{name}_{difficulty.value}"
    chart.name = name
    chart.difficulty = difficulty
    chart.max_combo = combo
    chart.divisions = divisions
    chart.base_bpm = base_bpm
    # chart.bpm_changes = [BpmChange(1,base_bpm)]
    chart.short_notes = short_notes
    chart.wyrm_notes = wyrm_notes
    
    # export as JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chart, f, indent=4, cls=CustomJsonEncoder)
    print(f"JSON data saved as {output_file}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-a", "--all", action="store_true")
    parser.add_argument("-i", "--input")
    args = parser.parse_args()

    if args.all:
        bin_files = glob.glob(os.path.join(PATH_RAW, "*.bin"))
        for file in bin_files:
            try:
                parse(file)
            except Exception as e:
                print(f"Parsing failed for file {file}: {e}")
                traceback.print_exc()
    else:
        if not args.input:
            parser.error("Should specify input. Type --help for more information.")
        else:
            try:
                parse(args.input)
            except Exception as e:
                print(f"Parsing failed for file {args.input}: {e}")
                traceback.print_exc()

import os, glob, struct, json
from typing import Optional

INPUT_PATH = "./raw"
OUTPUT_PATH = "./res"

def read_int(f) -> int:
    return struct.unpack('<i', f.read(4))[0]

def read_double(f) -> float:
    return struct.unpack('<d', f.read(8))[0]

def read_bool(f) -> bool:
    return struct.unpack('<?', f.read(1))[0]

def read_string(f) -> str:
    length = struct.unpack('<b', f.read(1))[0]
    return f.read(length).decode('utf-8')

def parse(file) -> Optional[dict]:
    data = {}
    with open(file, "rb") as f:
        data['header'] = read_string(f)

        if data['header'] != "RIFT_EVENT_CAPTURE":
            print(f"Warning: unexpected header {data['header']}. Skipping current file.")
            return None
        
        # version
        data['version'] = read_int(f)

        # name, level_id
        data['name'] = read_string(f)
        data['level_id'] = read_string(f)

        # difficulty
        data['difficulty'] = read_int(f)

        # pins(modifiers)
        data['pins'] = []
        pin_count = read_int(f)
        for _ in range(pin_count):
            data['pins'].append(read_string(f))

        # bpm, divisions, beat count and timings
        data['bpm'] = read_int(f)
        data['divisions'] = read_int(f)
        data['beat_count'] = read_int(f)
        data['beat_timings'] = []
        for _ in range(data['beat_count']):
            data['beat_timings'].append(read_double(f))
        
        # events
        data['events'] = []
        event_count = read_int(f)
        for _ in range(event_count):
            event = {}
            event['event_type'] = read_int(f)
            event['time'] = read_double(f)
            event['beat'] = read_double(f)
            event['target_time'] = read_double(f)
            event['target_beat'] = read_double(f)
            event['enemy_type'] = read_int(f)
            event['column'] = read_int(f)
            event['total_score'] = read_int(f)
            event['base_score'] = read_int(f)
            event['base_score_multiplier'] = read_int(f)
            event['vibe_score_multiplier'] = read_int(f)
            event['bonus_score'] = read_int(f)
            event['is_vibe'] = read_bool(f)

            data['events'].append(event)

    return data

def dump(data) -> None:
    name = data['name']
    difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]

    with open(os.path.join(OUTPUT_PATH, f"{name}_{difficulty}.json"), "w") as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    bin_files = glob.glob(os.path.join(INPUT_PATH, "*.bin"))
    print(bin_files)
    for file in bin_files:
        data = parse(file)
        if data:
            dump(data)
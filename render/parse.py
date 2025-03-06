import os, glob, struct, json, csv
from typing import Optional
from constants import PATH_RAW, PATH_JSON

# Used to track which vibe row is correct
# - only used when "csv row head != data['name']"
# - this value should be updated manually.
NAME_TO_ROW_HEAD = {
    'Glass Cages (feat. Sarah Hubbard)': "Glass Cages",
    'Om and On': "Om And On",
    'Under the Thunder': "Under The Thunder"
}

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
            # round up to 3 decimal points
            event['target_beat'] = round(read_double(f), 3)
            event['enemy_type'] = read_int(f)
            event['column'] = read_int(f)
            event['total_score'] = read_int(f)
            event['base_score'] = read_int(f)
            event['base_score_multiplier'] = read_int(f)
            event['vibe_score_multiplier'] = read_int(f)
            event['bonus_score'] = read_int(f)
            event['is_vibe'] = read_bool(f)

            data['events'].append(event)
        
        # add vibe data
        row_head = NAME_TO_ROW_HEAD[data['name']] if data['name'] in NAME_TO_ROW_HEAD else data['name']
        with open('vibe_path.csv', 'r', newline='') as csvfile:
            reader = csv.reader(csvfile)
        
            target_rows = []
            for row in reader:
                if row[0] == row_head:
                    target_rows.append(row)
            target_row = target_rows[data['difficulty']]

            data['max_score'] = int(target_row[2])
            data['vibe'] = []
            for i in range(3, len(target_row), 4):
                if target_row[i] == '':
                    continue

                vibe_chunk = {
                    'bar': target_row[i],
                    'beat': float(target_row[i+1][1:]),
                    'combo': int(target_row[i+2]),
                    'enemies': int(target_row[i+3])
                }
                
                data['vibe'].append(vibe_chunk)

    return data

def dump(data) -> None:
    name = data['name']
    difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]

    with open(os.path.join(PATH_JSON, f"{name}_{difficulty}.json"), "w") as f:
        json.dump(data, f, indent=4)

if __name__ == "__main__":
    bin_files = glob.glob(os.path.join(PATH_RAW, "*.bin"))
    for file in bin_files:
        data = parse(file)
        if data:
            dump(data)
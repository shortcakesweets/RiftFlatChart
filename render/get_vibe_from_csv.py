import os, glob, csv, json, bisect
from rift_essentials import *

def get_vibe(file):
    NAME_TO_ROW_HEAD = {
        'Brave the Harvester': "Brave The Harvester",
        'Glass Cages (feat. Sarah Hubbard)': "Glass Cages",
        'Om and On': "Om And On",
        'Under the Thunder': "Under The Thunder",
        'RAVEVENGE (feat. Aram Zero)': "RAVEVENGE",
        "What's in the Box": "What's In The Box?"
    }
    
    with open(file, 'r') as f:
        data = json.load(f)
        
    chart = load_chart(data)
    name = chart.name

    row_head = NAME_TO_ROW_HEAD[name] if name in NAME_TO_ROW_HEAD else name
    try:
        with open('vibe_path.csv', 'r', newline='') as csvfile:
            reader = csv.reader(csvfile)

            target_rows = []
            for row in reader:
                if row[0] == row_head:
                    target_rows.append(row)
            target_row = target_rows[DifficultyType(chart.difficulty).value]
        
        chart.max_score = int(target_row[2])
        chart.optimal_vibes = []
        for i in range(3, len(target_row), 4):
            if target_row[i] == '':
                continue

            beat = float(target_row[i+1][1:]) - 1
            # spreadsheet was starting beat at 1
            enemies = int(target_row[i+3])
            
            chart.optimal_vibes.append(VibeData(beat, enemies))

        # deprecated
        """
        # determine vibe for all notes
        all_notes: list[Note] = chart.short_notes + chart.wyrm_notes
        all_notes.sort(key=lambda note: note.beat_start)
        
        # function implementation of binary search
        def binary_search(target_beat: float):
            beat_start_list = [note.beat_start for note in all_notes]
            index = bisect.bisect_left(beat_start_list, target_beat)
            if index < len(all_notes):
                return index
            return None

        for vibe_data in chart.optimal_vibes:
            index_from = binary_search(vibe_data.beat - 0.1)
            index_to = min(index_from + vibe_data.enemies, len(all_notes)) - 1
            
            while index_to + 1 < len(all_notes) and all_notes[index_to].beat_start == all_notes[index_to + 1].beat_start:
                index_to += 1
            
            for i in range(index_from, index_to + 1):
                all_notes[i].is_vibe = True
        """

        with open(file, "w", encoding="utf-8") as f:
            json.dump(chart, f, indent=4, cls=CustomJsonEncoder)
        print(f"Vibe data added in {file}")
    except Exception as e:
        print(f"Cannot get vibe data for {name}: {e}")
    
if __name__ == "__main__":
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        get_vibe(file)
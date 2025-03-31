import os, glob, csv, json, bisect
from rift_essentials import *

def get_vibe(file):
    NAME_TO_ROW_HEAD = {
        'Brave the Harvester': "Brave The Harvester",
        'Glass Cages (feat. Sarah Hubbard)': "Glass Cages",
        'Om and On': "Om And On",
        'Under the Thunder': "Under The Thunder",
        'RAVEVENGE (feat. Aram Zero)': "RAVEVENGE",
        "What's in the Box": "What's In The Box?",
        "Resurrections (dannyBstyle Remix)": "Resurrections Remix",
        "Scattered and Lost": "Scattered And Lost",
        "Reach for the Summit": "Reach For The Summit",
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

            beat = float(target_row[i+1][1:])
            enemies = int(target_row[i+3])
            
            chart.optimal_vibes.append(VibeData(beat, enemies))
        
        with open(file, "w", encoding="utf-8") as f:
            json.dump(chart, f, indent=4, cls=CustomJsonEncoder)
        print(f"Vibe data added in {file}")
    except Exception as e:
        print(f"Cannot get vibe data for {name}: {e}")
    
if __name__ == "__main__":
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        get_vibe(file)
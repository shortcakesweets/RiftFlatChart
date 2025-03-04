import os, glob, json

OUTPUT_PATH = "./res"
EVENT_TYPE = ["Hit", "Miss", "Overpress", "Hold Segment", "Hold Complete", "Vibe Gained", "Vibe Activated", "Vibe Ended"]

def analyze(file):
    with open(file, 'r') as f:
        data = json.load(f)

    name = data['name']
    difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]
    print(f"== {name}_{difficulty} ==")

    events = data.get('events', [])
    if not events:
        print("No events found in current file.")
        return
    
    event_types = [event.get('event_type') for event in events]

    stats = [0,0,0,0,0,0,0,0]
    for event_type in event_types:
        stats[event_type] += 1
    
    for idx, value in enumerate(stats):
        print(f"{EVENT_TYPE[idx]}\t\t{value}")
    print("===============================")

if __name__ == "__main__":
    json_files = glob.glob(os.path.join(OUTPUT_PATH, "*.json"))
    for file in json_files:
        data = analyze(file)

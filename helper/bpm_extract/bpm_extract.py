import os, glob, json
from rift_essentials import *

path = "./chart_files"

if __name__ == "__main__":
    chart_files = glob.glob(os.path.join(path, "*"))
    for file in chart_files:
        with open(file, "r", encoding="utf-8") as f:
            data: dict = json.load(f)
        
        print(f"=== {data['name']} ===")
        events = data['events']
        for event in events:
            if event['type'] == "AdjustBPM":
                # print(event)
                bpm: int = int(event['dataPairs'][0]['_eventDataValue'])
                beat: float = float(event['endBeatNumber'])
                
                print(f"{beat}: {bpm}")
    
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        with open(file, "r", encoding="utf-8") as f:
            chart: Chart = load_chart(json.load(f))
            
            print(f"{chart.name}: {chart.base_bpm}")
            
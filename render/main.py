import os, glob, struct, json
from parse import parse, dump
from flatten import flatten
from html_render import render
from constants import PATH_RAW, PATH_JSON

if __name__ == "__main__":
    # raw to json
    bin_files = glob.glob(os.path.join(PATH_RAW, "*.bin"))
    print(f"1. PARSE")
    for file in bin_files:
        data = parse(file)

        name = data['name']
        difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]
        if data:
            print(f"- {name} ({difficulty}) : OK")
            dump(data)
        else:
            print(f"- {name} ({difficulty}) : FAILED")
    
    # json to flat chart, then render html
    print(f"2. RENDER")
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        with open(file, 'r') as f:
            data = json.load(f)
        name = data['name']
        difficulty = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]
        
        flatten(file)
        render(file)
import os, glob, json
from parse import parse
from flatten import flatten
from render_chart_html import render_chart_html
from render_hompage_html import render_homepage_html
from render_changelog_html import render_changelog_html
from rift_essentials import PATH_RAW, PATH_JSON

if __name__ == "__main__":
    # 1. Parses (and dump data as JSON)
    bin_files = glob.glob(os.path.join(PATH_RAW, "*.bin"))
    for file in bin_files:
        data = parse(file)
        if data:
            name = data['name']
            difficulty = data['difficulty']
            difficulty_str = ["Easy", "Medium", "Hard", "Impossible"][difficulty]
            with open(os.path.join(PATH_JSON, f"{name}_{difficulty_str}.json"), "w") as f:
                json.dump(data, f, indent=4)
            print(f"Parse success on {name} ({difficulty}).")
        else:
            print(f"Failed Parse on {file}.")

    # 2. Flatten
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        flatten(file)
    
    # 3. Render chart HTML
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        render_chart_html(file)
    
    # 4. Render homepage
    render_homepage_html()
    render_changelog_html()
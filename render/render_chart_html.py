import os, glob, json
from constants import PATH_FLAT, PATH_HTML, URL

html_template = """<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>{title} {difficulty}</title>
        <link rel="stylesheet" href="style.css" />
    </head>
    <body>
        <div class="top-bar">
            <div class="album-info">
                <img src="./jacket/{title}.png" alt="Album Cover" />
                <table class="description-table">
                    <tr>
                        <td>Song Name</td>
                        <td>{title}</td>
                    </tr>
                    <tr>
                        <td>Difficulty</td>
                        <td>{difficulty}</td>
                    </tr>
                    <tr>
                        <td>BPM</td>
                        <td>{bpm}</td>
                    </tr>
                    <tr>
                        <td>Max Combo</td>
                        <td>{max_combo}</td>
                    </tr>
                    <tr>
                        <td>Max Score</td>
                        <td>{max_score}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="content">
            <img
                src="{chart_src}"
                alt="{chart_alt}" />
        </div>
    </body>
</html>
"""

def render_chart_html(file):
    try:
        with open(file) as f:
            data = json.load(f)
        
        name = data['name']
        difficulty = data['difficulty']
        difficulty_str = ["Easy", "Medium", "Hard", "Impossible"][difficulty]

        title = f"{name} {difficulty_str}"
        chart_path = os.path.relpath(os.path.join(PATH_FLAT, f"{name}_{difficulty}.png"), PATH_HTML)
        
        bpm = data['bpm']
        max_combo = 0
        max_score = 0

        html_content = html_template.format(title=name,
                                            difficulty=f"{difficulty_str}({difficulty})",
                                            bpm=str(bpm),
                                            max_combo=max_combo,
                                            max_score=max_score,
                                            chart_src=chart_path,
                                            chart_alt=title)

        with open(os.path.join(PATH_HTML, f"{title}.html"), "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"HTML render success on {name} ({difficulty}).")
    except Exception as e:
        print(f"HTML render failed on {name} ({difficulty}): {e}")

if __name__ == "__main__":
    from constants import PATH_JSON
    
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        render_chart_html(file)
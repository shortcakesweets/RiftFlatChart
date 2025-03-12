import os, glob, json, datetime, markdown
from rift_essentials import *

# Charts
html_template_chart = """<!DOCTYPE html>
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
                        <td>{difficulty}({intensity})</td>
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
        
        chart = load_chart(data)
        
        name = chart.name
        difficulty = chart.difficulty
        intensity = chart.intensity

        title = f"{name} {difficulty.name}"
        chart_path = os.path.relpath(os.path.join(PATH_FLAT, f"{name}_{difficulty.value}.png"), PATH_HTML)
        
        base_bpm = chart.base_bpm
        max_bpm = max(bpm_change.bpm for bpm_change in chart.bpm_changes)
        min_bpm = min(bpm_change.bpm for bpm_change in chart.bpm_changes)
        bpm_str = f"{base_bpm}" if min_bpm == max_bpm else f"{min_bpm}-{max_bpm} ({base_bpm})"
        
        max_combo = chart.max_combo
        max_score = chart.max_score

        html_content = html_template_chart.format(title=name,
                                            difficulty=f"{difficulty.name}",
                                            intensity=f"{intensity}",
                                            bpm=bpm_str,
                                            max_combo=max_combo,
                                            max_score=max_score,
                                            chart_src=chart_path,
                                            chart_alt=title)

        with open(os.path.join(PATH_HTML, f"{title}.html"), "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"HTML render success on {name} ({difficulty.name}).")
    except Exception as e:
        print(f"HTML render failed on {name} ({difficulty.name}): {e}")

# Homepage
html_template_homepage = """<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
        <title>RoTN Chart archive</title>
        <link rel="stylesheet" href="style.css" />
    </head>
    <body>
        <div class="title-div">
            <p>Rift of The Necrodancer</p>
            <p>Chart Archive</p>
            <a
                href="https://riftchart.shortcake.kr/changelog.html"
                class="changelog-link"
                >Changelog {timestamp}</a
            >
        </div>
        <table class="song-list">
            {row_segments}
        </table>
    </body>
</html>
"""

def create_row_html(file) -> str:
    with open(file) as f:
        data = json.load(f)
    
    chart = load_chart(data)
    
    name = chart.name
    difficulty = chart.difficulty
    
    title = f"{name} {difficulty.name}"
    
    row_template = """<tr>
    <td>
        <a href="./render/html/{title}.html">
            <img src="./render/html/jacket/{song_name}.png" class="album-cover">
        </a>
    </td>
    <td>
        <a href="./render/html/{title}.html" class="song-name">{song_name}</a>
    </td>
</tr>
    """
    
    row_html_segment = row_template.format(title=title, song_name=name)
    
    return row_html_segment

def render_homepage_html():
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M (UTC+09:00)")
    print(timestamp)
    
    row_segments = """"""
    for file in json_files:
        row_segments += create_row_html(file)
    
    html_content = html_template_homepage.format(timestamp=timestamp,
                                        row_segments=row_segments)
    
    with open("../index.html", "w", encoding="utf-8") as f:
        f.write(html_content)

# Changelog
html_template_changelog = """<!DOCTYPE html>
<html lang="en">
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charset="UTF-8" />
        <title>RoTN Chart archive</title>
        <link rel="stylesheet" href="style.css" />
    </head>
    <body>
        <div class="center-container">
            <div class="changelog-div">
                {changelog}
            </div>
        </div>
    </body>
</html>
"""

def render_changelog_html():
    with open("changelog.md", "r", encoding="utf-8") as f:
        md_text = f.read()
    changelog = markdown.markdown(md_text)
    
    html_content = html_template_changelog.format(changelog=changelog)

    with open("../changelog.html", "w", encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        render_chart_html(file)
    render_homepage_html()
    render_changelog_html()
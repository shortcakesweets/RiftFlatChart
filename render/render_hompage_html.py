import os, glob, json, datetime
from constants import PATH_HTML, PATH_JSON

html_template = """<!DOCTYPE html>
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
    
    title = data['name']
    difficulty_str = ["Easy", "Medium", "Hard", "Impossible"][data['difficulty']]
    
    row_template = """<tr>
    <td>
        <a href="./render/html/{title} {difficulty_str}.html">
            <img src="./render/html/jacket/{title}.png" class="album-cover">
        </a>
    </td>
    <td>
        <a href="./render/html/{title} {difficulty_str}.html" class="song-name">{title}</a>
    </td>
</tr>
    """
    
    row_html_segment = row_template.format(title=title, difficulty_str=difficulty_str)
    
    return row_html_segment

def render_homepage_html():
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M (UTC+09:00)")
    print(timestamp)
    
    row_segments = """"""
    for file in json_files:
        row_segments += create_row_html(file)
    
    html_content = html_template.format(row_segments=row_segments)
    
    with open("../index.html", "w", encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    render_homepage_html()
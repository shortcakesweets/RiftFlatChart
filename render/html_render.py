import os, glob, json
from constants import PATH_FLAT, PATH_HTML

html_template = """
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>{title}</title>
        <link rel="stylesheet" href="style.css" />
    </head>
    <body>
        <div class="top-bar">
            <h1>Rendered PNG Information</h1>
            <p>Display details and statistics about the rendered image here.</p>
        </div>

        <div class="content">
            <img
                src="{img_src}"
                alt="{img_alt}" />
        </div>
    </body>
</html>
"""

def render(file):
    try:
        with open(file) as f:
            data = json.load(f)
        
        name = data['name']
        difficulty = data['difficulty']
        difficulty_str = ["Easy", "Medium", "Hard", "Impossible"][difficulty]

        title = f"{name} {difficulty_str}"
        img_path = os.path.relpath(os.path.join(PATH_FLAT, f"{name}_{difficulty}.png"), PATH_HTML)

        html_content = html_template.format(title=title, img_src=img_path, img_alt=title)

        with open(os.path.join(PATH_HTML, f"{title}.html"), "w", encoding="utf-8") as f:
            f.write(html_content)
        return True
    except:
        return False

if __name__ == "__main__":
    from constants import PATH_JSON
    
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        render(file)
import markdown

html_template = """<!DOCTYPE html>
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
    
    html_content = html_template.format(changelog=changelog)

    with open("../changelog.html", "w", encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    render_changelog_html()
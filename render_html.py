import glob, json, datetime, markdown

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
                class="header-link"
                >Changelog {timestamp}</a
            >
            <a
                href="render/filedrop_renderer.html"
                class="header-link"
                >Custom Chart Render</a
            >
        </div>
        <table class="song-list">
            {row_segments}
        </table>
    </body>
</html>
"""

row_template = """<tr>
    <td>
        <a href="{url}">
            <img src="{album_art_src}" class="album-art">
        </a>
    </td>
    <td>
        <a href="{url}" class="song-name">{short_name}</a>
    </td>
</tr>
"""

def render_homepage_html():
    with open("render/chart_info.json", 'r') as f:
        chart_info = json.load(f)
    json_files = glob.glob("render/charts/*.json")
    
    keys = list(chart_info.keys())
    keys.sort(key=lambda key: chart_info[key]['name'])
    
    row_segments = """"""
    for key in keys:
        data = chart_info[key]
        short_name = data['name']
        album_art_src = f"render/{data['art']}"
        with open(f"render/{data['hit']['impossible']}", 'r') as f:
            diff = int(json.load(f)['diff'])
        url = f"render/official_renderer.html?key={key}&diff={diff}"
        
        row_segment = row_template.format(
            url = url,
            album_art_src = album_art_src,
            short_name = short_name
        )
        row_segments += row_segment
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M (UTC+09:00)")
    html_content = html_template_homepage.format(
        timestamp=timestamp,
        row_segments=row_segments)
    
    with open("index.html", "w", encoding="utf-8") as f:
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

    with open("changelog.html", "w", encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    render_homepage_html()
    render_changelog_html()
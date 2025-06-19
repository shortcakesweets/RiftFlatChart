import json
from pathlib import Path

CHART_LIST_PATH = Path(__file__).resolve().parents[1] / 'data/charts/chart_list.json'


def load_chart_list():
    with open(CHART_LIST_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)


def test_required_fields_exist():
    chart_list = load_chart_list()
    required_keys = {'name', 'art', 'chart', 'update_date', 'dlc', 'artist', 'intensity'}
    for key, data in chart_list.items():
        assert required_keys.issubset(data.keys()), f"{key} missing fields"


def test_art_and_chart_files_exist():
    chart_list = load_chart_list()
    base_dir = CHART_LIST_PATH.parent
    for key, data in chart_list.items():
        art_path = (base_dir / data['art']).resolve()
        assert art_path.is_file(), f"Missing art file for {key}: {art_path}"
        for diff in ['easy', 'medium', 'hard', 'impossible']:
            chart_rel = data['chart'][diff]
            chart_path = (base_dir / chart_rel).resolve()
            assert chart_path.is_file(), f"Missing chart file for {key} ({diff}): {chart_path}"

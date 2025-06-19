import json
from pathlib import Path

CHART_LIST_PATH = Path(__file__).resolve().parents[1] / "data/charts/chart_list.json"


def load_chart_list():
    with open(CHART_LIST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_chart_list_integrity_verbose():
    chart_list = load_chart_list()
    total = len(chart_list)
    required_keys = {
        "name",
        "art",
        "chart",
        "update_date",
        "dlc",
        "artist",
        "intensity",
    }
    base_dir = CHART_LIST_PATH.parent

    print(f"Total songs: {total}")

    failed = []
    for key, data in chart_list.items():
        name = data.get("name", key)
        try:
            missing = required_keys - data.keys()
            if missing:
                raise AssertionError(f"missing fields: {', '.join(sorted(missing))}")

            art_path = (base_dir / data["art"]).resolve()
            if not art_path.is_file():
                raise AssertionError(f"missing art file: {art_path}")

            for diff in ["easy", "medium", "hard", "impossible"]:
                chart_rel = data["chart"][diff]
                chart_path = (base_dir / chart_rel).resolve()
                if not chart_path.is_file():
                    raise AssertionError(
                        f"missing chart file ({diff}): {chart_path}"
                    )

            print(f"[PASS] {name}")
        except AssertionError as exc:
            failed.append((name, str(exc)))
            print(f"[FAIL] {name}: {exc}")

    if failed:
        print("\nFailed songs:")
        for name, msg in failed:
            print(f" - {name}: {msg}")
    else:
        print("All songs passed")

    assert not failed, f"{len(failed)} song(s) failed validation"

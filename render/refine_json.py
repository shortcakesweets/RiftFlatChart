import json, csv

KEY_TO_NAME = {
    "RRDiscoDisaster": "Disco Disaster",
    "RRElusional": "Elusional",
    "RRVisualizeYourself": "Visualize Yourself",
    "RRSpookhousePop": "Spookhouse Pop",
    "RROmandOn": "Om and On",
    "RRMorningDove": "Morning Dove",
    "RRHephsMess": "Heph's Mess",
    "RRAmalgamaniac": "Amalgamaniac",
    "RRHangTenHeph": "Hang Ten Heph",
    "RRCountFunkula": "Count Funkula",
    "RROverthinker": "Overthinker",
    "RRCryp2que": "Cryp2que",
    "RRNocturning": "Nocturning",
    "RRGlassCages": "Glass Cages (feat. Sarah Hubbard)",
    "RRHallowQueen": "Hallow Queen",
    "RRProgenitor": "Progenitor",
    "RRMatriarch": "Matriarch",
    "RRThunder": "Under the Thunder",
    "RREldritchHouse": "Eldritch House",
    "RRRavevenge": "RAVEVENGE (feat. Aram Zero)",
    "RRRiftWithin": "Rift Within",
    "RRSuzusQuest": "Suzu's Quest",
    "RRNecropolis": "Necropolis",
    "RRBaboosh": "Baboosh",
    "RRNecroSonatica": "Necro Sonatica",
    "RRHarmonie": "She Banned",
    "RRDeepBlues": "King's Ruse",
    "RRMatron": "What's in the Box?",
    "RRReaper": "Brave the Harvester",
    "RRFinalFugue": "Final Fugue",
    "RRTwombtorial": "Twombtorial",
    "RRPortamello": "Portamello",
    "DLCApricot01": "Slugger's Refrain",
    "DLCApricot02": "Got Danged",
    "DLCApricot03": "Bootus Bleez",
    "DLCBanana01": "Ressurections (dannyBstyle Remix)",
    "DLCBanana02": "Resurrections",
    "DLCBanana03": "Reach for the Summit",
    "DLCBanana04": "Confronting Myself",
    "DLCBanana05": "Scattered and Lost"
}

# if name == short_name, skip
KEY_TO_SHORT_NAME = {
    "RRGlassCages": "Glass Cages",
    "RRRavevenge": "RAVEVENGE",
    "DLCBanana01": "Ressurections Remix",
}

# if name == vibe_name, skip
KEY_TO_VIBE_NAME = {
    "RRGlassCages": "Glass Cages",
    "RRMatron": "What's In The Box",
    "RRReaper": "Brave The Harvester",
    "RRRavevenge": "Ravevenge",
    "RRThunder": "Under The Thunder",
    "DLCBanana01": "Resurrections Remix",
    "DLCBanana03": "Reach For The Summit",
    "DLCBanana05": "Scattered And Lost"
}

def change_name(data):
    for key, sub_data in data.items():
        hit_data = sub_data.get('hit')
        if hit_data == None:
            print(f"Cannot find hit data for key {key}")
            continue

        for sub_key, path in hit_data.items():
            with open(path, 'r') as file:
                chart_data = json.load(file)
            chart_data["key"] = key
            chart_data["name"] = KEY_TO_NAME[key]
            chart_data["short_name"] = KEY_TO_SHORT_NAME.get(key) if KEY_TO_SHORT_NAME.get(key) else KEY_TO_NAME[key]
            with open(path, 'w') as file:
                json.dump(chart_data, file, indent=4)
        
    print("change_name() complete")

def remove_raw(data):
    for key, sub_data in data.items():
        try:
            del sub_data['raw']
        except KeyError:
            #print(f"No raw data for key {key}")
            pass
    print("remove_raw() complete")

def change_hit_path(data):
    for key, sub_data in data.items():
        hit_data = sub_data.get('hit')
        if hit_data != None:
            for sub_key, path in hit_data.items():
                if path.startswith("Charts/"):
                    hit_data[sub_key] = path.replace("Charts/", "charts/", 1)
        else:
            print(f"Cannot find hit data for key {key}")

        art_data = sub_data.get('art')
        if art_data != None:
            if art_data.startswith("AlbumArts/"):
                art_data = art_data.replace("AlbumArts/", "album_arts/", 1)
            art_data = art_data.replace(".png", ".webp")
            sub_data['art'] = art_data
        else:
            print(f"Cannot find hit data for key {key}")

    print("change_hit_path() complete")

def add_vibe_path(data):
    with open('vibe_path.csv', 'r', newline='') as csvfile:
        reader = csv.reader(csvfile)
        rows = list(reader)
    
    for key, sub_data in data.items():
        hit_data = sub_data.get('hit')
        if hit_data == None:
            print(f"Cannot find hit data for key {key}")
            continue

        csv_key = KEY_TO_VIBE_NAME.get(key) if KEY_TO_VIBE_NAME.get(key) else KEY_TO_NAME[key]
        target_rows = []
        for row in rows:
            if row[0] == csv_key:
                target_rows.append(row)
        
        for sub_key, path in hit_data.items():
            with open(path, 'r') as file:
                chart_data = json.load(file)
            difficulty = int(chart_data["diff"]) - 1
            try:
                target_row = target_rows[difficulty]
            except Exception:
                print(f"Failed to get vibe data from {csv_key}_{difficulty}")
                continue
            
            chart_data["maxScore"] = int(target_row[2])
            optimal_vibes = []
            for i in range(3, len(target_row), 4):
                if target_row[i] == '':
                    continue
                beat = float(target_row[i+1][1:])
                optimal_vibes.append(beat)
            chart_data["optimalVibes"] = optimal_vibes
            
            with open(path, 'w') as file:
                json.dump(chart_data, file, indent=4)
    
    print("add_vibe_path() complete")

if __name__ == "__main__":
    with open('chart_info.json', 'r') as file:
        data = json.load(file)
    # print(data)
    
    remove_raw(data)
    change_hit_path(data)
    change_name(data)
    add_vibe_path(data)

    with open('chart_info.json', 'w') as file:
        json.dump(data, file, indent=4)
    print("dump complete")
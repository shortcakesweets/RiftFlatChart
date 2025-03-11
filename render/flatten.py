import os, glob, json, math
import traceback
from PIL import Image, ImageDraw, ImageFont
from note_generate import Note, extract_notes
from constants import PATH_FLAT

# DEBUG option
DEBUG_COMBO     = False

# size constants
# margin - gap - lane - gap - lane - gap - lane - gap - margin
LANE_WIDTH      = 16
LANE_GAP        = 1
LANE_MARGIN     = 24
LANE_HEIGHT     = 1200
LANE_PADDING    = 8             # slightly longer lanes for previewing next notes
NOTE_SIZE       = 12
NOTE_THICK      = 2
FONT_SIZE       = 12
WYRM_HEAD_SIZE  = 6

# color constants
BG_COLOR        = (0,0,0)       # black
LANE_COLOR      = (50,50,50)    # dark dark grey
MAIN_DIV_COLOR  = (128,128,128) # grey (50%)
SUB_DIV_COLOR   = (75,75,75)    # dark grey
GAP_COLOR       = (75,75,75)    # dark grey
FONT_MEASURE_COLOR = (211,211,211)  # light grey
FONT_BPM_COLOR  = (0,255,0)     # green
WYRM_BODY_COLOR = (0,159,100)   # actual pallete from in-game
# WYRM_HEAD_COLOR = (0,159,100)   
WYRM_HEAD_COLOR = (0,100,50)  # darker than body.
VIBE_WYRM_HEAD_COLOR = (255,255,0) # yellow
NOTE_COLOR      = (255,255,255) # white
OVERLAP_COLOR   = (255,0,0)     # red
VIBE_NOTE_COLOR = (255,255,0)   # yellow
VIBE_OVERLAP_COLOR = (255,140,0)# dark orange

def create_segment(beat_index: int, short_notes: list[Note], wyrm_notes: list[Note], data):
    width               = LANE_MARGIN * 2 + LANE_WIDTH * 3 + LANE_GAP * 4
    height              = LANE_HEIGHT + LANE_PADDING * 2 + LANE_MARGIN * 2
    height_lane_start   = LANE_HEIGHT + LANE_PADDING + LANE_MARGIN          # height of lane start, excluding padding
    height_lane_end     = LANE_PADDING + LANE_MARGIN                        # height of lane end,   excluding padding
    
    # function that calcs x,y coordinate
    def get_note_xy(column: int, rel_beat: float):
        NOTE_MARGIN = (LANE_WIDTH - NOTE_SIZE) / 2
        x = LANE_MARGIN + LANE_GAP * (column + 1) + LANE_WIDTH * column + NOTE_MARGIN
        
        BEAT_HEIGHT = LANE_HEIGHT / 16
        y = height_lane_start - (BEAT_HEIGHT) * rel_beat
        
        return x, y

    # prepare canvas
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # draw lanes
    x_start = LANE_MARGIN + LANE_GAP
    for _ in range(3):
        draw.rectangle([x_start,
                        height_lane_end - LANE_PADDING,
                        x_start + LANE_WIDTH,
                        height_lane_start + LANE_PADDING],
                        fill=LANE_COLOR)
        x_start += LANE_WIDTH + LANE_GAP
    
    # function that renders text
    def render_text(x: float, y: float, text: str, color: tuple):
        font = ImageFont.truetype("arialbd.ttf", FONT_SIZE)
        draw.text((x,y), text, fill=color, font=font)
    
    # draw beat divisions
    # - main division & beat count texts
    for rel_beat in range(0,17,4):
        _, y_finish = get_note_xy(0, rel_beat)
        draw.rectangle([LANE_MARGIN,
                        y_finish - LANE_GAP,
                        LANE_MARGIN + LANE_WIDTH * 3 + LANE_GAP * 4,
                        y_finish],
                        fill=MAIN_DIV_COLOR)
        render_text(0, y_finish - LANE_GAP - FONT_SIZE,
                    f"{(beat_index+rel_beat):03d}",
                    FONT_MEASURE_COLOR)
    
    # - sub division
    for rel_beat in range(17):
        if rel_beat % 4 != 0:
            _, y_finish = get_note_xy(0, rel_beat)
            draw.rectangle([LANE_MARGIN,
                            y_finish - LANE_GAP,
                            LANE_MARGIN + LANE_WIDTH * 3 + LANE_GAP * 4,
                            y_finish],
                            fill=SUB_DIV_COLOR)
    
    # draw gaps
    x_start = LANE_MARGIN
    for _ in range(4):
        draw.rectangle([x_start, height_lane_end - LANE_PADDING, x_start + LANE_GAP, height_lane_start + LANE_PADDING], fill=GAP_COLOR)
        x_start += LANE_GAP + LANE_WIDTH
    
    # function that gets best matching bpm
    #  - assumes bpm is integer multiplier or division of base bpm
    def get_bpm(measure_time: float, base_bpm: int) -> float:
        ideal_bpm = 60.0 / measure_time
        candidates = []
        for k in range(1,21):
            candidates.append(base_bpm * k)
            candidates.append(base_bpm / k)
        
        best_candidate = min(candidates, key=lambda x: abs(x - ideal_bpm))
        return round(best_candidate, 1)

    # draw bpm changes
    base_bpm = data['bpm']
    beat_timing_data = data['beat_timings']
    BPM_TEXT_X_START = LANE_MARGIN + LANE_GAP * 4 + LANE_WIDTH * 3

    if beat_index == 0: # always render bpm for first measure
        _, y_finish = get_note_xy(0,0)
        render_text(BPM_TEXT_X_START, y_finish - LANE_GAP - FONT_SIZE,
                    f"{base_bpm}",
                    FONT_BPM_COLOR)

    for rel_beat in range(17):
        def_beat = beat_index + rel_beat

        # Out of bounds error exception handling on both sides
        if def_beat - 1 < 0 or def_beat + 1 >= len(beat_timing_data):
            continue

        prev_measure_time = beat_timing_data[def_beat] - beat_timing_data[def_beat - 1]
        curr_measure_time = beat_timing_data[def_beat + 1] - beat_timing_data[def_beat]

        prev_bpm = get_bpm(prev_measure_time, base_bpm)
        curr_bpm = get_bpm(curr_measure_time, base_bpm)

        if curr_bpm != prev_bpm:
            _, y_finish = get_note_xy(0, rel_beat)
            render_text(BPM_TEXT_X_START, y_finish - LANE_GAP - FONT_SIZE,
                        f"{curr_bpm}",
                        FONT_BPM_COLOR)
            print(f" detected bpm change: {prev_bpm} → {curr_bpm}")
    
    # filter only in-range notes
    beat_from = beat_index
    beat_to = beat_index + 16
    filtered_short_notes = list(filter(lambda note: beat_from <= note.beat_start <= beat_to, short_notes))
    filtered_wyrm_notes = list(filter(lambda note: (beat_from <= note.beat_start <= beat_to) or (beat_from <= note.beat_finish <= beat_to), wyrm_notes))
    
    # function for rendering wyrm body
    def render_wyrm_body(column: int, rel_beat_start: float, rel_beat_finish: float, color: tuple = WYRM_BODY_COLOR):
        x_start, y_start  = get_note_xy(column, rel_beat_start)
        _      , y_finish = get_note_xy(column, rel_beat_finish)
        
        draw.rectangle([x_start, y_finish, x_start + NOTE_SIZE, y_start], fill=WYRM_BODY_COLOR)
    
    # function for rendering wyrm head
    def render_wyrm_head(column: int, rel_beat: float, color: tuple):
        x_start, y_start = get_note_xy(column, rel_beat)
        vertices = [
            (x_start, y_start),
            (x_start + NOTE_SIZE, y_start),
            (x_start + NOTE_SIZE/2, y_start - WYRM_HEAD_SIZE)
        ]

        draw.polygon(vertices, fill=color)

    # function for rendering short notes
    def render_short_note(column: int, rel_beat: float, color: tuple):
        x_start, y_start = get_note_xy(column, rel_beat)
        draw.rectangle([x_start, y_start - NOTE_THICK, x_start + NOTE_SIZE, y_start], fill=color)
    
    # function for determining if a note is in vibe state
    ## BUG : currently CSV files contain wrong combo values.
    ##  Do not use this function until it is fixed. use Note::is_vibe created from note_generate.
    """
    def is_optimal_vibe(combo: int, vibe_data):
        if vibe_data == None:
            return False
        for vibe_chunk in vibe_data:
            if vibe_chunk['combo'] < combo <= vibe_chunk['combo'] + vibe_chunk['enemies']:
                return True
        return False
    """
    
    # DEBUG function, that renders combo count text on every note
    def render_combo_text(column: int, rel_beat: float, combo: int):
        x_start, y_start = get_note_xy(column, rel_beat)
        font = ImageFont.truetype("arial.ttf", FONT_SIZE)
        COLOR_WHITE = (255,255,255)
        draw.text((x_start, y_start - FONT_SIZE), f"{combo}", fill=COLOR_WHITE, font=font)
    
    # render wyrm notes
    for note in filtered_wyrm_notes:
        beat_padding = LANE_PADDING / (LANE_HEIGHT / 16)
        
        relative_beat_start = max(note.beat_start - beat_index, -beat_padding)
        relative_beat_finish = min(note.beat_finish - beat_index, 16+beat_padding)
        
        render_wyrm_body(note.column, relative_beat_start, relative_beat_finish)
        
        relative_beat_start = note.beat_start - beat_index
        if relative_beat_start >= -beat_padding:
            # color = VIBE_WYRM_HEAD_COLOR if is_optimal_vibe(note.combo, vibe_data) else WYRM_HEAD_COLOR
            color = VIBE_WYRM_HEAD_COLOR if note.is_vibe else WYRM_HEAD_COLOR
            render_wyrm_head(note.column, relative_beat_start, color=color)

            if DEBUG_COMBO:
                render_combo_text(note.column, relative_beat_start, note.combo)
    
    # render short notes
    # vibe_data = data['vibe']
    for note in filtered_short_notes:
        relative_beat = note.beat_start - beat_index

        color = (0,0,0)
        if note.overlap == 1:
            # color = VIBE_NOTE_COLOR if is_optimal_vibe(note.combo, vibe_data) else NOTE_COLOR
            color = VIBE_NOTE_COLOR if note.is_vibe else NOTE_COLOR
        else:
            # color = VIBE_OVERLAP_COLOR if is_optimal_vibe(note.combo, vibe_data) else OVERLAP_COLOR
            color = VIBE_OVERLAP_COLOR if note.is_vibe else OVERLAP_COLOR

        render_short_note(note.column, relative_beat, color)

        if DEBUG_COMBO:
            render_combo_text(note.column, relative_beat, note.combo)
    
    return img

def flatten(file):
    if DEBUG_COMBO:
        print("WARNING: COMBO_DEBUG option is True")

    try:
        with open(file, 'r') as f:
            data = json.load(f)
        
        name = data['name']
        difficulty = data['difficulty']
        short_notes, wyrm_notes = extract_notes(file)
        
        last_beat: float = 0.0
        last_beat = max(short_notes[-1].beat_start, max(note.beat_finish for note in wyrm_notes) if len(wyrm_notes) != 0 else 0)
        last_beat = int(math.ceil(last_beat/16)*16)
        
        img_segments = []
        for beat_start in range(0, last_beat+1, 16):
            img_segments.append(create_segment(beat_start, short_notes, wyrm_notes, data))
        
        total_width = sum(img.width for img in img_segments)
        max_height = max(img.height for img in img_segments)
        
        img = Image.new("RGB", (total_width, max_height))
        
        current_x = 0
        for img_segment in img_segments:
            img.paste(img_segment, (current_x, 0))
            current_x += img_segment.width
        
        img.save(os.path.join(PATH_FLAT, f"{name}_{difficulty}.png"))
        print(f"Flatten success on {name} ({difficulty}).")
    except Exception as e:
        print(f"Flatten failed on {name} ({difficulty}): {e}")
        traceback.print_exc()

if __name__ == "__main__":
    from constants import PATH_JSON

    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        flatten(file)

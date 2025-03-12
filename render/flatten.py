import os, glob, json, math
import traceback
from PIL import Image, ImageDraw, ImageFont
from rift_essentials import *

# DEBUG option
DEBUG_COMBO     = False

# size constants
# margin - gap - lane - gap - lane - gap - lane - gap - margin
LANE_WIDTH      = 16
LANE_GAP        = 1
LANE_MARGIN     = 36
LANE_HEIGHT     = 1200
LANE_PADDING    = 8             # slightly longer lanes for previewing next notes
NOTE_SIZE       = 12
NOTE_THICK      = 2
FONT_SIZE       = 12
FONT_MARGIN     = 4
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

def create_segment(beat_index: int, chart: Chart):
    width               = LANE_MARGIN * 2 + LANE_WIDTH * 3 + LANE_GAP * 4
    height              = LANE_HEIGHT + LANE_PADDING * 2 + LANE_MARGIN * 2
    height_lane_start   = LANE_HEIGHT + LANE_PADDING + LANE_MARGIN          # height of lane start, excluding padding
    height_lane_end     = LANE_PADDING + LANE_MARGIN                        # height of lane end,   excluding padding

    short_notes = chart.short_notes
    wyrm_notes = chart.wyrm_notes
    
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
    def render_text(x: float, y: float, text: str, color: tuple, align_right: bool = False):
        font = ImageFont.truetype("arialbd.ttf", FONT_SIZE)
        if align_right:
            _, _, text_width, _ = font.getbbox(text)
            x -= text_width
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
        render_text(LANE_MARGIN - FONT_MARGIN, y_finish - LANE_GAP - FONT_SIZE,
                    f"{(beat_index+rel_beat):03d}",
                    FONT_MEASURE_COLOR,
                    align_right=True)
    
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
    
    # draw bpm change texts
    base_bpm = chart.base_bpm
    bpm_changes = chart.bpm_changes
    BPM_TEXT_X_START = LANE_MARGIN + LANE_GAP * 4 + LANE_WIDTH * 3
    for bpm_change in bpm_changes:
        rel_beat = bpm_change.beat - beat_index
        if rel_beat < 0 or rel_beat >= 16:
            continue
        
        _, y_finish = get_note_xy(0, rel_beat)
        render_text(BPM_TEXT_X_START + FONT_MARGIN, y_finish - LANE_GAP - FONT_SIZE,
                    f"{bpm_change.bpm}",
                    FONT_BPM_COLOR)
    
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
        
        overlap_count: int = 0
        for other_note in filtered_short_notes:
            if note.column == other_note.column and note.beat_start == other_note.beat_start:
                overlap_count += 1
        
        if overlap_count == 1:
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
        
        chart = load_chart(data)
        
        name = chart.name
        difficulty = chart.difficulty
        short_notes, wyrm_notes = chart.short_notes, chart.wyrm_notes
        
        last_beat: float = 0.0
        last_beat = max(short_notes[-1].beat_start, max(note.beat_finish for note in wyrm_notes) if len(wyrm_notes) != 0 else 0)
        last_beat = int(math.ceil(last_beat/16)*16)
        
        img_segments = []
        for beat_start in range(1, last_beat+1, 16):
            img_segments.append(create_segment(beat_start, chart))
        
        total_width = sum(img.width for img in img_segments)
        max_height = max(img.height for img in img_segments)
        
        img = Image.new("RGB", (total_width, max_height))
        
        current_x = 0
        for img_segment in img_segments:
            img.paste(img_segment, (current_x, 0))
            current_x += img_segment.width
        
        img.save(os.path.join(PATH_FLAT, f"{name}_{difficulty.value}.png"))
        print(f"Flatten success on {name} ({difficulty.value}).")
    except Exception as e:
        print(f"Flatten failed on {name} ({difficulty.value}): {e}")
        traceback.print_exc()

if __name__ == "__main__":
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        flatten(file)

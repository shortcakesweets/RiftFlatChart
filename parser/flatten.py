import os, glob, json, math
from PIL import Image, ImageDraw, ImageFont
from note_generate import Note, extract_notes
from constants import PATH_FLAT

# margin - lane - gap - lane - gap - lane - margin
LANE_WIDTH      = 16
LANE_GAP        = 1
LANE_MARGIN     = 24
LANE_HEIGHT     = 800
LANE_PADDING    = 8
NOTE_SIZE       = 12
NOTE_THICK      = 1
FONT_SIZE       = 12

LANE_COLOR      = (50, 50, 50)  # dark dark grey
BG_COLOR        = (0, 0, 0)     # black
GREY            = (128,128,128) # grey (50%)
DARK_GREY       = (75,75,75)    # 
GREEN           = (0, 255, 0)   # 
WYRM_BODY_COLOR = (21,255,165)  # actual pallete from in-game
WYRM_HEAD_COLOR = (0,159,100)   # darker than body
NOTE_COLOR      = (255,255,255) # white
OVERLAP_COLOR   = (255, 0, 0)   # red

def create_segment(beat_index: int, short_notes: list[Note], wyrm_notes: list[Note]):
    width               = LANE_MARGIN * 2 + LANE_WIDTH * 3 + LANE_GAP * 4
    height              = LANE_HEIGHT + LANE_PADDING * 2 + LANE_MARGIN * 2
    height_lane_start   = LANE_HEIGHT + LANE_PADDING + LANE_MARGIN          # height of lane start, excluding padding
    height_lane_end     = LANE_PADDING + LANE_MARGIN                        # height of lane end,   excluding padding
    
    img = Image.new("RGB", (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # draw lanes
    x_start = LANE_MARGIN + LANE_GAP
    for _ in range(3):
        draw.rectangle([x_start, height_lane_end - LANE_PADDING, x_start + LANE_WIDTH, height_lane_start + LANE_PADDING], fill=LANE_COLOR)
        x_start += LANE_WIDTH + LANE_GAP
    
    # draw beat divisions (with text)
    y_finish = height_lane_start
    for i in range(5):
        # main division (each 4 beats)
        draw.rectangle([LANE_MARGIN, y_finish - LANE_GAP, LANE_MARGIN + LANE_WIDTH * 3 + LANE_GAP * 4, y_finish], fill=GREY)
        for j in range(3):
            sub_beat_y_finish = y_finish - (LANE_HEIGHT/16) * (j+1)
            draw.rectangle([LANE_MARGIN, sub_beat_y_finish - LANE_GAP, LANE_MARGIN + LANE_WIDTH * 3 + LANE_GAP * 4, sub_beat_y_finish], fill=DARK_GREY)
        
        font = ImageFont.truetype("arial.ttf", FONT_SIZE)
        draw.text((0, y_finish - LANE_GAP - FONT_SIZE), f"{(beat_index+4*i):03d}", fill=GREEN, font=font)
        
        y_finish -= LANE_HEIGHT / 4
    
    # draw gaps
    x_start = LANE_MARGIN
    for _ in range(4):
        draw.rectangle([x_start, height_lane_end - LANE_PADDING, x_start + LANE_GAP, height_lane_start + LANE_PADDING], fill=DARK_GREY)
        x_start += LANE_GAP + LANE_WIDTH
    
    # filter only in-range notes
    beat_from = beat_index
    beat_to = beat_index + 16
    filtered_short_notes = list(filter(lambda note: beat_from <= note.beat_start <= beat_to, short_notes))
    filtered_wyrm_notes = list(filter(lambda note: (beat_from <= note.beat_start <= beat_to) or (beat_from <= note.beat_finish <= beat_to), wyrm_notes))
    
    # define get_note_xy
    def get_note_xy(column: int, rel_beat: float):
        NOTE_MARGIN = (LANE_WIDTH - NOTE_SIZE) / 2
        x = LANE_MARGIN + LANE_GAP * (column + 1) + LANE_WIDTH * column + NOTE_MARGIN
        
        BEAT_HEIGHT = LANE_HEIGHT / 16
        y = height_lane_start - (BEAT_HEIGHT) * rel_beat
        
        return x, y
    
    def render_short_note(column: int, rel_beat: float, color: tuple):
        x_start, y_start = get_note_xy(column, rel_beat)
        draw.rectangle([x_start, y_start - NOTE_THICK, x_start + NOTE_SIZE, y_start], fill=color)
    
    # render wyrm notes
    for note in filtered_wyrm_notes:
        beat_padding = LANE_PADDING / (LANE_HEIGHT / 16)
        
        relative_beat_start = max(note.beat_start - beat_index, -beat_padding)
        relative_beat_finish = min(note.beat_finish - beat_index, 16+beat_padding)
        
        x_start, y_start  = get_note_xy(note.column, relative_beat_start)
        _      , y_finish = get_note_xy(note.column, relative_beat_finish)
        
        draw.rectangle([x_start, y_finish, x_start + NOTE_SIZE, y_start], fill=WYRM_BODY_COLOR)
        
        relative_beat_start = note.beat_start - beat_index
        if relative_beat_start >= -beat_padding:
            render_short_note(note.column, relative_beat_start, WYRM_HEAD_COLOR)
    
    # render short notes
    for note in filtered_short_notes:
        relative_beat = note.beat_start - beat_index
        render_short_note(note.column, relative_beat, NOTE_COLOR if note.overlap == 1 else OVERLAP_COLOR)
    
    return img

def flatten(file):
    with open(file, 'r') as f:
        data = json.load(f)
    
    name = data['name']
    difficulty = data['difficulty']
    short_notes, wyrm_notes = extract_notes(file)
    
    last_beat: float = 0.0
    last_beat = max(short_notes[-1].beat_start, max(note.beat_finish for note in wyrm_notes))
    last_beat = int(math.ceil(last_beat/16)*16)
    
    img_segments = []
    for beat_start in range(0, last_beat+1, 16):
        img_segments.append(create_segment(beat_start, short_notes, wyrm_notes))
    
    total_width = sum(img.width for img in img_segments)
    max_height = max(img.height for img in img_segments)
    
    img = Image.new("RGB", (total_width, max_height))
    
    current_x = 0
    for img_segment in img_segments:
        img.paste(img_segment, (current_x, 0))
        current_x += img_segment.width
    
    img.save(os.path.join(PATH_FLAT, f"{name}_{difficulty}.png"))

if __name__ == "__main__":
    from constants import PATH_JSON
    
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        flatten(file)

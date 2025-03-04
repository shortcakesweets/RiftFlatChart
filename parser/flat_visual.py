import os, glob, json
from PIL import Image, ImageDraw
from constants import PATH_JSON

class Note():
    def __init__(self, timing_start: float = 0.0, timing_finish: float = 0.0, is_wyrm: bool = False):
        self.timing_start:  float = timing_start
        self.timing_finish: float = timing_finish
        self.is_wyrm:       bool  = is_wyrm

if __name__ == "__main__":
    json_files = glob.glob(os.path.join(PATH_JSON, "*.json"))
    for file in json_files:
        ## TODO : create flat charts
        pass
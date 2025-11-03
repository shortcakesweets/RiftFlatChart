import os, sys
from PIL import Image

input_folder = 'aa_before'
output_folder = 'aa_after'

if not os.path.isdir(input_folder):
    print(f"Input folder not found: {input_folder}")
    sys.exit(1)

os.makedirs(output_folder, exist_ok=True)

for filename in os.listdir(input_folder):
    if filename.lower().endswith('.png'):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, os.path.splitext(filename)[0] + '.webp')
        with Image.open(input_path) as img:
            img.save(output_path, 'WEBP')
        print(f"Converted {filename} to {output_path}")
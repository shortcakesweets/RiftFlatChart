import os
from PIL import Image

input_folder = 'aa_old'
output_folder = 'aa_new'

os.makedirs(output_folder, exist_ok=True)

for filename in os.listdir(input_folder):
    if filename.lower().endswith('.png'):
        input_path = os.path.join(input_folder, filename)
        output_path = os.path.join(output_folder, os.path.splitext(filename)[0] + '.webp')
        with Image.open(input_path) as img:
            img.save(output_path, 'WEBP')
        print(f"Converted {filename} to {output_path}")
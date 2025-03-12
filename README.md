# RiftFlatChart

Flattens Rift's charts so that you can see what inputs are actually going on. This project was possible thanks to [RiftEventCapture](https://github.com/DominicAglialoro/RiftEventCapture) by [DominicAglialoro](https://github.com/DominicAglialoro).

You can see rendered results at [RoTN Chart Archive](https://riftchart.shortcake.kr).

## Install Guide

This project is written on Python version 3.12, but I'm pretty sure it works on version 3.8+. (Untested, sorry)

-   Clone this repository

```bash
git clone https://github.com/shortcakesweets/RiftFlatChart.git
```

-   Navigate to render folder

```bash
cd render
```

-  Flattner has Pillow dependency.

```bash
pip install -r 
```

## Usage

You will need raw data using [RiftEventCapture](https://github.com/DominicAglialoro/RiftEventCapture).

1. Configure RiftEventCapture and play with "Golden Lute" modifier on. This will give a `.bin` file.

2. Erase all bin files in `render/raw`, instead put the `{song_name}_{#}.bin` file into `render/raw`.

3. from `/render` folder, run:

```
python parse.py -i {PATH_TO_BIN_FILE}
python flatten.py
```

`parse.py` will make JSON data from raw file, then `flatten.py` will create a rendered png file at `render/flat`.

**Important:** Run `main.py` from the `/render` folder only. Executing it from any other directory may cause relative path errors.

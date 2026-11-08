# RiftFlatChart

Flattens Rift's charts so that you can see what inputs are actually going on. This project was possible thanks to
- [RiftEventCapture](https://github.com/DominicAglialoro/RiftEventCapture) by [DominicAglialoro](https://github.com/DominicAglialoro).
- [RotN-Hitmapper](https://github.com/KayDeeTee/RotN-Hitmapper) by [KayDeeTee](https://github.com/KayDeeTee)
- [Vibe data spreadsheet](https://docs.google.com/spreadsheets/d/1qhnWRmLp0d2X18rmVsK_YJh-CiukE-0Gmg8kBMyYe4A/edit?usp=sharing)

You can see rendered results at [RoTN Chart Archive](https://riftchart.shortcake.kr).

## Local chart manager

Open `site.html` in desktop Chrome or Edge, click **Select folder**, and choose
this repository root (the folder containing `data`). No server or installation
is needed. The catalog is sorted by newest `update_date`, then title, just like
the homepage. Use **Refresh** after editing files outside the manager.

- **Add a chart:** select the four `.bin` files together or in batches. Full
  version-4 binaries are validated and assigned by embedded difficulty. All four
  must have the same song name and level ID. Upload PNG, JPG or WebP artwork
  (up to 20 MB, 4096 ? 4096), choose an update date, enter DLC (empty is allowed),
  and optionally check **Free DLC**. Click **Add** and allow browser write access.
- **Edit:** existing binaries, artwork, date, DLC, and Free DLC are loaded. You
  can replace individual binaries or artwork and edit the catalog fields, then
  click **Save changes**. The catalog key and existing display title are kept.
- **Delete:** confirm removal of the entry and its assets. Shared artwork and
  any other files still referenced by another catalog entry are kept.

Artwork uploads are converted to WebP. New/replacement assets receive unique
filenames, so existing files are not overwritten. The catalog is committed last,
then obsolete, unshared assets are removed. The browser needs to stay open until
saving finishes. Multi-file operations cannot be fully atomic: a crash may leave
unused assets, but original assets are retained until the catalog is committed.

Every operation keeps the previous `chart_list.json`, assets scheduled for
removal (at their original relative paths), and an `operation.json` manifest in
`.chart-manager-backups/<operation>/`. To undo an operation, close the manager,
restore the backed-up assets to their original locations, then restore its
`chart_list.json` to `data/charts/chart_list.json`. This restores the catalog to
that operation's starting state; it also replaces any later catalog changes.
Backups are local and ignored by Git. Failed cleanup is reported in the status.

The manager checks for catalog changes before committing. Use one manager tab
and avoid editing repository files externally during a save. No data leaves your
computer. The existing archive `index.html` still requires HTTP serving; this
does not add local-file support to the archive itself.

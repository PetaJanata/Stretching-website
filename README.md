# Move — stretch and mobility log

A single-page site for running through your stretching / mobility routines.
Pick a category, the moves load below. Built to run entirely on GitHub Pages
with no backend — the folder structure under `exercises/` *is* the database.

## What each category means

- **Legs, Chest, Back, Shoulder** — pre-workout routines for that body
  part: a mobility + activation group and a plyometric group, both shown
  together on one page.
- **Daily** — everyday stretching, split into six body-part
  subcategories (Spine + posture, Shoulders + scapula, Hips, Glutes +
  knee, Ankles + feet, Core stability). Selecting Daily reveals a second
  row of chips for these; only one subcategory's exercises show at a
  time.
- **Rest day** — extra work for non-workout days: power, strength, and
  conditioning groups, shown together on one page.

## Adding or editing an exercise

1. Go to `exercises/<category>/<group>/`.
2. Make a new folder for the exercise, named with dashes, e.g. `hip-circles`.
3. Drop in one of:
   - `video.mp4` (preferred — short, muted, looping clip)
   - `video.webm`
   - `image.jpg` / `image.png`
4. Add a `prescription.txt` with the recommended sets/reps or hold time,
   e.g. `3 x 10-12` or `2 x 30s hold`. This shows as a badge directly on
   the card, next to the video, so you don't have to open notes to see
   how many to do.
5. Optionally add a `notes.txt` with freeform technique cues (tap-to-open
   on the card).
6. From the repo root, run:

   ```
   python3 generate.py
   ```

   This rewrites `exercises.json`, which is what the site actually reads.
   Commit both your new folder and the updated `exercises.json`.

Folder and file names become the display text automatically
(`walking-lunge-with-twist` → "Walking lunge with twist"), so you never edit
JSON by hand. The generator prints a warning for any exercise missing
`prescription.txt` or a video/image, so it's easy to spot gaps.

### Categories and groups

Current structure:

```
exercises/
  legs/       mobility/            plyometric/
  chest/      mobility/            plyometric/
  back/       mobility/            plyometric/
  shoulder/   mobility/            plyometric/
  daily/      spine-posture/       shoulders-scapula/   hips/
              glutes-knee/         ankles-feet/          core-stability/
  rest-day/   power/               strength/             conditioning/
```

Each exercise folder (e.g. `exercises/legs/mobility/hip-circles/`)
contains `video.mp4` (or `image.jpg`), `prescription.txt`, and
optionally `notes.txt`.

Category tabs appear in this fixed order: legs, chest, back, shoulder,
daily, rest-day. Any new top-level folder you add under `exercises/` will
show up after those automatically — no code changes needed.

**Sub-navigation is automatic.** In `app.js`, any category with more than
`SUBNAV_GROUP_THRESHOLD` (default 3) groups gets the chip-style
sub-navigation like Daily — one group's exercises shown at a time,
switchable via chips — instead of every group stacked on the page.
Legs/Chest/Back/Shoulder (2 groups) and Rest day (3 groups) stay
single-page; Daily (6 groups) automatically becomes sub-navigated. If you
ever add a fourth group to Rest day, it'll switch to sub-nav too — adjust
the threshold in `app.js` if you don't want that.

Group folder names control both the section heading and the accent color
used for that group's cards (see `HIGH_INTENSITY_GROUPS` in `app.js` — by
default `plyometric`, `power`, and `conditioning` get the rust accent,
everything else gets navy). Add new group names to that list if you want
them to read as "high intensity" too. Group display labels (including the
new Daily subcategories) are defined in `GROUP_LABELS` in `generate.py`.

## Running locally

Any static file server works, e.g.:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Opening `index.html` directly via
`file://` won't work — the `fetch("exercises.json")` call needs an actual
HTTP server.)

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In the repo settings, go to **Pages**.
3. Under **Source**, choose the `main` branch and `/ (root)` folder.
4. Save — GitHub will give you a URL like
   `https://<username>.github.io/<repo>/` within a minute or two.
5. Every time you add exercises, remember to re-run `generate.py` and push
   both the new media/notes files and the updated `exercises.json`.

## Notes on video files

- Keep clips short (3–5 seconds) and compressed — GitHub has a 100 MB
  per-file limit and a soft repo-size warning around 1 GB, and large videos
  make the site slow to load on mobile data.
- `autoplay muted loop playsinline` is already handled in `app.js`, so any
  `video.mp4` you drop in will loop automatically without controls.

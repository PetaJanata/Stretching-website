#!/usr/bin/env python3
"""
Scans the exercises/ folder and writes exercises.json.

Folder structure expected:
  exercises/<category>/<group>/<exercise-slug>/
      video.mp4  (or video.webm, image.jpg, image.jpeg, image.png)
      notes.txt  (optional, freeform text)

Run this from the repo root whenever you add, rename, or remove
exercises, then commit the updated exercises.json alongside your files.

Usage:
  python3 generate.py
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent
EXERCISES_DIR = ROOT / "exercises"
OUTPUT_FILE = ROOT / "exercises.json"

# Fixed display order. Any folder not listed here still gets included,
# just appended after these in whatever order the filesystem returns.
CATEGORY_ORDER = ["legs", "chest", "back", "shoulder", "daily", "rest-day"]

GROUP_LABELS = {
    "mobility": "Mobility + activation",
    "activation": "Mobility + activation",
    "plyometric": "Plyometric",
    "power": "Power",
    "strength": "Strength",
    "conditioning": "Conditioning",
    "spine-posture": "Spine + posture",
    "shoulders-scapula": "Shoulders + scapula",
    "hips": "Hips",
    "glutes-knee": "Glutes + knee",
    "ankles-feet": "Ankles + feet",
    "core-stability": "Core stability",
}

# A category whose groups are treated as sub-navigation (one shown at a
# time, chip-style) rather than stacked sections. Currently just "daily",
# but this is driven off group count in the front end (see app.js), so
# any category that grows past a few subcategories will behave the same
# way automatically -- nothing to change here.

VIDEO_EXTENSIONS = [".mp4", ".webm"]
IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"]

WARNINGS = []


def slug_to_label(slug: str) -> str:
    """'hip-circles' -> 'Hip circles' (sentence case)."""
    words = slug.replace("_", "-").split("-")
    text = " ".join(words)
    return text[:1].upper() + text[1:]


def group_label(slug: str) -> str:
    return GROUP_LABELS.get(slug, slug_to_label(slug))


def find_media(exercise_dir: Path, rel_prefix: str):
    for ext in VIDEO_EXTENSIONS:
        f = exercise_dir / f"video{ext}"
        if f.exists():
            return {"type": "video", "src": f"{rel_prefix}/{f.name}"}
    for ext in IMAGE_EXTENSIONS:
        f = exercise_dir / f"image{ext}"
        if f.exists():
            return {"type": "image", "src": f"{rel_prefix}/{f.name}"}
    WARNINGS.append(f"no video/image found in {exercise_dir}")
    return None


def read_text_file(exercise_dir: Path, filename: str) -> str:
    f = exercise_dir / filename
    if f.exists():
        return f.read_text(encoding="utf-8").strip()
    return ""


def build_exercise(exercise_dir: Path):
    slug = exercise_dir.name
    rel_prefix = str(exercise_dir.relative_to(ROOT)).replace("\\", "/")
    prescription = read_text_file(exercise_dir, "prescription.txt")
    if not prescription:
        WARNINGS.append(f"no prescription.txt in {exercise_dir}")
    return {
        "slug": slug,
        "name": slug_to_label(slug),
        "media": find_media(exercise_dir, rel_prefix),
        "prescription": prescription,
        "notes": read_text_file(exercise_dir, "notes.txt"),
    }


def build_group(group_dir: Path):
    exercises = []
    for exercise_dir in sorted(p for p in group_dir.iterdir() if p.is_dir()):
        exercises.append(build_exercise(exercise_dir))
    return {
        "label": group_label(group_dir.name),
        "exercises": exercises,
    }


def build_category(category_dir: Path):
    groups = {}
    for group_dir in sorted(p for p in category_dir.iterdir() if p.is_dir()):
        groups[group_dir.name] = build_group(group_dir)
    return {
        "label": slug_to_label(category_dir.name),
        "groups": groups,
    }


def main():
    if not EXERCISES_DIR.exists():
        print(f"error: {EXERCISES_DIR} does not exist", file=sys.stderr)
        sys.exit(1)

    all_categories = {
        p.name: p for p in EXERCISES_DIR.iterdir() if p.is_dir()
    }

    ordered_slugs = [s for s in CATEGORY_ORDER if s in all_categories]
    ordered_slugs += [s for s in all_categories if s not in CATEGORY_ORDER]

    data = {}
    for slug in ordered_slugs:
        data[slug] = build_category(all_categories[slug])

    OUTPUT_FILE.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    exercise_count = sum(
        len(group["exercises"])
        for cat in data.values()
        for group in cat["groups"].values()
    )
    print(f"wrote {OUTPUT_FILE.relative_to(ROOT)}  "
          f"({len(data)} categories, {exercise_count} exercises)")

    if WARNINGS:
        print(f"\n{len(WARNINGS)} warning(s):")
        for w in WARNINGS:
            print(f"  - {w}")


if __name__ == "__main__":
    main()

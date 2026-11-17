"""Copy a research answer (Markdown) into the dashboard as an archive page.

The answers come from a separate research project and mention files that
only exist there. This script copies one answer into app/content/ and
drops those parts:

  - the closing "Saved in ..." paragraph and anything after it
  - list items that point to the research project's own files
    (see DROP_ITEM_PREFIXES)

Usage (from the project folder):

    python3 scripts/import_archive_page.py SOURCE.md DEST.md

Example:

    python3 scripts/import_archive_page.py \
      my_docs/about_data/rstar_query_results/archive_answers/A1_Rstar_query/2026-11-17_noaa-ncei-threats/answer_A1_Rstar_query_chatgpt-noaa_ncei.md \
      app/content/archives/noaa-ncei/threats-2026-11-17.md

After a new page is copied in, add it to the archive's "pages" list in
app/data/archives.json.
"""

import sys
from pathlib import Path

# A line starting with this ends the content we keep.
STOP_PREFIX = "Saved in "

# List items starting with any of these are dropped.
DROP_ITEM_PREFIXES = (
    "- **Pages to check by hand:**",
    "- **Sites to trust:**",
)


def clean(text: str) -> str:
    kept = []
    for line in text.splitlines():
        if line.startswith(STOP_PREFIX):
            break
        if line.lstrip().startswith(DROP_ITEM_PREFIXES):
            continue
        kept.append(line)
    return "\n".join(kept).rstrip() + "\n"


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__)
        return 2
    source, dest = Path(argv[1]), Path(argv[2])
    cleaned = clean(source.read_text(encoding="utf-8"))
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(cleaned, encoding="utf-8")
    print(f"Wrote {dest} ({len(cleaned.splitlines())} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))

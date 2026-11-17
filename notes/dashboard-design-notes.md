# Dashboard design notes

## Data file: `app/data/datasets.json` (since 2026-11-17)

Replaced the CSV (user's choice: JSON, because a dataset can have several
access links and more metadata is coming). Shape:

```json
{ "datasets": [ {
    "id": "gpcc-monitoring-noaa-psl-mirror-dwd-gpcc-source",
    "name": "...", "data_archive": "...", "precipitation_basis": "...",
    "period_of_record": "...", "formal_cdr": "...", "update_status": "...",
    "spatial_coverage": "...", "resolution": "...", "temporal_frequency": "...",
    "access_endpoints": [
      { "name": "DWD/GPCC archive", "url": "https://...", "role": "primary" },
      { "name": "NOAA PSL mirror",  "url": "https://...", "role": "mirror" } ]
} ] }
```

- `role` is `primary`, `alternative` or `mirror`; it's stored but not shown yet.
- `id` is a stable slug of the name (not used by the page yet; a good key for
  the future dataset page and for URLs instead of the card number).
- Endpoints came from `my_docs/about_data/Data archives by dataset.md`
  (links only; archives listed there without a link were left out). Tracking
  `utm_` parameters were removed. One-time build script:
  `.work/build_json.py` (not in git).
- New fields: add them to each dataset object; to show one in the panel, add
  it to `COL` and `METADATA_FIELDS` in app.js. Search covers every text field
  plus endpoint names and URLs.

## JSON → card mapping

| Card part | JSON field |
|---|---|
| Title | `name` |
| Label line "DATASET 007 / REANALYSIS" | position in the list + derived data-source type |
| Description | `precipitation_basis` |
| Tags | data-source type, coverage, short period (e.g. `1940–present`), `NOAA CDR` if `formal_cdr` starts with "YES" |
| Panel: Update status | `update_status` |
| Panel: metadata grid | `data_archive`, `period_of_record`, `spatial_coverage`, `resolution`, `temporal_frequency`, `formal_cdr` |
| Panel: Data access endpoints | `access_endpoints` → table (Name / Link address); links open in a new tab, link text is the URL without `https://` |

## Derived categories (`CATEGORIES`, `COVERAGES` in app.js)

(Rules below say "basis", "CDR field" etc. — the matching JSON fields.)

First matching rule wins.

- Data source: "blend"/"merged" in basis → Merged; "reanalysis" in basis or
  CDR field → Reanalysis; "satellite"/"microwave"/"IR" → Satellite; else Gauge-based.
- Coverage: "United States"/"CONUS" → CONUS; "North America"/"Canada" →
  North America; starts with "land"/"global land" and no ocean → Global land;
  "quasi"/"near-global"/a band like 60°S–60°N (not 90°S) → Quasi-global; else Global.
- Period tag: first year in the POR text, then "present" if the text says
  present/onward/most recent, else the latest year.

Result on the current CSV: Gauge 15, Satellite 12, Reanalysis 13, Merged 2;
CONUS 5, North America 2, Global land 11, Quasi-global 9, Global 15.

## Filters (multi-select, 2026-11-17)

- A click on an option button adds that option; a second click removes it.
  "All datasets" clears that group (it shows as pressed when nothing in the
  group is selected).
- Options in one group combine with OR; the two groups combine with AND
  (e.g. Satellite + Gauge-based and CONUS + Global land = datasets of either
  type that are in either coverage).
- URL: comma-separated lists, `?category=gauge,satellite&coverage=conus`.
  `FILTER_GROUPS` in app.js lists the groups.

## Differences from the design HTML in my_docs/

- The design HTML and CSS used different class names; the app uses the CSS's names.
- Card header is not a `<button>` wrapping headings (invalid HTML); the title is
  a button whose `::after` covers the whole header, so the whole header is clickable.
- Filter buttons and counts are generated from the data.
- Panel opens with a grid-rows animation; respects reduced motion.

## Layout and colors (2026-11-17, from my_docs/html_css_design/images/new_dashboard_layout_2026-11-17-6.46am.png)

Colors sampled from the image; all live as variables at the top of `app/styles.css`.

- Page (`--page-bg` `#E5EDF0`) shows at the sides; the whole `main.dashboard`
  (max 1200px) is navy `--deep-ocean` `#1F3244`, no top margin.
- Header text sits on the navy, indented 32px more than the panels below it.
  Label line `#A0B6C0`, description and meta `#C8D6DE`, rule `#5C7A8C`,
  title white bold 36px.
- Search bar: white, on the navy, 24px above the white panel.
- `.content-panel` (white) holds both the filters and the dataset index, so
  "Dataset index" and the cards sit in the same white area with dividers
  between cards. Filter headings, card labels and the "11 OF 42 DATASETS"
  counter are `--steel-blue` `#5C7A8C` (4.55:1 on white, passes AA).
- Footer is on the navy in `--on-navy-text` `#A0B6C0` (6.2:1).
- Active filter button `#1F3244`; inactive `#E3EDF0`.

### Card colors (2026-11-17, from the user)

- Page background changed to `#90A8BE` (`--page-bg`).
- Card `#E3E8EC` (`--dataset-card-bg`) with a 4px `#235C70` line under each
  card (`--dataset-card-rule`); the last card has no line.
- Card header on hover and while open: `#DAE4EC` (`--dataset-card-hover`).
- Open panel background white (`--dataset-details-bg`).
- Contrast fixes for the grey cards: card label line ("DATASET 008 /
  REANALYSIS") uses `--dataset-label-text` `#4A6575` (steel-blue was 3.5:1);
  the plain tags (coverage, period) are white so they don't vanish into the
  card; `--muted-text` is `#5C7A8C` (4.55:1 on white).
- Data-source tags (from the user): Gauge `#79D49B`, Satellite `#B0ECFF`,
  Reanalysis `#C6B9FB`, Merged `#FFD28A`, all with text `#434343`
  (`--tag-category-text`; 5.5–7.7:1).

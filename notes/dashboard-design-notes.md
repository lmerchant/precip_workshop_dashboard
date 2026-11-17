# Dashboard design notes

## CSV → card mapping

| Card part | CSV column |
|---|---|
| Title | Region / dataset |
| Label line "DATASET 007 / REANALYSIS" | row number + derived data-source type |
| Description | Precipitation basis |
| Tags | data-source type, coverage, short period (e.g. `1940–present`), `NOAA CDR` if Formal CDR? starts with "YES" |
| Panel: Update status | Update status / latency |
| Panel: metadata grid | Data Archive(s), POR, Spatial coverage, Native / distributed resolution, Temporal frequency, Formal CDR? |

Column names live in the `COL` object at the top of `app/app.js`; the panel
fields are the `METADATA_FIELDS` list.

## Derived categories (`CATEGORIES`, `COVERAGES` in app.js)

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

## Differences from the design HTML in docs/

- The design HTML and CSS used different class names; the app uses the CSS's names.
- Card header is not a `<button>` wrapping headings (invalid HTML); the title is
  a button whose `::after` covers the whole header, so the whole header is clickable.
- Filter buttons and counts are generated from the data.
- Panel opens with a grid-rows animation; respects reduced motion.

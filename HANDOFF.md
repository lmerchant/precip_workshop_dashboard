# Handoff — Precipitation Workshop Dashboard

_Last updated: 2026-11-18 (end of session 7)_

## What exists

- `app/` — the dashboard (plain HTML/CSS/JS, no build step); everything the
  site needs lives here, so `app/` is the folder to serve or publish
  - `index.html` — page shell: header, search, filter groups, dataset list
  - `styles.css` — based on `my_docs/html_css_design/styles.css`, plus tag colors,
    panel animation, focus styles, mobile tweaks
  - `app.js` — loads `data/datasets.json` (relative to `app/`), builds one
    card per dataset, search, filters, expand/collapse panels, state in URL
  - `archive.html`, `archive.js` — the archive page
    (`archive.html?id=noaa-ncei`), also used for instrument pages
    (`?id=noaa-satellites`); see "Archive pages" in the design notes
  - `shared.js` (helpers for both pages), `markdown.js` (Markdown renderer)
  - `data/archives.json` — archives and instruments that have pages, and
    their pages; `"kind": "archive"` or `"instrument"`
  - `content/archives/<id>/` and `content/instruments/<id>/` — per page:
    `<page>.md` (text), `<page>.json` (research question + "searched on"
    list), `<page>.query.md` (R* query statement)
  - `data/datasets.json` — the dataset data (46 datasets since session 7), including each
    dataset's `access_endpoints` list. This is now the file to edit; format in
    `notes/dashboard-design-notes.md`.
  - The old CSV now lives only in `my_docs/about_data/` (not in git).
- `.claude/launch.json` — `dashboard` server config for the browser preview
- `.github/workflows/pages.yml` — publishes `app/` to GitHub Pages on each
  push to `main`. Live and working since 2026-11-17 at
  https://lmerchant.github.io/precip_workshop_dashboard/ (Pages source is set
  to GitHub Actions). The user links it from their own GitHub Pages home page.
- GitHub repo: https://github.com/lmerchant/precip_workshop_dashboard
  (remote `origin`)
- `my_docs/` — the user's own reference files, kept local only: renamed from
  `docs/` and added to `.gitignore` on 2026-11-17 (earlier commits still hold
  the old `docs/` files in git history).
- Design references (user's): `my_docs/html_css_design/` (HTML, CSS, images)
- Data background (user's): `my_docs/about_data/Data archives by dataset.md`
  — per-dataset archive names and links; its links are now in
  `datasets.json` as access endpoints. The user is gathering more metadata
  and will add it as new JSON fields.
- Current layout/color design: `my_docs/html_css_design/images/new_dashboard_layout_2026-11-17-6.46am.png`
- Design decisions: `notes/dashboard-design-notes.md`
- `scripts/import_archive_page.py SOURCE.md DEST.md [--record
  research-record.json] [--query rstar_query.md] [--replace OLD NEW]` —
  copies a research answer into `app/content/` (dropping the "Saved in"
  paragraph, "Pages to check by hand" / "Sandbox" bullets, and sentences
  naming research-project files such as `results.csv`) plus the record
  fields and R* query; `--replace` rewrites text (e.g. a link to another
  run → its dashboard page). Then list the page in
  `app/data/archives.json`. Run from the project folder.
- Research results (user's, from another project):
  `my_docs/about_data/rstar_query_results/archive_answers/<query>/<date_topic>/`
  with `answer_*.md`, `research-record.json`, `rstar_query.md`, and
  `.../instrument_answers/A4_Rstar_query/<date_topic>/` with `answer_*.md`,
  `research-record.json` and `A4_Rstar_query_*.md` (no `rstar_query.md`:
  the query box text was written by hand, see session 6). Only
  `question` and `subquestions[].question` from the record are used so far;
  the user is still choosing other fields.

## How to run

The pages fetch their JSON and Markdown files, so they need a local web server (opening the file
directly shows an error message with these steps). From the `app/` folder:

    python3 -m http.server 3000 --bind 127.0.0.1

then open http://127.0.0.1:3000/ (the user uses port 3000; the browser-pane
preview in `.claude/launch.json` uses 8000 — stop it when done so it doesn't
block the user's port)

Decision (2026-11-17, updated): the data moved from CSV to JSON
(`app/data/datasets.json`) so a dataset can hold lists such as several access
endpoints. Keep reading the data at runtime and serving the page
with a local server. Don't build a copy of the data into app/. The user views
`app/` in their own browser, not as an artifact.

Decision (2026-11-17): stay with plain HTML/CSS/JS, with no framework yet. The
site is on GitHub Pages via the Actions workflow, which publishes `app/` as-is. Astro is the preferred framework if one is ever
needed (it can build one page per dataset from the CSV). Next.js static export
was considered and set aside. Revisit when the dataset detail page is built.

## Current state (after session 7)

- 46 datasets render as cards, sorted by data-source tag, coverage tag,
  then name (re-sort with `python3 .work/sort_datasets.py` after any
  rename or new dataset); click a card to open the detail panel: update status,
  metadata grid (incl. Curator, Contact email, DOI), Notes, then a "Data
  access endpoints" table (name + link). `email` and `doi` are blank for
  now; 4 new datasets (TerraClimate, WorldClim, CMAP, CoCoRaHS) have
  blanks the user will fill in. Blank fields show "NA" in the panel
  (label set in `app.js`; the JSON keeps them as empty strings).
- Filters are derived from the data text (no category field exists):
  data source (Gauge-based / Satellite / Reanalysis / Merged) and coverage
  (CONUS / North America / Global land / Quasi-global / Global).
- Search matches all words across every text field and the endpoint names/URLs.
- Filters are multi-select (click to add/remove; "All datasets" clears the
  group). Within a group options are OR'd; the two groups are AND'd.
- Look: navy dashboard panel (max 1200px wide) on a #D5E3EF page, #E4EBF0
  cards with a 4px #235C70 rule, #CAD8E3 hover/open header, #46606F card
  label text, white open panel, bright
  data-source tags with #434343 text. All text passes WCAG AA; details in
  `notes/dashboard-design-notes.md`.
- Search, filters and open cards are stored in the URL
  (`?q=&category=a,b&coverage=&open=<dataset id>,<dataset id>`; since
  session 5 `open` and the `#dataset-<id>` jump use dataset ids, not card
  numbers),
  which is the hook for restoring the dashboard after the future dataset page.

- Archive pages (session 3): each dataset panel links its archive to an
  archive page when one exists ("NOAA NCEI — about this archive"; 8
  datasets). The NCEI page (`archive.html?id=noaa-ncei`) shows, under the
  report title: the R* query box, "**Question:**" and a "Searched on" list,
  then the threat-assessment report; at the bottom a "Datasets in this
  archive" list whose links open and scroll to that card on the dashboard.
  "← Back to dashboard" restores the search, filters and open cards. Two
  or more pages per archive show as tabs (tested). Content indented 40px.
- `app/` is self-contained; the only outside resource is Google Fonts (IBM
  Plex), which the user chose to keep.
- "R* metadata" row (session 6) under the coverage filters: one link per
  `archives.json` entry — NOAA NCEI (archive), NOAA Satellites, NASA
  Satellites, NOAA Rain Gauges (instruments, "— about this instrument").
  Links carry the dashboard state. The NCEI links in the dataset panels
  are still there.
- Instrument pages: same layout as the NCEI page, header label
  "Instrument", subtitle the agency's full name, R* query box with the
  user's A4 text ("[Dependent infrastructure resilience]" / "Observation
  network or sensor platform at risk" / description), question and
  "Searched on", then the report. No dataset list (no dataset field names
  an instrument). The NASA report's "earlier NOAA run" link opens the
  NOAA Satellites page.
- Session 6's code is merged to `main` and pushed by the user (2026-11-18):
  `main`, `origin/main` and `origin/develop` at `16943a7`. The handoff
  commits after it are on `develop` only. Not checked on the live site.

## Open questions for the user

- Should categories come from new JSON fields (e.g. `data_source`,
  `coverage_group`) instead of text rules? Easy now that the data is JSON.
- Which filter groups matter most (also: temporal frequency, archive, CDR status)?
- Header wording (title, "GLOBAL & REGIONAL COLLECTION").

## Working preferences (see also CLAUDE.md)

- Git: work and commit on `develop`. To publish, merge `develop` into `main`
  and push (`git switch main && git merge --ff-only develop && git push
  origin main develop && git switch develop`). The user has done the merge and
  push themselves so far; ask before pushing.
- In session 2, `git merge` and `git rm` from Claude's Bash were denied.
  Give the user the command instead, and use `mv`/`trash` plus `git add -A`
  to untrack files. The user also commits on `main` directly at times (e.g.
  data edits), so check `git log develop..main` at the start of a session
  and have the user fast-forward `develop` if it's behind.
- When the user pastes CSS values, apply them as variables at the top of
  `app/styles.css`, and adjust text colors if needed to pass WCAG AA (the
  user has said that's fine).
- Put everything the user views in `app/`; they open it in their own browser
  (no artifacts). After each big change, give them the server command from
  CLAUDE.md ("Viewing the dashboard").
- Skills: `my:frontend-ui-engineering` for UI/accessibility work and
  `my:playwright-expert` for Playwright. playwright-expert had
  `disable-model-invocation: true`; the user removed it on 2026-11-17, so it
  should show up from session 2 on. Claude can't edit `~/.my-claude-plugins`
  (permission settings), so give the user commands for changes there.
- Playwright isn't set up in this project yet. When it is: Firefox + WebKit
  only, npm runs in the user's Terminal (see global CLAUDE.md).

## Session log

- Session 7 (2026-11-18): the user renamed every dataset in
  `datasets.json` (e.g. "ERA5 — global" → "ERA5: fifth generation ECMWF
  reanalysis…", region prefixes dropped), plus "JRA-55: Japanese 55-year
  Reanalysis" done by Claude. Added GHCN-D from
  `my_docs/about_data/ghcn_dataset.json` (id `ghcn-d`, the source had a
  blank id; Gauge-based / Global land, card 011) and re-sorted; the
  renames moved Livneh up in the CONUS group and PERSIANN-CDR/TRMM down in
  the Satellite group. The blank-field label "Not stated" → "NA" in
  `app.js` (the user asked for it "in the JSON", but the text only lived
  in the code; offered to write "NA" into the JSON, which would need the
  category rule changed — no answer). The user merged and pushed
  through `f369813`.

- Session 6 (2026-11-18): added the "R* metadata" row with the NCEI link
  (`a814f56` also holds the next item), then the NOAA Satellites and NASA
  Satellites instrument pages from the A4 R* query (`a814f56`), then NOAA
  Rain Gauges (`16943a7`). User's decisions: no dataset list on
  instrument pages; query box uses their given text, not the whole A4
  query file; remove research-file references and relink the NASA → NOAA
  run link; one flat row of links. Left in the reports: "(read via
  WebFetch)" and "(subagent report)" notes (offered to remove; no answer).
  The user merged and pushed through `16943a7`.

- Session 5 (2026-11-18): merged the user's
  `my_docs/about_data/master_climate_inventory_subset.json` into
  `datasets.json` (details in `notes/dashboard-design-notes.md`): 9 matched
  datasets gained curator/doi/notes, 4 new datasets added, `email` key added
  but left blank (public site). User's corrections: DS-136 (GPCP) note now
  says "Global Precipitation Climatology Project"; DS-234 ("GPCC") dropped
  as a duplicate; "50°S-50°N land" removed from the CHIRPS notes (v3 covers
  60°S–60°N). Panel shows Curator, Contact email, DOI and Notes.
  Then sorted `datasets.json` by data-source tag, coverage tag, then name
  (`.work/sort_datasets.py`); archive-page links still open the right
  cards (they number from the JSON order). Then switched URLs from card
  numbers to dataset ids (`?open=chirps-v3,era5-global`,
  `#dataset-chirps-v3`) in app.js and archive.js, so links survive
  re-sorting; "Dataset 001" on the card is now only a display number.
  Tested open/reload/archive-link round trip in the browser. The browser
  pane kept a stale archive.js until a forced reload — remind the user to
  hard-reload (Cmd+Shift+R) after JS changes.
  Then CoCoRaHS, CMAP, WorldClim and TerraClimate period of record
  "-ongoing" → "-present" (user's request) so their tags read
  "<year>–present"; the period tag also treats "ongoing" as present.
  Commits `a733458`, `7e65c64`; the user merged to `main` and pushed.

- Session 4 (2026-11-17): new colors from the user — page #D5E3EF (tried
  #C3DFF0 first), cards #E4EBF0, hover/open header #CAD8E3; card label
  text darkened #4A6575 → #46606F to keep 4.5:1 on the new hover color.
  The user published sessions 3 and 4 to GitHub Pages. Note: the page color
  only shows on windows wider than 1200px (the navy panel fills narrower
  ones); offered to add a light-blue margin around the panel, no answer yet.
  The checkout was on `main` mid-session (the user switches to merge);
  check the branch before committing.

- Session 3 (2026-11-17): archive pages. Added `archive.html` for NOAA
  NCEI with the user's threat-assessment research (copied in by
  `scripts/import_archive_page.py`, "Saved in" paragraph and the two
  research-file bullets in Gaps removed), linked from the 8 NCEI dataset
  panels; tabs ready for more pages; data fetches no longer cached.
  Then: 40px left indent on the archive page, and its dataset links jump
  to that card on the dashboard (open, scrolled to the top). Then the
  research question and "Searched on" subquestions from
  `research-record.json` under the page title (import script `--record`),
  with the R* query statement (`rstar_query.md`, `--query`) above them;
  its "R* Query" heading is an 18px h3 like the others (h2 24px, body 15px).
  Checked `app/` is self-contained (fonts from Google Fonts kept).

- Session 2 (2026-11-17): restyled to `new_dashboard_layout_2026-11-17-6.46am.png`
  — pale page, whole dashboard on a navy (#1F3244) panel, search on navy, and
  filters + dataset index in one white panel (see "Layout and colors" in
  `notes/dashboard-design-notes.md`). Then the user's own card colors
  (#90A8BE page, #E3E8EC cards, #DAE4EC hover/open) and bright tag colors;
  multi-select filters; GitHub Pages workflow — site is live. Renamed
  `docs/` → `my_docs/` (untracked; old commits keep the files, user is fine
  with that). Switched the data from CSV to `app/data/datasets.json` and
  added a "Data access endpoints" table to each panel, using the links in
  `my_docs/about_data/Data archives by dataset.md`; all merged to `main`,
  pushed and live. The user once saw a stale stylesheet: after CSS/JS
  changes, remind them to hard-reload (Cmd+Shift+R).
- Session 1 (2026-11-17): built the first dashboard from the design files and
  the CSV; moved the data into `app/data/`; decided on plain HTML now with
  GitHub Pages later; added the skills and viewing sections to CLAUDE.md;
  first commits on `develop`.

## Next steps

000. Session 7 is published: the user merged and pushed through `f369813`
   (2026-11-18). Optionally check the new names, GHCN-D and "NA" on the
   live site.
00. Session 6 is published (`16943a7`). Optionally check the R* metadata
   row and instrument pages on the live site; the handoff commits reach
   `main` with the next merge.
01. Ask whether to remove "(read via WebFetch)" / "(subagent report)"
   notes from the instrument reports (import script could drop them).
02. If instruments should list datasets, add an `instruments` field to
   `datasets.json` (which datasets use NOAA/NASA satellites or NOAA
   gauges) and show the list on the instrument pages.

0a. Session 5 leftovers: the user fills the blanks in the 4 new datasets
   (TerraClimate, WorldClim, CMAP, CoCoRaHS). Until
   `precipitation_basis` is filled they all show as "Gauge-based" (the
   category rule's fallback).

0b. **Reminder for the user:** double-check the nClimGrid-Daily curator
   "Kate Willett (NCEI)" with a colleague (Claude thought Kate Willett is at
   the UK Met Office, not NCEI). Left as is for now.

0. Ask whether the user wants a light-blue margin around the navy
   dashboard panel so the #D5E3EF page color shows on laptop-width windows.

1. Get answers to the open questions above and adjust filters / card content.
2. When the user has more metadata, add it as JSON fields and show it in the
   panel (or the future dataset page).
3. Set up Playwright (Firefox/WebKit) to check pages and accessibility.
4. Plan the per-dataset detail page (tab view) and the "back to dashboard"
   path that restores state from the URL.
5. Archive pages: add more pages/archives as the research comes in
   (import script + `archives.json`); decide which other
   `research-record.json` fields to use (e.g. a ratings summary in the
   dropdown).
6. Consider showing endpoint `role` (e.g. a "Mirror" label).
   Every dataset needs a unique `id` (lowercase letters, digits, hyphens):
   the URLs and card element ids use it.

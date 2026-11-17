# Handoff — Precipitation Workshop Dashboard

_Last updated: 2026-11-17_

## What exists

- `app/` — the dashboard (plain HTML/CSS/JS, no build step); everything the
  site needs lives here, so `app/` is the folder to serve or publish
  - `index.html` — page shell: header, search, filter groups, dataset list
  - `styles.css` — based on `docs/html_css_design/styles.css`, plus tag colors,
    panel animation, focus styles, mobile tweaks
  - `app.js` — loads `data/precipitation_workshop_datasets.csv` (relative to
    `app/`), builds one card per row, search, filters, expand/collapse panels,
    state in URL
  - `data/precipitation_workshop_datasets.csv` — the dataset table (moved from
    the top-level `data/` on 2026-11-17)
- `.claude/launch.json` — `dashboard` server config for the browser preview
- `.github/workflows/pages.yml` — publishes `app/` to GitHub Pages on each
  push to `main` (https://lmerchant.github.io/precip_workshop_dashboard/).
  Needs Settings → Pages → Source: GitHub Actions. Work on `develop`, merge
  into `main` to publish.
- Design references (user's): `docs/html_css_design/` (HTML, CSS, images)
- Data background (user's): `docs/about_data/Data archives by dataset.md`
  — a start on per-dataset metadata (archive name + dataset record link).
  The user is still gathering more metadata and will ask how to add it to
  the dashboard; don't wire it in before then.
- Current layout/color design: `docs/html_css_design/images/new_dashboard_layout_2026-11-17-6.46am.png`
- Design decisions: `notes/dashboard-design-notes.md`

## How to run

The page fetches the CSV, so it needs a local web server (opening the file
directly shows an error message with these steps). From the `app/` folder:

    python3 -m http.server 3000 --bind 127.0.0.1

then open http://127.0.0.1:3000/ (the user uses port 3000; the browser-pane
preview in `.claude/launch.json` uses 8000 — stop it when done so it doesn't
block the user's port)

Decision (2026-11-17): keep reading the CSV at runtime and serving the page
with a local server. Don't build a copy of the data into app/. The user views
`app/` in their own browser, not as an artifact.

Decision (2026-11-17): stay with plain HTML/CSS/JS, with no framework yet. The
site will go on GitHub Pages later, which works as-is: publish the `app/`
folder (e.g. with the Pages GitHub Action). Astro is the preferred framework if one is ever
needed (it can build one page per dataset from the CSV). Next.js static export
was considered and set aside. Revisit when the dataset detail page is built.

## Current state (session 1)

- 42 datasets render as cards; click a card to open the detail panel.
- Filters are derived from the CSV text (no category column exists):
  data source (Gauge-based / Satellite / Reanalysis / Merged) and coverage
  (CONUS / North America / Global land / Quasi-global / Global).
- Search matches all words across every CSV field.
- Filters are multi-select (click to add/remove; "All datasets" clears the group).
- Search, filters and open cards are stored in the URL (`?q=&category=a,b&coverage=&open=`),
  which is the hook for restoring the dashboard after the future dataset page.

## Open questions for the user

- Should categories come from a new CSV column instead of text rules?
- Which filter groups matter most (also: temporal frequency, archive, CDR status)?
- Split "Region — Dataset" names into region and dataset name?
- Header wording (title, "GLOBAL & REGIONAL COLLECTION").

## Working preferences (see also CLAUDE.md)

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

- Session 2 (2026-11-17): restyled to `new_dashboard_layout_2026-11-17-6.46am.png`
  — pale page, whole dashboard on a navy (#1F3244) panel, search on navy, and
  filters + dataset index in one white panel (see "Layout and colors" in
  `notes/dashboard-design-notes.md`). The user once saw a stale stylesheet:
  after CSS changes, remind them to hard-reload (Cmd+Shift+R).
- Session 1 (2026-11-17): built the first dashboard from the design files and
  the CSV; moved the data into `app/data/`; decided on plain HTML now with
  GitHub Pages later; added the skills and viewing sections to CLAUDE.md;
  first commits on `develop`.

## Next steps

1. Get answers to the open questions above and adjust filters / card content.
2. When the user has more metadata, plan how to add it (archive names and
   dataset record links from `docs/about_data/` would fit the panel).
3. Set up Playwright (Firefox/WebKit) to check pages and accessibility.
4. Plan the per-dataset detail page (tab view) and the "back to dashboard"
   path that restores state from the URL.
5. GitHub Pages workflow added 2026-11-17; confirm the first deploy works.

# Handoff — Precipitation Workshop Dashboard

_Last updated: 2026-11-17_

## What exists

- `app/` — the dashboard (plain HTML/CSS/JS, no build step); everything the
  site needs lives here, so `app/` is the folder to serve or publish
  - `index.html` — page shell: header, search, filter groups, dataset list
  - `styles.css` — based on `my_docs/html_css_design/styles.css`, plus tag colors,
    panel animation, focus styles, mobile tweaks
  - `app.js` — loads `data/datasets.json` (relative to `app/`), builds one
    card per dataset, search, filters, expand/collapse panels, state in URL
  - `data/datasets.json` — the dataset data (41 datasets), including each
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

## How to run

The page fetches the CSV, so it needs a local web server (opening the file
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

## Current state (after session 2)

- 41 datasets render as cards (the user removed a duplicate "PRISM" row);
  click a card to open the detail panel, which ends with a "Data access
  endpoints" table (name + link) for each dataset.
- Filters are derived from the data text (no category field exists):
  data source (Gauge-based / Satellite / Reanalysis / Merged) and coverage
  (CONUS / North America / Global land / Quasi-global / Global).
- Search matches all words across every text field and the endpoint names/URLs.
- Filters are multi-select (click to add/remove; "All datasets" clears the
  group). Within a group options are OR'd; the two groups are AND'd.
- Look: navy dashboard panel on a #90A8BE page, grey #E3E8EC cards with a 4px
  #235C70 rule, #DAE4EC hover/open header, white open panel, bright
  data-source tags with #434343 text. All text passes WCAG AA; details in
  `notes/dashboard-design-notes.md`.
- Search, filters and open cards are stored in the URL (`?q=&category=a,b&coverage=&open=`),
  which is the hook for restoring the dashboard after the future dataset page.

## Open questions for the user

- Should categories come from new JSON fields (e.g. `data_source`,
  `coverage_group`) instead of text rules? Easy now that the data is JSON.
- Which filter groups matter most (also: temporal frequency, archive, CDR status)?
- Split "Region — Dataset" names into region and dataset name?
- Header wording (title, "GLOBAL & REGIONAL COLLECTION").

## Working preferences (see also CLAUDE.md)

- Git: work and commit on `develop`. To publish, merge `develop` into `main`
  and push (`git switch main && git merge --ff-only develop && git push
  origin main develop && git switch develop`). The user has done the merge and
  push themselves so far; ask before pushing.
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

- Session 2 (2026-11-17): restyled to `new_dashboard_layout_2026-11-17-6.46am.png`
  — pale page, whole dashboard on a navy (#1F3244) panel, search on navy, and
  filters + dataset index in one white panel (see "Layout and colors" in
  `notes/dashboard-design-notes.md`). Then the user's own card colors
  (#90A8BE page, #E3E8EC cards, #DAE4EC hover/open) and bright tag colors;
  multi-select filters; GitHub Pages workflow — site is live. The user once
  saw a stale stylesheet: after CSS/JS changes, remind them to hard-reload
  (Cmd+Shift+R).
- Session 1 (2026-11-17): built the first dashboard from the design files and
  the CSV; moved the data into `app/data/`; decided on plain HTML now with
  GitHub Pages later; added the skills and viewing sections to CLAUDE.md;
  first commits on `develop`.

## Next steps


1. Get answers to the open questions above and adjust filters / card content.
2. When the user has more metadata, add it as JSON fields and show it in the
   panel (or the future dataset page).
3. Set up Playwright (Firefox/WebKit) to check pages and accessibility.
4. Plan the per-dataset detail page (tab view) and the "back to dashboard"
   path that restores state from the URL.
5. Consider showing endpoint `role` (e.g. a "Mirror" label) and using the
   dataset `id` in URLs instead of the card number.

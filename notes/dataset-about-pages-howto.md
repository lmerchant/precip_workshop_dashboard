# How the dataset about pages are built (and how to add more)

Built 2026-11-20 (session 9). The agreed format is in
`notes/dataset-about-pages-plan.md`; the user's original spec is
`my_docs/about_data/rstar_query_results/dataset_answers/about_dataset_queries/about_pages_format.md`.

## The pieces

| File | What it does |
|---|---|
| `app/data/dataset_pages.json` | **The list to edit.** One entry per dataset: `id` (as in `datasets.json`), `research_folder` (folder under the research root), `parts` (`part` number + short `topic`), in part order. |
| `scripts/import_dataset_pages.py` | Reads that list, copies each part's answer and questions into `app/content/datasets/<id>/`, and sets `about_url` in `datasets.json`. |
| `scripts/research_text.py` | `strip_tool_notes()` (removes "(read via WebFetch)" etc.) and `tool_mentions()` (finds lines still naming a tool). Also used by `import_archive_page.py`. |
| `scripts/import_archive_page.py` | Its `clean()` (drops "Saved in …" and everything after, "Pages to check by hand"/"Sandbox" bullets, sentences naming research files such as `check-by-hand.md`, and tool notes) is reused by the dataset script. |
| `app/content/datasets/<id>/pt<N>.md` | Answer text, cleaned, with its first `# ` heading removed. Generated: don't edit by hand, re-run the script. |
| `app/content/datasets/<id>/pt<N>.json` | `{ "question": …, "searched_on": [ … ] }` from `query_questions.txt`. Generated. |
| `app/dataset.html`, `app/dataset.js` | The page. `dataset.html?id=<id>` = summary page; `&part=<N>` = one part's page. |
| `app/app.js` (`aboutHref`) | The panel's "About dataset" link adds the search/filters and `open=<id>` to a `dataset.html?…` about_url. |
| `app/styles.css` section 13c | Dataset page styles (reuses the archive page's `.prose`, `.research-scope`, `.searched-on`). |

Research root: `my_docs/about_data/rstar_query_results/dataset_answers/about_dataset_queries/`.
Each part folder is `<research_folder>/<date>_<anything>-pt<N>/` and holds one
`answer*.md` and a `query_questions.txt`:

```
<Question>

The main question?

<Searched on>

First searched-on question?

Second one?
```

## Page layout (what dataset.js renders)

- Header: "← Back to dashboard" (→ `index.html?<search/filters>&open=<…,id>#dataset-<id>`,
  so the card is open and scrolled to), label line, `<h1>`, subtitle, meta line.
  - Title: card name before the first ": " + ": Web research" (summary) or
    + ": <topic>" (part). Subtitle: the card name after ": " (none if no colon).
- Summary: one `<section>` per part: `<h2>` topic, link "Read the web research: <topic>",
  Question, "Searched on" (`<h3>`) list.
- Part: "← Back to <short name> web research" link, "Question" `<h2>` with the
  question as a paragraph, "Searched on" `<h3>` and list,
  the answer (its `##` sections render as `<h2>`), then previous/next links.
- Every link between these pages carries the dashboard's q/category/coverage/open.

## Adding research

### A new part for a dataset that already has pages

1. Make sure the new folder ends in `-pt<N>` and has one `answer*.md` and a
   `query_questions.txt`.
2. Check `query_questions.txt`: every line under `<Question>` and
   `<Searched on>` must be a question (rewrite and save in the user's file;
   work any bracket note after the "?" into the sentence).
3. Add `{ "part": N, "topic": "<short topic>" }` to that dataset's `parts`
   in `app/data/dataset_pages.json`, in part-number order. Reuse topic names
   already in use where they fit (Overview; Quality control and formats;
   People; Funding; News; Funding and news; Funding and threats; Threats to
   inputs; Satellites) and ask the user for new ones.
4. From the project folder: `python3 scripts/import_dataset_pages.py`
   (`PYTHONPYCACHEPREFIX=$PWD/.work/pyc` keeps `__pycache__` out of `scripts/`).
5. Read the `check:` lines it prints. Lines that still mention WebFetch or a
   subagent inside a sentence (usually in "Gaps") are left as is unless the
   user says otherwise; if a new kind of bracketed tool note slips through,
   extend the patterns in `scripts/research_text.py`.
6. Check in the browser: summary page, the new part, prev/next links,
   "Back to dashboard". Remind the user to hard-reload (Cmd+Shift+R).

### A new dataset

1. Find its `id` in `app/data/datasets.json` (the user tells which research
   folder maps to which dataset name).
2. Add an entry to `app/data/dataset_pages.json` (`id`, `research_folder`,
   `parts`), then steps 2–6 above. The script sets the dataset's
   `about_url` to `dataset.html?id=<id>`, which turns the panel's
   "About dataset: NA" into a link.

### Re-running

The script rewrites every listed part and `datasets.json` each time; it is
safe to re-run after the user edits an answer or a question file.
`datasets.json` round-trips unchanged apart from `about_url` (2-space
indent, non-ASCII kept).

## Things to watch for

- Folder dates don't follow part order (queries were run out of order):
  only the `-pt<N>` ending matters.
- Answer files may be named differently (`answer.md` vs `answer_*.md`);
  the script takes the one `answer*.md` in the folder and stops if there
  are zero or several.
- Links to `./` or `web_search_results/` (research-project files) are
  reported as `check:` lines; fix by hand or with a `--replace`-style edit.
- Tool notes left in prose on purpose (2026-11-20): GPCP pt3 "Gaps"
  (WebFetch 404, checking subagent not run), GPCP pt5 "No checking subagent
  was run", PERSIANN pt2 maturity-matrix note, PERSIANN pt4 note under the
  ratings table, PERSIANN pt6 "The checking subagent reports…", NCEI archive
  page line 34 "the article or the extract".

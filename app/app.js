/* Precipitation workshop dataset dashboard.
 *
 * Loads the dataset CSV, builds one card per row, and wires up search,
 * filters and the expandable detail panels. The current search, filters
 * and open cards are kept in the URL query string, so a reload (or coming
 * back from a future dataset page) shows the dashboard as it was.
 */

const CSV_PATH = "data/precipitation_workshop_datasets.csv";

// CSV column names, in one place so a renamed column is a one-line change.
const COL = {
  name: "Region / dataset",
  archive: "Data Archive(s)",
  basis: "Precipitation basis",
  period: "POR",
  cdr: "Formal CDR?",
  update: "Update status / latency",
  coverage: "Spatial coverage",
  resolution: "Native / distributed resolution",
  frequency: "Temporal frequency",
};

// Fields shown in the metadata grid of the detail panel, in order.
const METADATA_FIELDS = [
  ["Data archive(s)", COL.archive],
  ["Period of record", COL.period],
  ["Spatial coverage", COL.coverage],
  ["Resolution", COL.resolution],
  ["Temporal frequency", COL.frequency],
  ["Formal CDR status", COL.cdr],
];

/* ---------- Derived categories ----------
 * The CSV has no category column, so the data-source type and coverage
 * are worked out from the text. The first matching rule wins.
 */

const CATEGORIES = [
  { id: "merged", label: "Merged / blended",
    test: r => /\b(blend|merged)/i.test(r[COL.basis]) },
  { id: "reanalysis", label: "Reanalysis",
    test: r => /reanalysis/i.test(r[COL.basis] + " " + r[COL.cdr]) },
  { id: "satellite", label: "Satellite",
    test: r => /satellite|microwave|\bIR\b/i.test(r[COL.basis]) },
  { id: "gauge", label: "Gauge-based",
    test: () => true },
];

const COVERAGES = [
  { id: "conus", label: "CONUS",
    test: t => /united states|\bCONUS\b/i.test(t) },
  { id: "north-america", label: "North America",
    test: t => /north america|canada/i.test(t) },
  { id: "global-land", label: "Global land",
    test: t => /^(global )?land\b/i.test(t) && !/ocean/i.test(t) },
  { id: "quasi-global", label: "Quasi-global",
    test: t => /quasi|near-global|\d+°S\s*[-–]\s*\d+°N/i.test(t) && !/90°S/.test(t) },
  { id: "global", label: "Global",
    test: () => true },
];

function categoryOf(row) {
  return CATEGORIES.find(c => c.test(row));
}

function coverageOf(row) {
  return COVERAGES.find(c => c.test(row[COL.coverage]));
}

function isFormalCDR(row) {
  return /^yes/i.test(row[COL.cdr].trim());
}

// Short "start–end" label for the period-of-record tag, e.g. "1979–present".
// Start is the first year mentioned (the main record is listed first);
// the full text is in the detail panel.
function shortPeriod(text) {
  const years = (text.match(/\b(1[89]\d\d|20\d\d)\b/g) || []).map(Number);
  if (years.length === 0) return text;
  const start = years[0];
  const ongoing = /present|onward|most recent/i.test(text);
  const end = ongoing ? "present" : Math.max(...years);
  return start === end ? String(start) : `${start}–${end}`;
}

/* ---------- CSV parsing ----------
 * Handles quoted fields with commas, newlines and doubled quotes.
 */

function parseCSV(text) {
  text = text.replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field); field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }

  const [header, ...body] = rows.filter(r => r.some(v => v.trim() !== ""));
  return body.map(values =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (values[i] || "").trim()]))
  );
}

/* ---------- Rendering ---------- */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const pad3 = n => String(n).padStart(3, "0");

function cardHtml(ds) {
  const r = ds.row;
  const e = escapeHtml;
  const panelId = `details-${ds.number}`;

  const metadata = METADATA_FIELDS.map(([label, col]) => `
    <div class="metadata-item">
      <dt>${e(label)}</dt>
      <dd>${e(r[col] || "Not stated")}</dd>
    </div>`).join("");

  return `
  <article class="dataset-card" data-number="${ds.number}">
    <div class="dataset-header">
      <div class="dataset-number">Dataset ${pad3(ds.number)} / ${e(ds.category.label)}</div>
      <h3 class="dataset-title">
        <button class="dataset-toggle" type="button"
                aria-expanded="false" aria-controls="${panelId}">${e(r[COL.name])}</button>
      </h3>
      <p class="dataset-description">${e(r[COL.basis])}</p>
      <div class="dataset-tags">
        <span class="tag tag-${ds.category.id}">${e(ds.category.label)}</span>
        <span class="tag tag-slate">${e(ds.coverage.label)}</span>
        <span class="tag tag-neutral">${e(shortPeriod(r[COL.period]))}</span>
        ${ds.cdr ? '<span class="tag tag-cdr">NOAA CDR</span>' : ""}
      </div>
      <svg class="expand-icon" viewBox="0 0 24 24" aria-hidden="true">
        <g class="icon-open"><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></g>
        <polyline class="icon-close" points="5,15 12,8 19,15"/>
      </svg>
    </div>

    <div class="dataset-details" id="${panelId}">
      <div class="details-inner">
        <div class="details-content">
          <h4 class="details-heading">Update status</h4>
          <p class="details-description">${e(r[COL.update] || "Not stated")}</p>

          <div class="section-divider"></div>

          <h4 class="details-heading caps">Dataset metadata</h4>
          <dl class="metadata-grid">${metadata}</dl>
        </div>
      </div>
    </div>
  </article>`;
}

function filterButtonsHtml(groupName, options, datasets) {
  const all = `<button type="button" class="filter-button" data-group="${groupName}"
     data-value="all" aria-pressed="true">All datasets<span class="filter-count">${datasets.length}</span></button>`;
  const rest = options
    .map(o => ({ ...o, n: datasets.filter(d => d[groupName].id === o.id).length }))
    .filter(o => o.n > 0)
    .map(o => `<button type="button" class="filter-button" data-group="${groupName}"
       data-value="${o.id}" aria-pressed="false">${escapeHtml(o.label)}<span class="filter-count">${o.n}</span></button>`)
    .join("");
  return all + rest;
}

/* ---------- State (kept in the URL) ---------- */

// Each filter group holds a set of selected option ids; an empty set
// means "All datasets". Options in one group combine with OR, and the
// two groups combine with AND.
const FILTER_GROUPS = ["category", "coverage"];

const state = { search: "", category: new Set(), coverage: new Set(), open: new Set() };

const listParam = value => (value || "").split(",").filter(Boolean);

function readStateFromUrl() {
  const p = new URLSearchParams(location.search);
  state.search = p.get("q") || "";
  FILTER_GROUPS.forEach(g => { state[g] = new Set(listParam(p.get(g))); });
  state.open = new Set(listParam(p.get("open")).map(Number));
}

function writeStateToUrl() {
  const p = new URLSearchParams();
  if (state.search) p.set("q", state.search);
  FILTER_GROUPS.forEach(g => { if (state[g].size) p.set(g, [...state[g]].join(",")); });
  if (state.open.size) p.set("open", [...state.open].sort((a, b) => a - b).join(","));
  const qs = p.toString();
  history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
}

/* ---------- Behaviour ---------- */

function applyFilters(datasets) {
  const terms = state.search.toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;

  datasets.forEach(ds => {
    const visible =
      FILTER_GROUPS.every(g => state[g].size === 0 || state[g].has(ds[g].id)) &&
      terms.every(t => ds.searchText.includes(t));
    ds.card.hidden = !visible;
    if (visible) shown++;
  });

  document.getElementById("datasetCount").textContent =
    `${String(shown).padStart(2, "0")} OF ${datasets.length} DATASETS`;
  document.getElementById("noResults").hidden = shown > 0;

  document.querySelectorAll(".filter-button").forEach(btn => {
    const selected = state[btn.dataset.group];
    const pressed = btn.dataset.value === "all"
      ? selected.size === 0
      : selected.has(btn.dataset.value);
    btn.setAttribute("aria-pressed", String(pressed));
  });

  writeStateToUrl();
}

function setExpanded(card, expanded) {
  card.classList.toggle("expanded", expanded);
  card.querySelector(".dataset-toggle").setAttribute("aria-expanded", String(expanded));
  const n = Number(card.dataset.number);
  if (expanded) state.open.add(n); else state.open.delete(n);
}

async function init() {
  const list = document.getElementById("datasetList");

  let rows;
  try {
    const res = await fetch(CSV_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    rows = parseCSV(await res.text());
  } catch (err) {
    list.innerHTML = `<p class="status-message">Could not load the dataset file
      (<code>${escapeHtml(CSV_PATH)}</code>: ${escapeHtml(err.message)}).
      Open this page through a local web server started from the <code>app</code> folder,
      for example <code>python3 -m http.server 3000 --bind 127.0.0.1</code>,
      then visit <code>http://127.0.0.1:3000/</code>.</p>`;
    return;
  }

  const datasets = rows.map((row, i) => ({
    number: i + 1,
    row,
    category: categoryOf(row),
    coverage: coverageOf(row),
    cdr: isFormalCDR(row),
    searchText: Object.values(row).join(" ").toLowerCase(),
  }));
  datasets.forEach(ds => {
    ds.searchText += " " + [ds.category.label, ds.coverage.label, ds.cdr ? "noaa cdr" : ""]
      .join(" ").toLowerCase();
  });

  document.getElementById("totalCount").textContent = `${datasets.length} DATASETS`;
  document.getElementById("categoryFilters").innerHTML =
    filterButtonsHtml("category", CATEGORIES, datasets);
  document.getElementById("coverageFilters").innerHTML =
    filterButtonsHtml("coverage", COVERAGES, datasets);

  list.innerHTML = datasets.map(cardHtml).join("") +
    `<p class="status-message" id="noResults" hidden>
       No datasets match the current search and filters.</p>`;
  datasets.forEach(ds => {
    ds.card = list.querySelector(`[data-number="${ds.number}"]`);
  });

  // Restore state from the URL.
  readStateFromUrl();
  const searchInput = document.getElementById("searchInput");
  searchInput.value = state.search;
  datasets.forEach(ds => {
    if (state.open.has(ds.number)) setExpanded(ds.card, true);
  });
  applyFilters(datasets);

  // Search
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim();
    applyFilters(datasets);
  });

  // Filter buttons (one listener for both groups). An option button
  // toggles that option; "All datasets" clears the group's selections.
  document.querySelector(".filter-section").addEventListener("click", ev => {
    const btn = ev.target.closest(".filter-button");
    if (!btn) return;
    const selected = state[btn.dataset.group];
    const value = btn.dataset.value;
    if (value === "all") selected.clear();
    else if (selected.has(value)) selected.delete(value);
    else selected.add(value);
    applyFilters(datasets);
  });

  // Expand / collapse dataset cards
  list.addEventListener("click", ev => {
    const toggle = ev.target.closest(".dataset-toggle");
    if (!toggle) return;
    const card = toggle.closest(".dataset-card");
    setExpanded(card, !card.classList.contains("expanded"));
    writeStateToUrl();
  });
}

init();

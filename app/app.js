/* Precipitation workshop dataset dashboard.
 *
 * Loads the dataset JSON, builds one card per dataset, and wires up search,
 * filters and the expandable detail panels. The current search, filters
 * and open cards are kept in the URL query string, so a reload (or coming
 * back from a future dataset page) shows the dashboard as it was.
 */

// DATA_PATH, ARCHIVES_PATH, escapeHtml and the archive helpers are in
// shared.js, which index.html loads first.

// Archives that have their own page (from data/archives.json). Filled in
// by init(); stays empty if that file can't be loaded.
let archives = [];

// Field names in datasets.json, in one place so a renamed field is a
// one-line change. Each dataset also has an "access_endpoints" list of
// { name, url, role } objects (role: primary, alternative or mirror).
const COL = {
  name: "name",
  archive: "data_archive",
  basis: "precipitation_basis",
  period: "period_of_record",
  cdr: "formal_cdr",
  update: "update_status",
  coverage: "spatial_coverage",
  resolution: "resolution",
  frequency: "temporal_frequency",
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
 * The data has no category field, so the data-source type and coverage
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
  return /^yes/i.test((row[COL.cdr] || "").trim());
}

// Short "start–end" label for the period-of-record tag, e.g. "1979–present".
// Start is the first year mentioned (the main record is listed first);
// the full text is in the detail panel.
function shortPeriod(text) {
  text = text || "";
  const years = (text.match(/\b(1[89]\d\d|20\d\d)\b/g) || []).map(Number);
  if (years.length === 0) return text;
  const start = years[0];
  const ongoing = /present|onward|most recent/i.test(text);
  const end = ongoing ? "present" : Math.max(...years);
  return start === end ? String(start) : `${start}–${end}`;
}

/* ---------- Rendering ---------- */

const pad3 = n => String(n).padStart(3, "0");

// Link text for an endpoint: the address without "https://" or a trailing "/".
const displayUrl = url => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

// The "Data archive(s)" value: each archive that has its own page is a
// link to it; the others stay plain text. writeStateToUrl() keeps the
// links' addresses up to date with the dashboard state.
function archiveNamesHtml(text) {
  const names = splitArchiveNames(text);
  if (names.length === 0) return "Not stated";
  return names.map(name => {
    const archive = findArchive(archives, name);
    if (!archive) return escapeHtml(name);
    return `<a class="archive-link" data-archive="${escapeHtml(archive.id)}"
         href="${escapeHtml(archiveHref(archive.id))}">${escapeHtml(name)} — about this archive</a>`;
  }).join("; ");
}

// Address of an archive page, carrying the dashboard's current state so
// its "Back to dashboard" link returns here as things were.
function archiveHref(id) {
  const back = dashboardQuery(location.search);
  return `archive.html?id=${encodeURIComponent(id)}${back ? `&${back}` : ""}`;
}

function endpointsHtml(endpoints) {
  const e = escapeHtml;
  if (!endpoints || endpoints.length === 0) return "";
  const rows = endpoints.map(ep => `
      <tr>
        <td>${e(ep.name)}</td>
        <td><a href="${e(ep.url)}" target="_blank" rel="noopener noreferrer">${e(displayUrl(ep.url))}<span class="visually-hidden"> (opens in a new tab)</span></a></td>
      </tr>`).join("");
  return `
          <div class="section-divider"></div>

          <h4 class="details-heading caps">Data access endpoints</h4>
          <table class="endpoints-table">
            <thead>
              <tr><th scope="col">Name</th><th scope="col">Link address</th></tr>
            </thead>
            <tbody>${rows}
            </tbody>
          </table>`;
}

function cardHtml(ds) {
  const r = ds.row;
  const e = escapeHtml;
  const panelId = `details-${ds.number}`;

  const metadata = METADATA_FIELDS.map(([label, col]) => `
    <div class="metadata-item">
      <dt>${e(label)}</dt>
      <dd>${col === COL.archive ? archiveNamesHtml(r[col]) : e(r[col] || "Not stated")}</dd>
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
${endpointsHtml(r.access_endpoints)}
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
  document.querySelectorAll(".archive-link").forEach(a => {
    a.href = archiveHref(a.dataset.archive);
  });
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

// Text the search box matches against: every text field, plus the
// endpoint names and addresses.
function searchTextOf(row) {
  const fields = Object.values(row).filter(v => typeof v === "string");
  const endpoints = (row.access_endpoints || []).flatMap(ep => [ep.name, ep.url]);
  return [...fields, ...endpoints].join(" ").toLowerCase();
}

async function init() {
  const list = document.getElementById("datasetList");

  let rows;
  try {
    rows = (await fetchJson(DATA_PATH)).datasets;
  } catch (err) {
    list.innerHTML = loadErrorHtml(DATA_PATH, err);
    return;
  }

  // Archive pages are extra: without archives.json the archive names
  // just show as plain text.
  try {
    archives = (await fetchJson(ARCHIVES_PATH)).archives;
  } catch {
    archives = [];
  }

  const datasets = rows.map((row, i) => ({
    number: i + 1,
    row,
    category: categoryOf(row),
    coverage: coverageOf(row),
    cdr: isFormalCDR(row),
    searchText: searchTextOf(row),
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

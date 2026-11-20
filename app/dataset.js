/* Dataset web research pages: dataset.html?id=<dataset id>[&part=<N>]
 *
 * Without "part": the summary page, one section per research part (its
 * topic, a link to its page, the question and the "Searched on" list).
 * With "part": that part's page: question, "Searched on", then the
 * answer text, with previous / next links at the bottom.
 *
 * The parts are listed in data/dataset_pages.json; their text is in
 * content/datasets/<id>/pt<N>.md and their questions in pt<N>.json, both
 * written by scripts/import_dataset_pages.py.
 *
 * The dashboard's own parameters (q, category, coverage, open) ride along
 * in the URL, so "Back to dashboard" returns to the same search and
 * filters, with this dataset's card open.
 */

const params = new URLSearchParams(location.search);
const datasetId = params.get("id") || "";
const partParam = params.get("part");
const backQuery = dashboardQuery(location.search);

const $ = id => document.getElementById(id);

// Dashboard address with this dataset's card open, scrolled to it
// (see jumpToCard in app.js).
function dashboardHref() {
  const p = new URLSearchParams(backQuery);
  const open = new Set((p.get("open") || "").split(",").filter(Boolean));
  open.add(datasetId);
  p.set("open", [...open].sort().join(","));
  return `index.html?${p}#dataset-${encodeURIComponent(datasetId)}`;
}

// Address of the summary page (no part) or of one part, keeping the
// dashboard state.
function pageHref(part) {
  const p = new URLSearchParams({ id: datasetId });
  if (part) p.set("part", String(part.part));
  return `dataset.html?${p}${backQuery ? `&${backQuery}` : ""}`;
}

const partFile = (part, ext) =>
  `content/datasets/${encodeURIComponent(datasetId)}/pt${part.part}.${ext}`;

// "GPCP Daily v3.3: Global Precipitation Climatology Project" ->
// short "GPCP Daily v3.3", full "Global Precipitation Climatology Project".
function splitName(name) {
  const i = name.indexOf(": ");
  return i < 0 ? { short: name, full: "" } : { short: name.slice(0, i), full: name.slice(i + 2) };
}

// Question and "Searched on" list. headingTag is the level of the
// "Searched on" heading, so headings stay in order on each page.
function questionsHtml(q, headingTag) {
  if (!q) return "";
  const question = q.question
    ? `<p class="research-question"><strong>Question:</strong> ${escapeHtml(q.question)}</p>`
    : "";
  const items = q.searched_on || [];
  const searched = items.length ? `
    <${headingTag} class="searched-on-heading">Searched on</${headingTag}>
    <ul class="searched-on">${items.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>` : "";
  return question + searched;
}

async function loadQuestions(part) {
  try {
    return await fetchJson(partFile(part, "json"));
  } catch {
    return null;
  }
}

/* ---------- Summary page ---------- */

async function showSummary(entry, names) {
  document.title = `${names.short}: Web research — Precipitation Workshop Datasets`;
  $("pageTitle").textContent = `${names.short}: Web research`;
  const n = entry.parts.length;
  $("pageMeta").textContent = `${n} ${n === 1 ? "PAGE" : "PAGES"} OF WEB RESEARCH`;

  const questions = await Promise.all(entry.parts.map(loadQuestions));
  const sections = entry.parts.map((part, i) => {
    const headingId = `part-${part.part}`;
    return `
    <section class="research-part" aria-labelledby="${headingId}">
      <h2 id="${headingId}">${escapeHtml(part.topic)}</h2>
      <p class="research-part-link"><a href="${escapeHtml(pageHref(part))}">Read the web research: ${escapeHtml(part.topic)}</a></p>
      ${questionsHtml(questions[i], "h3")}
    </section>`;
  }).join("");
  $("pageContent").innerHTML = `<div class="prose dataset-prose">${sections}</div>`;
}

/* ---------- One part's page ---------- */

async function showPart(entry, names, part) {
  const index = entry.parts.indexOf(part);
  document.title = `${names.short}: ${part.topic} — Precipitation Workshop Datasets`;
  $("pageTitle").textContent = `${names.short}: ${part.topic}`;
  $("kindLabel").textContent = "Precipitation workshop / Dataset web research";
  $("pageMeta").textContent = `PART ${index + 1} OF ${entry.parts.length}`;

  const panel = $("pageContent");
  panel.setAttribute("aria-busy", "true");
  let text;
  const file = partFile(part, "md");
  try {
    const res = await fetch(file, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (err) {
    panel.innerHTML = loadErrorHtml(file, err);
    panel.removeAttribute("aria-busy");
    return;
  }
  const q = await loadQuestions(part);

  const prev = entry.parts[index - 1];
  const next = entry.parts[index + 1];
  const nav = prev || next ? `
    <nav class="part-nav" aria-label="Other research pages for this dataset">
      ${prev ? `<a class="part-nav-prev" href="${escapeHtml(pageHref(prev))}"><span aria-hidden="true">←</span> ${escapeHtml(prev.topic)}</a>` : "<span></span>"}
      ${next ? `<a class="part-nav-next" href="${escapeHtml(pageHref(next))}">${escapeHtml(next.topic)} <span aria-hidden="true">→</span></a>` : ""}
    </nav>` : "";

  // renderMarkdown escapes the file's text before adding markup. The
  // answer's "##" sections become <h2>s under the page's <h1>.
  panel.innerHTML = `
    <div class="prose dataset-prose">
      <p class="summary-link"><a href="${escapeHtml(pageHref(null))}"><span aria-hidden="true">←</span> Back to ${escapeHtml(names.short)} web research</a></p>
      <div class="research-scope">${questionsHtml(q, "h2")}</div>
      <article>${renderMarkdown(text)}</article>
      ${nav}
    </div>`;
  panel.removeAttribute("aria-busy");
}

/* ---------- Start ---------- */

function notFound(message) {
  $("pageTitle").textContent = "Page not found";
  $("pageContent").innerHTML = `<p class="status-message">${message}
    Use “Back to dashboard” to return to the dataset list.</p>`;
}

async function init() {
  $("backLink").href = dashboardHref();

  let pages, datasets;
  try {
    [pages, datasets] = await Promise.all([fetchJson(DATASET_PAGES_PATH), fetchJson(DATA_PATH)]);
  } catch (err) {
    $("pageContent").innerHTML = loadErrorHtml(DATASET_PAGES_PATH, err);
    return;
  }

  const entry = pages.datasets.find(d => d.id === datasetId);
  const row = datasets.datasets.find(d => d.id === datasetId);
  if (!entry || !row) {
    notFound(`There is no web research for the dataset
      <code>${escapeHtml(datasetId || "(none given)")}</code>.`);
    return;
  }

  const names = splitName(row.name);
  $("pageSubtitle").textContent = names.full;

  if (partParam === null) {
    showSummary(entry, names);
    return;
  }
  const part = entry.parts.find(p => String(p.part) === partParam);
  if (!part) {
    notFound(`${escapeHtml(names.short)} has no research part
      <code>${escapeHtml(partParam)}</code>.`);
    return;
  }
  showPart(entry, names, part);
}

init();

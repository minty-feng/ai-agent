/* global fetch, document */
const API_BASE = window.location.origin;

// ── DOM refs ────────────────────────────────────────────────────────
const strategySelect = document.getElementById("strategy");
const queryInput = document.getElementById("query");
const minStarsInput = document.getElementById("minStars");
const languageInput = document.getElementById("language");
const minForksInput = document.getElementById("minForks");
const createdAfterInput = document.getElementById("createdAfter");
const pushedAfterInput = document.getElementById("pushedAfter");
const sortBySelect = document.getElementById("sortBy");
const sortOrderSelect = document.getElementById("sortOrder");
const starsGroup = document.getElementById("starsGroup");
const languageGroup = document.getElementById("languageGroup");
const advancedGroup = document.getElementById("advancedGroup");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const totalCountSpan = document.getElementById("totalCount");
const repoTableBody = document.getElementById("repoTableBody");

const perPageSelect = document.getElementById("perPage");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageInfo = document.getElementById("pageInfo");

const storageDirInput = document.getElementById("storageDir");
const githubTokenInput = document.getElementById("githubToken");
const saveConfigBtn = document.getElementById("saveConfigBtn");
const configStatus = document.getElementById("configStatus");
const separatorInput = document.getElementById("separator");
const replaceSlashInput = document.getElementById("replaceSlash");
const replaceDashInput = document.getElementById("replaceDash");
const connectionUrlInput = document.getElementById("connectionUrl");
const esUrlInput = document.getElementById("esUrl");
const indexNameInput = document.getElementById("indexName");

const fetchStatusDiv = document.getElementById("fetchStatus");
const fetchOutput = document.getElementById("fetchOutput");
const closeFetchBtn = document.getElementById("closeFetch");

const settingsToggle = document.getElementById("settingsToggle");
const settingsDrawer = document.getElementById("settingsDrawer");
const settingsClose = document.getElementById("settingsClose");
const drawerBackdrop = document.getElementById("drawerBackdrop");

const storageRadios = document.querySelectorAll('input[name="storageType"]');
const localOptions = document.getElementById("localOptions");
const sqlOptions = document.getElementById("sqlOptions");
const esOptions = document.getElementById("esOptions");

// ── State ───────────────────────────────────────────────────────────
let lastSearchTotal = 0;
let currentPage = 1;
const MAX_DISPLAYED_TOPICS = 3;

// ── Settings drawer ─────────────────────────────────────────────────
function openDrawer() {
  settingsDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
}

function closeDrawer() {
  settingsDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
}

settingsToggle.addEventListener("click", openDrawer);
settingsClose.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

// ── Storage type switching ──────────────────────────────────────────
storageRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    localOptions.style.display = radio.value === "local" ? "" : "none";
    sqlOptions.style.display = radio.value === "sql" ? "" : "none";
    esOptions.style.display = radio.value === "elasticsearch" ? "" : "none";
  });
});

// ── Strategy-dependent UI ───────────────────────────────────────────
const QUERY_PLACEHOLDERS = {
  repo_name: "输入仓库名关键词…",
  stars: "输入搜索关键词…",
  language: "输入搜索关键词…",
  topic: "输入 Topic 名称（如 machine-learning）…",
  advanced: "输入关键词（可选）…",
  by_org: "输入组织或用户名（如 microsoft）…",
};

strategySelect.addEventListener("change", () => {
  const v = strategySelect.value;
  starsGroup.style.display = (v === "stars" || v === "advanced") ? "" : "none";
  languageGroup.style.display = (v === "language" || v === "advanced") ? "" : "none";
  advancedGroup.style.display = (v === "advanced" || v === "by_org") ? "" : "none";
  queryInput.placeholder = QUERY_PLACEHOLDERS[v] || "输入搜索关键词…";
});

// ── Load config on start ────────────────────────────────────────────
(async function loadConfig() {
  try {
    const resp = await fetch(`${API_BASE}/api/config`);
    if (!resp.ok) return;
    const data = await resp.json();
    storageDirInput.value = data.storage_dir || "";
    separatorInput.value = data.separator || "_";
    replaceSlashInput.checked = data.replace_slash !== false;
    replaceDashInput.checked = data.replace_dash !== false;
    connectionUrlInput.value = data.connection_url || "";
    esUrlInput.value = data.es_url || "";
    indexNameInput.value = data.index_name || "";

    // Set storage type radio
    const st = data.storage_type || "local";
    const radio = document.querySelector(
      `input[name="storageType"][value="${st}"]`
    );
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
    }
  } catch {
    /* ignore – backend may not be running yet */
  }
})();

// ── Save config ─────────────────────────────────────────────────────
saveConfigBtn.addEventListener("click", async () => {
  const selectedType = document.querySelector(
    'input[name="storageType"]:checked'
  ).value;

  const body = {
    storage_type: selectedType,
    replace_slash: replaceSlashInput.checked,
    replace_dash: replaceDashInput.checked,
    separator: separatorInput.value || "_",
  };
  if (storageDirInput.value) body.storage_dir = storageDirInput.value;
  if (githubTokenInput.value) body.github_token = githubTokenInput.value;
  if (connectionUrlInput.value) body.connection_url = connectionUrlInput.value;
  if (esUrlInput.value) body.es_url = esUrlInput.value;
  if (indexNameInput.value) body.index_name = indexNameInput.value;

  try {
    const resp = await fetch(`${API_BASE}/api/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      configStatus.textContent = "✅ 设置已保存";
      setTimeout(() => (configStatus.textContent = ""), 3000);
    }
  } catch (err) {
    configStatus.textContent = "❌ " + err.message;
  }
});

// ── Close fetch panel ───────────────────────────────────────────────
closeFetchBtn.addEventListener("click", () => {
  fetchStatusDiv.style.display = "none";
});

// ── Search repos ────────────────────────────────────────────────────
async function doSearch(resetPage = true) {
  if (resetPage) currentPage = 1;
  const payload = {
    strategy: strategySelect.value,
    query: queryInput.value.trim(),
    min_stars: parseInt(minStarsInput.value, 10) || 0,
    language: languageInput.value.trim() || "",
    min_forks: parseInt(minForksInput.value, 10) || 0,
    created_after: createdAfterInput.value || "",
    pushed_after: pushedAfterInput.value || "",
    sort_by: sortBySelect.value,
    sort_order: sortOrderSelect.value,
    per_page: parseInt(perPageSelect.value, 10) || 10,
    page: currentPage,
  };

  if (!payload.query && payload.strategy !== "advanced") {
    queryInput.focus();
    return;
  }

  searchBtn.disabled = true;
  searchBtn.classList.add("loading");
  searchBtn.innerHTML = "搜索中";

  try {
    const resp = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const data = await resp.json();
    lastSearchTotal = data.total_count;
    renderResults(data);
    updatePagination(currentPage, payload.per_page, data.total_count);
  } catch (err) {
    alert("搜索失败: " + err.message);
  } finally {
    searchBtn.disabled = false;
    searchBtn.classList.remove("loading");
    searchBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> 搜索';
  }
}

searchBtn.addEventListener("click", doSearch);

// Enter key triggers search
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") doSearch();
});

// ── Pagination ──────────────────────────────────────────────────────
function updatePagination(page, perPage, total) {
  const totalPages = Math.ceil(total / perPage) || 1;
  pageInfo.textContent = `第 ${page} / ${totalPages} 页`;
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= totalPages;
}

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    doSearch(false);
  }
});

nextPageBtn.addEventListener("click", () => {
  const perPage = parseInt(perPageSelect.value, 10) || 10;
  const totalPages = Math.ceil(lastSearchTotal / perPage) || 1;
  if (currentPage < totalPages) {
    currentPage += 1;
    doSearch(false);
  }
});

perPageSelect.addEventListener("change", () => {
  if (lastSearchTotal > 0) doSearch(true);
});

// ── Render results ──────────────────────────────────────────────────
function renderTopics(repo) {
  const topics = repo.topics || [];
  if (topics.length > 0) {
    return topics.slice(0, MAX_DISPLAYED_TOPICS).map(t => `<span class="topic-badge">${escapeHtml(t)}</span>`).join("");
  }
  // fallback: first N words of description
  const desc = (repo.description || "").trim();
  if (!desc) return '<span class="text-muted">—</span>';
  const words = desc.split(/\s+/).slice(0, MAX_DISPLAYED_TOPICS);
  return words.map(w => `<span class="topic-badge topic-badge--muted">${escapeHtml(w)}</span>`).join("");
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  return isoStr.slice(0, 10);
}

function renderResults(data) {
  totalCountSpan.textContent = `共 ${data.total_count.toLocaleString()} 个`;
  repoTableBody.innerHTML = "";

  for (const repo of data.repos) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${escapeHtml(repo.url)}" target="_blank" rel="noopener">${escapeHtml(repo.full_name)}</a></td>
      <td><div class="topic-list">${renderTopics(repo)}</div></td>
      <td class="col-created">${formatDate(repo.created_at)}</td>
      <td><span class="star-count">${repo.stars.toLocaleString()}</span></td>
      <td>${repo.language ? `<span class="lang-badge">${escapeHtml(repo.language)}</span>` : "—"}</td>
      <td>
        <button class="btn btn-fetch"
                data-owner="${escapeAttr(repo.owner)}"
                data-repo="${escapeAttr(repo.name)}">
          📥 获取
        </button>
      </td>`;
    repoTableBody.appendChild(tr);
  }

  resultsDiv.style.display = "";

  // attach fetch handlers
  repoTableBody.querySelectorAll(".btn-fetch").forEach((btn) => {
    btn.addEventListener("click", () =>
      fetchMarkdown(btn.dataset.owner, btn.dataset.repo, btn)
    );
  });
}

// ── Fetch markdown files ────────────────────────────────────────────
async function fetchMarkdown(owner, repo, btn) {
  btn.disabled = true;
  btn.textContent = "下载中…";
  fetchStatusDiv.style.display = "";
  fetchOutput.textContent = `正在获取 ${owner}/${repo} 的 Markdown 文件…\n`;

  try {
    const resp = await fetch(`${API_BASE}/api/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owner, repo }),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const data = await resp.json();
    fetchOutput.textContent =
      `✅ ${owner}/${repo} — 共保存 ${data.files_saved} 个文件 (${data.storage_type})\n\n` +
      data.paths.join("\n");
  } catch (err) {
    fetchOutput.textContent = "❌ 下载失败: " + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "📥 获取";
  }
}

// ── Helpers ──────────────────────────────────────────────────────────
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

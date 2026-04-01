/* global fetch, document */
const API_BASE = window.location.origin;

// ── DOM refs ────────────────────────────────────────────────────────
const strategySelect = document.getElementById("strategy");
const queryInput = document.getElementById("query");
const minStarsInput = document.getElementById("minStars");
const languageInput = document.getElementById("language");
const starsGroup = document.getElementById("starsGroup");
const languageGroup = document.getElementById("languageGroup");
const searchBtn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const totalCountSpan = document.getElementById("totalCount");
const repoTableBody = document.getElementById("repoTableBody");

const storageDirInput = document.getElementById("storageDir");
const githubTokenInput = document.getElementById("githubToken");
const saveConfigBtn = document.getElementById("saveConfigBtn");
const configStatus = document.getElementById("configStatus");

const fetchStatusDiv = document.getElementById("fetchStatus");
const fetchOutput = document.getElementById("fetchOutput");

// ── Strategy-dependent UI ───────────────────────────────────────────
strategySelect.addEventListener("change", () => {
  const v = strategySelect.value;
  starsGroup.style.display = v === "stars" ? "" : "none";
  languageGroup.style.display = v === "language" ? "" : "none";
});

// ── Load config on start ────────────────────────────────────────────
(async function loadConfig() {
  try {
    const resp = await fetch(`${API_BASE}/api/config`);
    if (!resp.ok) return;
    const data = await resp.json();
    storageDirInput.value = data.storage_dir || "";
  } catch {
    /* ignore – backend may not be running yet */
  }
})();

// ── Save config ─────────────────────────────────────────────────────
saveConfigBtn.addEventListener("click", async () => {
  const body = {};
  if (storageDirInput.value) body.storage_dir = storageDirInput.value;
  if (githubTokenInput.value) body.github_token = githubTokenInput.value;

  try {
    const resp = await fetch(`${API_BASE}/api/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      configStatus.textContent = "✅ 已保存";
      setTimeout(() => (configStatus.textContent = ""), 3000);
    }
  } catch (err) {
    configStatus.textContent = "❌ " + err.message;
  }
});

// ── Search repos ────────────────────────────────────────────────────
searchBtn.addEventListener("click", async () => {
  const payload = {
    strategy: strategySelect.value,
    query: queryInput.value.trim(),
    min_stars: parseInt(minStarsInput.value, 10) || 100,
    language: languageInput.value.trim() || "Python",
  };

  if (!payload.query) {
    alert("请输入搜索关键词");
    return;
  }

  searchBtn.disabled = true;
  searchBtn.textContent = "搜索中…";

  try {
    const resp = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const data = await resp.json();
    renderResults(data);
  } catch (err) {
    alert("搜索失败: " + err.message);
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = "🔍 搜索";
  }
});

function renderResults(data) {
  totalCountSpan.textContent = `共 ${data.total_count} 个`;
  repoTableBody.innerHTML = "";

  for (const repo of data.repos) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><a href="${repo.url}" target="_blank">${repo.full_name}</a></td>
      <td>${repo.description || "—"}</td>
      <td>${repo.stars.toLocaleString()}</td>
      <td>${repo.language || "—"}</td>
      <td>
        <button class="btn btn-fetch"
                data-owner="${repo.owner}"
                data-repo="${repo.name}">
          📥 获取 MD
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
      `✅ ${owner}/${repo} — 共保存 ${data.files_saved} 个 Markdown 文件\n\n` +
      data.paths.join("\n");
  } catch (err) {
    fetchOutput.textContent = "❌ 下载失败: " + err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "📥 获取 MD";
  }
}

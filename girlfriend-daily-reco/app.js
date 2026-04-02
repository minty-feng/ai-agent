const TREND_ITEMS = [
  {
    name: "薄款西装外套（廓形）",
    reason: "通勤与休闲都好搭，春夏叠穿利用率高",
    link: "https://s.taobao.com/search?q=%E8%96%84%E6%AC%BE%E8%A5%BF%E8%A3%85%E5%A4%96%E5%A5%97+%E5%A5%B3",
  },
  {
    name: "轻薄针织开衫",
    reason: "空调房和昼夜温差场景非常实用",
    link: "https://s.taobao.com/search?q=%E8%BD%BB%E8%96%84%E9%92%88%E7%BB%87%E5%BC%80%E8%A1%AB+%E5%A5%B3",
  },
  {
    name: "直筒高腰牛仔裤",
    reason: "显腿长，几乎可搭配任意上衣",
    link: "https://search.jd.com/Search?keyword=%E5%A5%B3%E7%9B%B4%E7%AD%92%E9%AB%98%E8%85%B0%E7%89%9B%E4%BB%94%E8%A3%A4",
  },
  {
    name: "低跟玛丽珍鞋",
    reason: "约会通勤都可穿，舒适又精致",
    link: "https://s.taobao.com/search?q=%E4%BD%8E%E8%B7%9F%E7%8E%9B%E4%B8%BD%E7%8F%8D%E9%9E%8B",
  },
  {
    name: "托特包（大容量）",
    reason: "日常通勤必备，风格百搭",
    link: "https://search.jd.com/Search?keyword=%E5%A5%B3+%E6%89%98%E7%89%B9%E5%8C%85+%E5%A4%A7%E5%AE%B9%E9%87%8F",
  },
];

const HOT_MEAL_SUGGESTIONS = [
  "酸汤肥牛米线（雨天治愈）",
  "照烧鸡腿饭（高蛋白不油腻）",
  "潮汕牛肉粿条汤（暖胃鲜香）",
  "韩式石锅拌饭（蔬菜丰富，满足感强）",
  "虾仁滑蛋荞麦面（轻负担）",
];

const $ = (id) => document.getElementById(id);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const API_BASE = "/api";
const BUDGET_LABELS = { all: "不限", budget: "平价", mid: "中档" };
const WEATHER_LABELS = {
  sunny: "晴天",
  cloudy: "多云",
  rainy: "雨天",
  cold: "降温/冷天",
  hot: "炎热",
};
const MOOD_LABELS = {
  happy: "开心",
  calm: "平静",
  tired: "疲惫",
  romantic: "浪漫",
  focused: "专注上班",
};
const OCCASION_LABELS = {
  work: "上班/通勤",
  date: "约会",
  casual: "休闲逛街",
  home: "宅家",
};
const DIET_LABELS = {
  all: "都可以",
  light: "清淡低负担",
  comfort: "治愈系",
  spicy: "想吃辣",
  protein: "高蛋白",
};
const TOMORROW_MOOD_FALLBACK = {
  happy: "calm",
  calm: "happy",
  tired: "focused",
  romantic: "happy",
  focused: "calm",
};

const store = {
  outfits: [],
  meals: [],
  history: [],
};

const appState = {
  latestPlan: null,
  editingOutfitId: null,
  editingMealId: null,
  shareLink: "",
  shareToken: "",
  isModalOpen: false,
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleString();
}

function updateStatusNode(node, text, type = "neutral") {
  if (!node) return;
  node.textContent = text;
  node.classList.remove("ok", "error", "neutral");
  node.classList.add(type || "neutral");
}

function updateBackendStatus(text, type = "neutral") {
  updateStatusNode($("backendStatus"), text, type);
}

function updateWeatherStatus(text, type = "neutral") {
  updateStatusNode($("weatherStatus"), text, type);
}

function updateEmailStatus(text, type = "neutral") {
  updateStatusNode($("emailStatus"), text, type);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json();
}

function sanitizeFilenamePart(value) {
  return String(value || "plan")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCheckedValues(name) {
  return $$(`input[name="${name}"]:checked`).map((input) => input.value);
}

function setCheckedValues(name, values = []) {
  const selected = new Set(values);
  $$(`input[name="${name}"]`).forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function buildTagRow(tags, labels) {
  if (!tags?.length) {
    return '<span class="tag muted">暂无</span>';
  }
  return tags
    .map((tag) => `<span class="tag">${escapeHtml(labels[tag] || tag)}</span>`)
    .join("");
}

function renderOverviewCounts() {
  $("outfitCount").textContent = String(store.outfits.length);
  $("mealCount").textContent = String(store.meals.length);
  $("historyCount").textContent = String(store.history.length);
}

function renderDataLists() {
  $("outfitList").innerHTML =
    store.outfits
      .map(
        (item) => `
          <li class="library-item">
            <div class="library-head">
              <div>
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.style || "未填写风格")} · ${escapeHtml(
          BUDGET_LABELS[item.budget] || "不限"
        )}</p>
              </div>
              <div class="item-actions">
                <button class="btn small ghost" type="button" data-action="edit-outfit" data-id="${
                  item.id
                }">编辑</button>
                <button class="btn small danger" type="button" data-action="delete-outfit" data-id="${
                  item.id
                }">删除</button>
              </div>
            </div>
            <div class="tag-block">
              <span class="tag-label">天气</span>
              <div class="tag-list">${buildTagRow(item.weather, WEATHER_LABELS)}</div>
            </div>
            <div class="tag-block">
              <span class="tag-label">心情</span>
              <div class="tag-list">${buildTagRow(item.moods, MOOD_LABELS)}</div>
            </div>
            <div class="tag-block">
              <span class="tag-label">场景</span>
              <div class="tag-list">${buildTagRow(item.occasions, OCCASION_LABELS)}</div>
            </div>
            ${
              item.link
                ? `<a class="item-link" href="${escapeHtml(
                    item.link
                  )}" target="_blank" rel="noopener noreferrer">查看参考链接</a>`
                : ""
            }
          </li>`
      )
      .join("") ||
    '<li class="empty-state-card">还没有穿搭素材，先新增几套喜欢的搭配吧。</li>';

  $("mealList").innerHTML =
    store.meals
      .map(
        (item) => `
          <li class="library-item">
            <div class="library-head">
              <div>
                <h4>${escapeHtml(item.name)}</h4>
                <p>${escapeHtml(item.flavor || "未填写口味")} · ${escapeHtml(
          BUDGET_LABELS[item.budget] || "不限"
        )}</p>
              </div>
              <div class="item-actions">
                <button class="btn small ghost" type="button" data-action="edit-meal" data-id="${
                  item.id
                }">编辑</button>
                <button class="btn small danger" type="button" data-action="delete-meal" data-id="${
                  item.id
                }">删除</button>
              </div>
            </div>
            <div class="tag-block">
              <span class="tag-label">天气</span>
              <div class="tag-list">${buildTagRow(item.weather, WEATHER_LABELS)}</div>
            </div>
            <div class="tag-block">
              <span class="tag-label">心情</span>
              <div class="tag-list">${buildTagRow(item.moods, MOOD_LABELS)}</div>
            </div>
            <div class="tag-block">
              <span class="tag-label">饮食</span>
              <div class="tag-list">${buildTagRow(item.diets, DIET_LABELS)}</div>
            </div>
            ${
              item.link
                ? `<a class="item-link" href="${escapeHtml(
                    item.link
                  )}" target="_blank" rel="noopener noreferrer">查看店铺 / 参考链接</a>`
                : ""
            }
          </li>`
      )
      .join("") ||
    '<li class="empty-state-card">还没有菜品素材，先录入几道她会喜欢的选择吧。</li>';

  $("trendList").innerHTML = TREND_ITEMS.map(
    (item) => `
      <li class="trend-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <p>${escapeHtml(item.reason)}</p>
        </div>
        <a class="item-link" href="${escapeHtml(
          item.link
        )}" target="_blank" rel="noopener noreferrer">去看看</a>
      </li>`
  ).join("");

  renderOverviewCounts();
}

function historyToPlan(entry) {
  return normalizePlanData({
    planLabel: entry.plan_label,
    condition: entry.condition,
    topOutfits: entry.top_outfits,
    topMeals: entry.top_meals,
    hotMealsPool: entry.hot_meals,
    createdAt: entry.created_at,
  });
}

function renderHistoryList() {
  $("historyList").innerHTML =
    store.history
      .map(
        (entry) => `
          <li class="history-entry">
            <div>
              <strong>${escapeHtml(entry.plan_label)}</strong>
              <p>${escapeHtml(
                `${WEATHER_LABELS[entry.condition?.weather] || "未知天气"} · ${formatDate(
                  entry.created_at
                )}`
              )}</p>
            </div>
            <button class="btn small ghost" type="button" data-action="view-history" data-id="${
              entry.id
            }">查看</button>
          </li>`
      )
      .join("") || '<li class="empty-state-card">生成推荐后，这里会沉淀你的历史计划。</li>';

  renderOverviewCounts();
}

function syncRecommendationButtons() {
  const disabled = !appState.latestPlan;
  $$("[data-open-recommendation]").forEach((button) => {
    button.disabled = disabled;
  });
}

function setActiveStudioTab(tabName) {
  $$("[data-tab-trigger]").forEach((button) => {
    const active = button.dataset.tabTrigger === tabName;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("outfitPanel").classList.toggle("hidden", tabName !== "outfit");
  $("mealPanel").classList.toggle("hidden", tabName !== "meal");
}

function resetOutfitFormEditing() {
  appState.editingOutfitId = null;
  $("outfitSubmitBtn").textContent = "添加到穿搭素材库";
  $("outfitCancelEditBtn").classList.add("hidden");
}

function resetMealFormEditing() {
  appState.editingMealId = null;
  $("mealSubmitBtn").textContent = "添加到菜品素材库";
  $("mealCancelEditBtn").classList.add("hidden");
}

function getConditionFromUI() {
  return {
    weather: $("weather").value,
    mood: $("mood").value,
    occasion: $("occasion").value,
    diet: $("diet").value,
    budget: $("budget").value,
  };
}

function buildTomorrowCondition(base) {
  const rotatedOccasion = {
    work: "casual",
    casual: "date",
    date: "work",
    home: "work",
  };
  return {
    ...base,
    mood: TOMORROW_MOOD_FALLBACK[base.mood] || "calm",
    occasion: rotatedOccasion[base.occasion] || "casual",
  };
}

function scoreOutfit(outfit, condition) {
  let score = 0;
  if (outfit.weather.includes(condition.weather)) score += 3;
  if (outfit.moods.includes(condition.mood)) score += 3;
  if (outfit.occasions.includes(condition.occasion)) score += 2;
  if (condition.budget === "all" || outfit.budget === condition.budget) score += 2;
  return score;
}

function scoreMeal(meal, condition) {
  let score = 0;
  if (meal.weather.includes(condition.weather)) score += 3;
  if (meal.moods.includes(condition.mood)) score += 2;
  if (condition.diet === "all" || meal.diets.includes(condition.diet)) score += 3;
  if (condition.budget === "all" || meal.budget === condition.budget) score += 2;
  return score;
}

function pickTop(items, scorer, condition) {
  return [...items]
    .map((item) => ({ item, score: scorer(item, condition) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function pickHotMealsByBudget(budget) {
  if (budget === "budget") {
    return [
      "番茄鸡蛋盖饭（平价又下饭）",
      "麻辣拌（加蔬菜版，性价比高）",
      "牛肉汤面（暖胃且预算友好）",
    ];
  }
  if (budget === "mid") {
    return [
      "日式鳗鱼饭（满足感强）",
      "低温鸡胸凯撒沙拉（轻负担）",
      "海鲜奶油意面（约会感拉满）",
    ];
  }
  return HOT_MEAL_SUGGESTIONS;
}

function normalizeRankedItems(items, type) {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      if (!entry) return null;
      const nested = entry.item || entry;
      if (!nested?.name) return null;
      return {
        score: Number(entry.score || 0),
        item: {
          name: String(nested.name || ""),
          style: type === "outfit" ? String(nested.style || "") : undefined,
          flavor: type === "meal" ? String(nested.flavor || "") : undefined,
          weather: Array.isArray(nested.weather) ? nested.weather : [],
          moods: Array.isArray(nested.moods) ? nested.moods : [],
          occasions: Array.isArray(nested.occasions) ? nested.occasions : [],
          diets: Array.isArray(nested.diets) ? nested.diets : [],
          budget: String(nested.budget || "budget"),
          link: String(nested.link || ""),
        },
      };
    })
    .filter(Boolean);
}

function normalizePlanData(rawPlan) {
  const condition = rawPlan?.condition || {};
  return {
    planLabel: String(rawPlan?.planLabel || rawPlan?.plan_label || "今日推荐"),
    condition: {
      weather: condition.weather || "sunny",
      mood: condition.mood || "happy",
      occasion: condition.occasion || "casual",
      diet: condition.diet || "all",
      budget: condition.budget || "all",
    },
    topOutfits: normalizeRankedItems(rawPlan?.topOutfits || rawPlan?.top_outfits, "outfit"),
    topMeals: normalizeRankedItems(rawPlan?.topMeals || rawPlan?.top_meals, "meal"),
    hotMealsPool: Array.isArray(rawPlan?.hotMealsPool || rawPlan?.hot_meals)
      ? (rawPlan.hotMealsPool || rawPlan.hot_meals).map((item) => String(item))
      : [],
    createdAt: rawPlan?.createdAt || rawPlan?.created_at || new Date().toISOString(),
  };
}

function getPlanData(condition, planLabel) {
  const current = condition || getConditionFromUI();
  return normalizePlanData({
    planLabel: planLabel || "今日推荐",
    condition: current,
    topOutfits: pickTop(store.outfits, scoreOutfit, current),
    topMeals: pickTop(store.meals, scoreMeal, current),
    hotMealsPool: pickHotMealsByBudget(current.budget),
    createdAt: new Date().toISOString(),
  });
}

function buildPlanMetaLabels(plan) {
  return [
    `天气 · ${WEATHER_LABELS[plan.condition.weather] || "未设置"}`,
    `心情 · ${MOOD_LABELS[plan.condition.mood] || "未设置"}`,
    `场景 · ${OCCASION_LABELS[plan.condition.occasion] || "未设置"}`,
    `饮食 · ${DIET_LABELS[plan.condition.diet] || "未设置"}`,
    `预算 · ${BUDGET_LABELS[plan.condition.budget] || "未设置"}`,
  ];
}

function buildPlanSummary(plan) {
  return `根据${WEATHER_LABELS[plan.condition.weather] || "当前天气"}、${
    MOOD_LABELS[plan.condition.mood] || "当前心情"
  }和${OCCASION_LABELS[plan.condition.occasion] || "当前场景"}生成的高优先级推荐。`;
}

function buildBadgesHtml(labels) {
  return labels.map((label) => `<span class="meta-pill">${escapeHtml(label)}</span>`).join("");
}

function buildPreviewContent(entry, type) {
  if (!entry) {
    return '<div class="empty-preview">暂无匹配内容，先补充素材库会更准确。</div>';
  }
  const descriptor =
    type === "outfit" ? entry.item.style || "风格未填写" : entry.item.flavor || "口味未填写";
  return `
    <strong>${escapeHtml(entry.item.name)}</strong>
    <p>${escapeHtml(descriptor)}</p>
    <span>匹配分 ${escapeHtml(String(entry.score))} · ${escapeHtml(
      BUDGET_LABELS[entry.item.budget] || "不限"
    )}</span>
  `;
}

function buildResultCard(entry, index, type) {
  const descriptor =
    type === "outfit" ? entry.item.style || "风格未填写" : entry.item.flavor || "口味未填写";
  const tags =
    type === "outfit"
      ? buildTagRow(entry.item.occasions, OCCASION_LABELS)
      : buildTagRow(entry.item.diets, DIET_LABELS);

  return `
    <article class="result-card-item">
      <div class="result-rank">TOP ${index + 1}</div>
      <div class="result-content">
        <h4>${escapeHtml(entry.item.name)}</h4>
        <p>${escapeHtml(descriptor)}</p>
        <div class="result-meta">
          <span>匹配分 ${escapeHtml(String(entry.score))}</span>
          <span>${escapeHtml(BUDGET_LABELS[entry.item.budget] || "不限")}</span>
        </div>
        <div class="tag-list">${tags}</div>
        ${
          entry.item.link
            ? `<a class="item-link" href="${escapeHtml(
                entry.item.link
              )}" target="_blank" rel="noopener noreferrer">${
                type === "outfit" ? "购买 / 参考链接" : "店铺 / 参考链接"
              }</a>`
            : ""
        }
      </div>
    </article>
  `;
}

function buildHotMealCard(plan) {
  const extras = plan.hotMealsPool.slice(0, 3);
  if (!extras.length) {
    return `
      <article class="result-card-item result-card-soft">
        <div class="result-content">
          <h4>额外灵感</h4>
          <p>当前没有可展示的额外菜品推荐。</p>
        </div>
      </article>
    `;
  }
  return `
    <article class="result-card-item result-card-soft">
      <div class="result-content">
        <h4>额外热门菜品</h4>
        <ul class="extra-list">
          ${extras.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    </article>
  `;
}

function buildPlanText(plan) {
  const outfitLines = plan.topOutfits
    .map(
      ({ item, score }, idx) =>
        `${idx + 1}. ${item.name}（${item.style || "风格未填写"}，匹配分 ${score}，${
          BUDGET_LABELS[item.budget] || "不限"
        }）${item.link ? `\n   链接：${item.link}` : ""}`
    )
    .join("\n");

  const mealLines = plan.topMeals
    .map(
      ({ item, score }, idx) =>
        `${idx + 1}. ${item.name}（${item.flavor || "口味未填写"}，匹配分 ${score}，${
          BUDGET_LABELS[item.budget] || "不限"
        }）${item.link ? `\n   链接：${item.link}` : ""}`
    )
    .join("\n");

  const extras = plan.hotMealsPool.slice(0, 3).map((item) => `- ${item}`).join("\n");

  return [
    `【${plan.planLabel}】`,
    `天气：${WEATHER_LABELS[plan.condition.weather]}`,
    `心情：${MOOD_LABELS[plan.condition.mood]}`,
    `场景：${OCCASION_LABELS[plan.condition.occasion]}`,
    `饮食：${DIET_LABELS[plan.condition.diet]}`,
    `预算：${BUDGET_LABELS[plan.condition.budget]}`,
    "",
    "【穿搭推荐】",
    outfitLines || "- 暂无匹配内容",
    "",
    "【美食推荐】",
    mealLines || "- 暂无匹配内容",
    "",
    "【额外热门菜品】",
    extras || "- 暂无额外推荐",
    "",
    `生成时间：${formatDate(plan.createdAt)}`,
  ].join("\n");
}

function buildPlanHtml(plan) {
  const outfitLines = plan.topOutfits
    .map(
      ({ item, score }, idx) =>
        `<li>${idx + 1}. ${escapeHtml(item.name)}（${escapeHtml(
          item.style || "风格未填写"
        )}，匹配分 ${score}，${escapeHtml(
          BUDGET_LABELS[item.budget] || "不限"
        )}）${
          item.link
            ? ` <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">链接</a>`
            : ""
        }</li>`
    )
    .join("");

  const mealLines = plan.topMeals
    .map(
      ({ item, score }, idx) =>
        `<li>${idx + 1}. ${escapeHtml(item.name)}（${escapeHtml(
          item.flavor || "口味未填写"
        )}，匹配分 ${score}，${escapeHtml(
          BUDGET_LABELS[item.budget] || "不限"
        )}）${
          item.link
            ? ` <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">链接</a>`
            : ""
        }</li>`
    )
    .join("");

  return `
    <h3>${escapeHtml(plan.planLabel)}</h3>
    <p>${escapeHtml(buildPlanSummary(plan))}</p>
    <p>${escapeHtml(buildPlanMetaLabels(plan).join(" · "))}</p>
    <h4>穿搭推荐</h4>
    <ol>${outfitLines || "<li>暂无匹配内容</li>"}</ol>
    <h4>美食推荐</h4>
    <ol>${mealLines || "<li>暂无匹配内容</li>"}</ol>
    <h4>额外热门菜品</h4>
    <ul>${plan.hotMealsPool.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <p>生成时间：${escapeHtml(formatDate(plan.createdAt))}</p>
  `;
}

function clearShareLink() {
  appState.shareLink = "";
  appState.shareToken = "";
  $("shareLinkInput").value = "";
  $("openShareLinkBtn").disabled = true;
}

function renderPlanPreview(plan) {
  $("datePlanTitle").textContent = plan.planLabel;
  $("planSummary").textContent = buildPlanSummary(plan);
  $("conditionPills").innerHTML = buildBadgesHtml(buildPlanMetaLabels(plan));
  $("previewOutfit").innerHTML = buildPreviewContent(plan.topOutfits[0], "outfit");
  $("previewMeal").innerHTML = buildPreviewContent(plan.topMeals[0], "meal");
}

function renderPlanModal(plan) {
  $("modalTitle").textContent = plan.planLabel;
  $("modalSummary").textContent = buildPlanSummary(plan);
  $("modalMeta").innerHTML = buildBadgesHtml(buildPlanMetaLabels(plan));

  $("outfitResult").innerHTML =
    plan.topOutfits.map((entry, index) => buildResultCard(entry, index, "outfit")).join("") ||
    '<div class="empty-state-card">暂无匹配穿搭，请新增更多风格素材。</div>';

  $("mealResult").innerHTML = `
    ${
      plan.topMeals.map((entry, index) => buildResultCard(entry, index, "meal")).join("") ||
      '<div class="empty-state-card">暂无匹配菜品，请新增更多饮食素材。</div>'
    }
    ${buildHotMealCard(plan)}
  `;
}

function openRecommendationModal() {
  if (!appState.latestPlan) return;
  $("recommendationModal").classList.remove("hidden");
  $("recommendationModal").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  appState.isModalOpen = true;
}

function closeRecommendationModal() {
  $("recommendationModal").classList.add("hidden");
  $("recommendationModal").setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  appState.isModalOpen = false;
}

async function persistPlanHistory(planData) {
  try {
    const saved = await apiRequest("/history", {
      method: "POST",
      body: JSON.stringify({
        plan_label: planData.planLabel,
        condition: planData.condition,
        top_outfits: planData.topOutfits,
        top_meals: planData.topMeals,
        hot_meals: planData.hotMealsPool.slice(0, 3),
        created_at: planData.createdAt,
      }),
    });
    store.history.unshift(saved);
    store.history = store.history.slice(0, 30);
    renderHistoryList();
  } catch (error) {
    updateBackendStatus("推荐已生成，但保存历史记录失败。", "error");
  }
}

async function renderPlanUI(planData, options = {}) {
  const plan = normalizePlanData(planData);
  appState.latestPlan = plan;

  $("resultEmpty").classList.add("hidden");
  $("resultWrap").classList.remove("hidden");

  clearShareLink();
  renderPlanPreview(plan);
  renderPlanModal(plan);
  syncRecommendationButtons();

  if (!$("emailSubject").value.trim()) {
    $("emailSubject").value = `给你准备的${plan.planLabel}：穿搭 + 美食`;
  }

  if (options.openModal) {
    openRecommendationModal();
  }

  if (options.source === "shared") {
    updateEmailStatus("已从访问链接恢复推荐，可直接查看、导出、发邮件或下载图片。", "ok");
  } else {
    updateEmailStatus("已生成推荐：可在弹窗中发送邮件、生成可访问链接或下载高清图片。", "ok");
  }

  if (options.persistHistory) {
    await persistPlanHistory(plan);
  }
}

async function renderRecommendation(condition, planLabel) {
  const current = condition || getConditionFromUI();
  await renderPlanUI(getPlanData(current, planLabel), {
    openModal: true,
    persistHistory: true,
    source: "generated",
  });
}

async function copyTextContent(content, successMessage, errorMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    updateEmailStatus(successMessage, "ok");
  } catch (error) {
    updateEmailStatus(errorMessage, "error");
  }
}

async function copyPlanText() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成今日推荐或明日计划，再复制。", "error");
    return;
  }
  await copyTextContent(
    buildPlanText(appState.latestPlan),
    "推荐文案已复制，可直接粘贴发送。",
    "复制失败，请改用导出功能获取文案文件。"
  );
}

function exportPlan() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成今日推荐或明日计划，再导出。", "error");
    return;
  }
  const blob = new Blob([buildPlanText(appState.latestPlan)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${appState.latestPlan.planLabel}-${date}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateEmailStatus("推荐文案已导出，可直接转发给她。", "ok");
}

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function buildShareUrl(plan) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set(
    "share",
    encodeBase64Url(
      JSON.stringify({
        planLabel: plan.planLabel,
        condition: plan.condition,
        topOutfits: plan.topOutfits,
        topMeals: plan.topMeals,
        hotMealsPool: plan.hotMealsPool.slice(0, 3),
        createdAt: plan.createdAt,
      })
    )
  );
  return url.toString();
}

async function generateShareLink() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成推荐，再创建访问链接。", "error");
    return;
  }
  updateEmailStatus("正在生成可访问链接...", "neutral");
  try {
    const payload = await apiRequest("/share", {
      method: "POST",
      body: JSON.stringify({
        plan_label: appState.latestPlan.planLabel,
        condition: appState.latestPlan.condition,
        top_outfits: appState.latestPlan.topOutfits,
        top_meals: appState.latestPlan.topMeals,
        hot_meals: appState.latestPlan.hotMealsPool.slice(0, 3),
        created_at: appState.latestPlan.createdAt,
      }),
    });
    const shareUrl = new URL(window.location.origin + window.location.pathname);
    shareUrl.searchParams.set("share_id", payload.token);
    appState.shareToken = payload.token;
    appState.shareLink = shareUrl.toString();
  } catch (error) {
    appState.shareToken = "";
    appState.shareLink = buildShareUrl(appState.latestPlan);
  }

  $("shareLinkInput").value = appState.shareLink;
  $("openShareLinkBtn").disabled = false;
  updateEmailStatus("可访问链接已生成，你可以复制或直接打开。", "ok");
}

async function copyShareLink() {
  const shareLink = $("shareLinkInput").value.trim() || appState.shareLink;
  if (!shareLink) {
    updateEmailStatus("请先生成访问链接。", "error");
    return;
  }
  await copyTextContent(shareLink, "访问链接已复制。", "链接复制失败，请手动复制输入框内容。");
}

function openShareLink() {
  const shareLink = $("shareLinkInput").value.trim() || appState.shareLink;
  if (!shareLink) {
    updateEmailStatus("请先生成访问链接。", "error");
    return;
  }
  window.open(shareLink, "_blank", "noopener,noreferrer");
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapTextLines(ctx, text, maxWidth) {
  const words = String(text || "").split("");
  const lines = [];
  let current = "";
  words.forEach((character) => {
    const trial = current + character;
    if (ctx.measureText(trial).width > maxWidth && current) {
      lines.push(current);
      current = character;
    } else {
      current = trial;
    }
  });
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, color) {
  ctx.fillStyle = color;
  const lines = wrapTextLines(ctx, text, maxWidth);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

async function downloadPlanImage() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成推荐，再下载高清图片。", "error");
    return;
  }

  const plan = appState.latestPlan;
  const canvas = document.createElement("canvas");
  const width = 1800;
  const height = 1400;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    updateEmailStatus("当前浏览器不支持图片导出。", "error");
    return;
  }

  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, "#fdf2ff");
  bg.addColorStop(0.55, "#eef4ff");
  bg.addColorStop(1, "#fff8f3");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#f472b6";
  ctx.beginPath();
  ctx.arc(250, 220, 160, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8b5cf6";
  ctx.beginPath();
  ctx.arc(1500, 180, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#60a5fa";
  ctx.beginPath();
  ctx.arc(1500, 1180, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(76, 38, 127, 0.14)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  drawRoundedRect(ctx, 90, 80, width - 180, height - 160, 48);
  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#7c3aed";
  ctx.font = '600 28px "Segoe UI", sans-serif';
  ctx.fillText("Girlfriend Daily Reco", 150, 160);

  ctx.fillStyle = "#1f1636";
  ctx.font = '700 68px "Segoe UI", sans-serif';
  ctx.fillText(plan.planLabel, 150, 240);

  ctx.font = '400 28px "Segoe UI", sans-serif';
  drawWrappedText(ctx, buildPlanSummary(plan), 150, 294, 1020, 40, "#5c5470");

  ctx.font = '600 24px "Segoe UI", sans-serif';
  drawWrappedText(ctx, buildPlanMetaLabels(plan).join("  ·  "), 150, 384, 1300, 34, "#7c3aed");

  const cardWidth = 690;
  const cardHeight = 560;
  const leftX = 150;
  const rightX = 960;
  const topY = 450;

  [
    { x: leftX, y: topY, color: "#fff4fb", border: "#f6c3df", title: "穿搭推荐" },
    { x: rightX, y: topY, color: "#f5f3ff", border: "#d8ccff", title: "美食推荐" },
  ].forEach((card) => {
    drawRoundedRect(ctx, card.x, card.y, cardWidth, cardHeight, 36);
    ctx.fillStyle = card.color;
    ctx.fill();
    ctx.strokeStyle = card.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#241b3a";
    ctx.font = '700 34px "Segoe UI", sans-serif';
    ctx.fillText(card.title, card.x + 40, card.y + 58);
  });

  function drawEntries(entries, x, y, kind) {
    let currentY = y;
    if (!entries.length) {
      ctx.fillStyle = "#6b6481";
      ctx.font = '500 26px "Segoe UI", sans-serif';
      ctx.fillText("暂无匹配内容，继续补充素材库会更准确。", x, currentY);
      return;
    }

    entries.forEach((entry, index) => {
      drawRoundedRect(ctx, x, currentY, 610, 128, 28);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "rgba(124, 58, 237, 0.14)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#7c3aed";
      ctx.font = '700 20px "Segoe UI", sans-serif';
      ctx.fillText(`TOP ${index + 1}`, x + 28, currentY + 34);

      ctx.fillStyle = "#201834";
      ctx.font = '700 28px "Segoe UI", sans-serif';
      ctx.fillText(entry.item.name, x + 28, currentY + 72);

      ctx.fillStyle = "#5d5672";
      ctx.font = '500 22px "Segoe UI", sans-serif';
      const descriptor =
        kind === "outfit" ? entry.item.style || "风格未填写" : entry.item.flavor || "口味未填写";
      drawWrappedText(
        ctx,
        `${descriptor} · 匹配分 ${entry.score} · ${BUDGET_LABELS[entry.item.budget] || "不限"}`,
        x + 28,
        currentY + 104,
        560,
        28,
        "#5d5672"
      );

      currentY += 148;
    });
  }

  drawEntries(plan.topOutfits, 190, 540, "outfit");
  drawEntries(plan.topMeals, 1000, 540, "meal");

  drawRoundedRect(ctx, 150, 1050, width - 300, 180, 36);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "rgba(99, 102, 241, 0.18)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#241b3a";
  ctx.font = '700 30px "Segoe UI", sans-serif';
  ctx.fillText("额外热门菜品与分享信息", 190, 1106);

  ctx.fillStyle = "#5d5672";
  ctx.font = '500 23px "Segoe UI", sans-serif';
  drawWrappedText(
    ctx,
    `额外推荐：${plan.hotMealsPool.slice(0, 3).join(" / ") || "暂无额外推荐"}`,
    190,
    1148,
    width - 380,
    30,
    "#5d5672"
  );
  drawWrappedText(
    ctx,
    `生成时间：${formatDate(plan.createdAt)} · 导出自 Girlfriend Daily Reco`,
    190,
    1204,
    width - 380,
    30,
    "#7c3aed"
  );

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
  if (!blob) {
    updateEmailStatus("图片导出失败，请稍后重试。", "error");
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilenamePart(plan.planLabel)}-${new Date()
    .toISOString()
    .slice(0, 10)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateEmailStatus("高清图片已生成并开始下载。", "ok");
}

async function sendPlanEmail() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成推荐，再发送邮件。", "error");
    return;
  }
  const toEmail = $("emailTo").value.trim();
  if (!toEmail) {
    updateEmailStatus("请先填写收件人邮箱。", "error");
    return;
  }

  const mode = $("emailMode").value;
  const manualSubject = $("emailSubject").value.trim();
  const subject = manualSubject || `给你准备的${appState.latestPlan.planLabel}：穿搭 + 美食`;
  const textBody = buildPlanText(appState.latestPlan);
  const htmlBody = buildPlanHtml(appState.latestPlan);

  if (mode === "mailto") {
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(textBody)}`;
    window.location.href = mailto;
    updateEmailStatus("已打开邮件客户端，请确认后发送。", "ok");
    return;
  }

  updateEmailStatus("正在发送邮件...", "neutral");
  try {
    await apiRequest("/email/send", {
      method: "POST",
      body: JSON.stringify({
        to_email: toEmail,
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });
    updateEmailStatus("邮件发送成功，快去提醒她查看收件箱吧。", "ok");
  } catch (error) {
    updateEmailStatus("邮件发送失败，请检查后端 SMTP 配置，或改用“邮件客户端”模式。", "error");
  }
}

function mapWeatherCodeToTag(code, temperature) {
  if (temperature <= 12) return "cold";
  if (temperature >= 30) return "hot";
  if (code >= 51 && code <= 99) return "rainy";
  if ([1, 2, 3, 45, 48].includes(code)) return "cloudy";
  return "sunny";
}

async function fetchWeatherByLocation() {
  if (!navigator.geolocation) {
    updateWeatherStatus("天气助手：当前浏览器不支持定位。", "error");
    return;
  }

  updateWeatherStatus("天气助手：正在获取定位并查询天气...", "neutral");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
        const response = await fetch(url);
        const data = await response.json();
        const current = data.current || {};
        const weatherCode = Number(current.weather_code ?? 0);
        const temp = Number(current.temperature_2m ?? 22);
        const mapped = mapWeatherCodeToTag(weatherCode, temp);
        $("weather").value = mapped;
        updateWeatherStatus(
          `天气助手：已根据定位自动设置为「${WEATHER_LABELS[mapped]}」，当前约 ${temp}°C。`,
          "ok"
        );
      } catch (error) {
        updateWeatherStatus("天气助手：自动识别失败，请手动选择天气。", "error");
      }
    },
    () => {
      updateWeatherStatus("天气助手：定位被拒绝，请手动选择天气。", "error");
    },
    { timeout: 10000 }
  );
}

function parseSharedPlanFromUrl() {
  const url = new URL(window.location.href);
  const shareId = url.searchParams.get("share_id");
  if (shareId) {
    return apiRequest(`/share/${encodeURIComponent(shareId)}`).then((payload) =>
      normalizePlanData(payload)
    );
  }
  const share = url.searchParams.get("share");
  if (!share) return null;

  try {
    const decoded = JSON.parse(decodeBase64Url(share));
    return normalizePlanData(decoded);
  } catch (error) {
    updateEmailStatus("分享链接解析失败，请重新生成访问链接。", "error");
    return null;
  }
}

async function loadData() {
  try {
    const [outfits, meals, history] = await Promise.all([
      apiRequest("/outfits"),
      apiRequest("/meals"),
      apiRequest("/history?limit=30"),
    ]);
    store.outfits = outfits;
    store.meals = meals;
    store.history = history;
    updateBackendStatus("数据存储：Python + SQLite 已连接", "ok");
  } catch (error) {
    store.outfits = [];
    store.meals = [];
    store.history = [];
    updateBackendStatus("后端连接失败，请先启动 Python 服务。", "error");
  }

  renderDataLists();
  renderHistoryList();
}

function bindEvents() {
  $$("[data-tab-trigger]").forEach((button) => {
    button.addEventListener("click", () => setActiveStudioTab(button.dataset.tabTrigger));
  });

  $$("[data-open-recommendation]").forEach((button) => {
    button.addEventListener("click", openRecommendationModal);
  });

  $("closeModalBtn").addEventListener("click", closeRecommendationModal);
  $("recommendationModal").addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") {
      closeRecommendationModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && appState.isModalOpen) {
      closeRecommendationModal();
    }
  });

  $("recommendBtn").addEventListener("click", async () =>
    renderRecommendation(getConditionFromUI(), "今日推荐")
  );
  $("tomorrowBtn").addEventListener("click", async () =>
    renderRecommendation(buildTomorrowCondition(getConditionFromUI()), "明日计划")
  );
  $("autoWeatherBtn").addEventListener("click", fetchWeatherByLocation);
  $("copyTextBtn").addEventListener("click", copyPlanText);
  $("exportBtn").addEventListener("click", exportPlan);
  $("generateShareBtn").addEventListener("click", generateShareLink);
  $("copyShareLinkBtn").addEventListener("click", copyShareLink);
  $("openShareLinkBtn").addEventListener("click", openShareLink);
  $("downloadImageBtn").addEventListener("click", downloadPlanImage);
  $("sendEmailBtn").addEventListener("click", sendPlanEmail);

  $("refreshHistoryBtn").addEventListener("click", async () => {
    try {
      store.history = await apiRequest("/history?limit=30");
      renderHistoryList();
      updateBackendStatus("历史记录已刷新。", "ok");
    } catch (error) {
      updateBackendStatus("刷新历史失败。", "error");
    }
  });

  $("outfitForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: $("outfitName").value.trim(),
      style: $("outfitStyle").value.trim(),
      weather: getCheckedValues("outfitWeatherTags"),
      moods: getCheckedValues("outfitMoodTags"),
      occasions: getCheckedValues("outfitOccasionTags"),
      budget: $("outfitBudget").value,
      link: $("outfitLink").value.trim(),
    };
    if (!payload.name) return;

    try {
      if (appState.editingOutfitId) {
        const updated = await apiRequest(`/outfits/${appState.editingOutfitId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        store.outfits = store.outfits.map((item) => (item.id === updated.id ? updated : item));
        resetOutfitFormEditing();
      } else {
        const created = await apiRequest("/outfits", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        store.outfits.unshift(created);
      }
      renderDataLists();
      event.target.reset();
      updateBackendStatus("穿搭素材已保存到 SQLite。", "ok");
    } catch (error) {
      updateBackendStatus("保存穿搭失败，请检查后端是否运行。", "error");
    }
  });

  $("mealForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: $("mealName").value.trim(),
      flavor: $("mealFlavor").value.trim(),
      weather: getCheckedValues("mealWeatherTags"),
      moods: getCheckedValues("mealMoodTags"),
      diets: getCheckedValues("mealDietTags"),
      budget: $("mealBudget").value,
      link: $("mealLink").value.trim(),
    };
    if (!payload.name) return;

    try {
      if (appState.editingMealId) {
        const updated = await apiRequest(`/meals/${appState.editingMealId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        store.meals = store.meals.map((item) => (item.id === updated.id ? updated : item));
        resetMealFormEditing();
      } else {
        const created = await apiRequest("/meals", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        store.meals.unshift(created);
      }
      renderDataLists();
      event.target.reset();
      updateBackendStatus("菜品素材已保存到 SQLite。", "ok");
    } catch (error) {
      updateBackendStatus("保存菜品失败，请检查后端是否运行。", "error");
    }
  });

  $("outfitList").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const item = store.outfits.find((entry) => entry.id === id);
    if (!item) return;

    if (button.dataset.action === "edit-outfit") {
      setActiveStudioTab("outfit");
      appState.editingOutfitId = id;
      $("outfitName").value = item.name;
      $("outfitStyle").value = item.style || "";
      $("outfitLink").value = item.link || "";
      $("outfitBudget").value = item.budget || "budget";
      setCheckedValues("outfitWeatherTags", item.weather);
      setCheckedValues("outfitMoodTags", item.moods);
      setCheckedValues("outfitOccasionTags", item.occasions);
      $("outfitSubmitBtn").textContent = "保存穿搭修改";
      $("outfitCancelEditBtn").classList.remove("hidden");
      return;
    }

    if (button.dataset.action === "delete-outfit") {
      try {
        await apiRequest(`/outfits/${id}`, { method: "DELETE" });
        store.outfits = store.outfits.filter((entry) => entry.id !== id);
        renderDataLists();
        updateBackendStatus("穿搭素材已删除。", "ok");
      } catch (error) {
        updateBackendStatus("删除穿搭失败。", "error");
      }
    }
  });

  $("mealList").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const item = store.meals.find((entry) => entry.id === id);
    if (!item) return;

    if (button.dataset.action === "edit-meal") {
      setActiveStudioTab("meal");
      appState.editingMealId = id;
      $("mealName").value = item.name;
      $("mealFlavor").value = item.flavor || "";
      $("mealLink").value = item.link || "";
      $("mealBudget").value = item.budget || "budget";
      setCheckedValues("mealWeatherTags", item.weather);
      setCheckedValues("mealMoodTags", item.moods);
      setCheckedValues("mealDietTags", item.diets);
      $("mealSubmitBtn").textContent = "保存菜品修改";
      $("mealCancelEditBtn").classList.remove("hidden");
      return;
    }

    if (button.dataset.action === "delete-meal") {
      try {
        await apiRequest(`/meals/${id}`, { method: "DELETE" });
        store.meals = store.meals.filter((entry) => entry.id !== id);
        renderDataLists();
        updateBackendStatus("菜品素材已删除。", "ok");
      } catch (error) {
        updateBackendStatus("删除菜品失败。", "error");
      }
    }
  });

  $("historyList").addEventListener("click", async (event) => {
    const button = event.target.closest('button[data-action="view-history"]');
    if (!button) return;
    const id = Number(button.dataset.id);
    const historyItem = store.history.find((entry) => entry.id === id);
    if (!historyItem) return;
    await renderPlanUI(historyToPlan(historyItem), {
      openModal: true,
      persistHistory: false,
      source: "history",
    });
  });

  $("outfitCancelEditBtn").addEventListener("click", () => {
    resetOutfitFormEditing();
    $("outfitForm").reset();
  });

  $("mealCancelEditBtn").addEventListener("click", () => {
    resetMealFormEditing();
    $("mealForm").reset();
  });
}

async function init() {
  setActiveStudioTab("outfit");
  bindEvents();
  syncRecommendationButtons();
  await loadData();

  const sharedPlan = await parseSharedPlanFromUrl();
  if (sharedPlan) {
    await renderPlanUI(sharedPlan, {
      openModal: true,
      persistHistory: false,
      source: "shared",
    });
  } else {
    updateEmailStatus("提示：先生成推荐，再导出、分享或发送邮件。", "neutral");
  }
}

init();

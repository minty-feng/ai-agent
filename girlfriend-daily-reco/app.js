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
const API_BASE = "/api";
const BUDGET_LABELS = { all: "不限", budget: "平价", mid: "中档" };
const WEATHER_LABELS = {
  sunny: "晴天",
  cloudy: "多云",
  rainy: "雨天",
  cold: "降温/冷天",
  hot: "炎热",
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
};

function updateBackendStatus(text, type) {
  const node = $("backendStatus");
  node.textContent = text;
  node.classList.remove("ok", "error", "neutral");
  if (type === "ok") node.classList.add("ok");
  else if (type === "error") node.classList.add("error");
  else node.classList.add("neutral");
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

function parseTags(input) {
  return input
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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

function renderDataLists() {
  $("outfitList").innerHTML = store.outfits
    .map(
      (x) => `
      <li>
        <strong>${x.name}</strong>
        <div>${x.style || "未填写风格"} · 天气: ${x.weather.join("/") || "-"}</div>
        <div>预算：${BUDGET_LABELS[x.budget] || "不限"}</div>
        <div class="item-actions">
          <button class="btn small" type="button" data-action="edit-outfit" data-id="${x.id}">编辑</button>
          <button class="btn small danger" type="button" data-action="delete-outfit" data-id="${x.id}">删除</button>
        </div>
      </li>`
    )
    .join("");

  $("mealList").innerHTML = store.meals
    .map(
      (x) => `
      <li>
        <strong>${x.name}</strong>
        <div>${x.flavor || "未填写口味"} · 标签: ${x.diets.join("/") || "-"}</div>
        <div>预算：${BUDGET_LABELS[x.budget] || "不限"}</div>
        <div class="item-actions">
          <button class="btn small" type="button" data-action="edit-meal" data-id="${x.id}">编辑</button>
          <button class="btn small danger" type="button" data-action="delete-meal" data-id="${x.id}">删除</button>
        </div>
      </li>`
    )
    .join("");

  $("trendList").innerHTML = TREND_ITEMS.map(
    (x) => `
      <li>
        <strong>${x.name}</strong>
        <div>${x.reason}</div>
        <a href="${x.link}" target="_blank" rel="noopener noreferrer">去看看</a>
      </li>`
  ).join("");
}

function renderHistoryList() {
  $("historyList").innerHTML = store.history
    .map(
      (x) => `
      <li>
        <div><strong>${x.plan_label}</strong></div>
        <div>${new Date(x.created_at).toLocaleString()}</div>
        <div>天气：${WEATHER_LABELS[x.condition?.weather] || "-"}</div>
      </li>`
    )
    .join("");
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

function getPlanData(condition, planLabel) {
  const current = condition || getConditionFromUI();
  const topOutfits = pickTop(store.outfits, scoreOutfit, current);
  const topMeals = pickTop(store.meals, scoreMeal, current);
  const hotMealsPool = pickHotMealsByBudget(current.budget);

  return {
    planLabel: planLabel || "今日推荐",
    condition: current,
    topOutfits,
    topMeals,
    hotMealsPool,
    createdAt: new Date().toISOString(),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

  const extras = plan.hotMealsPool.slice(0, 2).map((x) => `- ${x}`).join("\n");

  return [
    `【${plan.planLabel}】`,
    `天气：${WEATHER_LABELS[plan.condition.weather]}`,
    `预算：${BUDGET_LABELS[plan.condition.budget]}`,
    "",
    "【穿搭推荐】",
    outfitLines || "- 暂无匹配内容",
    "",
    "【美食推荐】",
    mealLines || "- 暂无匹配内容",
    "",
    "【热门菜品（额外）】",
    extras,
    "",
    `生成时间：${new Date(plan.createdAt).toLocaleString()}`,
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

  const extraMeals = plan.hotMealsPool
    .slice(0, 2)
    .map((name) => `<li>${escapeHtml(name)}</li>`)
    .join("");

  return `
    <h3>${escapeHtml(plan.planLabel)}</h3>
    <p>天气：${escapeHtml(WEATHER_LABELS[plan.condition.weather])}；预算：${escapeHtml(
    BUDGET_LABELS[plan.condition.budget]
  )}</p>
    <h4>穿搭推荐</h4>
    <ol>${outfitLines || "<li>暂无匹配内容</li>"}</ol>
    <h4>美食推荐</h4>
    <ol>${mealLines || "<li>暂无匹配内容</li>"}</ol>
    <h4>热门菜品（额外）</h4>
    <ul>${extraMeals}</ul>
    <p>生成时间：${escapeHtml(new Date(plan.createdAt).toLocaleString())}</p>
  `;
}

function updateEmailStatus(text, type) {
  const node = $("emailStatus");
  node.textContent = text;
  node.classList.remove("ok", "error", "neutral");
  if (type === "ok") node.classList.add("ok");
  if (type === "error") node.classList.add("error");
  if (!type) node.classList.add("neutral");
}

async function copyPlanText() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成今日推荐或明日计划，再复制。", "error");
    return;
  }

  const content = buildPlanText(appState.latestPlan);
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
    updateEmailStatus("推荐文案已复制，可直接粘贴发送。", "ok");
  } catch (error) {
    updateEmailStatus("复制失败，请改用“一键导出”获取文案文件。", "error");
  }
}

function exportPlan() {
  if (!appState.latestPlan) {
    updateEmailStatus("请先生成今日推荐或明日计划，再导出。", "error");
    return;
  }
  const content = buildPlanText(appState.latestPlan);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${appState.latestPlan.planLabel}-${date}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateEmailStatus("已导出推荐文案文件，可直接转发给她。", "ok");
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
  const subject = manualSubject || `给你准备的${appState.latestPlan.planLabel}：穿搭+美食`;
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

  updateEmailStatus("正在发送邮件...", undefined);
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

async function persistPlanHistory(planData) {
  try {
    const saved = await apiRequest("/history", {
      method: "POST",
      body: JSON.stringify({
        plan_label: planData.planLabel,
        condition: planData.condition,
        top_outfits: planData.topOutfits,
        top_meals: planData.topMeals,
        hot_meals: planData.hotMealsPool.slice(0, 2),
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

async function renderRecommendation(condition, planLabel) {
  const current = condition || getConditionFromUI();
  const planData = getPlanData(current, planLabel);
  appState.latestPlan = planData;
  const { topOutfits, topMeals, hotMealsPool } = planData;

  $("outfitResult").innerHTML = topOutfits
    .map(
      ({ item, score }, idx) => `
      <div class="result-item">
        <h4>No.${idx + 1} ${item.name}</h4>
        <p>${item.style || "风格未填写"} · 匹配分 ${score} · ${
        BUDGET_LABELS[item.budget] || "不限"
      }</p>
        ${
          item.link
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">相关购买/参考链接</a>`
            : ""
        }
      </div>`
    )
    .join("");

  const hotMeals = hotMealsPool.slice(0, 2)
    .map((name) => `<li>${name}</li>`)
    .join("");

  $("mealResult").innerHTML = `
    ${topMeals
      .map(
        ({ item, score }, idx) => `
      <div class="result-item">
        <h4>No.${idx + 1} ${item.name}</h4>
        <p>${item.flavor || "口味未填写"} · 匹配分 ${score} · ${
          BUDGET_LABELS[item.budget] || "不限"
        }</p>
        ${
          item.link
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">店铺/参考链接</a>`
            : ""
        }
      </div>`
      )
      .join("")}
    <div class="result-item">
      <h4>当前热门菜品推荐（额外）</h4>
      <ul>${hotMeals}</ul>
    </div>
  `;

  $("datePlanTitle").textContent = `${planData.planLabel}（天气：${
    WEATHER_LABELS[current.weather]
  }，预算：${BUDGET_LABELS[current.budget]}）`;
  $("resultEmpty").classList.add("hidden");
  $("resultWrap").classList.remove("hidden");
  updateEmailStatus("已生成推荐：可一键导出或发送邮件。", "ok");
  await persistPlanHistory(planData);
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
    $("weatherStatus").textContent = "天气助手：当前浏览器不支持定位。";
    return;
  }

  $("weatherStatus").textContent = "天气助手：正在获取定位并查询天气...";

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
        $("weatherStatus").textContent = `天气助手：已根据定位自动设置为「${
          WEATHER_LABELS[mapped]
        }」，当前约 ${temp}°C。`;
      } catch (error) {
        $("weatherStatus").textContent =
          "天气助手：自动识别失败，请手动选择天气。";
      }
    },
    () => {
      $("weatherStatus").textContent =
        "天气助手：定位被拒绝，请手动选择天气。";
    },
    { timeout: 10000 }
  );
}

function bindEvents() {
  $("recommendBtn").addEventListener("click", async () =>
    renderRecommendation(getConditionFromUI(), "今日推荐")
  );
  $("tomorrowBtn").addEventListener("click", async () => {
    const condition = buildTomorrowCondition(getConditionFromUI());
    await renderRecommendation(condition, "明日计划");
  });
  $("autoWeatherBtn").addEventListener("click", fetchWeatherByLocation);
  $("exportBtn").addEventListener("click", exportPlan);
  $("copyTextBtn").addEventListener("click", copyPlanText);
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

  $("outfitForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newItem = {
      name: $("outfitName").value.trim(),
      style: $("outfitStyle").value.trim(),
      weather: parseTags($("outfitWeather").value),
      moods: parseTags($("outfitMood").value),
      occasions: parseTags($("outfitOccasion").value),
      budget: $("outfitBudget").value,
      link: $("outfitLink").value.trim(),
    };
    if (!newItem.name) return;
    try {
      if (appState.editingOutfitId) {
        const updated = await apiRequest(`/outfits/${appState.editingOutfitId}`, {
          method: "PUT",
          body: JSON.stringify(newItem),
        });
        store.outfits = store.outfits.map((x) => (x.id === updated.id ? updated : x));
        appState.editingOutfitId = null;
        $("outfitSubmitBtn").textContent = "添加到穿搭素材库";
      } else {
        const created = await apiRequest("/outfits", {
          method: "POST",
          body: JSON.stringify(newItem),
        });
        store.outfits.unshift(created);
      }
      renderDataLists();
      e.target.reset();
      updateBackendStatus("穿搭素材已保存到 SQLite。", "ok");
    } catch (error) {
      updateBackendStatus("保存穿搭失败，请检查后端是否运行。", "error");
    }
  });

  $("mealForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newItem = {
      name: $("mealName").value.trim(),
      flavor: $("mealFlavor").value.trim(),
      weather: parseTags($("mealWeather").value),
      moods: parseTags($("mealMood").value),
      diets: parseTags($("mealDiet").value),
      budget: $("mealBudget").value,
      link: $("mealLink").value.trim(),
    };
    if (!newItem.name) return;
    try {
      if (appState.editingMealId) {
        const updated = await apiRequest(`/meals/${appState.editingMealId}`, {
          method: "PUT",
          body: JSON.stringify(newItem),
        });
        store.meals = store.meals.map((x) => (x.id === updated.id ? updated : x));
        appState.editingMealId = null;
        $("mealSubmitBtn").textContent = "添加到菜品素材库";
      } else {
        const created = await apiRequest("/meals", {
          method: "POST",
          body: JSON.stringify(newItem),
        });
        store.meals.unshift(created);
      }
      renderDataLists();
      e.target.reset();
      updateBackendStatus("菜品素材已保存到 SQLite。", "ok");
    } catch (error) {
      updateBackendStatus("保存菜品失败，请检查后端是否运行。", "error");
    }
  });

  $("outfitList").addEventListener("click", async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const item = store.outfits.find((x) => x.id === id);
    if (!item) return;
    if (action === "edit-outfit") {
      appState.editingOutfitId = id;
      $("outfitName").value = item.name;
      $("outfitStyle").value = item.style || "";
      $("outfitWeather").value = item.weather.join(",");
      $("outfitMood").value = item.moods.join(",");
      $("outfitOccasion").value = item.occasions.join(",");
      $("outfitBudget").value = item.budget || "budget";
      $("outfitLink").value = item.link || "";
      $("outfitSubmitBtn").textContent = "保存穿搭修改";
      return;
    }
    if (action === "delete-outfit") {
      try {
        await apiRequest(`/outfits/${id}`, { method: "DELETE" });
        store.outfits = store.outfits.filter((x) => x.id !== id);
        renderDataLists();
        updateBackendStatus("穿搭素材已删除。", "ok");
      } catch (error) {
        updateBackendStatus("删除穿搭失败。", "error");
      }
    }
  });

  $("mealList").addEventListener("click", async (e) => {
    const button = e.target.closest("button[data-action]");
    if (!button) return;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;
    const item = store.meals.find((x) => x.id === id);
    if (!item) return;
    if (action === "edit-meal") {
      appState.editingMealId = id;
      $("mealName").value = item.name;
      $("mealFlavor").value = item.flavor || "";
      $("mealWeather").value = item.weather.join(",");
      $("mealMood").value = item.moods.join(",");
      $("mealDiet").value = item.diets.join(",");
      $("mealBudget").value = item.budget || "budget";
      $("mealLink").value = item.link || "";
      $("mealSubmitBtn").textContent = "保存菜品修改";
      return;
    }
    if (action === "delete-meal") {
      try {
        await apiRequest(`/meals/${id}`, { method: "DELETE" });
        store.meals = store.meals.filter((x) => x.id !== id);
        renderDataLists();
        updateBackendStatus("菜品素材已删除。", "ok");
      } catch (error) {
        updateBackendStatus("删除菜品失败。", "error");
      }
    }
  });
}

async function init() {
  bindEvents();
  await loadData();
  updateEmailStatus("提示：先生成推荐，再导出或发送邮件。", undefined);
}

init();

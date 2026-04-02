const DEFAULT_OUTFITS = [
  {
    name: "奶油白针织开衫 + A字半身裙",
    style: "温柔约会风",
    weather: ["cloudy", "cold", "sunny"],
    moods: ["happy", "romantic", "calm"],
    occasions: ["date", "casual"],
    link: "https://www.taobao.com/",
  },
  {
    name: "浅灰西装外套 + 直筒牛仔裤",
    style: "通勤韩系",
    weather: ["sunny", "cloudy", "cold"],
    moods: ["focused", "calm"],
    occasions: ["work", "casual"],
    link: "https://www.tmall.com/",
  },
  {
    name: "薄款防晒衬衫 + 阔腿裤",
    style: "轻松清爽",
    weather: ["hot", "sunny"],
    moods: ["happy", "calm"],
    occasions: ["work", "casual", "home"],
    link: "https://www.jd.com/",
  },
  {
    name: "短款风衣 + 连衣裙",
    style: "气质通勤",
    weather: ["rainy", "cloudy", "cold"],
    moods: ["focused", "romantic"],
    occasions: ["work", "date"],
    link: "https://www.taobao.com/",
  },
  {
    name: "软糯家居套装",
    style: "宅家治愈",
    weather: ["rainy", "cold", "hot"],
    moods: ["tired", "calm"],
    occasions: ["home"],
    link: "https://www.xiaohongshu.com/",
  },
];

const DEFAULT_MEALS = [
  {
    name: "番茄肥牛乌冬",
    flavor: "酸甜浓郁",
    weather: ["rainy", "cold", "cloudy"],
    moods: ["tired", "happy"],
    diets: ["comfort", "protein"],
    link: "https://www.dianping.com/",
  },
  {
    name: "清炒虾仁时蔬 + 杂粮饭",
    flavor: "清淡鲜甜",
    weather: ["sunny", "hot", "cloudy"],
    moods: ["focused", "calm"],
    diets: ["light", "protein"],
    link: "https://www.meituan.com/",
  },
  {
    name: "麻辣香锅（少油版）",
    flavor: "麻辣上头",
    weather: ["rainy", "cold"],
    moods: ["happy", "tired"],
    diets: ["spicy", "comfort"],
    link: "https://www.meituan.com/",
  },
  {
    name: "三文鱼牛油果波奇饭",
    flavor: "清爽轻食",
    weather: ["hot", "sunny"],
    moods: ["calm", "focused"],
    diets: ["light", "protein"],
    link: "https://www.ele.me/",
  },
  {
    name: "菌菇鸡汤面",
    flavor: "暖胃鲜香",
    weather: ["cold", "rainy", "cloudy"],
    moods: ["tired", "romantic", "calm"],
    diets: ["comfort"],
    link: "https://www.dianping.com/",
  },
];

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

const store = {
  outfits: [],
  meals: [],
};

function loadData() {
  const savedOutfits = localStorage.getItem("gf_outfits");
  const savedMeals = localStorage.getItem("gf_meals");
  store.outfits = savedOutfits ? JSON.parse(savedOutfits) : [...DEFAULT_OUTFITS];
  store.meals = savedMeals ? JSON.parse(savedMeals) : [...DEFAULT_MEALS];
}

function persistData() {
  localStorage.setItem("gf_outfits", JSON.stringify(store.outfits));
  localStorage.setItem("gf_meals", JSON.stringify(store.meals));
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
  return score;
}

function scoreMeal(meal, condition) {
  let score = 0;
  if (meal.weather.includes(condition.weather)) score += 3;
  if (meal.moods.includes(condition.mood)) score += 2;
  if (condition.diet === "all" || meal.diets.includes(condition.diet)) score += 3;
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
      </li>`
    )
    .join("");

  $("mealList").innerHTML = store.meals
    .map(
      (x) => `
      <li>
        <strong>${x.name}</strong>
        <div>${x.flavor || "未填写口味"} · 标签: ${x.diets.join("/") || "-"}</div>
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

function renderRecommendation() {
  const condition = {
    weather: $("weather").value,
    mood: $("mood").value,
    occasion: $("occasion").value,
    diet: $("diet").value,
  };

  const topOutfits = pickTop(store.outfits, scoreOutfit, condition);
  const topMeals = pickTop(store.meals, scoreMeal, condition);

  $("outfitResult").innerHTML = topOutfits
    .map(
      ({ item, score }, idx) => `
      <div class="result-item">
        <h4>No.${idx + 1} ${item.name}</h4>
        <p>${item.style || "风格未填写"} · 匹配分 ${score}</p>
        ${
          item.link
            ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer">相关购买/参考链接</a>`
            : ""
        }
      </div>`
    )
    .join("");

  const hotMeals = HOT_MEAL_SUGGESTIONS.slice(0, 2)
    .map((name) => `<li>${name}</li>`)
    .join("");

  $("mealResult").innerHTML = `
    ${topMeals
      .map(
        ({ item, score }, idx) => `
      <div class="result-item">
        <h4>No.${idx + 1} ${item.name}</h4>
        <p>${item.flavor || "口味未填写"} · 匹配分 ${score}</p>
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

  $("resultEmpty").classList.add("hidden");
  $("resultWrap").classList.remove("hidden");
}

function bindEvents() {
  $("recommendBtn").addEventListener("click", renderRecommendation);

  $("outfitForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newItem = {
      name: $("outfitName").value.trim(),
      style: $("outfitStyle").value.trim(),
      weather: parseTags($("outfitWeather").value),
      moods: parseTags($("outfitMood").value),
      occasions: parseTags($("outfitOccasion").value),
      link: $("outfitLink").value.trim(),
    };
    if (!newItem.name) return;
    store.outfits.unshift(newItem);
    persistData();
    renderDataLists();
    e.target.reset();
  });

  $("mealForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const newItem = {
      name: $("mealName").value.trim(),
      flavor: $("mealFlavor").value.trim(),
      weather: parseTags($("mealWeather").value),
      moods: parseTags($("mealMood").value),
      diets: parseTags($("mealDiet").value),
      link: $("mealLink").value.trim(),
    };
    if (!newItem.name) return;
    store.meals.unshift(newItem);
    persistData();
    renderDataLists();
    e.target.reset();
  });
}

function init() {
  loadData();
  renderDataLists();
  bindEvents();
}

init();

"use strict";

const API = "/api";
const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const MARK = { green: "✓", amber: "!", red: "✕" };

const STR = {
  en: {
    tagline: "Heat-safe shifts for construction crews",
    langButton: "हिंदी",
    savedSites: "Saved sites",
    where: "Where is the site?",
    wherePh: "City or area, e.g. Nagpur",
    useLocation: "Use my location",
    siteName: "Site name (optional)",
    siteNamePh: "e.g. Tower B, Sector 62",
    workload: "How heavy is the work?",
    light: "Light",
    lightEg: "Supervising, wiring, painting",
    moderate: "Moderate",
    moderateEg: "Masonry, plastering, bar bending",
    heavy: "Heavy",
    heavyEg: "Digging, carrying loads, concreting",
    crew: "Workers on site",
    replay: "Replay the 19 May 2026 heatwave",
    replayHint: "Uses recorded weather from that day, to see the plan in peak summer.",
    makePlan: "Make the shift plan",
    loading: "Checking the weather…",
    searching: "Searching…",
    noPlace: "No place found. Try a nearby city.",
    locating: "Finding your location…",
    locateFail: "Could not get your location. Type the city instead.",
    myLocation: "My location",
    planFail: "Could not build the plan. Check your connection and try again.",
    today: "Today",
    tomorrow: "Tomorrow",
    replayDay: "Replay",
    nextDay: "Next day",
    recommended: "Recommended shift",
    noChange: "Usual shift is safe",
    noWork: "No safe working hours",
    noWorkBody: "It is too hot for this work at any time between 05:00 and 20:00. Stop outdoor work, or switch to lighter tasks in the shade.",
    then: "then",
    stopLine: "No work in the sun {from}–{to}",
    usualShift: "Usual shift {from}–{to}",
    thisPlan: "This plan",
    safeWork: "of safe work",
    unsafeHours: "{n} unsafe hours",
    onSite: "{n} h on site",
    noChangeNote: "The usual {from}–{to} shift stays within safe limits. Keep the breaks and water below.",
    shortNote: "Only {n} safe hours on this day. Move the heaviest tasks to a cooler day.",
    hourByHour: "Hour by hour",
    legendGreen: "Safe: work 50 min, rest 10 min",
    legendAmber: "Caution: rest 30 to 45 min every hour",
    legendRed: "Stop: no work in the sun",
    showTable: "Show as a table",
    legendWork: "Planned working hours",
    noWorkBar: "No work",
    tapHint: "Tap an hour to see the details.",
    detail: "{from}–{to}: {temp}°C, humidity {rh}%, wind {wind} m/s. Heat stress (WBGT) {wbgt}°C. {advice}",
    adviceWork: "Work {w} min, rest {r} min in the shade.",
    adviceStop: "Stop work in the sun.",
    method: "Heat stress (WBGT) is an estimate from weather data: temperature, humidity, wind and sunshine (Open-Meteo). It is not measured on site, so each hour is judged {m}°C stricter than the ACGIH limits. For {workload} work: safe up to {a}°C, stop above {b}°C.",
    thHour: "Hour", thTemp: "Temp", thRh: "Humidity", thWbgt: "WBGT", thStatus: "Status", thWork: "Work / rest",
    statusGreen: "Safe", statusAmber: "Caution", statusRed: "Stop",
    restWater: "Rest and water",
    waterEach: "Water per worker",
    waterCrew: "Water for {n} workers",
    restEach: "Rest every hour",
    litres: "{n} L",
    minutes: "{n} min",
    waterRule: "One glass every 20 minutes, even when not thirsty. Keep the water in the shade.",
    briefing: "Crew briefing",
    briefingLang: "Briefing language",
    briefingHint: "Play this to the crew before work starts.",
    play: "Play the briefing",
    stop: "Stop",
    preparing: "Preparing the voice…",
    whatsapp: "Share on WhatsApp",
    copy: "Copy text",
    copied: "Copied",
    srcAgent: "Wording by the Strands agent, numbers checked against the plan.",
    srcTemplate: "Standard wording.",
    voicePolly: "Voice: Amazon Polly.",
    voiceDevice: "Voice: this device.",
    noVoice: "This device has no voice for this language. Read the text aloud, or share it on WhatsApp.",
    saveSite: "Save this site for a fresh plan every day at 5 am",
    saved: "Saved. A new plan is prepared every morning at 5 am.",
    saveFail: "Could not save the site.",
    remove: "Remove {name}",
    footer: "Guidance for planning only. Always stop work and give first aid if anyone shows signs of heat illness.",
    hUnit: "h", mUnit: "min",
    waTitle: "Heat plan", waWork: "Work", waStop: "No work in the sun", waRest: "Rest in shade every hour",
    waWater: "Water", waWaterEach: "L per worker, one glass every 20 min", waPeak: "Hottest", waNoWork: "No safe working hours. Outdoor work stopped.",
  },
  hi: {
    tagline: "निर्माण मज़दूरों के लिए गर्मी से सुरक्षित शिफ़्ट",
    langButton: "English",
    savedSites: "सहेजी गई साइटें",
    where: "साइट कहाँ है?",
    wherePh: "शहर या इलाका, जैसे नागपुर",
    useLocation: "मेरी लोकेशन लें",
    siteName: "साइट का नाम (ज़रूरी नहीं)",
    siteNamePh: "जैसे टावर बी, सेक्टर 62",
    workload: "काम कितना भारी है?",
    light: "हल्का",
    lightEg: "निगरानी, वायरिंग, पेंटिंग",
    moderate: "मध्यम",
    moderateEg: "चिनाई, प्लास्टर, सरिया मोड़ना",
    heavy: "भारी",
    heavyEg: "खुदाई, बोझ ढोना, कंक्रीट",
    crew: "साइट पर मज़दूर",
    replay: "19 मई 2026 की लू दोबारा चलाएँ",
    replayHint: "उस दिन का दर्ज मौसम लेकर दिखाता है कि तेज़ गर्मी में योजना कैसी बनती है।",
    makePlan: "शिफ़्ट की योजना बनाएँ",
    loading: "मौसम देखा जा रहा है…",
    searching: "खोज रहे हैं…",
    noPlace: "जगह नहीं मिली। पास का शहर लिखें।",
    locating: "आपकी लोकेशन ढूँढ रहे हैं…",
    locateFail: "लोकेशन नहीं मिली। शहर का नाम लिखें।",
    myLocation: "मेरी लोकेशन",
    planFail: "योजना नहीं बन पाई। इंटरनेट जाँचें और फिर कोशिश करें।",
    today: "आज",
    tomorrow: "कल",
    replayDay: "रीप्ले",
    nextDay: "अगला दिन",
    recommended: "सुझाई गई शिफ़्ट",
    noChange: "रोज़ की शिफ़्ट सुरक्षित है",
    noWork: "कोई सुरक्षित समय नहीं",
    noWorkBody: "05:00 से 20:00 के बीच इस काम के लिए हर समय बहुत गर्मी है। धूप का काम रोकें, या छाँव में हल्का काम करें।",
    then: "फिर",
    stopLine: "{from}–{to} धूप में काम बंद",
    usualShift: "रोज़ की शिफ़्ट {from}–{to}",
    thisPlan: "यह योजना",
    safeWork: "सुरक्षित काम",
    unsafeHours: "{n} असुरक्षित घंटे",
    onSite: "साइट पर {n} घंटे",
    noChangeNote: "रोज़ की {from}–{to} शिफ़्ट सुरक्षित सीमा में है। नीचे बताए आराम और पानी का ध्यान रखें।",
    shortNote: "इस दिन सिर्फ़ {n} सुरक्षित घंटे हैं। सबसे भारी काम किसी ठंडे दिन करें।",
    hourByHour: "हर घंटे का हाल",
    legendGreen: "सुरक्षित: 50 मिनट काम, 10 मिनट आराम",
    legendAmber: "सावधान: हर घंटे 30 से 45 मिनट आराम",
    legendRed: "रोकें: धूप में काम बंद",
    showTable: "तालिका में देखें",
    legendWork: "काम के तय घंटे",
    noWorkBar: "काम बंद",
    tapHint: "पूरी जानकारी के लिए किसी घंटे पर दबाएँ।",
    detail: "{from}–{to}: {temp}°C, नमी {rh}%, हवा {wind} मी/से। गर्मी का दबाव (WBGT) {wbgt}°C। {advice}",
    adviceWork: "{w} मिनट काम, {r} मिनट छाँव में आराम।",
    adviceStop: "धूप में काम रोकें।",
    method: "गर्मी का दबाव (WBGT) मौसम के आँकड़ों से निकाला गया अनुमान है: तापमान, नमी, हवा और धूप (Open-Meteo)। यह साइट पर नापा नहीं गया है, इसलिए हर घंटे को ACGIH सीमा से {m}°C सख़्त परखा गया है। {workload} काम के लिए: {a}°C तक सुरक्षित, {b}°C से ऊपर काम बंद।",
    thHour: "घंटा", thTemp: "तापमान", thRh: "नमी", thWbgt: "WBGT", thStatus: "स्थिति", thWork: "काम / आराम",
    statusGreen: "सुरक्षित", statusAmber: "सावधान", statusRed: "रोकें",
    restWater: "आराम और पानी",
    waterEach: "हर मज़दूर के लिए पानी",
    waterCrew: "{n} मज़दूरों के लिए पानी",
    restEach: "हर घंटे आराम",
    litres: "{n} लीटर",
    minutes: "{n} मिनट",
    waterRule: "हर 20 मिनट में एक गिलास, प्यास न लगे तब भी। पानी छाँव में रखें।",
    briefing: "मज़दूरों के लिए सूचना",
    briefingLang: "सूचना की भाषा",
    briefingHint: "काम शुरू होने से पहले इसे सबको सुनाएँ।",
    play: "सूचना सुनाएँ",
    stop: "रोकें",
    preparing: "आवाज़ तैयार हो रही है…",
    whatsapp: "WhatsApp पर भेजें",
    copy: "टेक्स्ट कॉपी करें",
    copied: "कॉपी हो गया",
    srcAgent: "शब्द Strands एजेंट के, आँकड़े योजना से मिलाए गए।",
    srcTemplate: "तय शब्दों में।",
    voicePolly: "आवाज़: Amazon Polly।",
    voiceDevice: "आवाज़: इसी फ़ोन की।",
    noVoice: "इस फ़ोन में इस भाषा की आवाज़ नहीं है। टेक्स्ट पढ़कर सुनाएँ या WhatsApp पर भेजें।",
    saveSite: "रोज़ सुबह 5 बजे नई योजना के लिए यह साइट सहेजें",
    saved: "सहेज लिया। हर सुबह 5 बजे नई योजना तैयार होगी।",
    saveFail: "साइट सहेजी नहीं जा सकी।",
    remove: "{name} हटाएँ",
    footer: "यह सिर्फ़ योजना बनाने के लिए सलाह है। किसी में लू के लक्षण दिखें तो तुरंत काम रोकें और प्राथमिक उपचार दें।",
    hUnit: "घंटे", mUnit: "मिनट",
    waTitle: "गर्मी की योजना", waWork: "काम", waStop: "धूप में काम बंद", waRest: "हर घंटे छाँव में आराम",
    waWater: "पानी", waWaterEach: "लीटर हर साथी, हर 20 मिनट में एक गिलास", waPeak: "सबसे ज़्यादा गर्मी", waNoWork: "कोई सुरक्षित समय नहीं। धूप का काम बंद।",
  },
};

const $ = (id) => document.getElementById(id);
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

const state = {
  lang: store.get("lang") === "hi" ? "hi" : "en",
  blang: "hi",
  place: null,
  request: null,
  plan: null,
  day: 0,
  selectedHour: null,
  briefings: new Map(),
  audio: null,
  speaking: false,
};

function t(key, vars = {}, lang = state.lang) {
  return STR[lang][key].replace(/\{(\w+)\}/g, (_, name) => vars[name]);
}
const hh = (hour) => `${String(hour).padStart(2, "0")}:00`;
const span = (b) => `${hh(b.start)}–${hh(b.end)}`;
function duration(minutes, lang = state.lang) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return [h ? `${h} ${STR[lang].hUnit}` : "", m || !h ? `${m} ${STR[lang].mUnit}` : ""].filter(Boolean).join(" ");
}
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function applyI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((n) => { n.placeholder = t(n.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria]").forEach((n) => { n.setAttribute("aria-label", t(n.dataset.i18nAria)); });
  $("lang").textContent = t("langButton");
  if (state.plan) render();
  renderSaved();
}

/* ---------- place search ---------- */

let searchTimer;
async function geocode(query) {
  const url = `${GEOCODE}?name=${encodeURIComponent(query)}&count=5&language=${state.lang}&countryCode=IN`;
  const data = await (await fetch(url)).json();
  return (data.results || []).map((r) => ({
    lat: r.latitude,
    lon: r.longitude,
    label: r.name,
    region: [r.admin2, r.admin1].filter((x) => x && x !== r.name).join(", "),
  }));
}

function choosePlace(place) {
  state.place = place;
  $("place").value = place.label;
  $("suggest").hidden = true;
  $("placeStatus").textContent = "";
}

$("place").addEventListener("input", () => {
  state.place = null;
  clearTimeout(searchTimer);
  const query = $("place").value.trim();
  if (query.length < 3) { $("suggest").hidden = true; return; }
  searchTimer = setTimeout(async () => {
    try {
      const places = await geocode(query);
      if ($("place").value.trim() !== query || state.place) return;
      $("suggest").replaceChildren(...places.map((p) => {
        const button = el("button", { type: "button" }, p.label, el("small", {}, p.region));
        button.addEventListener("click", () => choosePlace(p));
        return el("li", {}, button);
      }));
      $("suggest").hidden = places.length === 0;
    } catch { /* suggestions are optional */ }
  }, 300);
});

$("locate").addEventListener("click", () => {
  if (!navigator.geolocation) { $("placeStatus").textContent = t("locateFail"); return; }
  $("placeStatus").textContent = t("locating");
  navigator.geolocation.getCurrentPosition(
    (pos) => choosePlace({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: t("myLocation") }),
    () => { $("placeStatus").textContent = t("locateFail"); },
    { timeout: 10000 },
  );
});

/* ---------- plan ---------- */

async function api(path, options) {
  const res = await fetch(API + path, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function currentRequest() {
  return {
    lat: state.place.lat,
    lon: state.place.lon,
    site: $("site").value.trim() || state.place.label,
    workload: document.querySelector('input[name="workload"]:checked').value,
    crew: Math.max(1, Number($("crew").value) || 1),
    replay: $("replay").checked,
  };
}

$("form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("error").hidden = true;
  $("go").disabled = true;
  $("go").textContent = t("loading");
  try {
    if (!state.place) {
      const places = await geocode($("place").value.trim());
      if (!places.length) throw new Error(t("noPlace"));
      choosePlace(places[0]);
    }
    const req = currentRequest();
    const query = new URLSearchParams({ lat: req.lat, lon: req.lon, workload: req.workload, site: req.site, replay: req.replay ? 1 : 0 });
    state.plan = await api(`/plan?${query}`);
    state.request = req;
    state.day = 0;
    state.selectedHour = null;
    state.briefings.clear();
    store.set("place", JSON.stringify(state.place));
    $("saveStatus").textContent = "";
    $("result").hidden = false;
    render();
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    $("error").textContent = err instanceof TypeError ? t("planFail") : err.message;
    $("error").hidden = false;
  } finally {
    $("go").disabled = false;
    $("go").textContent = t("makePlan");
  }
});

function dayLabel(index) {
  const day = state.plan.days[index];
  const date = new Intl.DateTimeFormat(state.lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short" })
    .format(new Date(`${day.date}T00:00`));
  const name = state.plan.replay_date ? t(index ? "nextDay" : "replayDay") : t(index ? "tomorrow" : "today");
  return `${name} · ${date}`;
}

function render() {
  stopVoice();
  const { plan, request } = state;
  const day = plan.days[state.day];
  const { planned, usual } = day;

  document.querySelectorAll(".tabs button").forEach((tab) => {
    const index = Number(tab.dataset.day);
    tab.hidden = !plan.days[index];
    if (plan.days[index]) tab.textContent = dayLabel(index);
    tab.setAttribute("aria-selected", String(index === state.day));
  });

  /* shift card */
  if (!planned.blocks.length) {
    $("shiftEyebrow").textContent = t("noWork");
    $("shiftTimes").textContent = "";
    $("shiftStop").textContent = t("noWorkBody");
    $("compare").replaceChildren();
  } else {
    $("shiftEyebrow").textContent = t(day.changed ? "recommended" : "noChange");
    const parts = planned.blocks.flatMap((b, i) => (i ? [el("span", { className: "then" }, t("then")), span(b)] : [span(b)]));
    $("shiftTimes").replaceChildren(...parts);
    $("shiftStop").textContent = day.stop ? t("stopLine", { from: hh(day.stop.start), to: hh(day.stop.end) }) : "";
    const box = (label, minutes, sub) => el("div", {},
      el("span", { className: "label" }, label),
      el("span", { className: "big" }, duration(minutes)),
      el("span", { className: "sub" }, `${t("safeWork")} · ${sub}`));
    const boxes = day.changed
      ? [
        box(t("usualShift", { from: hh(usual.blocks[0].start), to: hh(usual.blocks[0].end) }), usual.work_min, t("unsafeHours", { n: usual.red_hours })),
        box(t("thisPlan"), planned.work_min, `${t("unsafeHours", { n: 0 })} · ${t("onSite", { n: planned.hours_on_site })}`),
      ]
      : [el("p", { className: "note hint" }, t("noChangeNote", { from: hh(usual.blocks[0].start), to: hh(usual.blocks[0].end) }))];
    if (planned.hours_on_site < usual.hours_on_site) {
      boxes.push(el("p", { className: "note hint" }, t("shortNote", { n: planned.hours_on_site })));
    }
    $("compare").replaceChildren(...boxes);
  }

  /* hour strip */
  const first = day.hours[0].hour;
  document.querySelector(".chart").style.setProperty("--cols", day.hours.length);
  $("strip").replaceChildren(...day.hours.map((h) => {
    const cell = el("button", { type: "button", className: `cell ${h.level}` },
      el("span", { className: "hr" }, String(h.hour).padStart(2, "0")),
      el("span", { className: "mark" }, MARK[h.level]),
      el("span", { className: "tmp" }, `${Math.round(h.temp)}°`));
    cell.setAttribute("aria-label", hourDetail(h));
    cell.setAttribute("aria-pressed", String(state.selectedHour === h.hour));
    const select = () => {
      state.selectedHour = h.hour;
      $("detail").textContent = hourDetail(h);
      $("strip").querySelectorAll(".cell").forEach((c) => c.setAttribute("aria-pressed", String(c === cell)));
    };
    cell.addEventListener("click", select);
    cell.addEventListener("mouseenter", select);
    cell.addEventListener("focus", select);
    return cell;
  }));
  const bars = planned.blocks.map((b) => {
    const bar = el("div", { className: "work" }, `${String(b.start).padStart(2, "0")}–${String(b.end).padStart(2, "0")}`);
    bar.style.gridColumn = `${b.start - first + 1} / ${b.end - first + 1}`;
    return bar;
  });
  if (day.stop) {
    const bar = el("div", { className: "nowork" }, t("noWorkBar"));
    bar.style.gridColumn = `${day.stop.start - first + 1} / ${day.stop.end - first + 1}`;
    bars.push(bar);
  }
  $("workbar").replaceChildren(...bars);
  const selected = day.hours.find((h) => h.hour === state.selectedHour);
  $("detail").textContent = selected ? hourDetail(selected) : t("tapHint");

  $("table").replaceChildren(
    el("thead", {}, el("tr", {}, ...["thHour", "thTemp", "thRh", "thWbgt", "thStatus", "thWork"].map((k) => el("th", { scope: "col" }, t(k))))),
    el("tbody", {}, ...day.hours.map((h) => el("tr", {},
      el("td", {}, `${hh(h.hour)}–${hh(h.hour + 1)}`),
      el("td", {}, `${h.temp.toFixed(1)}°C`),
      el("td", {}, `${h.rh}%`),
      el("td", {}, `${h.wbgt.toFixed(1)}°C`),
      el("td", {}, `${MARK[h.level]} ${t(`status${h.level[0].toUpperCase()}${h.level.slice(1)}`)}`),
      el("td", {}, h.work_min ? `${h.work_min} / ${60 - h.work_min}` : "0 / 60")))),
  );
  const margin = plan.margin_c || 0;
  $("method").textContent = t("method", {
    workload: t(plan.workload),
    m: margin,
    a: plan.limits_wbgt_c[0] - margin,
    b: plan.limits_wbgt_c[2] - margin,
  });

  /* rest and water */
  $("waterEach").textContent = t("litres", { n: day.water_l_per_worker });
  $("waterCrewLabel").textContent = t("waterCrew", { n: request.crew });
  $("waterCrew").textContent = t("litres", { n: Math.ceil(day.water_l_per_worker * request.crew) });
  const rest = day.rest_min;
  $("restEach").textContent = rest.length ? t("minutes", { n: rest.length > 1 ? `${rest[0]}–${rest[rest.length - 1]}` : rest[0] }) : "–";

  renderBriefing();
}

function hourDetail(h) {
  const advice = h.work_min ? t("adviceWork", { w: h.work_min, r: 60 - h.work_min }) : t("adviceStop");
  return t("detail", { from: hh(h.hour), to: hh(h.hour + 1), temp: h.temp.toFixed(1), rh: h.rh, wind: h.wind.toFixed(1), wbgt: h.wbgt.toFixed(1), advice });
}

document.querySelectorAll(".tabs button").forEach((tab) => tab.addEventListener("click", () => {
  state.day = Number(tab.dataset.day);
  state.selectedHour = null;
  render();
}));

/* ---------- briefing ---------- */

function whatsappText(day, lang) {
  const s = (key) => STR[lang][key];
  const lines = [`*${s("waTitle")}: ${state.request.site}, ${day.date}*`];
  if (!day.planned.blocks.length) {
    lines.push(s("waNoWork"));
  } else {
    lines.push(`${s("waWork")}: ${day.planned.blocks.map(span).join(", ")}`);
    if (day.stop) lines.push(`${s("waStop")}: ${hh(day.stop.start)}–${hh(day.stop.end)}`);
    const rest = day.rest_min;
    lines.push(`${s("waRest")}: ${rest.length > 1 ? `${rest[0]}–${rest[rest.length - 1]}` : rest[0]} ${s("mUnit")}`);
    lines.push(`${s("waWater")}: ${day.water_l_per_worker} ${s("waWaterEach")}`);
  }
  lines.push(`${s("waPeak")}: ${hh(day.peak.hour)}, ${Math.round(day.peak.temp)}°C`);
  return lines.join("\n");
}

function fetchBriefing() {
  const key = `${state.day}|${state.blang}`;
  if (!state.briefings.has(key)) {
    const day = state.plan.days[state.day];
    const { lat, lon, workload, site, replay } = state.request;
    const fallback = { script: day.scripts[state.blang], source: "template", audio_b64: null };
    state.briefings.set(key, api("/briefing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat, lon, workload, site, replay, when: day.when, lang: state.blang }),
    }).catch(() => fallback));
  }
  return state.briefings.get(key);
}

function renderBriefing() {
  const day = state.plan.days[state.day];
  const key = `${state.day}|${state.blang}`;
  document.querySelectorAll("[data-blang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.blang === state.blang)));
  $("script").lang = state.blang;
  $("script").textContent = day.scripts[state.blang];
  $("scriptSource").textContent = "";
  $("play").textContent = t("play");
  $("whatsapp").href = `https://wa.me/?text=${encodeURIComponent(whatsappText(day, state.blang))}`;
  fetchBriefing().then((b) => {
    if (key !== `${state.day}|${state.blang}`) return;
    $("script").textContent = b.script;
    $("scriptSource").textContent = `${t(b.source === "agent" ? "srcAgent" : "srcTemplate")} ${t(b.audio_b64 ? "voicePolly" : "voiceDevice")}`;
  });
}

function stopVoice() {
  if (state.audio) { state.audio.pause(); state.audio = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
  state.speaking = false;
  $("play").textContent = t("play");
}

$("play").addEventListener("click", async () => {
  if (state.speaking) { stopVoice(); return; }
  $("play").textContent = t("preparing");
  const lang = state.blang;
  const b = await fetchBriefing();
  const done = () => { state.speaking = false; state.audio = null; $("play").textContent = t("play"); };
  state.speaking = true;
  $("play").textContent = t("stop");
  if (b.audio_b64) {
    state.audio = new Audio(`data:audio/mpeg;base64,${b.audio_b64}`);
    state.audio.addEventListener("ended", done);
    state.audio.play().catch(done);
    return;
  }
  const code = lang === "hi" ? "hi-IN" : "en-IN";
  const voice = window.speechSynthesis && speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(lang));
  if (!voice && lang === "hi") {
    done();
    $("scriptSource").textContent = t("noVoice");
    return;
  }
  const utterance = new SpeechSynthesisUtterance(b.script);
  utterance.lang = code;
  if (voice) utterance.voice = voice;
  utterance.rate = 0.9;
  utterance.onend = utterance.onerror = done;
  speechSynthesis.speak(utterance);
});
if (window.speechSynthesis) speechSynthesis.getVoices();

document.querySelectorAll("[data-blang]").forEach((button) => button.addEventListener("click", () => {
  stopVoice();
  state.blang = button.dataset.blang;
  renderBriefing();
}));

$("copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText($("script").textContent);
  $("copy").textContent = t("copied");
  setTimeout(() => { $("copy").textContent = t("copy"); }, 1500);
});

/* ---------- saved sites ---------- */

let savedSites = [];

function renderSaved() {
  $("saved").hidden = savedSites.length === 0;
  const todayIso = new Date().toLocaleDateString("en-CA");
  $("savedList").replaceChildren(...savedSites.map((site) => {
    const fresh = site.latest && site.latest.date === todayIso;
    const summary = fresh
      ? (site.latest.blocks.length ? `${t("today")}: ${site.latest.blocks.map(span).join(", ")}` : t("noWork"))
      : `${t(site.workload)} · ${site.crew}`;
    const open = el("button", { type: "button" }, el("b", {}, site.name), el("small", {}, summary));
    open.addEventListener("click", () => {
      choosePlace({ lat: site.lat, lon: site.lon, label: site.name });
      $("site").value = site.name;
      $("crew").value = site.crew;
      document.querySelector(`input[name="workload"][value="${site.workload}"]`).checked = true;
      $("replay").checked = false;
      $("form").requestSubmit();
    });
    const remove = el("button", { type: "button", className: "remove" }, "✕");
    remove.setAttribute("aria-label", t("remove", { name: site.name }));
    remove.addEventListener("click", async () => {
      await api(`/sites/${encodeURIComponent(site.id)}`, { method: "DELETE" }).catch(() => {});
      loadSaved();
    });
    return el("li", {}, open, remove);
  }));
}

async function loadSaved() {
  try { savedSites = (await api("/sites")).sites; } catch { savedSites = []; }
  renderSaved();
}

$("save").addEventListener("click", async () => {
  const { lat, lon, workload, site, crew } = state.request;
  try {
    await api("/sites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lat, lon, workload, crew, name: site }),
    });
    $("saveStatus").textContent = t("saved");
    loadSaved();
  } catch {
    $("saveStatus").textContent = t("saveFail");
  }
});

/* ---------- start ---------- */

$("lang").addEventListener("click", () => {
  state.lang = state.lang === "en" ? "hi" : "en";
  store.set("lang", state.lang);
  applyI18n();
});

try {
  const last = JSON.parse(store.get("place"));
  if (last && typeof last.lat === "number") choosePlace(last);
} catch { /* no saved place */ }
applyI18n();
loadSaved();

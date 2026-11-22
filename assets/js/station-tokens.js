/* Station 1 · Token Counter. Uses the bundled gpt-tokenizer (o200k_base, MIT licence). */
(function () {
  const LESSON = "1.1", STATION = "tokens";
  const $ = id => document.getElementById(id);
  const u = Store.currentUser();
  if (!u) return;
  $("year").textContent = new Date().getFullYear();
  $("navUser").textContent = `Hi, ${u.name}`;

  const tk = window.GPTTokenizer_o200k_base;
  if (!tk) { $("loading").textContent = "The tokenizer could not load. Refresh the page to try again."; return; }
  $("loading").hidden = true;

  // DRAFT examples for Chris to review
  const PRESETS = [
    { group: "School", items: [
      { label: "Homework (English)", text: "Please hand in your homework by Friday." },
      { label: "Homework (中文)", text: "請在星期五前交功課。" },
    ]},
    { group: "Work", items: [
      { label: "Email (English)", text: "Please find attached the quarterly report." },
      { label: "Email (中文)", text: "請查收附件中的季度報告。" },
    ]},
    { group: "Words", items: [
      { label: "the", text: "the" },
      { label: "unbelievable", text: "unbelievable" },
      { label: "Mississippi", text: "Mississippi" },
      { label: "supercalifragilistic", text: "supercalifragilisticexpialidocious" },
    ]},
  ];
  $("presets").innerHTML = PRESETS.map(g =>
    `<span class="lbl">${g.group}:</span>` + g.items.map((p, i) =>
      `<button type="button" class="chip-btn" data-text="${p.text.replace(/"/g, "&quot;")}">${p.label}</button>`).join("")
  ).join("");

  const saved = (() => { try { return JSON.parse(JSON.stringify(Store.currentUser().lessons?.[LESSON]?.stations?.[STATION]?.data || {})); } catch (e) { return {}; } })();
  const state = { t1: !!saved.t1, t2: !!saved.t2, en: saved.en ?? null, zh: saved.zh ?? null };
  if (Store.stationStatus(LESSON, STATION) === "new") Store.setStation(LESSON, STATION, "started", {});

  const CJK = /[㐀-鿿豈-﫿]/g;
  const LATIN = /[A-Za-z]/;

  // Turn token ids into readable chunks. A Chinese character can span several tokens;
  // those are grouped into one block with a small count.
  function chunks(ids) {
    const out = []; let buf = [];
    ids.forEach((id, i) => {
      buf.push(id);
      const s = tk.decode(buf);
      if (s.includes("�") && i < ids.length - 1 && buf.length < 4) return;
      out.push({ text: s, n: buf.length }); buf = [];
    });
    return out;
  }

  function wordsIn(text) {
    const latin = (text.match(/[A-Za-z0-9’']+/g) || []).length;
    const cjk = (text.match(CJK) || []).length;
    return latin + cjk;   // each Chinese character counted as one word
  }

  let colour = 0;
  function render() {
    const text = $("text").value;
    const ids = text ? tk.encode(text) : [];
    $("nTokens").textContent = ids.length;
    $("nWords").textContent = wordsIn(text);
    $("nChars").textContent = [...text].length;
    if (!ids.length) { $("tokens").innerHTML = '<span class="empty">Your tokens will appear here.</span>'; return; }
    colour = 0;
    $("tokens").innerHTML = chunks(ids).map(c => {
      const show = c.text.replace(/ /g, "·").replace(/\n/g, "↵");
      const cls = `tok c${colour++ % 4}${/^\s+$/.test(c.text) ? " space" : ""}`;
      const esc = show.replace(/[&<>]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]));
      return `<span class="${cls}" title="${c.n} token${c.n > 1 ? "s" : ""}">${esc}${c.n > 1 ? `<sup>${c.n}</sup>` : ""}</span>`;
    }).join("");
    check(text, ids.length);
  }

  function check(text, n) {
    const t = text.trim();
    const oneWord = t && !/\s/.test(t) && LATIN.test(t) && !CJK.test(t);
    CJK.lastIndex = 0;
    if (oneWord && /^[A-Za-z]{3,}$/.test(t) && n === 1) state.t1 = true;
    if (oneWord && n >= 4) state.t2 = true;
    const cjkCount = (t.match(CJK) || []).length;
    const latinWords = (t.match(/[A-Za-z]+/g) || []).length;
    if (cjkCount >= 4) state.zh = n;
    else if (latinWords >= 4) state.en = n;
    paint();
  }

  function paint() {
    $("task1").classList.toggle("done", state.t1);
    $("task2").classList.toggle("done", state.t2);
    const t3 = state.en != null && state.zh != null;
    $("task3").classList.toggle("done", t3);
    $("cmpEn").textContent = state.en ?? "–";
    $("cmpZh").textContent = state.zh ?? "–";
    $("cmpDiff").textContent = t3 ? (state.zh === state.en ? "Same" : (state.zh > state.en ? `+${state.zh - state.en} ZH` : `+${state.en - state.zh} EN`)) : "–";
    const all = state.t1 && state.t2 && t3;
    const isDone = Store.stationStatus(LESSON, STATION) === "done";
    $("completeBtn").disabled = !all || isDone;
    $("completeBtn").textContent = isDone ? "Station complete" : "Mark station complete";
    $("doneMsg").hidden = !isDone;
    Store.setStation(LESSON, STATION, isDone ? "done" : "started", { t1: state.t1, t2: state.t2, en: state.en, zh: state.zh });
  }

  let timer;
  $("text").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 120); });
  $("presets").addEventListener("click", e => {
    const b = e.target.closest("[data-text]"); if (!b) return;
    $("text").value = b.dataset.text; render(); $("text").focus();
  });
  $("completeBtn").addEventListener("click", () => {
    Store.setStation(LESSON, STATION, "done", { t1: state.t1, t2: state.t2, en: state.en, zh: state.zh });
    paint();
  });

  if (saved.lastText) $("text").value = saved.lastText;
  $("text").addEventListener("blur", () => Store.setStation(LESSON, STATION, Store.stationStatus(LESSON, STATION), { lastText: $("text").value.slice(0, 500) }));
  render(); paint();
})();

/* Station 4 · Training & Model Size. */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const main = Page.shell({
    id: "training", crumb: "Station 4", kicker: "Station 4 · 3 minutes", title: "Training & Model Size",
    lead: "Before an LLM can chat, it reads an enormous amount of text (training). What it learns is stored in billions of numbers called <b>parameters</b>. And it only knows what it read before training ended.",
  });
  const st = Page.station("training");

  // Facts used (public figures): Meta reported Llama 3 was pre-trained on over 15 trillion tokens (2024).
  // Parameters: GPT-2 1.5B (OpenAI, 2019), GPT-3 175B (OpenAI, 2020), Llama 3.1 405B (Meta, 2024).
  const TRAIN_TOKENS = 15e12, WORDS_PER_TOKEN = 0.75, READ_WPM = 250;
  // Sizes from public reports. Kimi K3 figures vary slightly between sources (about 2.7–2.8 trillion).
  // Companies do not publish sizes for Gemini, ChatGPT or Claude.
  const MODELS = [
    { id: "gpt2", name: "GPT-2", year: "2019", b: 1.5, note: "OpenAI’s early model. It could write a paragraph, but often drifted off topic." },
    { id: "gpt3", name: "GPT-3", year: "2020", b: 175, note: "The model family that later led to ChatGPT in 2022." },
    { id: "llama", name: "Llama 3.1", year: "2024", b: 405, note: "Meta’s biggest open model in 2024." },
    { id: "kimi2", name: "Kimi K2", year: "July 2025", b: 1000, note: "From Moonshot AI in China. About 1 trillion parameters, but it only uses about 32 billion of them for each answer, which saves computing power." },
    { id: "kimi3", name: "Kimi K3", year: "2026", b: 2800, approx: true, note: "One of the biggest open models released this year. Like Kimi K2, it only uses part of itself for each answer." },
  ];
  const MAX_B = 2800;
  // DRAFT events for Chris to review.
  const EVENTS = [
    { when: "2017-06", label: "Google publishes the Transformer paper" },
    { when: "2022-11", label: "ChatGPT launches" },
    { when: "2022-12", label: "Argentina wins the FIFA World Cup" },
    { when: "2026-03", label: "Gemini opens to everyone in Hong Kong" },
    { when: "today", label: "What you had for breakfast today" },
  ];
  const START = new Date(2020, 0, 1);
  const monthsTotal = (2026 - 2020) * 12 + 10; // Jan 2020 → Nov 2026
  const fmt = d => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  const saved = st.data();
  const state = { hoursSet: !!saved.hoursSet, seen: new Set(saved.seen || []), cutoffOk: !!saved.cutoffOk };

  main.innerHTML = `<div class="station-grid"><div>
    <section class="panel-box"><h2>1. How much does an AI read?</h2>
      <p class="sub">Meta says its Llama 3 model was trained on more than <b>15 trillion tokens</b> of text. How long would that take you to read?</p>
      <div class="slider-row"><span>I read</span><input type="range" id="hours" min="1" max="24" step="1" value="${saved.hours || 8}" aria-label="Hours of reading per day"><span id="hoursOut"></span></div>
      <div class="calc"><div><b id="words"></b><span>Words to read</span></div><div><b id="years"></b><span>Years it would take you</span></div></div>
      <p class="fine">Based on reading 250 words a minute, every day of the year, with no holidays.</p></section>

    <section class="panel-box"><h2>2. How big is the model?</h2>
      <p class="sub">Tap each model to learn about it. The bars show the number of parameters (the “knobs” the model adjusts while learning). Look how fast they have grown since 2019.</p>
      <div class="models" id="models">${MODELS.map(m => `<button type="button" class="model" data-id="${m.id}">
        <span class="name">${esc(m.name)}<small>${m.year}</small></span>
        <span class="track"><span class="fill" style="width:${m.b / MAX_B * 100}%"></span><span class="val">${m.approx ? "about " : ""}${m.b >= 1000 ? (m.b / 1000) + " trillion" : m.b + " billion"}</span></span></button>`).join("")}</div>
      <div class="callout model-info" id="modelInfo">Tap a model above.</div></section>

    <section class="panel-box"><h2>3. Knowledge cutoff</h2>
      <p class="sub">Slide to choose when the model’s training ended. It only knows events from before that date.</p>
      <p class="cutoff-out">Training ended: <span id="cutOut"></span></p>
      <input type="range" id="cutoff" min="0" max="${monthsTotal}" step="1" value="${saved.cutoff ?? 24}" aria-label="Training end date">
      <ul class="events" id="events"></ul>
      <div class="callout" style="margin-top:14px"><b>Your mission:</b> find a date where the model knows ChatGPT launched but does <b>not</b> know Gemini opened in Hong Kong.</div></section>
  </div><aside>
    ${Page.tasksPanel([["Work out your reading time", "Move the hours slider."], ["Tap all five models", "From 2019 to this year."], ["Complete the cutoff mission", "Find the right training end date."]])}
    ${Page.learnBox("What this means for you", ["LLMs learn from huge amounts of human writing, including its mistakes and bias.", "Bigger models are usually more capable, but cost more to run.", "A model does not know recent events unless it searches the web.", "Always check dates, prices and news with a current source."])}
  </aside></div>`;

  const big = n => n >= 1e12 ? (n / 1e12).toFixed(1).replace(/\.0$/, "") + " trillion" : n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, "") + " billion" : Math.round(n).toLocaleString("en-GB");
  function calc(fromUser) {
    const h = +document.getElementById("hours").value;
    const words = TRAIN_TOKENS * WORDS_PER_TOKEN;
    const years = words / READ_WPM / 60 / h / 365;
    document.getElementById("hoursOut").textContent = `${h} hour${h > 1 ? "s" : ""} a day`;
    document.getElementById("words").textContent = big(words);
    document.getElementById("years").textContent = Math.round(years).toLocaleString("en-GB");
    if (fromUser) state.hoursSet = true;
    paint({ hours: h });
  }
  document.getElementById("hours").addEventListener("input", () => calc(true));

  document.getElementById("models").addEventListener("click", e => {
    const b = e.target.closest(".model"); if (!b) return;
    const m = MODELS.find(x => x.id === b.dataset.id);
    state.seen.add(m.id); b.classList.add("seen");
    const size = m.b >= 1000 ? `${m.approx ? "about " : ""}${m.b / 1000} trillion` : `${m.b} billion`;
    const times = m.id === "gpt2" ? "" : ` That is about ${Math.round(m.b / 1.5).toLocaleString("en-GB")} times bigger than GPT-2.`;
    document.getElementById("modelInfo").textContent = `${m.name} (released ${m.year}): ${size} parameters. ${m.note}${times}`;
    paint();
  });
  state.seen.forEach(id => document.querySelector(`.model[data-id="${id}"]`)?.classList.add("seen"));

  function cut(fromUser) {
    const v = +document.getElementById("cutoff").value;
    const d = new Date(START.getFullYear(), START.getMonth() + v, 1);
    document.getElementById("cutOut").textContent = fmt(d);
    const known = ev => ev.when !== "today" && new Date(ev.when + "-01") < d;
    document.getElementById("events").innerHTML = EVENTS.map(ev => `<li><span class="when">${ev.when === "today" ? "Today" : fmt(new Date(ev.when + "-01"))}</span>
      <span>${esc(ev.label)}</span><span class="k ${known(ev) ? "yes" : "no"}">${known(ev) ? "✓ Knows" : "? Doesn’t know"}</span></li>`).join("");
    const ok = known(EVENTS[1]) && !known(EVENTS[3]);
    if (ok && fromUser && !state.cutoffOk) { state.cutoffOk = true; Page.toast("Mission complete: that model would be out of date about Hong Kong."); }
    paint({ cutoff: v });
  }
  document.getElementById("cutoff").addEventListener("input", () => cut(true));

  function paint(patch = {}) {
    const extra = () => ({ hoursSet: state.hoursSet, seen: [...state.seen], cutoffOk: state.cutoffOk });
    st.save({ ...extra(), ...patch });
    Page.paintTasks(st, [state.hoursSet, state.seen.size >= MODELS.length, state.cutoffOk], extra);
  }
  calc(false); cut(false);
})();

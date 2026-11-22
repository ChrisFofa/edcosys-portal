/* Station 2 · Next-Word Predictor. Numbers are illustrative teaching examples, not output from a real model. */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const main = Page.shell({
    id: "next-word", crumb: "Station 2", kicker: "Station 2 · 4 minutes", title: "Next-Word Predictor",
    lead: "An LLM writes by guessing the most likely next word, again and again. Pick a sentence, make your own guess, then see how a model would score every option.",
  });
  const st = Page.station("next-word");

  // DRAFT sentences for Chris to review. Scores are for teaching, not from a real model.
  const S = [
    { id: "attached", where: "Work", start: "Please find attached the", words: { file: 62, report: 21, invoice: 9, document: 6, banana: 0.1 } },
    { id: "late", where: "Work", start: "Sorry for the late", words: { reply: 58, response: 22, email: 12, notice: 5, dinosaur: 0.1 } },
    { id: "homework", where: "School", start: "Please hand in your", words: { homework: 55, assignment: 25, essay: 10, phone: 6, form: 4 } },
    { id: "once", where: "School", start: "Once upon a", words: { time: 92, hill: 3, dream: 2, day: 2, Tuesday: 1 } },
    { id: "food", where: "Open question", start: "My favourite food is", words: { pizza: 14, sushi: 12, ramen: 10, "dim sum": 10, chocolate: 9, rice: 8, pasta: 8, curry: 7 } },
  ];
  const saved = st.data();
  const state = { revealed: new Set(saved.revealed || []), variety: saved.variety || 0, triedOpen: !!saved.triedOpen, current: S[0].id, temp: 1, guesses: {}, history: [] };

  main.innerHTML = `<div class="station-grid"><div>
    <section class="panel-box"><h2>1. Pick a sentence</h2><p class="sub">Work and school examples, plus one open question.</p>
      <div class="sentence-pick" id="pick">${S.map(s => `<button type="button" data-id="${s.id}"><span>${esc(s.start)} …</span><small>${esc(s.where)}</small></button>`).join("")}</div></section>
    <section class="panel-box"><h2>2. Make your guess</h2>
      <p class="big-sentence" id="sentence"></p>
      <div class="row-actions"><label for="guess" class="sr" style="position:absolute;left:-9999px">Your guess</label>
        <input class="text" id="guess" placeholder="Type the next word" maxlength="20" style="flex:1">
        <button class="btn btn-navy btn-sm" id="reveal">Reveal the scores</button></div>
      <div id="scores" hidden>
        <h3 class="h3">How likely is each next word?</h3>
        <div class="probs" id="probs"></div>
        <div class="callout" id="guessMsg" hidden></div>
        <div class="slider-row"><span>Safe</span><input type="range" id="temp" min="0.2" max="2" step="0.1" value="1" aria-label="Creativity"><span>Creative</span></div>
        <p class="fine" style="margin-top:6px">This is the <b>creativity</b> setting (called “temperature”). Low = always the top word. High = surprising words get more chances.</p>
        <div class="row-actions"><button class="btn btn-outline btn-sm" id="gen">Let the AI pick a word</button><span class="fine" style="margin:0">Press it a few times.</span></div>
        <ul class="history" id="history"></ul>
      </div>
      <p class="fine">These scores are teaching examples. Real models score thousands of possible words at every step.</p></section>
  </div><aside>
    ${Page.tasksPanel([["Reveal the scores for 3 sentences", "Guess first, then press Reveal."], ["Get 3 different words from the AI", "Turn creativity up and press “Let the AI pick” a few times on one sentence."], ["Try the open question", "“My favourite food is …” has no single right answer."]])}
    ${Page.learnBox("What this means for you", ["An LLM does not look up answers. It picks likely next words.", "That is why the same question can get different answers.", "A likely-sounding answer is not always a true one: always check facts.", "Lower creativity suits facts and emails. Higher suits ideas and stories."])}
  </aside></div>`;

  const cur = () => S.find(s => s.id === state.current);
  function dist(s, T) {
    const entries = Object.entries(s.words);
    const w = entries.map(([, p]) => Math.pow(p, 1 / T));
    const sum = w.reduce((a, b) => a + b, 0);
    return entries.map(([word], i) => ({ word, p: w[i] / sum * 100 })).sort((a, b) => b.p - a.p);
  }
  function drawSentence() {
    const g = state.guesses[state.current];
    document.getElementById("sentence").innerHTML = `${esc(cur().start)} <span class="blank">${g ? esc(g) : "&nbsp;"}</span>`;
  }
  function drawProbs() {
    const d = dist(cur(), state.temp);
    const mine = (state.guesses[state.current] || "").toLowerCase();
    document.getElementById("probs").innerHTML = d.map((x, i) => `<div class="prob${i === 0 ? " top" : ""}${x.word.toLowerCase() === mine ? " mine" : ""}">
      <b>${esc(x.word)}</b><div class="track"><div class="fill" style="width:${Math.max(.6, x.p)}%"></div></div><span>${x.p < 1 ? x.p.toFixed(1) : Math.round(x.p)}%</span></div>`).join("");
  }
  function select(id) {
    state.current = id; state.history = [];
    document.querySelectorAll("#pick button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
    document.getElementById("guess").value = state.guesses[id] || "";
    document.getElementById("scores").hidden = !state.revealed.has(id) || !state.guesses[id];
    document.getElementById("history").innerHTML = "";
    if (id === "food") state.triedOpen = true;
    drawSentence(); if (!document.getElementById("scores").hidden) drawProbs();
    paint();
  }
  document.getElementById("pick").addEventListener("click", e => { const b = e.target.closest("button"); if (b) select(b.dataset.id); });
  document.getElementById("guess").addEventListener("keydown", e => { if (e.key === "Enter") document.getElementById("reveal").click(); });
  document.getElementById("reveal").addEventListener("click", () => {
    const g = document.getElementById("guess").value.trim();
    if (!g) { Page.toast("Type your guess first."); document.getElementById("guess").focus(); return; }
    state.guesses[state.current] = g; state.revealed.add(state.current);
    document.getElementById("scores").hidden = false;
    drawSentence(); drawProbs();
    const hit = dist(cur(), 1).find(x => x.word.toLowerCase() === g.toLowerCase());
    const top = dist(cur(), 1)[0];
    const msg = document.getElementById("guessMsg");
    msg.hidden = false;
    msg.className = "callout" + (hit && hit.word === top.word ? " ok" : "");
    msg.textContent = hit ? (hit.word === top.word ? `Spot on! “${hit.word}” is the model’s top pick. You think like an LLM.` : `“${hit.word}” is on the list, but the model’s top pick is “${top.word}”.`)
      : `“${g}” isn’t in the model’s top choices here. Its favourite is “${top.word}”. Not wrong, just less likely.`;
    paint();
  });
  document.getElementById("temp").addEventListener("input", e => { state.temp = +e.target.value; drawProbs(); });
  document.getElementById("gen").addEventListener("click", () => {
    const d = dist(cur(), state.temp);
    let r = Math.random() * 100, pick = d[d.length - 1].word;
    for (const x of d) { if ((r -= x.p) <= 0) { pick = x.word; break; } }
    state.history.unshift(pick); state.history = state.history.slice(0, 6);
    document.getElementById("history").innerHTML = state.history.map(w => `<li>${esc(cur().start)} <b>${esc(w)}</b></li>`).join("");
    state.variety = Math.max(state.variety, new Set(state.history).size);
    paint();
  });

  function paint() {
    const flags = [state.revealed.size >= 3, state.variety >= 3, state.triedOpen];
    const extra = () => ({ revealed: [...state.revealed], variety: state.variety, triedOpen: state.triedOpen });
    st.save(extra());
    Page.paintTasks(st, flags, extra);
  }
  select(S[0].id);
})();

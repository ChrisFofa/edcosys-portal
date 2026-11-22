/* Station 5 · Real or Made Up? Learners judge statements an AI assistant "said". */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const main = Page.shell({
    id: "real-or-fake", crumb: "Station 5", kicker: "Station 5 · 3 minutes", title: "Real or Made Up?",
    lead: "AI can make things up and say them confidently. This is called a <b>hallucination</b>. Read what each person asked and what the AI said. Is the answer real, or made up? You don’t need to be an AI expert: look for clues.",
  });
  const st = Page.station("real-or-fake");

  // DRAFT items for Chris to review. No AI news or history knowledge needed: every fake has a clue
  // you can spot with common sense (impossible date, famous name on a silly quote, made-up organisation, a book that doesn't exist).
  const ITEMS = [
    { id: "maths", where: "School", ask: "What is 15 × 4?", text: "15 × 4 = 60.", real: true,
      why: "Real. You can check it yourself in seconds. Simple facts like this are usually right, but it’s still good to check." },
    { id: "einstein", where: "School", ask: "Give me a famous quote about hard work for my essay.", text: "“Success is 1% talent and 99% bubble tea.” — Albert Einstein, 1921", real: false,
      why: "Made up. A famous name makes a quote sound real, but Einstein never said this. Search for any quote before you use it." },
    { id: "cny", where: "Work", ask: "When is the Lunar New Year holiday this year?", text: "Lunar New Year falls on 31 February this year, so the office will close that day.", real: false,
      why: "Made up. February never has 31 days! AI can mix up dates. Always check holidays on the official government calendar." },
    { id: "spider", where: "School", ask: "How many legs does a spider have?", text: "A spider has 8 legs.", real: true,
      why: "Real. This is a well-known fact, and easy to check in any science book." },
    { id: "eggtart", where: "Work", ask: "Find me a statistic for my presentation.", text: "A 2024 study by the Hong Kong Institute of Office Snacks found that 93% of staff work better after eating an egg tart.", real: false,
      why: "Made up. There is no such institute. A very exact number from an organisation you have never heard of is a warning sign. Ask for the link." },
    { id: "fyi", where: "Work", ask: "What does “FYI” mean in an email?", text: "“FYI” means “for your information”.", real: true,
      why: "Real. A common workplace abbreviation, and easy to confirm." },
    { id: "potter", where: "School", ask: "Recommend a book for my English report.", text: "Try “Harry Potter and the Secret of the MTR” by J.K. Rowling (2019).", real: false,
      why: "Made up. The author is real, but this book doesn’t exist. AI often invents titles that sound right. Search a library catalogue first." },
    { id: "email", where: "Work", ask: "Write a polite one-line reply to say I can’t join Friday’s meeting.", text: "“Thank you for the invitation. Unfortunately I can’t attend on Friday, but please share the notes with me.”", real: true,
      why: "Real (and useful). Writing and rewording is something AI does well. There are no facts here that need checking." },
  ];
  const saved = st.data();
  const answers = saved.answers || {};

  main.innerHTML = `<div class="station-grid"><div>
    <p class="score-line" id="score" style="margin:0 0 14px"></p>
    <div class="claims" id="claims">${ITEMS.map((it, i) => `<article class="claim" id="c-${it.id}">
      <p class="said">${esc(it.where)} · ${i + 1} of ${ITEMS.length}</p>
      <p class="asked"><b>You asked:</b> ${esc(it.ask)}</p>
      <blockquote><b>AI said:</b> ${esc(it.text)}</blockquote>
      <div class="choices"><button type="button" class="btn btn-outline btn-sm" data-id="${it.id}" data-v="real">Real</button>
        <button type="button" class="btn btn-outline btn-sm" data-id="${it.id}" data-v="fake">Made up</button></div>
      <div class="callout" hidden></div></article>`).join("")}</div>
  </div><aside>
    ${Page.tasksPanel([["Judge all 8 statements", "Real or made up?"], ["Get at least 6 right", "Look for warning signs."], ["Read the four warning signs", "In the box below."]])}
    <section class="learn" style="margin-top:24px" id="signs"><h2>Four warning signs of a hallucination</h2><ul>
      <li>A date or fact that can’t be right (like 31 February).</li><li>A famous name attached to a quote, to make it sound true.</li>
      <li>An exact number from an organisation you’ve never heard of.</li><li>A book or source you can’t find anywhere.</li></ul>
      <div class="row-actions"><button class="btn btn-gold btn-sm" id="readSigns">I’ve read these</button></div></section>
  </aside></div>`;

  const state = { readSigns: !!saved.readSigns };
  function draw() {
    let right = 0;
    ITEMS.forEach(it => {
      const card = document.getElementById(`c-${it.id}`);
      const a = answers[it.id];
      const box = card.querySelector(".callout");
      if (!a) return;
      const ok = (a === "real") === it.real;
      if (ok) right++;
      card.classList.add("answered", ok ? "right" : "wrong");
      card.querySelectorAll("button").forEach(b => { b.disabled = true; if (b.dataset.v === a) b.classList.replace("btn-outline", "btn-navy"); });
      box.hidden = false; box.className = "callout " + (ok ? "ok" : "bad");
      box.innerHTML = `<b>${ok ? "Correct." : "Not quite."}</b> ${esc(it.why)}`;
    });
    const n = Object.keys(answers).length;
    document.getElementById("score").textContent = `${n} of ${ITEMS.length} judged · ${right} correct`;
    const btn = document.getElementById("readSigns");
    btn.disabled = state.readSigns; btn.textContent = state.readSigns ? "✓ Read" : "I’ve read these";
    const extra = () => ({ answers, readSigns: state.readSigns, right });
    st.save(extra());
    Page.paintTasks(st, [n === ITEMS.length, right >= 6, state.readSigns], extra);
  }
  document.getElementById("claims").addEventListener("click", e => {
    const b = e.target.closest("button[data-id]"); if (!b || answers[b.dataset.id]) return;
    answers[b.dataset.id] = b.dataset.v; draw();
  });
  document.getElementById("readSigns").addEventListener("click", () => { state.readSigns = true; draw(); });
  draw();
})();

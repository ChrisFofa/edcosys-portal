/* Station 3 · Memory Bucket. A scripted chat shows how the context window fills up and old messages drop out. */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const main = Page.shell({
    id: "memory", crumb: "Station 3", kicker: "Station 3 · 3 minutes", title: "Memory Bucket",
    lead: "Each chat has a short-term memory called the <b>context window</b>. It holds a fixed number of tokens. When it is full, the oldest messages drop out, and the AI can no longer see them.",
  });
  const st = Page.station("memory");

  // DRAFT scripts for Chris to review. Token counts are rounded examples.
  const SCRIPTS = {
    school: {
      label: "School",
      first: { q: "I’m revising for my HKDSE Biology exam. Always explain simply and give one example.", a: "Got it! I’ll keep it simple and add an example each time. What topic first?" },
      turns: [
        ["What is photosynthesis?", "Plants use light energy to turn carbon dioxide and water into glucose and oxygen. Example: a leaf in sunlight."],
        ["And respiration?", "Cells break down glucose to release energy. Example: your muscles during PE."],
        ["What’s the difference?", "Photosynthesis stores energy; respiration releases it."],
        ["Give me a practice question.", "Explain why a plant kept in the dark loses mass over a week."],
        ["Explain enzymes.", "Proteins that speed up reactions without being used up. Example: amylase in saliva."],
        ["What is osmosis?", "Water moving across a membrane from dilute to concentrated solution. Example: a raisin swelling in water."],
        ["Make a summary table.", "Here is a table comparing photosynthesis, respiration, enzymes and osmosis…"],
        ["Quiz me on all of it.", "Question 1: Which gas do plants take in for photosynthesis?"],
      ],
      test: "What was the first instruction I gave you?",
      remember: "You asked me to explain things simply and give one example each time, for your HKDSE Biology revision.",
      forgot: "I’m not sure. I can’t see the start of our chat any more. Could you remind me?",
    },
    work: {
      label: "Work",
      first: { q: "I work in HR. Always reply formally and keep answers under 100 words.", a: "Understood. I’ll keep replies formal and under 100 words." },
      turns: [
        ["Draft an email inviting staff to AI training.", "Dear colleagues, you are invited to an AI skills workshop…"],
        ["Make it shorter.", "Dear colleagues, please join our AI workshop. Details to follow."],
        ["Add the date: 5 December, 2 pm.", "…The workshop will take place on 5 December at 2 pm."],
        ["Suggest three workshop titles.", "1. AI at Work 2. Smarter Emails with AI 3. AI Basics for Teams"],
        ["Write a reminder for next week.", "Reminder: the AI workshop is next Thursday at 2 pm."],
        ["Draft a feedback form.", "Here are five questions for your feedback form…"],
        ["Summarise all of this for my manager.", "Summary: workshop planned for 5 December, invitations sent…"],
        ["Write a thank-you note to the trainer.", "Dear trainer, thank you for an excellent session…"],
      ],
      test: "What was the first instruction I gave you?",
      remember: "You asked me to reply formally and keep every answer under 100 words.",
      forgot: "I don’t have that information. The start of our conversation is no longer in my memory.",
    },
  };
  const SIZES = { small: { label: "Small memory", cap: 220 }, large: { label: "Large memory", cap: 900 } };
  const tokens = s => Math.round(s.split(/\s+/).filter(Boolean).length * 1.35) + 4;

  const saved = st.data();
  const state = { track: Store.currentUser().role === "professional" ? "work" : "school", size: "small", sent: 0, msgs: [], fell: !!saved.fell, askedForgot: !!saved.askedForgot, askedRemember: !!saved.askedRemember };

  main.innerHTML = `<div class="station-grid"><div>
    <section class="panel-box">
      <div class="row-actions" style="margin-top:0;justify-content:space-between">
        <div class="seg" role="group" aria-label="Example chat"><button type="button" data-track="school">School chat</button><button type="button" data-track="work">Work chat</button></div>
        <div class="seg" role="group" aria-label="Memory size"><button type="button" data-size="small">Small memory</button><button type="button" data-size="large">Large memory</button></div>
      </div>
      <div class="bucket-wrap" style="margin-top:20px">
        <div><div class="chat" id="chat" aria-live="polite"></div>
          <div class="row-actions"><button class="btn btn-navy btn-sm" id="send">Send next message</button>
            <button class="btn btn-gold btn-sm" id="ask">Ask: “What was my first instruction?”</button>
            <button class="link" id="reset" style="font-size:15px">Start again</button></div></div>
        <div><div class="gauge" aria-hidden="true"><div class="level" id="level"></div><div class="lbl" id="lvl">0%</div></div>
          <p class="gauge-cap" id="cap"></p><p class="forgot" id="forgot"></p></div>
      </div>
      <p class="fine">The gold-bordered message is your first instruction. Watch what happens to it.</p>
    </section>
  </div><aside>
    ${Page.tasksPanel([["Fill the bucket until a message drops out", "Keep pressing “Send next message”."], ["Ask the question after your first message is gone", "Does the AI still know your instruction?"], ["Try again with a large memory", "Switch to Large memory, send 5 messages, then ask."]])}
    ${Page.learnBox("What this means for you", ["In a long chat, the AI can forget your early instructions.", "Repeat important instructions, or start a fresh chat.", "A new chat starts with an empty memory. It does not remember you.", "Bigger context windows remember more, but are never unlimited."])}
  </aside></div>`;

  function used() { return state.msgs.filter(m => !m.gone).reduce((t, m) => t + m.t, 0); }
  function push(role, text, extra = {}) {
    state.msgs.push({ role, text, t: tokens(text), ...extra });
    const cap = SIZES[state.size].cap;
    while (used() > cap) {
      const oldest = state.msgs.find(m => !m.gone && !m.answer);
      if (!oldest) break;
      oldest.gone = true; state.fell = true;
    }
  }
  function reset() {
    const sc = SCRIPTS[state.track];
    state.sent = 0; state.msgs = [];
    push("user", sc.first.q, { first: true }); push("ai", sc.first.a);
    draw();
  }
  function draw() {
    const cap = SIZES[state.size].cap, u = used(), pct = Math.min(100, Math.round(u / cap * 100));
    document.getElementById("chat").innerHTML = state.msgs.map(m =>
      `<div class="msg ${m.role}${m.first ? " first" : ""}${m.gone ? " gone" : ""}${m.answer ? " answer" : ""}">${esc(m.text)}<span class="tk">${m.gone ? "FORGOTTEN · " : ""}${m.t} tokens</span></div>`).join("");
    const chat = document.getElementById("chat"); chat.scrollTop = chat.scrollHeight;
    document.getElementById("level").style.height = pct + "%";
    document.getElementById("level").classList.toggle("full", pct >= 90);
    document.getElementById("lvl").textContent = pct + "%";
    document.getElementById("cap").textContent = `${u} of ${cap} tokens used`;
    const gone = state.msgs.filter(m => m.gone).length;
    document.getElementById("forgot").textContent = gone ? `${gone} message${gone > 1 ? "s" : ""} forgotten.` : "Nothing forgotten yet.";
    document.getElementById("send").disabled = state.sent >= SCRIPTS[state.track].turns.length;
    document.querySelectorAll("[data-track]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.track === state.track)));
    document.querySelectorAll("[data-size]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.size === state.size)));
    paint();
  }
  document.getElementById("send").addEventListener("click", () => {
    const sc = SCRIPTS[state.track]; const t = sc.turns[state.sent]; if (!t) return;
    push("user", t[0]); push("ai", t[1]); state.sent++; draw();
  });
  document.getElementById("ask").addEventListener("click", () => {
    const sc = SCRIPTS[state.track];
    const firstVisible = state.msgs.some(m => m.first && !m.gone);
    push("user", sc.test);
    push("ai", firstVisible ? sc.remember : sc.forgot, { answer: true });
    if (!firstVisible) state.askedForgot = true;
    if (firstVisible && state.size === "large" && state.sent >= 5) state.askedRemember = true;
    draw();
  });
  document.getElementById("reset").addEventListener("click", reset);
  main.querySelectorAll("[data-track]").forEach(b => b.addEventListener("click", () => { state.track = b.dataset.track; reset(); }));
  main.querySelectorAll("[data-size]").forEach(b => b.addEventListener("click", () => { state.size = b.dataset.size; reset(); }));

  function paint() {
    const extra = () => ({ fell: state.fell, askedForgot: state.askedForgot, askedRemember: state.askedRemember });
    st.save(extra());
    Page.paintTasks(st, [state.fell, state.askedForgot, state.askedRemember], extra);
  }
  reset();
})();

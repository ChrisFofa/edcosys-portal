/* AI Case Detective · group activity. Groups solve at least one case: name the cause, write a rule, then see the answer. */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const main = Page.shell({
    id: "case-detective", crumb: "AI Case Detective", kicker: "Group activity · 18 minutes", title: "AI Case Detective",
    lead: "Real cases where AI went wrong. Your group picks a case, works out the cause, and writes <b>one rule</b> that would have stopped it. Then present your answer to the room in 60 seconds.",
  });
  const st = Page.station("case-detective");

  const CAUSES = [
    { id: "hallucination", label: "Hallucination", hint: "The AI made something up." },
    { id: "cutoff", label: "Knowledge cutoff", hint: "The AI’s information was out of date." },
    { id: "privacy", label: "Privacy leak", hint: "Private information went into an AI tool." },
    { id: "bias", label: "Bias", hint: "The AI repeated unfair patterns." },
  ];
  // Work cases are real, reported events. School cases are realistic scenarios. DRAFT wording for Chris to review.
  const CASES = [
    { id: "lawyers", where: "Work · USA, 2023", title: "The fake court cases", cause: "hallucination",
      story: "Two lawyers in New York used ChatGPT to help research a case. They sent the judge a document that quoted six earlier court decisions. When the other side checked, none of the six cases existed. ChatGPT had invented them, including names, dates and quotes.",
      clue: "When asked if the cases were real, ChatGPT said yes.",
      answer: "Hallucination. The judge fined the lawyers US$5,000. The AI produced fluent, confident text that looked like real legal citations.",
      rule: "Check every name, quote and reference in the original source before you use it." },
    { id: "samsung", where: "Work · South Korea, 2023", title: "The leaked company code", cause: "privacy",
      story: "Engineers at Samsung pasted secret computer code and notes from an internal meeting into ChatGPT to get help fixing bugs and writing a summary. That information was now stored on another company’s servers.",
      clue: "Soon after, Samsung banned staff from using public AI chatbots on company devices.",
      answer: "Privacy leak. Free public AI tools may store what you type. Confidential company information left the company’s control.",
      rule: "Never paste confidential, client or personal information into a public AI tool. Use only tools your company has approved." },
    { id: "airline", where: "Work · Canada, 2024", title: "The chatbot’s refund promise", cause: "hallucination",
      story: "A man asked Air Canada’s website chatbot about cheaper fares after a family death. The chatbot said he could buy a full-price ticket and claim money back later. That was not the airline’s real policy, and his claim was refused.",
      clue: "A tribunal ruled the airline was responsible for what its chatbot said.",
      answer: "Hallucination. The chatbot gave a confident but wrong answer, and the company had to pay. The organisation using the AI is responsible for its answers.",
      rule: "Check important answers (money, rules, deadlines) with an official source or a person." },
    { id: "essay", where: "School scenario", title: "The essay references", cause: "hallucination",
      story: "A student asked an AI chatbot for five book references for a history essay. The list looked perfect, with authors, titles and page numbers. The teacher could not find two of the books in any library.",
      clue: "The two missing books had very realistic titles and well-known publishers.",
      answer: "Hallucination. AI often invents references that look real. Fake references can count as academic dishonesty.",
      rule: "Search for every reference in a library catalogue or Google Scholar before you cite it." },
    { id: "notes", where: "School scenario", title: "The out-of-date revision notes", cause: "cutoff",
      story: "A student asked AI to make revision notes, including this year’s exam timetable and syllabus changes. The notes used dates and topics from an older year. The student revised a topic that had been removed.",
      clue: "The AI did not search the web. It answered from what it learned during training.",
      answer: "Knowledge cutoff. The model only knew information from before its training ended, so recent changes were missing.",
      rule: "For dates, timetables and syllabus changes, always check the official website, such as the exam authority or your school." },
    { id: "photo", where: "School scenario", title: "The classmate’s photo", cause: "privacy",
      story: "A student uploaded a classmate’s photo to a free AI app to turn it into a funny cartoon and share it in a group chat. The classmate had not been asked and was upset.",
      clue: "The app’s terms said uploaded photos may be used to improve its service.",
      answer: "Privacy leak. Someone else’s personal data (their face) was given to an AI company without permission.",
      rule: "Never upload someone else’s photo or personal details to an AI tool without their permission." },
  ];
  const saved = st.data();
  const solved = saved.solved || {};   // { caseId: { cause, rule, correct, at } }
  let current = CASES[0].id;

  main.innerHTML = `<div class="station-grid cases-first"><div>
    <section class="panel-box" id="file"></section>
  </div><aside>
    <section class="panel-box"><h2>Case files</h2><p class="sub">Your teacher will give your group a case. You can try more if you finish early.</p>
      <ul class="cases" id="cases"></ul></section>
    <section class="panel-box"><h2>Your mission</h2><ul class="tasks">
      <li class="task" id="task1"><span class="tick">✓</span><div><b>Solve at least one case</b><span>Name the cause and write your rule.</span></div></li>
      <li class="task" id="task2"><span class="tick">✓</span><div><b>Present in 60 seconds</b><span>Cause, proof, and your rule.</span></div></li></ul>
      <div class="complete"><button class="btn btn-navy" id="completeBtn" disabled>Mark activity complete</button>
      <p class="done-msg" id="doneMsg" hidden>✓ Activity complete. Saved to your progress.</p></div></section>
  </aside></div>`;

  function drawList() {
    document.getElementById("cases").innerHTML = CASES.map(c => `<li><button type="button" class="case-btn" data-id="${c.id}" aria-pressed="${c.id === current}">
      <span><small>${esc(c.where)}</small><b>${esc(c.title)}</b></span>${solved[c.id] ? '<span class="solved">✓ Solved</span>' : ""}</button></li>`).join("");
  }
  function drawFile() {
    const c = CASES.find(x => x.id === current), s = solved[c.id];
    document.getElementById("file").innerHTML = `
      <div class="file-head"><h2>${esc(c.title)}</h2><span class="where">${esc(c.where)}</span></div>
      <p class="story">${esc(c.story)}</p>
      <div class="clue"><b>Clue:</b> ${esc(c.clue)}</div>
      <h3 class="h3">1. What caused the problem?</h3>
      <div class="options">${CAUSES.map(k => `<label><input type="radio" name="cause" value="${k.id}" ${s?.cause === k.id ? "checked" : ""} ${s ? "disabled" : ""}><span>${esc(k.label)}<small>${esc(k.hint)}</small></span></label>`).join("")}</div>
      <h3 class="h3">2. Write one rule that would have stopped it</h3>
      <label for="rule" style="position:absolute;left:-9999px">Your rule</label>
      <textarea class="rule" id="rule" placeholder="Our rule: …" ${s ? "disabled" : ""}>${esc(s?.rule || "")}</textarea>
      <div class="row-actions">${s ? "" : '<button class="btn btn-navy btn-sm" id="submit">Submit our answer</button>'}</div>
      <div id="result">${s ? result(c, s) : ""}</div>`;
    document.getElementById("submit")?.addEventListener("click", () => {
      const cause = document.querySelector('input[name="cause"]:checked')?.value;
      const rule = document.getElementById("rule").value.trim();
      if (!cause) { Page.toast("Choose a cause first."); return; }
      if (rule.length < 10) { Page.toast("Write your rule in a full sentence."); document.getElementById("rule").focus(); return; }
      solved[c.id] = { cause, rule, correct: cause === c.cause, at: Date.now() };
      save(); drawList(); drawFile();
    });
  }
  function result(c, s) {
    const label = CAUSES.find(k => k.id === c.cause).label;
    return `<div class="callout ${s.correct ? "ok" : "bad"}"><b>${s.correct ? "Case cracked!" : `Close. The main cause was ${label}.`}</b> ${esc(c.answer)}</div>
      <div class="callout"><b>Example rule:</b> ${esc(c.rule)}<br><span class="fine">Compare it with yours. Both can be right.</span></div>`;
  }
  document.getElementById("cases").addEventListener("click", e => { const b = e.target.closest(".case-btn"); if (!b) return; current = b.dataset.id; drawList(); drawFile(); });

  function save() {
    const n = Object.keys(solved).length;
    st.save({ solved });
    const done = st.isDone();
    document.getElementById("task1").classList.toggle("done", n >= 1);
    document.getElementById("task2").classList.toggle("done", done);
    const btn = document.getElementById("completeBtn");
    btn.disabled = done || n < 1;
    btn.textContent = done ? "Activity complete" : n ? "We’ve presented: mark complete" : "Mark activity complete";
    document.getElementById("doneMsg").hidden = !done;
  }
  document.getElementById("completeBtn").addEventListener("click", () => { st.complete({ solved }); save(); Page.toast("Activity complete. Saved."); });
  drawList(); drawFile(); save();
})();

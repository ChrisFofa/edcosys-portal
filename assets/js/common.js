/* Shared page shell + station helpers for inner pages. Requires store.js. */
(function () {
  const LESSON = "1.1";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let coursePromise = null;
  const course = () => coursePromise || (coursePromise = fetch("data/course.json", { cache: "no-store" }).then(r => r.json()));

  function shell({ id, crumb, kicker, title, lead }) {
    const u = Store.currentUser();
    document.body.innerHTML = `
      <nav class="nav" aria-label="Main"><div class="container nav-row">
        <a href="index.html" class="nav-brand"><img src="assets/img/edcosys-portal-logo.png" alt="edcosys portal" width="248" height="30"></a>
        <ul class="nav-links"><li><a href="index.html#courses">Courses</a></li><li><a href="lesson-1-1.html">Lesson 1.1</a></li></ul>
        <span class="nav-user">Hi, ${esc(u.name)}</span></div></nav>
      <header class="page-head"><div class="container">
        <p class="crumbs"><a href="index.html">Learning Portal</a> › <a href="lesson-1-1.html">Lesson 1.1</a> › ${esc(crumb)}</p>
        <p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1><p class="lead">${lead}</p></div></header>
      <main class="station-body"><div class="container" id="main"></div>
        <div class="container"><nav class="next-nav" id="nextNav" aria-label="Station navigation"><a href="lesson-1-1.html">← Back to Lesson 1.1</a></nav></div></main>
      <footer class="footer"><div class="container footer-row">
        <img src="assets/img/edcosys-portal-logo.png" alt="edcosys portal" width="182" height="22">
        <span>© ${new Date().getFullYear()} edcosys · Your name and progress are saved in this browser only. · <a href="https://www.edcosys.com" target="_blank" rel="noopener">Visit edcosys.com</a></span></div></footer>
      <div class="toast" id="toast" role="status" hidden></div>`;
    course().then(c => {
      const items = c.lessons.find(l => l.id === LESSON).stations.slice().sort((a, b) => a.order - b.order);
      const i = items.findIndex(s => s.id === id);
      const next = items[i + 1];
      if (next) document.getElementById("nextNav").insertAdjacentHTML("beforeend",
        next.status === "live" ? `<a href="${esc(next.page)}">Next: ${esc(next.title)} →</a>` : `<span class="muted-link">Next: ${esc(next.title)} (coming soon)</span>`);
    }).catch(() => {});
    if (window.addLogout) window.addLogout();
    return document.getElementById("main");
  }

  // Station progress: status + saved data, with a challenge list and a complete button.
  function station(id) {
    const getData = () => { const u = Store.currentUser(); return JSON.parse(JSON.stringify(u?.lessons?.[LESSON]?.stations?.[id]?.data || {})); };
    if (Store.stationStatus(LESSON, id) === "new") Store.setStation(LESSON, id, "started", {});
    return {
      data: getData,
      save: patch => Store.setStation(LESSON, id, Store.stationStatus(LESSON, id), patch),
      isDone: () => Store.stationStatus(LESSON, id) === "done",
      complete: patch => Store.setStation(LESSON, id, "done", patch || {}),
    };
  }

  // Challenge panel HTML + painter.
  function tasksPanel(tasks) {
    return `<section class="panel-box" aria-labelledby="tasksTitle"><h2 id="tasksTitle">Your challenges</h2>
      <p class="sub">They tick themselves as you go.</p>
      <ul class="tasks">${tasks.map((t, i) => `<li class="task" id="task${i + 1}"><span class="tick">✓</span><div><b>${esc(t[0])}</b><span>${esc(t[1])}</span></div></li>`).join("")}</ul>
      <div class="complete"><button class="btn btn-navy" id="completeBtn" disabled>Mark station complete</button>
      <p class="done-msg" id="doneMsg" hidden>✓ Station complete. Saved to your progress.</p></div></section>`;
  }
  function paintTasks(st, flags, extra) {
    flags.forEach((f, i) => document.getElementById(`task${i + 1}`)?.classList.toggle("done", !!f));
    const btn = document.getElementById("completeBtn");
    const done = st.isDone();
    btn.disabled = done || !flags.every(Boolean);
    btn.textContent = done ? "Station complete" : "Mark station complete";
    document.getElementById("doneMsg").hidden = !done;
    btn._latest = { flags, extra };   // the click handler always uses the newest flags
    if (!btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", () => {
        const { flags: f, extra: x } = btn._latest;
        st.complete(x ? x() : {}); paintTasks(st, f, x); toast("Station complete. Saved.");
      });
    }
  }
  function learnBox(title, points) {
    return `<section class="learn" style="margin-top:24px"><h2>${esc(title)}</h2><ul>${points.map(p => `<li>${esc(p)}</li>`).join("")}</ul></section>`;
  }

  let tt;
  function toast(msg) { const t = document.getElementById("toast"); if (!t) return; t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2600); }

  window.Page = { LESSON, esc, shell, station, tasksPanel, paintTasks, learnBox, toast, course };
})();

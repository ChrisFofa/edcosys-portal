/* Lesson hub: lists the stations for one lesson with each learner's status. Reads data/course.json. */
(async function () {
  const LESSON_ID = "1.1";
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const u = Store.currentUser();
  if (!u) return;
  $("year").textContent = new Date().getFullYear();
  $("navUser").textContent = `Hi, ${u.name}`;

  let course;
  try { course = await (await fetch("data/course.json", { cache: "no-store" })).json(); }
  catch (e) { $("summary").textContent = "Could not load the lesson. Refresh the page to try again."; return; }
  const lesson = course.lessons.find(l => l.id === LESSON_ID);
  const items = lesson.stations.slice().sort((a, b) => a.order - b.order);
  $("title").textContent = lesson.title;
  $("summary").textContent = lesson.summary;

  const status = id => Store.stationStatus(LESSON_ID, id);
  const done = items.filter(s => status(s.id) === "done").length;
  $("progName").textContent = `${u.name}'s progress`;
  $("progText").textContent = `${done} of ${items.length} complete`;
  requestAnimationFrame(() => ($("progBar").style.width = `${Math.round(done / items.length * 100)}%`));

  const STATE = { new: "", started: '<span class="started">In progress</span>', done: '<span class="done">✓ Done</span>' };
  $("rows").innerHTML = items.map(s => {
    const st = status(s.id);
    const live = s.status === "live";
    const label = s.kind === "quiz" ? "Final check" : s.kind === "activity" ? "Group activity" : `Station ${s.order}`;
    const num = s.kind === "quiz" ? "Q" : String(s.order).padStart(2, "0");
    const action = !live ? `<span class="soon">Coming soon</span>`
      : `<a class="btn ${st === "done" ? "btn-outline" : "btn-navy"}" href="${esc(s.page)}">${st === "done" ? "Open again" : st === "started" ? "Continue" : "Start"}</a>`;
    return `<li class="row${live ? "" : " planned"}${s.kind === "quiz" ? " quiz" : ""}">
      <div class="num" aria-hidden="true">${num}</div>
      <div><h2>${esc(s.title)}</h2><p>${esc(s.summary)}</p>
        <div class="meta">${label.toUpperCase()} · ${s.minutes} MIN ${STATE[st] ? " · " + STATE[st] : ""}</div></div>
      <div class="go">${action}</div></li>`;
  }).join("");
})();

/* Portal welcome page: name-only sign-in, saved in this browser via Store (store.js). */
(function () {
  const box = document.getElementById("welcome");
  const navUser = document.getElementById("navUser");
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  document.getElementById("year").textContent = new Date().getFullYear();

  function showSignIn() {
    const recent = Store.recentUsers(3);
    navUser.hidden = true;
    box.innerHTML = `
      <div class="gold-bar"></div>
      <h1>Welcome to the edcosys Learning Portal</h1>
      <p class="lead">Practical AI courses for students and working professionals. Learn how AI works, then put it to work.</p>
      <form class="name-form" id="nameForm" novalidate>
        <label for="name">Tell us your name</label>
        <div class="field-row">
          <input type="text" id="name" name="name" autocomplete="given-name" maxlength="30" placeholder="First name or nickname">
          <button type="submit" class="btn btn-navy">Continue</button>
        </div>
        <p class="error" id="nameError" hidden>Please type a name with at least 2 letters.</p>
        <p class="note">No password needed. We use your name to save your progress.</p>
      </form>
      ${recent.length ? `<p class="returning">Been here before? Continue as ${recent.map(u =>
        `<button type="button" class="link" data-user="${esc(u.id)}">${esc(u.name)}</button>`).join(", ")}</p>` : ""}`;

    document.getElementById("nameForm").addEventListener("submit", e => {
      e.preventDefault();
      const input = document.getElementById("name");
      const name = input.value.trim();
      if (name.replace(/[^\p{L}]/gu, "").length < 2) { document.getElementById("nameError").hidden = false; input.focus(); return; }
      Store.signIn(name, null);
      showWelcomeBack();
    });
    box.querySelectorAll("[data-user]").forEach(b => b.addEventListener("click", () => { Store.signInExisting(b.dataset.user); showWelcomeBack(); }));
  }

  function showWelcomeBack() {
    const u = Store.currentUser();
    navUser.hidden = false;
    navUser.textContent = `Hi, ${u.name}`;
    box.innerHTML = `
      <div class="gold-bar"></div>
      <h1>Welcome, ${esc(u.name)}</h1>
      <p class="lead">Your progress is saved on this device. Pick up where you left off.</p>
      <div class="signed-in-actions">
        <a class="btn btn-navy" href="lesson-1-1.html">Go to Lesson 1.1</a>
        <button type="button" class="link" id="switchName">Not ${esc(u.name)}?</button>
      </div>`;
    document.getElementById("switchName").addEventListener("click", () => { Store.signOut(); showSignIn(); document.getElementById("name").focus(); });
  }

  // Course links need a name first, so progress can be saved.
  document.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => {
    if (Store.currentUser()) { location.href = b.dataset.open; return; }
    document.getElementById("start").scrollIntoView();
    const input = document.getElementById("name");
    if (input) { input.focus({ preventScroll: true }); }
  }));
  document.getElementById("ctaBtn").addEventListener("click", () => setTimeout(() => { const i = document.getElementById("name"); if (i) i.focus({ preventScroll: true }); }, 400));

  Store.currentUser() ? showWelcomeBack() : showSignIn();
})();

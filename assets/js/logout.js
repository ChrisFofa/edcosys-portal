/* Adds "Log out" next to the learner's name in the menu. Progress stays saved in this browser. */
(function () {
  function add() {
    const user = document.querySelector(".nav-user");
    if (!user || document.getElementById("logoutBtn")) return;
    const b = document.createElement("button");
    b.type = "button"; b.id = "logoutBtn"; b.className = "nav-logout"; b.textContent = "Log out";
    b.hidden = user.hidden;
    b.addEventListener("click", () => { Store.signOut(); location.href = "index.html"; });
    user.insertAdjacentElement("afterend", b);
    new MutationObserver(() => { b.hidden = user.hidden; }).observe(user, { attributes: true, attributeFilter: ["hidden"] });
  }
  window.addLogout = add;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();

/* Data layer for the LLM Playground.
   Everything a learner does is saved in this browser (localStorage), so closing the page loses nothing.
   One saved object, versioned so later changes can upgrade old data safely.

   {
     schema: 1,
     currentUserId: "chris" | null,
     users: {
       "chris": {
         id, name, role: "student" | "professional",
         createdAt, lastSeenAt,                       // epoch ms
         lessons: {
           "1.1": {
             stations: { "tokens": { status: "started" | "done", startedAt, completedAt, data: {} } },
             quiz: { attempts: [{ score, total, answers: [], at }], best: 8 }
           }
         }
       }
     }
   }
   exportAll() returns this object, ready to send to a teacher dashboard later. */
(function () {
  const KEY = "edcosys.llmPlayground";
  const SCHEMA = 1;
  const empty = () => ({ schema: SCHEMA, currentUserId: null, users: {} });

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return empty();
      const data = JSON.parse(raw);
      return data && data.schema === SCHEMA ? data : empty();
    } catch (e) { return empty(); }
  }
  let db = read();
  let available = true;
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); available = true; }
    catch (e) { available = false; }
  }

  const idFor = name => name.trim().toLowerCase().replace(/\s+/g, " ");
  const lessonOf = (user, lessonId) => {
    user.lessons[lessonId] = user.lessons[lessonId] || { stations: {}, quiz: { attempts: [], best: null } };
    return user.lessons[lessonId];
  };

  window.Store = {
    isSaving: () => available,
    currentUser: () => (db.currentUserId ? db.users[db.currentUserId] || null : null),
    recentUsers: (limit = 6) => Object.values(db.users).sort((a, b) => b.lastSeenAt - a.lastSeenAt).slice(0, limit),

    signIn(name, role) {
      const id = idFor(name);
      const now = Date.now();
      if (!db.users[id]) db.users[id] = { id, name: name.trim(), role, createdAt: now, lastSeenAt: now, lessons: {} };
      if (role) db.users[id].role = role;
      db.users[id].lastSeenAt = now;
      db.currentUserId = id;
      write();
      return db.users[id];
    },
    signInExisting(id) {
      if (!db.users[id]) return null;
      db.users[id].lastSeenAt = Date.now();
      db.currentUserId = id; write();
      return db.users[id];
    },
    signOut() { db.currentUserId = null; write(); },

    stationStatus(lessonId, stationId) {
      const u = this.currentUser(); if (!u) return "new";
      const s = lessonOf(u, lessonId).stations[stationId];
      return s ? s.status : "new";
    },
    setStation(lessonId, stationId, status, data) {
      const u = this.currentUser(); if (!u) return;
      const L = lessonOf(u, lessonId);
      const s = L.stations[stationId] || { status: "started", startedAt: Date.now(), completedAt: null, data: {} };
      s.status = status;
      if (status === "done" && !s.completedAt) s.completedAt = Date.now();
      if (data) s.data = Object.assign(s.data || {}, data);
      L.stations[stationId] = s;
      u.lastSeenAt = Date.now(); write();
    },
    recordQuiz(lessonId, score, total, answers) {
      const u = this.currentUser(); if (!u) return;
      const q = lessonOf(u, lessonId).quiz;
      q.attempts.push({ score, total, answers, at: Date.now() });
      q.best = Math.max(q.best ?? 0, score);
      u.lastSeenAt = Date.now(); write();
    },
    bestQuiz(lessonId) { const u = this.currentUser(); return u ? lessonOf(u, lessonId).quiz.best : null; },

    exportAll: () => JSON.parse(JSON.stringify(db)),
  };
})();

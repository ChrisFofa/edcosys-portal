/* LLM Quiz · 10 questions, one at a time, with explanations. Every attempt is saved via Store.recordQuiz. */
(function () {
  if (!Store.currentUser()) return;
  const { esc } = Page;
  const LESSON = Page.LESSON;
  const main = Page.shell({
    id: "quiz", crumb: "LLM Quiz", kicker: "Final check · 7 minutes", title: "LLM Quiz",
    lead: "10 questions on everything from today. Work on your own, no AI allowed. You see whether you are right after each question, and a full review at the end.",
  });
  const st = Page.station("quiz");

  // FIXED QUIZ: every learner gets the same 10 questions in the same order, with the same answer order.
  // Nothing is shuffled. If a question is ever edited, raise QUIZ_VERSION so old and new scores can be told apart.
  // Every question comes from the Lesson 1.1 deck (slide numbers in the comments). DRAFT for Chris to review.
  const QUIZ_VERSION = "1.1-v1";
  const Q = [
    // Q1 · slide 11
    { q: "What does LLM stand for?", a: ["Large Language Model", "Learning Logic Machine", "Long List Memory", "Live Language Monitor"], c: 0,
      why: "LLM means Large Language Model: an AI trained on a huge amount of text to understand and write language." },
    // Q2 · slides 3 and 6
    { q: "Which of these is NOT AI?", a: ["Gmail’s spam filter", "An Excel SUM formula", "Face ID on a phone", "TikTok’s For You page"], c: 1,
      why: "A SUM formula follows fixed rules a person wrote. The others learn patterns from data." },
    // Q3 · slide 9
    { q: "Which sentence about the AI family is true?", a: ["All AI is an LLM", "Every LLM is a kind of AI", "LLMs are older than AI", "Machine learning is not AI"], c: 1,
      why: "AI is the biggest group. Machine learning sits inside it, deep learning inside that, and LLMs inside deep learning." },
    // Q4 · slides 11, 12 and 15
    { q: "How does an LLM write its reply?", a: ["It copies a stored answer from a database", "It searches every website every time", "It predicts likely next words, one at a time", "A person types it in real time"], c: 2,
      why: "An LLM generates text by predicting the next likely word (token), again and again." },
    // Q5 · slide 13
    { q: "What is a token?", a: ["A password for an AI account", "A small chunk of text the model reads", "A coin used to pay for AI", "A type of computer chip"], c: 1,
      why: "LLMs cut text into small chunks called tokens. A long word can be several tokens." },
    // Q6 · slide 14
    { q: "Work: in a long chat, Copilot forgets your first instruction to “keep it under 100 words”. Why?", a: ["It is being rude", "Its context window is full, so early messages dropped out", "It needs a software update", "It only reads the first message"], c: 1,
      why: "The context window is the chat’s short-term memory. When it fills up, the oldest messages drop out. Repeat key instructions." },
    // Q7 · slides 14 and 20
    { q: "School: you ask an AI about this year’s exam dates and it gives last year’s. What is the most likely cause?", a: ["Hallucination about maths", "Knowledge cutoff", "A privacy leak", "Too many tokens"], c: 1,
      why: "The model only knows what it read before training ended. Check dates on the official website." },
    // Q8 · slides 20 and 22
    { q: "An AI gives you a book reference that does not exist. What is this called?", a: ["A hallucination", "A context window", "A token", "Fine-tuning"], c: 0,
      why: "A hallucination is when AI makes something up and says it confidently. Always check references." },
    // Q9 · slides 20, 22 and 23
    { q: "Work: a colleague wants to paste a client’s contract into a free AI chatbot to summarise it. What should they do?", a: ["Go ahead, AI tools are private", "Paste it, but delete the chat afterwards", "Don’t. Use only a tool the company has approved, and remove client details", "Ask the chatbot if it is safe"], c: 2,
      why: "Public AI tools may store what you type. Confidential and client information should only go into approved tools." },
    // Q10 · slides 15 and 18
    { q: "Why can Gemini give different answers to the same question?", a: ["It is broken", "It picks from several likely next words, with some randomness", "It reads your mind", "Someone changes the answers by hand"], c: 1,
      why: "At each step the model chooses among likely words. A creativity (temperature) setting adds variety." },
  ];
  const L = ["A", "B", "C", "D"];
  let i = 0, picks = [], checked = false;

  function start() {
    const best = Store.bestQuiz(LESSON);
    const attempts = Store.currentUser().lessons?.[LESSON]?.quiz?.attempts?.length || 0;
    main.innerHTML = `<section class="panel-box quiz-card"><h2>Ready?</h2>
      <p class="sub">10 multiple-choice questions · about 7 minutes · you can retake it any time.</p>
      ${attempts ? `<p class="score-line">Your best score so far: ${best}/10 (${attempts} attempt${attempts > 1 ? "s" : ""})</p>` : ""}
      <div class="row-actions"><button class="btn btn-navy" id="go">${attempts ? "Retake the quiz" : "Start the quiz"}</button></div></section>`;
    document.getElementById("go").addEventListener("click", () => { i = 0; picks = []; show(); });
  }
  function show() {
    checked = false;
    const q = Q[i];
    main.innerHTML = `<section class="panel-box quiz-card">
      <div class="q-progress"><span>Question ${i + 1} of ${Q.length}</span><span>${picks.filter((p, k) => p === Q[k].c).length} correct so far</span></div>
      <div class="bar"><i style="width:${i / Q.length * 100}%"></i></div>
      <p class="q-text">${esc(q.q)}</p>
      <div class="answers" role="group" aria-label="Answers">${q.a.map((t, k) => `<button type="button" class="answer" data-k="${k}" aria-pressed="false"><span class="letter">${L[k]}</span><span>${esc(t)}</span></button>`).join("")}</div>
      <div id="fb"></div>
      <div class="row-actions"><button class="btn btn-navy btn-sm" id="check" disabled>Check answer</button></div></section>`;
    let sel = null;
    main.querySelectorAll(".answer").forEach(b => b.addEventListener("click", () => {
      if (checked) return;
      sel = +b.dataset.k;
      main.querySelectorAll(".answer").forEach(x => x.setAttribute("aria-pressed", String(+x.dataset.k === sel)));
      document.getElementById("check").disabled = false;
    }));
    document.getElementById("check").addEventListener("click", () => {
      if (!checked) {
        checked = true; picks[i] = sel;
        main.querySelectorAll(".answer").forEach(x => {
          const k = +x.dataset.k; x.disabled = true;
          if (k === q.c) x.classList.add("correct"); else if (k === sel) x.classList.add("incorrect");
        });
        const ok = sel === q.c;
        document.getElementById("fb").innerHTML = `<div class="callout ${ok ? "ok" : "bad"}"><b>${ok ? "Correct." : `Not quite. The answer is ${L[q.c]}.`}</b> ${esc(q.why)}</div>`;
        const btn = document.getElementById("check");
        btn.textContent = i < Q.length - 1 ? "Next question" : "See my results";
      } else if (i < Q.length - 1) { i++; show(); }
      else finish();
    });
  }
  function finish() {
    const score = picks.filter((p, k) => p === Q[k].c).length;
    Store.recordQuiz(LESSON, score, Q.length, { version: QUIZ_VERSION, picks });
    st.complete({ lastScore: score });
    const msg = score >= 9 ? "Excellent. You really know how LLMs work." : score >= 7 ? "Well done. Review the ones you missed below." : score >= 5 ? "Good start. Read the explanations, then try again." : "Have another look at the stations, then retake the quiz.";
    main.innerHTML = `<section class="panel-box quiz-card"><h2>Your result</h2>
      <p class="result-big">${score}<span>/${Q.length}</span></p><p class="sub">${msg} Best score: ${Store.bestQuiz(LESSON)}/10.</p>
      <div class="row-actions"><button class="btn btn-navy btn-sm" id="again">Retake the quiz</button><a class="btn btn-outline btn-sm" href="lesson-1-1.html">Back to Lesson 1.1</a></div>
      <h3 class="h3">Review your answers</h3>
      <ol class="review">${Q.map((q, k) => `<li class="${picks[k] === q.c ? "" : "wrong"}"><b>${k + 1}. ${esc(q.q)}</b>
        ${picks[k] === q.c ? "✓ " : `✗ You chose ${L[picks[k]]}. `}Answer: ${L[q.c]}. ${esc(q.a[q.c])}<br><span class="fine">${esc(q.why)}</span></li>`).join("")}</ol></section>`;
    document.getElementById("again").addEventListener("click", () => { i = 0; picks = []; show(); });
    window.scrollTo(0, 0);
  }
  start();
})();

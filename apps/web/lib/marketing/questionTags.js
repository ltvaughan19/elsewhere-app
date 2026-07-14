/**
 * Floating question tags around Earth (desktop) / docked cycle (mobile).
 * Fully hidden once the hero is scrolled past.
 * Does not touch Spline Earth materials.
 */

const QUESTIONS = [
  "Where can I actually afford to live?",
  "Is this even possible for me?",
  "What if I mess this up?",
  "How do people actually do this?",
  "Will I regret this?",
  "Which visa is even real?",
  "What about my family?",
  "Can I still work remotely?",
  "What if the forums are wrong?",
  "How long does this actually take?",
  "Will I ever feel at home?",
  "Am I already too late?",
  "What does this cost — really?",
  "Who do I even trust?",
];

const MAX_VISIBLE_DESKTOP = 4;
const APPEAR_EVERY = 2.4;
const FADE_IN = 1.8;
const LIFETIME = 11;
const FADE_OUT = 2.2;

/** Mobile: single docked tag, cycle every N seconds */
const MOBILE_CYCLE = 3.6;
const MOBILE_CROSSFADE = 0.7;

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function isMobileViewport() {
  return window.innerWidth < 768;
}

/**
 * @param {HTMLElement} root
 * @param {{ reducedMotion?: boolean }} opts
 */
export function createQuestionTags(root, opts = {}) {
  const reducedMotion = opts.reducedMotion ?? false;

  root.innerHTML = "";
  root.setAttribute("aria-hidden", "true");

  let mobile = isMobileViewport();
  let progress = 0; // 0 = hero top, 1 = hero scrolled past (from ScrollTrigger)
  let target = 0;
  let time = 0;
  let w = window.innerWidth;
  let h = window.innerHeight;
  let raf = 0;
  let last = performance.now();

  // —— Desktop orbit state ——
  /** @type {Array<any>} */
  let active = [];
  let nextQuestion = 0;
  let spawnTimer = 0.6;

  // —— Mobile dock state ——
  /** @type {HTMLElement | null} */
  let dockEl = null;
  let mobileIndex = 0;
  let mobileAge = 0;
  let mobileOpacity = 0;

  function clearActive() {
    for (const t of active) t.el.remove();
    active = [];
    if (dockEl) {
      dockEl.remove();
      dockEl = null;
    }
    root.classList.remove("is-mobile-dock");
  }

  function setupMode() {
    clearActive();
    mobile = isMobileViewport();
    nextQuestion = 0;
    spawnTimer = 0.6;
    mobileIndex = 0;
    mobileAge = 0;
    mobileOpacity = 0;

    if (mobile) {
      root.classList.add("is-mobile-dock");
      dockEl = document.createElement("span");
      dockEl.className = "question-tag question-tag--dock";
      dockEl.textContent = QUESTIONS[0];
      root.appendChild(dockEl);
      // Start invisible; fade in after a beat
      dockEl.style.opacity = "0";
    } else {
      root.classList.remove("is-mobile-dock");
    }
  }

  setupMode();

  /**
   * Hero leave progress: 0 while hero fills the top, 1 when hero has left.
   * Tags must be fully gone at 1.
   */
  function setProgress(p) {
    target = Math.min(1, Math.max(0, p));
    if (reducedMotion) progress = target;
  }

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    const nowMobile = isMobileViewport();
    if (nowMobile !== mobile) {
      setupMode();
    }
  }
  window.addEventListener("resize", resize);

  function spawnDesktop() {
    if (active.length >= MAX_VISIBLE_DESKTOP) return;

    const el = document.createElement("span");
    el.className = "question-tag";
    el.textContent = QUESTIONS[nextQuestion % QUESTIONS.length];
    nextQuestion += 1;
    root.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    active.push({
      el,
      angle,
      radiusBase: 0.28 + Math.random() * 0.14,
      speed: (0.035 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1),
      yBias: (Math.random() - 0.5) * 0.32,
      phase: Math.random() * Math.PI * 2,
      scale: 0.94 + Math.random() * 0.12,
      age: 0,
    });
  }

  /**
   * Presence while hero is on screen. Hard cut after hero leaves.
   * progress from hero ScrollTrigger: 0 at top, ~1 when bottom hits top.
   */
  function heroPresence(p) {
    // Stay visible through most of the hero; fade in last third of leave
    if (p >= 0.98) return 0;
    return 1 - smoothstep(0.55, 0.92, p);
  }

  function tickDesktop(dt, presence) {
    if (presence > 0.12 && !reducedMotion) {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && active.length < MAX_VISIBLE_DESKTOP) {
        spawnDesktop();
        spawnTimer = APPEAR_EVERY + Math.random() * 1.2;
      }
    }

    const leave = smoothstep(0.55, 0.92, progress);
    const cx = w * 0.5;
    const cy = h * 0.46;
    const base = Math.min(w, h);

    for (let i = active.length - 1; i >= 0; i--) {
      const t = active[i];
      t.age += dt;

      let lifeOpacity = 1;
      if (t.age < FADE_IN) {
        lifeOpacity = smoothstep(0, FADE_IN, t.age);
      } else if (t.age > LIFETIME - FADE_OUT) {
        lifeOpacity = 1 - smoothstep(LIFETIME - FADE_OUT, LIFETIME, t.age);
      }

      if (t.age >= LIFETIME || presence < 0.04) {
        t.el.remove();
        active.splice(i, 1);
        continue;
      }

      if (!reducedMotion) t.angle += t.speed * dt;

      const breathe = Math.sin(time * 0.35 + t.phase) * 0.012 * base;
      const radius = base * t.radiusBase * (1 + leave * 0.2) + breathe;
      const ex = Math.cos(t.angle) * radius;
      const ey =
        Math.sin(t.angle) * radius * 0.58 + t.yBias * base * 0.18;

      const depth = (Math.sin(t.angle) + 1) * 0.5;
      const scale = t.scale * lerp(0.92, 1.04, depth);
      const opacity =
        lifeOpacity * presence * lerp(0.55, 0.9, depth);

      t.el.style.transform = `translate(-50%, -50%) translate(${cx + ex}px, ${cy + ey}px) scale(${scale})`;
      t.el.style.opacity = String(Math.max(0, opacity));
      t.el.style.filter = leave > 0.08 ? `blur(${leave * 1.4}px)` : "none";
    }
  }

  function tickMobile(dt, presence) {
    if (!dockEl) return;

    // Completely gone past hero
    if (presence < 0.02) {
      dockEl.style.opacity = "0";
      dockEl.style.visibility = "hidden";
      return;
    }
    dockEl.style.visibility = "visible";

    mobileAge += dt;

    // Intro fade
    const intro = reducedMotion ? 1 : smoothstep(0, 1.2, time - 0.8);

    // Crossfade cycle through questions
    const cycleT = mobileAge % MOBILE_CYCLE;
    let cycleOpacity = 1;
    if (cycleT < MOBILE_CROSSFADE) {
      cycleOpacity = smoothstep(0, MOBILE_CROSSFADE, cycleT);
    } else if (cycleT > MOBILE_CYCLE - MOBILE_CROSSFADE) {
      cycleOpacity =
        1 - smoothstep(MOBILE_CYCLE - MOBILE_CROSSFADE, MOBILE_CYCLE, cycleT);
    }

    // Advance text at the dark point of the crossfade
    const prevSlot = Math.floor((mobileAge - dt) / MOBILE_CYCLE);
    const slot = Math.floor(mobileAge / MOBILE_CYCLE);
    if (slot !== prevSlot && slot >= 0) {
      mobileIndex = (mobileIndex + 1) % QUESTIONS.length;
      dockEl.textContent = QUESTIONS[mobileIndex];
    }

    // Soft hold — no free-floating transform; CSS docks the box
    dockEl.style.transform = "none";
    dockEl.style.opacity = String(
      Math.max(0, intro * cycleOpacity * presence * 0.95)
    );
    dockEl.style.filter = "none";
  }

  function tick(now = performance.now()) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    if (!reducedMotion) {
      progress += (target - progress) * Math.min(1, dt * 2.4);
    } else {
      progress = target;
    }

    const presence = heroPresence(progress);

    if (mobile) {
      tickMobile(dt, presence);
    } else {
      tickDesktop(dt, presence);
    }

    // Hard hide entire layer past hero
    root.style.visibility = presence < 0.02 ? "hidden" : "visible";
    root.style.pointerEvents = "none";
    root.setAttribute("data-past-hero", presence < 0.02 ? "true" : "false");

    raf = requestAnimationFrame(tick);
  }

  // Desktop: first tag after Earth settles
  if (!mobile && !reducedMotion) {
    setTimeout(() => {
      if (active.length === 0) spawnDesktop();
      spawnTimer = APPEAR_EVERY;
    }, 900);
  } else if (!mobile) {
    spawnDesktop();
  }

  raf = requestAnimationFrame(tick);

  console.info(
    "[Elsewhere] Question tags — mode:",
    mobile ? "mobile-dock" : "desktop-orbit"
  );

  return {
    setProgress,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      clearActive();
      root.innerHTML = "";
    },
  };
}

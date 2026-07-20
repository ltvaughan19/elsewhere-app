"use client";

/**
 * Faithful Next port of Elsewhere Vite `src/main.js`.
 * Same Lenis + GSAP ScrollTrigger wiring, camera scrub, question tags, nav fade.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { createQuestionTags } from "./questionTags.js";
import { createSplineScene } from "./splineScene.js";

gsap.registerPlugin(ScrollTrigger);

type BootHandle = { destroy: () => void };

export async function bootMarketingExperience(root: HTMLElement): Promise<BootHandle> {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const yearEl = root.querySelector<HTMLElement>("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const loader = root.querySelector<HTMLElement>("#loader");
  const loaderCopy = root.querySelector<HTMLElement>(".loader-copy");
  const canvas = root.querySelector<HTMLCanvasElement>("#webgl");
  const arcsCanvas = root.querySelector<HTMLCanvasElement>("#arcs");
  const progressFill = root.querySelector<HTMLElement>("#progress-fill");
  const panels = [...root.querySelectorAll<HTMLElement>(".panel")];
  const panelInners = [...root.querySelectorAll<HTMLElement>(".panel-inner")];

  if (arcsCanvas) {
    arcsCanvas.style.display = "none";
    arcsCanvas.setAttribute("aria-hidden", "true");
  }

  let lenis: Lenis | null = null;
  let lenisTicker: ((time: number) => void) | null = null;
  const wantsDesktopSmoothScroll = () =>
    !reducedMotion && window.innerWidth >= 768;

  function destroyLenis() {
    if (lenisTicker) {
      gsap.ticker.remove(lenisTicker);
      lenisTicker = null;
    }
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
    gsap.ticker.lagSmoothing(500, 33);
  }

  function setupLenis() {
    destroyLenis();
    if (!wantsDesktopSmoothScroll()) return;
    lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    lenisTicker = (time: number) => {
      lenis?.raf(time * 1000);
    };
    gsap.ticker.add(lenisTicker);
    gsap.ticker.lagSmoothing(0);
  }

  setupLenis();

  let questionTags: {
    setProgress: (p: number) => void;
    dispose: () => void;
  } = { setProgress: () => {}, dispose: () => {} };

  const tagsRoot = root.querySelector<HTMLElement>("#question-tags");
  if (tagsRoot) {
    try {
      questionTags = createQuestionTags(tagsRoot, { reducedMotion });
    } catch (e) {
      console.warn("[Elsewhere] Question tags failed", e);
    }
  }

  let earthScene: {
    setProgress: (p: number) => void;
    dispose: () => void;
    hasCamera?: () => boolean;
  } = {
    setProgress: () => {},
    dispose: () => {},
  };

  if (loaderCopy) loaderCopy.textContent = "Loading Earth…";

  const scrollTriggers: ScrollTrigger[] = [];
  const cleanups: Array<() => void> = [];
  const heroCopy = root.querySelector<HTMLElement>(".hero-copy");
  const isMobileHero = () => window.innerWidth < 768;
  const revealUsefulContent = () => {
    loader?.classList.add("is-done");
    heroCopy?.classList.add("is-visible");
    ScrollTrigger.refresh();
  };
  const failSafe = window.setTimeout(revealUsefulContent, 10000);
  cleanups.push(() => window.clearTimeout(failSafe));

  if (canvas) {
    try {
      const scene = await createSplineScene(canvas, {
        onReady: (info: { cameraFound?: boolean }) => {
          if (loaderCopy) loaderCopy.textContent = "Almost there…";
          if (info && info.cameraFound === false) {
            console.warn(
              "[Elsewhere] Scroll camera object not found in Spline scene — check camera name",
            );
          }
          window.setTimeout(revealUsefulContent, 350);
        },
        onError: revealUsefulContent,
      });
      earthScene = scene;
    } catch {
      revealUsefulContent();
    }
  }

  panelInners.forEach((inner) => {
    const section = inner.closest(".panel");
    if (section?.classList.contains("hero") && !reducedMotion) {
      scrollTriggers.push(
        ScrollTrigger.create({
          trigger: section,
          start: "top 75%",
          onEnter: () => {
            if (!isMobileHero()) inner.classList.add("is-visible");
          },
          onEnterBack: () => {
            if (!isMobileHero()) inner.classList.add("is-visible");
          },
        }),
      );
      return;
    }
    scrollTriggers.push(
      ScrollTrigger.create({
        trigger: section,
        start: "top 75%",
        end: "bottom 25%",
        onEnter: () => inner.classList.add("is-visible"),
        onEnterBack: () => inner.classList.add("is-visible"),
      }),
    );
  });

  requestAnimationFrame(() => {
    if (!heroCopy) return;
    if (!isMobileHero() || reducedMotion) {
      heroCopy.classList.add("is-visible");
      if (reducedMotion && isMobileHero()) {
        heroCopy.classList.add("is-mobile-revealed");
      }
    } else {
      heroCopy.classList.add("is-visible");
      heroCopy.classList.remove("is-mobile-revealed");
    }
  });

  let mobileHeroRevealST: ScrollTrigger | null = null;

  function setupMobileHeroReveal() {
    if (!heroCopy) return;

    mobileHeroRevealST?.kill();
    mobileHeroRevealST = null;

    if (reducedMotion) {
      heroCopy.classList.add("is-visible", "is-mobile-revealed");
      return;
    }

    if (!isMobileHero()) {
      heroCopy.classList.remove("is-mobile-revealed");
      heroCopy.classList.add("is-visible");
      return;
    }

    heroCopy.classList.add("is-visible");
    heroCopy.classList.remove("is-mobile-revealed");

    mobileHeroRevealST = ScrollTrigger.create({
      id: "mobile-hero-reveal",
      trigger: root.querySelector("#hero"),
      start: "top top",
      end: "top+=12% top",
      onUpdate: (self) => {
        if (self.progress >= 0.2) {
          heroCopy.classList.add("is-mobile-revealed");
        } else if (self.progress < 0.08) {
          heroCopy.classList.remove("is-mobile-revealed");
        }
      },
      onLeave: () => heroCopy.classList.add("is-mobile-revealed"),
    });
  }

  setupMobileHeroReveal();
  let resizeRevealTimer = 0;
  const onResizeReveal = () => {
    window.clearTimeout(resizeRevealTimer);
    resizeRevealTimer = window.setTimeout(() => {
      setupLenis();
      setupMobileHeroReveal();
      setupScrollProgressTriggers();
      ScrollTrigger.refresh();
    }, 150);
  };
  window.addEventListener("resize", onResizeReveal);
  cleanups.push(() => {
    window.removeEventListener("resize", onResizeReveal);
    window.clearTimeout(resizeRevealTimer);
    mobileHeroRevealST?.kill();
  });

  let earthProgressST: ScrollTrigger | null = null;
  let heroTagsST: ScrollTrigger | null = null;

  function setupScrollProgressTriggers() {
    earthProgressST?.kill();
    heroTagsST?.kill();

    // Mobile: native scroll + no scrub lag (finger and Earth stay in sync).
    const useCinematicScrub = wantsDesktopSmoothScroll();

    earthProgressST = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: useCinematicScrub ? 1.1 : false,
      onUpdate: (self) => {
        const p = self.progress;
        earthScene.setProgress(p);
        if (progressFill) progressFill.style.width = `${p * 100}%`;
      },
    });

    heroTagsST = ScrollTrigger.create({
      trigger: root.querySelector("#hero"),
      start: "top top",
      end: "bottom top",
      scrub: useCinematicScrub ? 0.6 : false,
      onUpdate: (self) => {
        questionTags.setProgress(self.progress);
      },
      onLeave: () => questionTags.setProgress(1),
      onEnterBack: () => questionTags.setProgress(0),
      onLeaveBack: () => questionTags.setProgress(0),
    });
  }

  setupScrollProgressTriggers();
  cleanups.push(() => {
    earthProgressST?.kill();
    heroTagsST?.kill();
  });

  if (!reducedMotion && window.innerWidth > 768) {
    panels.forEach((section) => {
      const inner = section.querySelector(".panel-inner");
      if (!inner || section.classList.contains("hero")) return;
      gsap.fromTo(
        inner,
        { y: 32 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top 90%",
            end: "top 50%",
            scrub: true,
          },
        },
      );
    });
  }

  function getNavThresholdPx() {
    const header = root.querySelector(".site-header");
    const h = header?.getBoundingClientRect().height || 72;
    return Math.ceil(h + 2);
  }

  function syncNavThresholdMarker() {
    const px = getNavThresholdPx();
    document.documentElement.style.setProperty("--nav-threshold", `${px}px`);
    const marker = root.querySelector<HTMLElement>("#nav-threshold");
    if (marker) marker.style.top = `${px}px`;
  }

  let navFadeTriggers: ScrollTrigger[] = [];

  function setupNavContentFade() {
    syncNavThresholdMarker();
    navFadeTriggers.forEach((st) => st.kill());
    navFadeTriggers = [];

    const targets = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll(".panel-inner, .site-footer"),
    );

    if (isMobileHero()) {
      targets.forEach((el) => {
        el.style.setProperty("--nav-exit-fade", "1");
        if (el.classList.contains("panel-inner")) {
          el.style.pointerEvents = "";
        }
      });
      return;
    }

    targets.forEach((el, index) => {
      el.style.setProperty("--nav-exit-fade", "1");

      const st = ScrollTrigger.create({
        id: `nav-content-fade-${index}`,
        trigger: el,
        start: () => `top top+=${getNavThresholdPx()}`,
        end: () => `top top+=${Math.max(6, Math.round(getNavThresholdPx() * 0.18))}`,
        scrub: reducedMotion ? false : 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const fade = 1 - self.progress;
          el.style.setProperty("--nav-exit-fade", String(fade));
          if (el.classList.contains("panel-inner")) {
            el.style.pointerEvents = fade < 0.08 ? "none" : "";
          }
        },
        onLeaveBack: () => {
          el.style.setProperty("--nav-exit-fade", "1");
          if (el.classList.contains("panel-inner")) {
            el.style.pointerEvents = "";
          }
        },
      });
      navFadeTriggers.push(st);
    });
  }

  setupNavContentFade();
  const onResizeNav = () => {
    syncNavThresholdMarker();
    setupNavContentFade();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", onResizeNav);
  cleanups.push(() => {
    window.removeEventListener("resize", onResizeNav);
    navFadeTriggers.forEach((st) => st.kill());
  });

  const anchorHandler = (e: Event) => {
    const link = e.currentTarget as HTMLAnchorElement;
    const id = link.getAttribute("href");
    if (!id || id === "#") return;
    const target = root.querySelector(id) ?? document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target as HTMLElement, { offset: 0, duration: 1.25 });
    else (target as HTMLElement).scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  };

  const anchors = [...root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  anchors.forEach((link) => link.addEventListener("click", anchorHandler));
  cleanups.push(() => {
    anchors.forEach((link) => link.removeEventListener("click", anchorHandler));
  });

  const STORAGE_KEY = "elsewhere-newsletter-emails";
  const form = root.querySelector<HTMLFormElement>("#newsletter");
  const note = root.querySelector<HTMLElement>("#newsletter-note");

  async function saveEmail(email: string) {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Array<
      string | { email: string; at: string }
    >;
    if (!list.find((x) => (typeof x === "string" ? x === email : x.email === email))) {
      list.push({ email, at: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "marketing-home",
          intent: "free_brief",
        }),
      });
    } catch {
      /* local save still counts */
    }
  }

  const onSubmit = (e: Event) => {
    e.preventDefault();
    if (!form) return;
    const input = form.querySelector<HTMLInputElement>("#email");
    const value = input?.value?.trim() ?? "";
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      if (note) {
        note.textContent = "Please enter a valid email.";
        form.classList.remove("is-success");
      }
      input?.focus();
      return;
    }
    void saveEmail(value);
    form.classList.add("is-success");
    if (note) {
      note.textContent =
        "You’re subscribed. Check your inbox for a welcome from Elsewhere.";
    }
    if (input) input.value = "";
  };
  form?.addEventListener("submit", onSubmit);
  cleanups.push(() => form?.removeEventListener("submit", onSubmit));

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener("load", onLoad);
  cleanups.push(() => window.removeEventListener("load", onLoad));

  return {
    destroy() {
      cleanups.forEach((fn) => fn());
      scrollTriggers.forEach((t) => t.kill());
      // Marketing owns ScrollTrigger while mounted — clear all so client nav is clean.
      ScrollTrigger.getAll().forEach((t) => t.kill());
      questionTags.dispose();
      earthScene.dispose();
      destroyLenis();
    },
  };
}

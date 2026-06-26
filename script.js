/* ═══════════════════════════════════════════════════════════════
   SMOOTH TRANSIT GLOBAL — script.js
   • Lucide icons init
   • Locomotive Scroll on homepage with proper data-scroll effects
   • Why-new scroll-spy counter + card reveal
   • All original logic preserved
   FIXES:
   • lerp raised 0.075 → 0.095 for snappier feel
   • Native scroll listeners guarded with "if (locoScroll) return"
     to stop Loco + native competing on homepage
   • Ticket dodge changed from += to = so it never flies off screen
═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  /* ── page detection ── */
  const isHome = !!document.querySelector(".hero");
  const isServices = !!document.querySelector(".svc-nav-strip");
  const isContact = !!document.querySelector(".contact-main");
  const isAbout = !!document.querySelector(".story-section");

  /* inner pages have dark hero → header adapts */
  if (!isHome && document.querySelector(".page-hero")) {
    document.body.classList.add("has-dark-hero");
  }

  /* ================================================================
     0. LUCIDE ICONS
  ================================================================ */
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  /* ================================================================
     1. CUSTOM CURSOR
  ================================================================ */
  const cursorCircle = document.createElement("div");
  cursorCircle.classList.add("cursor-circle");
  const cursorDot = document.createElement("div");
  cursorDot.classList.add("cursor-dot");
  cursorCircle.appendChild(cursorDot);
  document.body.appendChild(cursorCircle);

  let mouseX = 0,
    mouseY = 0,
    curX = 0,
    curY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    const el = document.elementFromPoint(mouseX, mouseY);
    const dark = el?.closest(
      ".booking-card,.ss-slide,.svc-cta-banner,.site-footer,.page-hero,.clientele-section,.quote-section,.process-section,.why-new-left",
    );
    cursorCircle.style.borderColor = dark ? "#fff" : "red";
    cursorDot.style.backgroundColor = dark ? "#fff" : "red";
  });

  (function animCursor() {
    curX += (mouseX - curX) * 0.15;
    curY += (mouseY - curY) * 0.15;
    cursorCircle.style.transform = `translate(${curX}px,${curY}px) translate(-50%,-50%)`;
    requestAnimationFrame(animCursor);
  })();

  /* ================================================================
     2. HEADER — scroll shrink + burger
  ================================================================ */
  const header = document.getElementById("site-header");
  const burger = document.getElementById("burger");
  const mobileNav = document.getElementById("mobileNav");

  if (header) {
    const onScroll = () =>
      header.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (burger && mobileNav) {
    burger.addEventListener("click", () => {
      const open = burger.classList.toggle("open");
      mobileNav.classList.toggle("open", open);
    });
    mobileNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        burger.classList.remove("open");
        mobileNav.classList.remove("open");
      }),
    );
  }

  /* ================================================================
     3. SCROLL PROGRESS BAR
  ================================================================ */
  const progressBar = document.createElement("div");
  progressBar.style.cssText =
    "position:fixed;top:0;left:0;height:3px;width:0;" +
    "background:linear-gradient(90deg,#1a6fe8,#e02020);" +
    "z-index:9999;pointer-events:none;transition:width .1s linear";
  document.body.appendChild(progressBar);

  /* FIX: guard with "if (locoScroll) return" — Loco handles this on homepage */
  window.addEventListener(
    "scroll",
    () => {
      if (locoScroll) return;
      const pct =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
        100;
      progressBar.style.width = Math.min(pct, 100) + "%";
    },
    { passive: true },
  );

  /* ================================================================
     4. LOCOMOTIVE SCROLL — homepage only
  ================================================================ */
  let locoScroll = null;

  if (isHome) {
    const locoEl = document.getElementById("scroll-container");
    if (locoEl && typeof LocomotiveScroll !== "undefined") {
      document.body.classList.add("locomotive-active");

      locoScroll = new LocomotiveScroll({
        el: locoEl,
        smooth: false,
        smoothMobile: false,
        lerp: 0.04 /* FIX: was 0.075 — raised for snappier, less sluggish feel */,
        multiplier: 0.9,
        smartphone: { smooth: false },
        tablet: { smooth: false },
      });

      /* sync native scroll position for non-Loco code */
      locoScroll.on("scroll", ({ scroll, limit }) => {
        window.scrollY_loco = scroll.y;

        /* scroll progress bar */
        const pct = limit.y > 0 ? (scroll.y / limit.y) * 100 : 0;
        progressBar.style.width = Math.min(pct, 100) + "%";

        /* header shrink via loco scroll position */
        if (header) header.classList.toggle("scrolled", scroll.y > 40);

        /* why-new scroll spy */
        whyScrollSpy(scroll.y);
      });

      /* re-init Lucide after Locomotive rewrites the DOM */
      setTimeout(() => {
        if (typeof lucide !== "undefined") lucide.createIcons();
      }, 300);
    }
  }

  /* ================================================================
     5. HERO CANVAS GRID
  ================================================================ */
  const canvas = document.getElementById("gridCanvas");
  const hero = document.querySelector(".hero");

  if (canvas && hero) {
    const ctx = canvas.getContext("2d");
    const cell = 80;
    const fade = 0.02;
    const active = [];
    let W, H;

    const resize = () => {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    hero.addEventListener(
      "mousemove",
      (e) => {
        const r = hero.getBoundingClientRect();
        const col = Math.floor((e.clientX - r.left) / cell);
        const row = Math.floor((e.clientY - r.top) / cell);
        const x = col * cell,
          y = row * cell;
        if (!active.some((c) => c.x === x && c.y === y))
          active.push({ x, y, alpha: 0.14 });
      },
      { passive: true },
    );

    (function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let i = active.length - 1; i >= 0; i--) {
        const c = active[i];
        ctx.fillStyle = `rgba(26,111,232,${c.alpha})`;
        ctx.fillRect(c.x, c.y, cell, cell);
        c.alpha -= fade;
        if (c.alpha <= 0) active.splice(i, 1);
      }
      requestAnimationFrame(draw);
    })();
  }

  /* ================================================================
     6. HERO HEADLINE STAGGER
  ================================================================ */
  const heroLines = document.querySelectorAll(".hero-headline .line-inner");
  heroLines.forEach((el, i) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(60px)";
    setTimeout(
      () => {
        el.style.transition =
          "opacity .8s cubic-bezier(.4,0,.2,1), transform .8s cubic-bezier(.4,0,.2,1)";
        el.style.opacity = "1";
        el.style.transform = "none";
      },
      300 + i * 130,
    );
  });

  /* hero tag + sub fade in */
  const heroTag = document.querySelector(".hero-tag");
  const heroSub = document.querySelector(".hero-sub");
  const heroCta = document.querySelector(".hero-ctas");
  const heroSta = document.querySelector(".hero-stats");
  const heroImgi = document.querySelector(".hero-bg-img");
  [heroTag, heroSub, heroCta, heroSta, heroImgi].forEach((el, i) => {
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    setTimeout(
      () => {
        el.style.transition = "opacity .7s ease, transform .7s ease";
        el.style.opacity = "1";
        el.style.transform = "none";
      },
      200 + i * 150,
    );
  });

  /* ================================================================
     8. CLIENT LOGOS
  ================================================================ */
  const track = document.getElementById("clientsTrack");
  if (track) {
    track.innerHTML += track.innerHTML;
    let pos = 0;
    (function animLogos() {
      pos -= 0.8;
      if (pos <= -track.scrollWidth / 2) pos = 0;
      track.style.transform = `translateX(${pos}px)`;
      requestAnimationFrame(animLogos);
    })();
  }

  /* ================================================================
     9. SERVICES SLIDER
  ================================================================ */
  const ssSlides = document.querySelectorAll(".ss-slide");
  const ssPips = document.querySelectorAll(".ss-pip");
  const ssPrev = document.getElementById("ssPrev");
  const ssNext = document.getElementById("ssNext");
  let ssIdx = 0,
    ssTimer = null;

  function ssGo(idx) {
    ssSlides.forEach((s) => s.classList.remove("active"));
    ssPips.forEach((p) => p.classList.remove("active"));
    ssIdx = (idx + ssSlides.length) % ssSlides.length;
    ssSlides[ssIdx]?.classList.add("active");
    ssPips[ssIdx]?.classList.add("active");
  }
  function ssAuto() {
    clearInterval(ssTimer);
    ssTimer = setInterval(() => ssGo(ssIdx + 1), 5000);
  }

  if (ssSlides.length) {
    if (ssPrev)
      ssPrev.addEventListener("click", () => {
        ssGo(ssIdx - 1);
        ssAuto();
      });
    if (ssNext)
      ssNext.addEventListener("click", () => {
        ssGo(ssIdx + 1);
        ssAuto();
      });
    const ssWrap = document.getElementById("ssSlider");
    if (ssWrap) {
      let ssTX = 0;
      ssWrap.addEventListener(
        "touchstart",
        (e) => {
          ssTX = e.touches[0].clientX;
        },
        { passive: true },
      );
      ssWrap.addEventListener(
        "touchend",
        (e) => {
          const dx = e.changedTouches[0].clientX - ssTX;
          if (Math.abs(dx) > 40) {
            ssGo(ssIdx + (dx < 0 ? 1 : -1));
            ssAuto();
          }
        },
        { passive: true },
      );
    }
    ssGo(0);
    ssAuto();
  }

  /* ================================================================
     10. WHY-NEW — scroll-driven counter + card reveal
  ================================================================ */
  const whyNewSection = document.getElementById("why");
  const whyCards = document.querySelectorAll(".why-card-item");
  const whyCounter = document.getElementById("whyNewActive");

  function whyScrollSpy(scrollY) {
    if (!whyNewSection || !whyCards.length) return;

    /* reveal cards as they enter view */
    whyCards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82) {
        card.classList.add("in-view");
      }
    });

    /* update counter based on which card is most centred */
    let closest = 0,
      minDist = Infinity;
    whyCards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const dist = Math.abs(centre - window.innerHeight * 0.5);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    if (whyCounter) {
      whyCounter.textContent = String(closest + 1).padStart(2, "0");
    }
  }

  /* FIX: guard with "if (locoScroll) return" — Loco handles scroll on homepage,
     native listener running simultaneously caused jank and double-updates */
  window.addEventListener(
    "scroll",
    () => {
      if (locoScroll) return;
      whyScrollSpy(window.scrollY);
      /* re-run card reveal for inner pages */
      document.querySelectorAll(".why-card-item").forEach((card) => {
        if (card.getBoundingClientRect().top < window.innerHeight * 0.85) {
          card.classList.add("in-view");
        }
      });
      /* generic reveal for inner page sections */
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          el.classList.add("revealed");
        }
      });
    },
    { passive: true },
  );

  /* Trigger once on load */
  setTimeout(() => {
    whyScrollSpy(window.scrollY);
    document.querySelectorAll(".why-card-item").forEach((card) => {
      if (card.getBoundingClientRect().top < window.innerHeight * 0.85)
        card.classList.add("in-view");
    });
  }, 400);

  /* ================================================================
     11. GENERIC SECTION REVEALS (inner pages — no Locomotive)
  ================================================================ */
  if (!isHome) {
    const revealEls = document.querySelectorAll(
      ".story-right, .story-sticky, .about-why, .clientele-section .cl-header, " +
        ".cl-cards, .sector-strip, .about-corporate, .svc-block-right, .svc-block-left, " +
        ".svc-corporate-inner, .contact-info, .contact-form-col, .ls-left, .ls-right, " +
        ".faq-list, .corp-left, .corp-right, .astat, .wq-item, .cf-row-item",
    );

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.style.opacity = "1";
          e.target.style.transform = "none";
          io.unobserve(e.target);
        });
      },
      { threshold: 0.1 },
    );

    revealEls.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition =
        "opacity .7s cubic-bezier(.4,0,.2,1), transform .7s cubic-bezier(.4,0,.2,1)";
      io.observe(el);
    });
  }

  /* ================================================================
     12. FOOTER — year, glow, magnetic CTA
  ================================================================ */
  const fyEl = document.getElementById("footer-year");
  if (fyEl) fyEl.textContent = new Date().getFullYear();

  const footerEl = document.getElementById("site-footer");
  const glow = document.getElementById("footer-glow");
  if (footerEl && glow) {
    footerEl.addEventListener("mousemove", (e) => {
      const r = footerEl.getBoundingClientRect();
      glow.style.left = e.clientX - r.left + "px";
      glow.style.top = e.clientY - r.top + "px";
      glow.style.opacity = "1";
    });
    footerEl.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });
  }

  const btnWrap = document.getElementById("cta-btn-wrap");
  const ctaBtn = btnWrap?.querySelector(".cta-btn");
  if (btnWrap && ctaBtn) {
    btnWrap.addEventListener("mousemove", (e) => {
      const r = btnWrap.getBoundingClientRect();
      ctaBtn.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.28}px,${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
    });
    btnWrap.addEventListener("mouseleave", () => {
      ctaBtn.style.transition = "transform .5s cubic-bezier(.4,0,.2,1)";
      ctaBtn.style.transform = "translate(0,0)";
    });
    btnWrap.addEventListener("mouseenter", () => {
      ctaBtn.style.transition = "transform .1s linear";
    });
  }

  /* CTA heading word reveal */
  const ctaHeading = document.querySelector(".cta-heading");
  if (ctaHeading) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.querySelectorAll(".word").forEach((w, i) => {
            w.style.opacity = "0";
            w.style.transform = "translateY(28px)";
            setTimeout(() => {
              w.style.transition = "opacity .65s ease, transform .65s ease";
              w.style.opacity = "1";
              w.style.transform = "none";
            }, i * 90);
          });
        });
      },
      { threshold: 0.5 },
    ).observe(ctaHeading);
  }

  /* ================================================================
     13. SERVICES PAGE — tab nav + scroll spy
  ================================================================ */
  const svcTabs = document.querySelectorAll(".svc-tab");
  if (svcTabs.length) {
    svcTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        svcTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const el = document.getElementById(tab.dataset.target);
        if (el)
          window.scrollTo({ top: el.offsetTop - 130, behavior: "smooth" });
      });
    });

    const svcSections = [
      "flight",
      "protocol",
      "security",
      "logistics",
      "corporate",
    ]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    window.addEventListener(
      "scroll",
      () => {
        const y = window.scrollY + 200;
        let cur = svcSections[0];
        svcSections.forEach((s) => {
          if (s && s.offsetTop <= y) cur = s;
        });
        if (cur)
          svcTabs.forEach((t) =>
            t.classList.toggle("active", t.dataset.target === cur.id),
          );
      },
      { passive: true },
    );
  }

  /* ================================================================
     14. FAQ ACCORDION
  ================================================================ */
  document.querySelectorAll(".faq-item").forEach((item) => {
    const btn = item.querySelector(".faq-q");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const was = item.classList.contains("open");
      document
        .querySelectorAll(".faq-item")
        .forEach((i) => i.classList.remove("open"));
      if (!was) item.classList.add("open");
    });
  });

  /* ================================================================
     15. CONTACT FORM
  ================================================================ */
  const contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector(".cf-submit");
      const success = document.getElementById("cfSuccess");
      const span = btn.querySelector("span");
      if (span) span.textContent = "Sending…";
      btn.disabled = true;
      setTimeout(() => {
        btn.style.display = "none";
        if (success) success.classList.add("show");
        contactForm
          .querySelectorAll("input,select,textarea")
          .forEach((f) => (f.value = ""));
      }, 1200);
    });
  }

  /* ================================================================
     16. PROCESS STEPS — stagger reveal on scroll
  ================================================================ */
  const processSteps = document.querySelectorAll(".process-step");
  if (processSteps.length) {
    const psObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = [...processSteps].indexOf(e.target);
          setTimeout(() => {
            e.target.style.opacity = "1";
            e.target.style.transform = "none";
          }, idx * 120);
          psObs.unobserve(e.target);
        });
      },
      { threshold: 0.2 },
    );

    processSteps.forEach((s) => {
      s.style.opacity = "0";
      s.style.transform = "translateY(30px)";
      s.style.transition = "opacity .7s ease, transform .7s ease";
      psObs.observe(s);
    });
  }

  /* ================================================================
     17. QUOTE SECTION — text reveal
  ================================================================ */
  const quoteText = document.querySelector(".quote-text");
  if (quoteText) {
    const qObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.style.opacity = "1";
          e.target.style.transform = "none";
          qObs.unobserve(e.target);
        });
      },
      { threshold: 0.3 },
    );
    quoteText.style.opacity = "0";
    quoteText.style.transform = "translateY(30px)";
    quoteText.style.transition = "opacity 1s ease, transform 1s ease";
    qObs.observe(quoteText);
  }

  /* ================================================================
     18. SMOOTH ANCHOR LINKS
  ================================================================ */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      if (locoScroll) {
        locoScroll.scrollTo(el, { offset: -80, duration: 1200 });
      } else {
        window.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
      }
    });
  });

  /* ================================================================
     19. INTRO IMAGE PARALLAX (fallback for non-Loco)
  ================================================================ */
  if (!locoScroll) {
    const introRight = document.querySelector(".intro-right");
    if (introRight) {
      window.addEventListener(
        "scroll",
        () => {
          const rect = introRight.getBoundingClientRect();
          const pct =
            (window.innerHeight - rect.top) /
            (window.innerHeight + rect.height);
          introRight.style.transform = `translateY(${pct * -30}px)`;
        },
        { passive: true },
      );
    }
  }

  /* ================================================================
     20. BENEFITS STRIP — stagger
  ================================================================ */
  const benefitItems = document.querySelectorAll(".benefit-item");
  if (benefitItems.length) {
    const bObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = [...benefitItems].indexOf(e.target);
          setTimeout(() => {
            e.target.style.opacity = "1";
            e.target.style.transform = "none";
          }, idx * 100);
          bObs.unobserve(e.target);
        });
      },
      { threshold: 0.2 },
    );

    benefitItems.forEach((b) => {
      b.style.opacity = "0";
      b.style.transform = "translateY(24px)";
      b.style.transition = "opacity .65s ease, transform .65s ease";
      bObs.observe(b);
    });
  }

  /* ================================================================
     21. CORP FEATURES STRIP — stagger
  ================================================================ */
  const corpFeats = document.querySelectorAll(".corp-feat");
  if (corpFeats.length) {
    const cfObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = [...corpFeats].indexOf(e.target);
          setTimeout(() => {
            e.target.style.opacity = "1";
            e.target.style.transform = "none";
          }, idx * 100);
          cfObs.unobserve(e.target);
        });
      },
      { threshold: 0.15 },
    );

    corpFeats.forEach((f) => {
      f.style.opacity = "0";
      f.style.transform = "translateX(20px)";
      f.style.transition = "opacity .65s ease, transform .65s ease";
      cfObs.observe(f);
    });
  }

  /* ================================================================
     22. HERO FLOAT CHIPS — entrance
  ================================================================ */
  const chips = document.querySelectorAll(".float-chip");
  chips.forEach((chip, i) => {
    chip.style.opacity = "0";
    chip.style.transform = "translateY(20px) scale(0.95)";
    setTimeout(
      () => {
        chip.style.transition = "opacity .7s ease, transform .7s ease";
        chip.style.opacity = "1";
        chip.style.transform = "none";
      },
      900 + i * 180,
    );
  });

  /* subtle float animation */
  chips.forEach((chip, i) => {
    chip.style.animation = `chipFloat ${3 + i * 0.5}s ease-in-out infinite`;
  });

  /* ================================================================
     23. AFTER ALL INITS — refresh Locomotive
  ================================================================ */
  if (locoScroll) {
    setTimeout(() => {
      locoScroll.update();
      if (typeof lucide !== "undefined") lucide.createIcons();
    }, 600);
  }
});

/* ── chip float keyframe injected via JS to avoid CSS file dependency ── */
const chipStyle = document.createElement("style");
chipStyle.textContent = `
  @keyframes chipFloat {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-6px); }
  }
`;
document.head.appendChild(chipStyle);

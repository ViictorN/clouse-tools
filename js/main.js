/* ============================================================
   CLOUSE TOOLS — main.js
   Chrome rendering, search (⌘K), Lenis + GSAP motion system,
   cursor, magnetic elements, spotlight cards, page renderers.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var PAGE = document.body.getAttribute("data-page") || "";
  var QS = new URLSearchParams(location.search);

  window.CT = {};
  CT.icon = function (name, cls) {
    return '<span class="icn ' + (cls || "") + '">' + (ICON_DATA[name] || ICON_DATA.abc || "") + "</span>";
  };
CT.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return String.fromCharCode(38) + "#" + c.charCodeAt(0) + ";"; }); };

  CT.copy = function (text, note) {
    var done = function () { CT.toast(note || "Copied to clipboard"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { legacy(); });
    } else legacy();
    function legacy() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { CT.toast("Copy failed — select manually"); }
      ta.remove();
    }
  };

  /* ---------------- header / footer ---------------- */
  function catLink(c) { return '<a href="category.html?cat=' + c.id + '">' + c.name + "</a>"; }
  function renderChrome() {
    var header = $("#site-header");
    if (header) {
      var active = { home: "index.html", tools: "tools.html", about: "about.html" }[PAGE];
      header.innerHTML =
        '<nav class="nav" id="nav" aria-label="Main">' +
          '<div class="container nav-inner">' +
            '<a class="nav-logo" href="index.html" aria-label="Clouse Tools home">' +
              '<span class="logo-mark" aria-hidden="true">C</span><span>Clouse&nbsp;Tools</span>' +
            "</a>" +
            '<div class="nav-links">' +
              '<a href="index.html"' + (PAGE === "home" ? ' class="active"' : "") + ">Home</a>" +
              '<a href="tools.html"' + (PAGE === "tools" || PAGE === "category" ? ' class="active"' : "") + ">Tools</a>" +
              '<a href="index.html#categories">Categories</a>' +
              '<a href="about.html"' + (PAGE === "about" ? ' class="active"' : "") + ">About</a>" +
            "</div>" +
            '<div class="nav-cta">' +
              '<button class="nav-search-btn" id="open-search" aria-label="Open search (Ctrl+K)">' + CT.icon("search") + "<kbd>Ctrl K</kbd></button>" +
              '<a class="btn btn-primary btn-sm" data-magnetic href="tools.html">' + CT.icon("sparkles") + "All tools</a>" +
              '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span></button>' +
            "</div>" +
          "</div>" +
        "</nav>";
    }
    var footer = $("#site-footer");
    if (footer) {
      var pop = popularTools(5);
      footer.innerHTML =
        '<div class="container">' +
          '<div class="footer-grid">' +
            "<div class='footer-brand'>" +
              '<a class="nav-logo" href="index.html"><span class="logo-mark" aria-hidden="true">C</span><span>Clouse&nbsp;Tools</span></a>' +
              "<p>Free online tools for everyone. Fast, private and 100% in your browser — no registration, no uploads, no limits.</p>" +
            "</div>" +
            "<div><h5>Popular</h5><ul>" + pop.map(function (t) { return '<li><a href="tool.html?tool=' + t.slug + '">' + t.name + "</a></li>"; }).join("") + "</ul></div>" +
            "<div><h5>Categories</h5><ul>" + CATEGORIES.map(function (c) { return "<li>" + catLink(c) + "</li>"; }).join("") + "</ul></div>" +
            "<div><h5>Company</h5><ul>" +
              '<li><a href="about.html">About</a></li><li><a href="components.html">Components</a></li>' +
              '<li><a href="terms.html">Terms of Use</a></li><li><a href="privacy.html">Privacy Policy</a></li>' +
            "</ul></div>" +
          "</div>" +
          '<div class="footer-bottom">' +
            "<p>© 2026 Clouse Tools — Simple tools. Real productivity.</p>" +
            '<div class="footer-social">' +
              '<a href="about.html" aria-label="About">' + CT.icon("globe") + "</a>" +
              '<a href="components.html" aria-label="Components">' + CT.icon("star") + "</a>" +
              '<a href="tool.html?tool=qr-code-generator" aria-label="QR generator">' + CT.icon("qrcode") + "</a>" +
            "</div>" +
          "</div>" +
        "</div>";
    }
    hydrateIcons(document);
  }

  /* ---------------- mobile menu ---------------- */
  function initMenu() {
    var burger = $("#burger");
    if (!burger) return;
    var menu = document.createElement("div");
    menu.className = "m-menu";
    var links = [
      ["index.html", "Home", "01"], ["tools.html", "All Tools", "02"], ["category.html?cat=math", "Math Tools", "03"],
      ["category.html?cat=text", "Text Tools", "04"], ["category.html?cat=converters", "Converters", "05"], ["about.html", "About", "06"]
    ];
    menu.innerHTML = links.map(function (l, i) {
      return '<a class="m-link" style="transition-delay:' + (i * 45 + 60) + 'ms" href="' + l[0] + '">' + l[1] + "<small>" + l[2] + "</small></a>";
    }).join("") +
      '<div class="m-foot"><a class="btn btn-primary" href="tools.html">Explore 67 tools</a>' +
      '<button class="btn btn-ghost" id="m-search">Search ' + CT.icon("search") + "</button></div>";
    document.body.appendChild(menu);
    function toggle(force) {
      var open = document.body.classList.toggle("menu-open", force);
      burger.setAttribute("aria-expanded", open);
      if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
    }
    burger.addEventListener("click", function () { toggle(!document.body.classList.contains("menu-open")); });
    $$(".m-menu a").forEach(function (a) { a.addEventListener("click", function () { toggle(false); }); });
    var ms = $("#m-search");
    if (ms) ms.addEventListener("click", function () { toggle(false); openSearch(""); });
  }

  /* ---------------- search overlay (Ctrl+K) ---------------- */
  var sOverlay, sInput, sResults, sActive = -1, sItems = [];
  function renderSearchOverlay() {
    sOverlay = document.createElement("div");
    sOverlay.className = "search-overlay";
    sOverlay.setAttribute("role", "dialog"); sOverlay.setAttribute("aria-label", "Search tools");
    sOverlay.innerHTML =
      '<div class="search-panel">' +
        '<div class="search-row">' + CT.icon("search") +
          '<input class="search-input" id="s-input" type="text" placeholder="Search 67 tools…" aria-label="Search tools" autocomplete="off" spellcheck="false">' +
          '<span class="search-hint">ESC</span>' +
        "</div>" +
        '<div class="search-results" id="s-results"></div>' +
      "</div>";
    document.body.appendChild(sOverlay);
    sInput = $("#s-input", sOverlay); sResults = $("#s-results", sOverlay);
    sInput.addEventListener("input", function () { paintResults(sInput.value); });
    sInput.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var t = sItems[sActive];
        go(t ? "tool.html?tool=" + t.slug : "search.html?q=" + encodeURIComponent(sInput.value.trim()));
      }
    });
    sOverlay.addEventListener("click", function (e) { if (e.target === sOverlay) closeSearch(); });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); sOverlay.classList.contains("open") ? closeSearch() : openSearch(); }
      else if (e.key === "Escape" && sOverlay.classList.contains("open")) closeSearch();
      else if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && !sOverlay.classList.contains("open")) { e.preventDefault(); openSearch(); }
    });
  }
  function toolRow(t) {
    return '<div class="sr-item" data-slug="' + t.slug + '">' +
      '<span class="tile-icn soft">' + CT.icon(t.icon) + "</span>" +
      '<div><div class="sr-name">' + t.name + '</div><div class="sr-cat">' + CAT_BY_ID[t.cat].name + "</div></div></div>";
  }
  function paintResults(q) {
    sActive = -1;
    if (!q.trim()) {
      sItems = popularTools(6);
      sResults.innerHTML = '<div class="t-label" style="padding:10px 16px 4px">Popular right now</div>' + sItems.map(toolRow).join("");
    } else {
      sItems = searchTools(q, 9);
      sResults.innerHTML = sItems.length
        ? sItems.map(toolRow).join("")
        : '<div class="sr-empty"><b>No tools found for "' + CT.esc(q) + '"</b>Try "percent", "image" or "json".</div>';
    }
    bindRows();
  }
  function bindRows() {
    $$(".sr-item", sResults).forEach(function (row) {
      row.addEventListener("click", function () { go("tool.html?tool=" + row.getAttribute("data-slug")); });
    });
  }
  function move(d) {
    var rows = $$(".sr-item", sResults);
    if (!rows.length) return;
    sActive = (sActive + d + rows.length) % rows.length;
    rows.forEach(function (r, i) { r.classList.toggle("active", i === sActive); });
    rows[sActive].scrollIntoView({ block: "nearest" });
  }
  function openSearch(prefill) {
    if (document.body.classList.contains("menu-open")) document.body.classList.remove("menu-open");
    sOverlay.classList.add("open");
    sInput.value = prefill || "";
    paintResults(sInput.value);
    setTimeout(function () { sInput.focus(); }, 60);
  }
  function closeSearch() { sOverlay.classList.remove("open"); }
  CT.openSearch = openSearch;

  /* ---------------- navigation + page wipe ---------------- */
  var wiping = false;
  function go(url) {
    if (wiping) return;
    if (!window.gsap || REDUCED) { location.href = url; return; }
    wiping = true;
    var wipe = $(".page-wipe");
    var name = url.indexOf("tool=") > -1 ? TOOL_BY_SLUG[QSnoop(url, "tool")] ? TOOL_BY_SLUG[QSnoop(url, "tool")].name : "" : "";
    $(".wipe-inner", wipe).textContent = name || "";
    gsap.timeline({ onComplete: function () { location.href = url; } })
      .set(".page-wipe", { transformOrigin: "bottom" })
      .to(".page-wipe", { scaleY: 1, duration: 0.42, ease: "power3.inOut" })
      .to(".wipe-inner", { opacity: 1, duration: 0.2 }, "-=0.15");
  }
  function QSnoop(url, key) {
    var m = url.match(new RegExp("[?&]" + key + "=([^&]+)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function initLinks() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!href || href.charAt(0) === "#" || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (href.indexOf("http") === 0 || href.indexOf("mailto:") === 0) return;
      e.preventDefault();
      go(href);
    });
    if (window.gsap && !REDUCED) {
      gsap.set(".page-wipe", { transformOrigin: "top" });
      gsap.to(".page-wipe", { scaleY: 0, duration: 0.55, ease: "power3.out", delay: 0.05 });
    }
  }

  /* ---------------- card templates ---------------- */
  function toolCard(t, i) {
    return '<a class="t-card' + (t.popular ? " popular" : "") + '" data-spot href="tool.html?tool=' + t.slug + '" data-cursor="view" aria-label="' + CT.esc(t.name) + '">' +
      '<span class="tile-icn soft">' + CT.icon(t.icon) + "</span>" +
      "<h3>" + CT.esc(t.name) + "</h3>" +
      "<p>" + CT.esc(t.desc) + "</p>" +
      '<div class="t-foot"><span class="t-cat">' + CAT_BY_ID[t.cat].name.replace(" Tools", "") + '</span><span class="t-go">' + CT.icon("arrow-up-right") + "</span></div>" +
      "</a>";
  }
  function catCard(c) {
    var list = toolsByCategory(c.id);
    var sample = list.slice(0, 3).map(function (t) { return "<span>" + t.name.replace(/ (Calculator|Generator|Converter|Tools|Checker|Timer|Analyzer)$/, "") + "</span>"; }).join("");
    return '<a class="cat-card" data-spot href="category.html?cat=' + c.id + '" data-cursor="view">' +
      '<div class="cat-head"><span class="tile-icn">' + CT.icon(c.icon) + '</span><span class="cat-count">' + list.length + " tools</span></div>" +
      "<h3>" + c.name + "</h3><p>" + c.desc + "</p>" +
      '<div class="cat-tags">' + sample + "</div></a>";
  }

  /* ---------------- page renderers ---------------- */
  function renderHome() {
    var pop = $("#popular-grid");
    if (pop) pop.innerHTML = popularTools(8).map(toolCard).join("");
    var catg = $("#category-grid");
    if (catg) catg.innerHTML = CATEGORIES.map(catCard).join("");
    var chips = $("#band-chips");
    if (chips) chips.innerHTML = TOOLS.slice(0, 14).map(function (t) {
      return '<span class="glass-chip">' + CT.icon(t.icon) + t.name.replace(/ (Calculator|Generator|Converter|Tools|Checker|Timer|Analyzer)$/, "") + "</span>";
    }).join("");
    var mq = $("#marquee-track");
    if (mq) {
      var items = TOOLS.slice(14, 48).map(function (t) {
        return '<span class="m-item">' + CT.icon(t.icon) + t.name + "</span>";
      }).join("");
      mq.innerHTML = items; mq.insertAdjacentHTML("afterend", '<div class="m-track" aria-hidden="true">' + items + "</div>");
      $(".marquee").setAttribute("aria-hidden", "true");
    }
    var heroChips = $("#hero-chips");
    if (heroChips) {
      var quick = ["percentage", "word count", "date", "image resize", "base64", "password"];
      heroChips.innerHTML = quick.map(function (q) { return '<button class="chip" data-q="' + q + '">' + q + "</button>"; }).join("");
      heroChips.addEventListener("click", function (e) {
        var b = e.target.closest(".chip"); if (!b) return;
        var r = searchTools(b.getAttribute("data-q"), 1);
        go(r.length ? "tool.html?tool=" + r[0].slug : "search.html?q=" + encodeURIComponent(b.getAttribute("data-q")));
      });
    }
    var hs = $("#hero-search-input");
    if (hs) {
      hs.closest("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var q = hs.value.trim(); if (!q) return;
        go("search.html?q=" + encodeURIComponent(q));
      });
    }
  }

  function renderToolsPage() {
    var grid = $("#all-tools-grid");
    if (!grid) return;
    var bar = $("#filter-bar");
    var current = "all";
    function paint(cat) {
      current = cat;
      var list = cat === "all" ? TOOLS : toolsByCategory(cat);
      grid.innerHTML = list.map(toolCard).join("");
      $$(".fchip", bar).forEach(function (c) { c.classList.toggle("active", c.getAttribute("data-cat") === cat); });
      $("#tools-count").textContent = list.length + (list.length === 1 ? " tool" : " tools");
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      revealBatch(grid);
    }
    bar.innerHTML = '<button class="fchip active" data-cat="all">All</button>' +
      CATEGORIES.map(function (c) { return '<button class="fchip" data-cat="' + c.id + '">' + c.name + "</button>"; }).join("");
    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".fchip"); if (b) paint(b.getAttribute("data-cat"));
    });
    paint("all");
  }

  function renderCategoryPage() {
    var id = QS.get("cat") || "math";
    var c = CAT_BY_ID[id];
    if (!c) { location.replace("tools.html"); return; }
    document.title = c.name + " — Clouse Tools";
    var hero = $("#cat-hero");
    hero.innerHTML =
      '<div class="eyebrow"><span class="dot"></span>Category</div>' +
      '<h1 class="h-d2">' + c.name + '</h1>' +
      '<p class="lead">' + c.blurb + "</p>";
    var list = toolsByCategory(id);
    $("#cat-grid").innerHTML = list.map(toolCard).join("");
    $("#cat-count").textContent = list.length + (list.length === 1 ? " tool" : " tools");
    var others = $("#other-cats");
    others.innerHTML = CATEGORIES.filter(function (x) { return x.id !== id; }).map(catCard).join("");
    revealBatch($("#cat-grid")); revealBatch(others);
  }

  function renderToolPage() {
    var slug = QS.get("tool");
    var t = TOOL_BY_SLUG[slug];
    var hero = $("#tool-hero");
    var card = $("#tool-card-slot");
    if (!t) {
      document.title = "Tool not found — Clouse Tools";
      hero.innerHTML = '<h1 class="h-d2">Tool not found</h1><p class="lead">The tool you are looking for does not exist (yet).</p>';
      card.innerHTML = '<div class="btn-row" style="justify-content:center"><a class="btn btn-primary" href="tools.html">Browse all tools</a></div>';
      $("#tool-extra").innerHTML = ""; $("#related-slot").innerHTML = ""; return;
    }
    document.title = t.name + " — Clouse Tools";
    var c = CAT_BY_ID[t.cat];
    hero.innerHTML =
      '<span class="tile-icn" aria-hidden="true">' + CT.icon(t.icon) + "</span>" +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="index.html">Home</a>' + CT.icon("chevron-right") +
        '<a href="category.html?cat=' + t.cat + '">' + c.name + "</a>" + CT.icon("chevron-right") + "<span>" + t.name + "</span></nav>" +
      "<h1>" + CT.esc(t.name) + "</h1>" +
      '<p class="lead">' + CT.esc(t.desc) + "</p>";
    if (window.ToolEngine && ToolEngine.render(t.slug, card)) {
      /* rendered */
    } else {
      card.innerHTML = '<div class="error-note">' + CT.icon("alert-triangle") + "This tool could not be loaded. Refresh the page.</div>";
    }
    $("#tool-extra").innerHTML =
      '<section class="about-tool"><h2>About this tool</h2><p>' + CT.esc(t.about) + "</p>" +
      '<ul><li>' + CT.icon("shield-check") + "Runs 100% in your browser — nothing is uploaded to any server.</li>" +
      "<li>" + CT.icon("zap") + "Results update instantly as you type.</li>" +
      "<li>" + CT.icon("star") + "Free forever, no registration or account required.</li></ul></section>";
    var rel = toolsByCategory(t.cat).filter(function (x) { return x.slug !== t.slug; }).slice(0, 4);
    if (rel.length < 4) popularTools(4).forEach(function (x) { if (rel.length < 4 && x.slug !== t.slug && rel.indexOf(x) < 0) rel.push(x); });
    $("#related-slot").innerHTML = rel.map(toolCard).join("");
    revealBatch($("#related-slot"));
  }

  function renderSearchPage() {
    var q = QS.get("q") || "";
    var norm = q.trim().replace(/\s+/g, " ");
    document.title = (norm ? '"' + norm + '" — search' : "Search") + " — Clouse Tools";
    var h = $("#search-hero");
    h.innerHTML = '<div class="eyebrow"><span class="dot"></span>Search</div>' +
      '<h1 class="h-d2">' + (norm ? "Results for &ldquo;" + CT.esc(norm) + "&rdquo;" : "Search all tools") + "</h1>";
    var grid = $("#search-grid");
    var res = norm ? searchTools(norm, 40) : [];
    $("#search-count").textContent = res.length + (res.length === 1 ? " result" : " results");
    if (res.length) {
      grid.innerHTML = res.map(toolCard).join("");
    } else {
      grid.className = "tools-grid cols-3";
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px 20px 10px">' +
        '<h3 style="font-size:22px;margin-bottom:10px">Nothing found' + (norm ? ' for &ldquo;' + CT.esc(norm) + "&rdquo;" : "") + "</h3>" +
        '<p class="lead-sm" style="margin-bottom:26px">Try a shorter keyword, or start with one of these:</p></div>' +
        popularTools(6).map(toolCard).join("");
    }
    revealBatch(grid);
  }

  /* ---------------- motion system ---------------- */
  function revealBatch(scope) {
    if (!window.gsap || REDUCED) return;
    var items = $$(".t-card, .cat-card, .band-feature", scope || document).filter(function (el) { return !el.__revealed; });
    if (!items.length) return;
    items.forEach(function (el) { el.__revealed = true; });
    gsap.from(items, {
      y: 30, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.06,
      scrollTrigger: { trigger: items[0], start: "top 92%", once: true },
      clearProps: "transform,opacity"
    });
  }

  function initMotion() {
    var hasGsap = !!window.gsap;
    if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (hasGsap && window.SplitText) gsap.registerPlugin(SplitText);

    /* smooth scroll */
    if (window.Lenis && !REDUCED) {
      var lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
      window.__lenis = lenis;
      if (hasGsap) {
        lenis.on("scroll", function () { if (window.ScrollTrigger) ScrollTrigger.update(); });
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      CT.scrollTo = function (target) { lenis.scrollTo(target, { offset: -90, duration: 1.1 }); };
    } else {
      CT.scrollTo = function (target) { var el = typeof target === "string" ? $(target) : target; if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var el = $(a.getAttribute("href"));
      if (el) { e.preventDefault(); CT.scrollTo(el); }
    });

    if (!hasGsap) return;

    /* generic reveals */
    if (!REDUCED) {
      $$("[data-reveal]").forEach(function (el) {
        gsap.from(el, {
          y: 34, opacity: 0, duration: 0.9, ease: "power3.out", delay: parseFloat(el.getAttribute("data-delay") || 0),
          scrollTrigger: { trigger: el, start: "top 88%", once: true }, clearProps: "transform,opacity"
        });
      });
    }

    /* hero intro (home) */
    if (PAGE === "home" && !REDUCED && window.SplitText) {
      var h1 = $(".hero h1");
      if (h1) {
        var split = new SplitText(h1, { type: "lines,chars", linesClass: "line" });
        gsap.from(split.chars, { yPercent: 118, duration: 1.05, ease: "power4.out", stagger: { amount: 0.55, from: "start" }, delay: 0.15 });
      }
      var heroSeq = [[".hero .eyebrow", 0.35], [".hero .hero-sub", 0.45], [".hero-search", 0.55], [".hero-chips", 0.68], [".hero-stats", 0.78]];
      heroSeq.forEach(function (it, i) {
        var el = $(it[0]); if (!el) return;
        gsap.from(el, { y: 26, opacity: 0, duration: 0.9, ease: "power3.out", delay: it[1], clearProps: "transform,opacity" });
      });
    }

    /* counters */
    $$("[data-count-to]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count-to"));
      if (REDUCED) { el.textContent = end + (el.getAttribute("data-suffix") || ""); return; }
      var obj = { v: 0 };
      gsap.to(obj, {
        v: end, duration: 1.6, ease: "power2.out", delay: parseFloat(el.getAttribute("data-delay") || 0.5),
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: function () { el.textContent = Math.round(obj.v) + (el.getAttribute("data-suffix") || ""); }
      });
    });

    /* dark band clip reveal + orb parallax */
    var band = $(".band-dark");
    if (band && !REDUCED && window.ScrollTrigger) {
      gsap.fromTo(band,
        { clipPath: "inset(12% 6% 12% 6% round 44px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
          scrollTrigger: { trigger: band, start: "top 82%", end: "top 30%", scrub: 0.6 } });
      var orb = $(".bg-orb", band);
      if (orb) gsap.to(orb, { y: 160, ease: "none", scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: 1 } });
      var floats = $$(".glass-chip", band);
      if (floats.length && window.ScrollTrigger) {
        gsap.to(floats, { y: function (i) { return i % 2 ? 8 : -8; }, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.12 });
      }
    }

    /* nav hide/show */
    var nav = $("#nav"); var lastY = 0;
    var onScroll = function () {
      var y = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle("scrolled", y > 14);
      if (y > 340 && y > lastY + 6) nav.classList.add("hidden");
      else if (y < lastY - 6 || y <= 340) nav.classList.remove("hidden");
      lastY = y;
    };
    (window.__lenis ? window.__lenis.on("scroll", onScroll) : window.addEventListener("scroll", onScroll, { passive: true }));

    if (REDUCED) return;

    /* magnetic */
    if (FINE && window.gsap) {
      $$("[data-magnetic]").forEach(function (el) {
        var xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
        var yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.32);
          yTo((e.clientY - r.top - r.height / 2) * 0.32);
        });
        el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
      });
    }

  }

  /* cursor events are bound outside initMotion for clarity */
  function initCursor() {
    if (!FINE || REDUCED || !window.gsap) return;
    var dot = $(".cursor-dot"), ring = $(".cursor-ring");
    if (!dot || !ring) return;
    var rx = gsap.quickTo(ring, "x", { duration: 0.32, ease: "power3" });
    var ry = gsap.quickTo(ring, "y", { duration: 0.32, ease: "power3" });
    var dx = gsap.quickTo(dot, "x", { duration: 0.07, ease: "none" });
    var dy = gsap.quickTo(dot, "y", { duration: 0.07, ease: "none" });
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    window.addEventListener("pointermove", function (e) { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest("a, button, [data-cursor], input, select, textarea, .chip, .fchip, .sr-item")) ring.classList.add("hovered");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest("a, button, [data-cursor], input, select, textarea, .chip, .fchip, .sr-item")) ring.classList.remove("hovered");
    });
    window.addEventListener("pointerdown", function () { ring.classList.add("press"); });
    window.addEventListener("pointerup", function () { ring.classList.remove("press"); });
  }

  /* spotlight cards */
  function initSpotlight() {
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest ? e.target.closest("[data-spot]") : null;
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  /* ---------------- preloader (home) ---------------- */
  function initPreloader() {
    var pre = $("#preloader");
    if (!pre) return;
    if (REDUCED || !window.gsap) { pre.remove(); return; }
    var count = $(".p-count", pre), bar = $(".p-bar i", pre);
    var obj = { v: 0 };
    var tl = gsap.timeline({ onComplete: function () { pre.remove(); } });
    tl.to(".p-mark", { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0)
      .to(obj, {
        v: 100, duration: 1.05, ease: "power2.inOut", onUpdate: function () {
          count.textContent = Math.round(obj.v);
          bar.style.width = obj.v + "%";
        }
      }, 0.1)
      .to(pre, { yPercent: -100, duration: 0.75, ease: "power4.inOut" }, "+=0.1");
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var steps = [
      ["renderChrome", function () { renderChrome(); }],
      ["initMenu", function () { initMenu(); }],
      ["renderSearchOverlay", function () { renderSearchOverlay(); }],
      ["hydrateIcons", function () { hydrateIcons(document); }],
      ["renderHome", function () { if (PAGE === "home") renderHome(); }],
      ["renderToolsPage", function () { if (PAGE === "tools") renderToolsPage(); }],
      ["renderCategoryPage", function () { if (PAGE === "category") renderCategoryPage(); }],
      ["renderToolPage", function () { if (PAGE === "tool") renderToolPage(); }],
      ["renderSearchPage", function () { if (PAGE === "search") renderSearchPage(); }],
      ["initLinks", function () { initLinks(); }],
      ["initMotion", function () { initMotion(); }],
      ["initCursor", function () { initCursor(); }],
      ["initSpotlight", function () { initSpotlight(); }],
      ["initPreloader", function () { initPreloader(); }],
      ["refresh", function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }],
      ["engineHook", function () { if (window.ToolEngine && ToolEngine.afterBoot) ToolEngine.afterBoot(); }]
    ];
    steps.forEach(function (s) {
      try { s[1](); } catch (e) {
        console.error("BOOT FAIL @ " + s[0] + ": " + (e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e));
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

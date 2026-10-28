// @ts-nocheck
/* ============================================================
   CLOUSE TOOLS — tool-engine.ts
   67 fully functional tools, 100% client-side in Next.js React.
   ============================================================ */
import { ICONS } from './icons';

export function renderTool(
  slug: string,
  root: HTMLElement,
  showToast: (msg: string) => void
): boolean {
  if (!root) return false;

  const CT = {
    icon: (name: string) => ICONS[name] || ICONS['sparkles'] || '',
    esc: (s: any) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    copy: (text: string) => {
      if (!text) return;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(String(text)).then(() => {
          showToast('Copied to clipboard');
        }).catch(() => {
          showToast('Copied to clipboard');
        });
      } else {
        showToast('Copied: ' + String(text).slice(0, 30));
      }
    },
    toast: (msg: string) => showToast(msg)
  };
  const esc = CT.esc;
  const E: Record<string, (root: HTMLElement) => void> = {};

  /* ---------------- shared helpers ---------------- */
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function num(v, def) { var n = parseFloat(String(v).replace(/,/g, ".")); return isNaN(n) ? (def || 0) : n; }
  function fmt(n, d) {
    if (!isFinite(n)) return "—";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: (d == null ? 6 : d) }).format(n);
  }
  function fmtE(n) { if (!isFinite(n)) return "—"; return new Intl.NumberFormat("en-US", { maximumFractionDigits: 10 }).format(n); }
  function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
  var MON = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DAYN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  function lab(t) { return '<span class="t-label">' + t + "</span>"; }
  function inputHtml(id, type, value, attrs) {
    return '<input class="t-input" id="' + id + '" type="' + type + '" value="' + esc(value == null ? "" : value) + '" ' + (attrs || "") + ">";
  }
  function selectHtml(id, options, val) {
    return '<select class="t-select" id="' + id + '">' + options.map(function (o) {
      var v = typeof o === "string" ? o : o.v, n = typeof o === "string" ? o : o.n;
      return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? " selected" : "") + ">" + esc(n) + "</option>";
    }).join("") + "</select>";
  }
  function areaHtml(id, ph) { return '<textarea class="t-area" id="' + id + '" placeholder="' + esc(ph || "Paste your text here…") + '"></textarea>'; }
  function resultPanel(id) {
    return '<div class="t-result" id="' + id + '-panel" hidden>' +
      '<button class="copy-btn" id="' + id + '-copy" aria-label="Copy result">' + CT.icon("copy") + "</button>" +
      '<div class="r-label">Result</div><div class="r-main" id="' + id + '-main"></div>' +
      '<div class="r-sub" id="' + id + '-sub" hidden></div><div class="r-grid" id="' + id + '-grid" hidden></div></div>';
  }
  function panelShow(id, o) {
    var p = q("#" + id + "-panel");
    if (!p) return;
    if (o.error) {
      p.hidden = false;
      p.querySelector(".r-label").textContent = "Error";
      q("#" + id + "-main").textContent = o.error;
      q("#" + id + "-sub").hidden = true; q("#" + id + "-grid").hidden = true;
      p.dataset.copy = "";
      return;
    }
    p.hidden = false;
    p.querySelector(".r-label").textContent = o.label || "Result";
    q("#" + id + "-main").textContent = o.main == null ? "" : o.main;
    var sub = q("#" + id + "-sub");
    sub.hidden = !o.sub; sub.textContent = o.sub || "";
    var grid = q("#" + id + "-grid");
    grid.hidden = !o.cells || !o.cells.length;
    grid.innerHTML = (o.cells || []).map(function (c) { return '<div class="r-cell"><b>' + esc(c[0]) + "</b><span>" + esc(c[1]) + "</span></div>"; }).join("");
    p.dataset.copy = o.copy != null ? o.copy : (o.main != null ? o.main : "");
  }
  function bindPanelCopy(id) {
    var b = q("#" + id + "-copy");
    if (b) b.addEventListener("click", function () {
      var p = q("#" + id + "-panel");
      CT.copy(p.dataset.copy || "");
    });
  }
  function bindCopyBtn(btnSel, getText) {
    var b = q(btnSel);
    if (b) b.addEventListener("click", function () { CT.copy(getText()); });
  }
  function outBox(id, ph) {
    return '<div class="out-box" id="' + id + '" ' + (ph ? 'data-ph="' + esc(ph) + '"' : "") + '></div>';
  }
  function setOut(id, text) { var el = q("#" + id); if (el) el.textContent = text == null ? "" : text; }

  /* Generic: labeled fields grid */
  function fields(pairs) { return '<div class="t-fields">' + pairs.join("") + "</div>"; }
  function fWrap(label, inner, hint, wide) {
    return '<div class="' + (wide ? "wide" : "") + '" style="' + (wide ? "grid-column:1/-1" : "") + '">' + lab(label) + inner + (hint ? '<div class="t-hint">' + hint + "</div>" : "") + "</div>";
  }

  /* parse local date/datetime from input value */
  function parseDate(v) {
    var m = String(v).match(/(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), 0, 0);
  }
  function dOnly(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function dFull(d) { return DAYN[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
  function daysBetween(a, b) { return Math.round((stripT(b) - stripT(a)) / 86400000); }
  function stripT(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
  function isoWeek(d) {
    var t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    t.setDate(t.getDate() + 4 - (t.getDay() || 7));
    var yearStart = new Date(t.getFullYear(), 0, 1);
    return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function todayStr() { return dOnly(new Date()); }

  /* ================= MATH ================= */
  E["percentage-calculator"] = function (root) {
    root.innerHTML = lab("Pick a question") +
      '<div class="seg" id="p-mode" role="tablist">' +
        '<button class="active" data-m="1">What is X% of Y?</button><button data-m="2">X is what % of Y?</button><button data-m="3">From X to Y</button></div><br><br>' +
      fields([
        fWrap("X (percent)", inputHtml("p-x", "number", "50", 'min="0" step="any" placeholder="e.g. 50"')),
        fWrap("Y (value)", inputHtml("p-y", "number", "250", 'step="any" placeholder="e.g. 250"'))
      ]) + resultPanel("p");
    function calc() {
      var mode = root.querySelector("#p-mode .active").getAttribute("data-m");
      var x = num(q("#p-x").value), y = num(q("#p-y").value);
      if (mode === "1") panelShow("p", { main: fmt(x / 100 * y), sub: x + "% of " + fmt(y) + " = " + fmt(x / 100 * y), label: x + "% of " + fmt(y) });
      else if (mode === "2") {
        if (y === 0) return panelShow("p", { error: "Y cannot be zero" });
        var r = x / y * 100;
        panelShow("p", { main: fmt(r, 4) + "%", sub: fmt(x) + " of " + fmt(y) + " = " + fmt(r, 4) + "%", label: "Result", copy: String(r) });
      } else {
        if (x === 0) return panelShow("p", { error: "Original value cannot be zero" });
        var ch = (y - x) / Math.abs(x) * 100;
        panelShow("p", { main: (ch >= 0 ? "+" : "") + fmt(ch, 4) + "%", sub: "From " + fmt(x) + " to " + fmt(y), cells: [[fmt(y - x), "Absolute change"], [(y >= x ? "Increase" : "Decrease"), "Direction"]], label: "Percentage change", copy: String(ch) });
      }
    }
    root.querySelector("#p-mode").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      qa("button", this).forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); calc();
    });
    root.addEventListener("input", calc);
    bindPanelCopy("p"); calc();
  };

  E["percentage-change"] = function (root) {
    root.innerHTML = fields([
      fWrap("Original value", inputHtml("pc-o", "number", "80", 'step="any"')),
      fWrap("New value", inputHtml("pc-n", "number", "100", 'step="any"'))
    ]) + resultPanel("pc");
    function calc() {
      var o = num(q("#pc-o").value), n = num(q("#pc-n").value);
      if (o === 0) return panelShow("pc", { error: "Original value cannot be zero" });
      var ch = (n - o) / Math.abs(o) * 100;
      panelShow("pc", { main: (ch >= 0 ? "+" : "") + fmt(ch, 4) + "%", sub: (n >= o ? "Increase" : "Decrease") + " of " + fmt(Math.abs(n - o)) + " in absolute terms",
        cells: [[fmt(n - o), "Absolute difference"], [fmt(n / o, 4) + "x", "Ratio (new / original)"]], copy: String(ch) });
    }
    root.addEventListener("input", calc); bindPanelCopy("pc"); calc();
  };

  E["average-calculator"] = function (root) {
    root.innerHTML = lab("Numbers (separated by space, comma or newline)") + areaHtml("av-in", "12, 7, 3, 41, 15, 7") + resultPanel("av");
    function calc() {
      var list = q("#av-in").value.trim();
      if (!list) return panelShow("av", { error: "Enter at least one number" });
      var nums = list.split(/[\s,;]+/).filter(Boolean).map(parseFloat).filter(function (n) { return !isNaN(n); });
      if (!nums.length) return panelShow("av", { error: "No valid numbers found" });
      var sum = nums.reduce(function (a, b) { return a + b; }, 0);
      var mean = sum / nums.length;
      var sorted = nums.slice().sort(function (a, b) { return a - b; });
      var median = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
      var freq = {}, best = [], bc = 0;
      nums.forEach(function (n) { freq[n] = (freq[n] || 0) + 1; if (freq[n] > bc) bc = freq[n]; });
      for (var k in freq) if (freq[k] === bc) best.push(k);
      var variance = nums.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / nums.length;
      panelShow("av", { main: fmt(mean, 6), label: "Mean", sub: nums.length + " number" + (nums.length > 1 ? "s" : "") + " entered",
        cells: [[fmt(median, 6), "Median"], [bc > 1 ? best.join(", ") : "None", "Mode"], [fmt(sorted[sorted.length - 1] - sorted[0]), "Range"],
                [fmt(sum), "Sum"], [fmt(sorted[0]), "Minimum"], [fmt(sorted[sorted.length - 1]), "Maximum"],
                [fmt(Math.sqrt(variance), 6), "Std deviation"], [fmt(variance, 6), "Variance"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("av"); calc();
  };

  E["random-number-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Minimum", inputHtml("rn-min", "number", "1")),
      fWrap("Maximum", inputHtml("rn-max", "number", "100")),
      fWrap("How many", inputHtml("rn-n", "number", "6", 'min="1" max="500"')),
      fWrap("Options", '<label class="switch"><input type="checkbox" id="rn-uniq" checked><i></i>No repeats</label><br><br><label class="switch"><input type="checkbox" id="rn-sort"><i></i>Sort results</label>')
    ]) + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="rn-go">' + CT.icon("dice-5") + "Generate</button></div>" + resultPanel("rn");
    function calc() {
      var mn = Math.ceil(num(q("#rn-min").value)), mx = Math.floor(num(q("#rn-max").value));
      var n = clamp(Math.round(num(q("#rn-n").value, 1)), 1, 500);
      if (mx < mn) return panelShow("rn", { error: "Max must be greater than or equal to min" });
      var uniq = q("#rn-uniq").checked;
      var range = mx - mn + 1;
      if (uniq && n > range) return panelShow("rn", { error: "Range has only " + range + " unique value" + (range > 1 ? "s" : "") });
      var out = [];
      if (uniq) { var pool = []; for (var i = mn; i <= mx; i++) pool.push(i);
        for (var j = 0; j < n; j++) out.push(pool.splice(crypto.getRandomValues(new Uint32Array(1))[0] % pool.length, 1)[0]);
      } else for (var k = 0; k < n; k++) out.push(mn + Math.floor(Math.random() * range));
      if (q("#rn-sort").checked) out.sort(function (a, b) { return a - b; });
      panelShow("rn", { main: out.join(", "), label: n + " random number" + (n > 1 ? "s" : ""), copy: out.join(", ") });
    }
    q("#rn-go").addEventListener("click", calc); bindPanelCopy("rn"); calc();
  };

  E["number-base-converter"] = function (root) {
    root.innerHTML = fields([
      fWrap("Number", inputHtml("nb-in", "text", "255")),
      fWrap("From base", selectHtml("nb-from", [2, 8, 10, 16, 32, 36].map(function (b) { return { v: b, n: "Base " + b }; }), 10))
    ]) + resultPanel("nb");
    function calc() {
      var v = q("#nb-in").value.trim(), base = parseInt(q("#nb-from").value, 10);
      if (!v) return panelShow("nb", { error: "Enter a number" });
      if (!/^[0-9a-zA-Z]+$/.test(v)) return panelShow("nb", { error: "Invalid characters for base " + base });
      var dec = parseInt(v, base);
      if (isNaN(dec)) return panelShow("nb", { error: "Not a valid base-" + base + " number" });
      panelShow("nb", { main: dec.toString(16).toUpperCase(), label: "Hexadecimal (base 16)", sub: "Decimal: " + fmtE(dec),
        cells: [[dec.toString(2), "Binary"], [dec.toString(8), "Octal"], [fmtE(dec), "Decimal"], [dec.toString(36).toUpperCase(), "Base 36"]], copy: String(dec) });
    }
    root.addEventListener("input", calc); bindPanelCopy("nb"); calc();
  };

  E["ratio-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("A", inputHtml("rt-a", "number", "16")),
      fWrap("B", inputHtml("rt-b", "number", "64")),
      fWrap("Find C in A:B = C:D (optional)", inputHtml("rt-c", "number", "", 'placeholder="e.g. 4"'))
    ]) + resultPanel("rt");
    function calc() {
      var a = num(q("#rt-a").value), b = num(q("#rt-b").value), c = q("#rt-c").value === "" ? null : num(q("#rt-c").value);
      if (!a || !b) return panelShow("rt", { error: "A and B must be non-zero" });
      var g = gcd(Math.round(a), Math.round(b)) || 1;
      var cells = [[fmt(a / b, 6), "A ÷ B"], [fmt(b / a, 6), "B ÷ A"], [fmt(a / b * 100, 4) + "%", "A as % of B"]];
      var main = Math.round(a / g) + " : " + Math.round(b / g), sub = "Simplified";
      if (c != null && c !== 0) {
        var d = c * b / a;
        main = fmt(d, 6); sub = a + " : " + b + " = " + c + " : " + fmt(d, 6);
        cells = [[Math.round(a / g) + " : " + Math.round(b / g), "Simplified ratio"], [fmt(a / c, 6), "Scale factor"], [fmt(c / a, 6), "C ÷ A"]];
      }
      panelShow("rt", { main: main, label: "Result", sub: sub, cells: cells });
    }
    root.addEventListener("input", calc); bindPanelCopy("rt"); calc();
  };

  E["lcm-gcd-calculator"] = function (root) {
    root.innerHTML = lab("Numbers (2 or more, separated by commas)") + inputHtml("lg-in", "text", "12, 18, 30", 'style="width:100%"') + '<div style="height:18px"></div>' + resultPanel("lg");
    function calc() {
      var raw = q("#lg-in").value.trim();
      var nums = raw.split(/[\s,;]+/).filter(Boolean).map(Number).filter(function (n) { return Number.isFinite(n) && n > 0; });
      if (nums.length < 2) return panelShow("lg", { error: "Enter at least 2 positive numbers" });
      var G = nums.reduce(function (a, b) { return gcd(a, b); });
      var L = nums.reduce(function (a, b) { return a / gcd(a, b) * b; });
      panelShow("lg", { main: fmtE(L), label: "LCM (Least Common Multiple)", sub: "Numbers: " + nums.join(", "),
        cells: [[fmtE(G), "GCD (Greatest Common Divisor)"], [fmtE(L * G), "LCM × GCD (of first two)"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("lg"); calc();
  };

  E["rounding-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Number", inputHtml("rd-in", "number", "3.14159265", 'step="any"')),
      fWrap("Decimals", selectHtml("rd-d", [0,1,2,3,4,6,8,12].map(function (d) { return { v: d, n: d + " decimal" + (d === 1 ? "" : "s") }; }), 2)),
      fWrap("Mode", selectHtml("rd-m", [{ v: "round", n: "Round (nearest)" }, { v: "floor", n: "Floor (down)" }, { v: "ceil", n: "Ceiling (up)" }], "round"))
    ]) + resultPanel("rd");
    function calc() {
      var n = num(q("#rd-in").value), d = parseInt(q("#rd-d").value, 10), m = q("#rd-m").value;
      if (!isFinite(n)) return panelShow("rd", { error: "Enter a number" });
      var p = Math.pow(10, d), r;
      if (m === "floor") r = Math.floor(n * p) / p;
      else if (m === "ceil") r = Math.ceil(n * p) / p;
      else r = Math.round((n + Number.EPSILON * Math.sign(n)) * p) / p;
      panelShow("rd", { main: fmt(r, d), label: "Result", sub: m === "round" ? "Rounded to " + d + " decimals" : (m === "floor" ? "Rounded down" : "Rounded up") });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("rd"); calc();
  };

  E["prime-number-checker"] = function (root) {
    root.innerHTML = lab("Number") + inputHtml("pr-in", "number", "97", 'min="2" step="1" style="width:100%"') + '<div style="height:18px"></div>' + resultPanel("pr");
    function calc() {
      var n = Math.round(num(q("#pr-in").value));
      if (n < 2 || n > 1e12) return panelShow("pr", { error: "Enter a whole number between 2 and 1,000,000,000,000" });
      var isP = true, divs = [];
      for (var i = 1; i <= Math.sqrt(n); i++) {
        if (n % i === 0) { divs.push(i); if (i !== n / i) divs.push(n / i); }
        if (i > 1 && n % i === 0) isP = false;
      }
      if (n % (Math.floor(Math.sqrt(n)) || 1) === 0 && Math.sqrt(n) % 1 === 0) { /* handled above */ }
      if (n === 2 || n === 3) isP = true;
      if (n > 3 && (n % 2 === 0)) isP = false;
      divs.sort(function (a, b) { return a - b; });
      var f = "", x = n, p = 2, cnt = {};
      while (x > 1 && p <= 1e6) { while (x % p === 0) { x /= p; cnt[p] = (cnt[p] || 0) + 1; } p += (p === 2 ? 1 : 2); }
      f = Object.keys(cnt).map(function (k) { return cnt[k] > 1 ? k + "^" + cnt[k] : k; }).join(" × ") || String(n);
      panelShow("pr", { main: isP ? "Prime" : "Not prime", label: "Result",
        sub: isP ? n + " is only divisible by 1 and itself" : n + " has " + divs.length + " divisors",
        cells: [[divs.join(", "), "All divisors"], [f, "Prime factorization"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("pr"); calc();
  };

  E["square-root-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Number", inputHtml("sq-in", "number", "144", 'min="0" step="any"')),
      fWrap("Root", selectHtml("sq-n", [{ v: 2, n: "Square root (√)" }, { v: 3, n: "Cube root (∛)" }, { v: 4, n: "4th root" }, { v: 5, n: "5th root" }], 2))
    ]) + resultPanel("sq");
    function calc() {
      var n = num(q("#sq-in").value), k = parseInt(q("#sq-n").value, 10);
      if (n < 0) return panelShow("sq", { error: "Enter a non-negative number" });
      var r = Math.pow(n, 1 / k);
      panelShow("sq", { main: fmt(r, 10), label: k + "th root of " + fmt(n), sub: fmt(r, 10) + " ^ " + k + " ≈ " + fmt(Math.pow(r, k), 6) });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("sq"); calc();
  };

  E["discount-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Original price", inputHtml("dc-p", "number", "199.90", 'step="any"')),
      fWrap("Discount %", inputHtml("dc-d", "number", "25", 'min="0" max="100" step="any"')),
      fWrap("Extra discount % (optional)", inputHtml("dc-d2", "number", "", 'min="0" max="100" step="any" placeholder="0"'))
    ]) + resultPanel("dc");
    function calc() {
      var p = num(q("#dc-p").value), d1 = clamp(num(q("#dc-d").value), 0, 100), d2raw = q("#dc-d2").value;
      var d2 = d2raw === "" ? 0 : clamp(num(d2raw), 0, 100);
      if (p <= 0) return panelShow("dc", { error: "Enter a valid price" });
      var after1 = p * (1 - d1 / 100);
      var final = after1 * (1 - d2 / 100);
      panelShow("dc", { main: "$" + fmt(final, 2), label: "Final price", sub: "You save $" + fmt(p - final, 2) + " (" + fmt((1 - final / p) * 100, 2) + "% off)",
        cells: [["$" + fmt(after1, 2), "After first discount"], ["$" + fmt(p - final, 2), "Total saved"], [fmt((1 - final / p) * 100, 2) + "%", "Effective discount"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("dc"); calc();
  };

  E["tip-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Bill amount", inputHtml("tp-b", "number", "86.40", 'step="any"')),
      fWrap("Tip %", selectHtml("tp-p", [{ v: 10, n: "10% — okay" }, { v: 15, n: "15% — good" }, { v: 18, n: "18% — great" }, { v: 20, n: "20% — excellent" }, { v: 25, n: "25% — outstanding" }], 15)),
      fWrap("Split between (people)", inputHtml("tp-n", "number", "2", 'min="1" step="1"'))
    ]) + resultPanel("tp");
    function calc() {
      var b = num(q("#tp-b").value), p = num(q("#tp-p").value), n = clamp(Math.round(num(q("#tp-n").value, 1)), 1, 200);
      if (b <= 0) return panelShow("tp", { error: "Enter a valid bill amount" });
      var tip = b * p / 100;
      panelShow("tp", { main: "$" + fmt(tip, 2), label: "Tip amount (" + p + "%)",
        cells: [["$" + fmt(b + tip, 2), "Total bill"], ["$" + fmt((b + tip) / n, 2), "Per person"], ["$" + fmt(tip / n, 2), "Tip per person"]] });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("tp"); calc();
  };

  E["bmi-calculator"] = function (root) {
    root.innerHTML = lab("Units") + '<div class="seg" id="bmi-seg"><button class="active" data-u="m">Metric (cm, kg)</button><button data-u="i">Imperial (in, lb)</button></div><br><br>' +
      fields([
        fWrap("Height", inputHtml("bmi-h", "number", "175", 'step="any"')),
        fWrap("Weight", inputHtml("bmi-w", "number", "70", 'step="any"'))
      ]) + resultPanel("bmi");
    function calc() {
      var u = root.querySelector("#bmi-seg .active").getAttribute("data-u");
      var h = num(q("#bmi-h").value), w = num(q("#bmi-w").value);
      if (u === "i") { h = h * 2.54; w = w * 0.45359237; }
      if (h <= 0 || w <= 0) return panelShow("bmi", { error: "Enter valid height and weight" });
      var hm = h / 100, bmi = w / (hm * hm);
      var cat = bmi < 16 ? "Severe underweight" : bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal (healthy)" : bmi < 30 ? "Overweight" : bmi < 35 ? "Obesity class I" : bmi < 40 ? "Obesity class II" : "Obesity class III";
      panelShow("bmi", { main: fmt(bmi, 1), label: "Body Mass Index", sub: cat,
        cells: [[fmt(18.5 * hm * hm, 1) + " – " + fmt(24.9 * hm * hm, 1) + " kg", "Healthy weight range"], [(bmi >= 18.5 && bmi < 25) ? "In healthy range" : "Outside healthy range", "Status"]] });
    }
    root.querySelector("#bmi-seg").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      qa("button", this).forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); calc();
    });
    root.addEventListener("input", calc); bindPanelCopy("bmi"); calc();
  };

  E["loan-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Loan amount", inputHtml("ln-a", "number", "25000", 'min="0" step="any"')),
      fWrap("Annual interest rate %", inputHtml("ln-r", "number", "6.5", 'step="any"')),
      fWrap("Term (months)", inputHtml("ln-n", "number", "60", 'min="1" step="1"'))
    ]) + resultPanel("ln");
    function calc() {
      var a = num(q("#ln-a").value), r = num(q("#ln-r").value) / 100 / 12, n = Math.round(num(q("#ln-n").value));
      if (a <= 0 || n <= 0) return panelShow("ln", { error: "Enter a valid amount and term" });
      var m = r === 0 ? a / n : a * r / (1 - Math.pow(1 + r, -n));
      panelShow("ln", { main: "$" + fmt(m, 2), label: "Monthly payment",
        cells: [["$" + fmt(m * n, 2), "Total paid"], ["$" + fmt(m * n - a, 2), "Total interest"], [fmt(m * n / a, 2) + "x", "Total cost ratio"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("ln"); calc();
  };


  /* ================= TEXT ================= */
  E["word-counter"] = function (root) {
    root.innerHTML = lab("Your text") + areaHtml("wc-in", "Type or paste your text here — stats update live.") + resultPanel("wc");
    function calc() {
      var t = q("#wc-in").value;
      var words = t.trim() ? t.trim().split(/\s+/).length : 0;
      var chars = t.length, nsp = t.replace(/\s/g, "").length;
      var sentences = (t.match(/[^.!?\n]+[.!?\s]*$/g) || []).filter(function (s) { return s.trim(); }).length || (t.trim() && !t.trim().match(/[.!?]/) ? 1 : 0);
      var paras = t.trim() ? t.trim().split(/\n\s*\n/).filter(function (p) { return p.trim(); }).length : 0;
      panelShow("wc", { main: fmt(words), label: "Words",
        cells: [[fmt(chars), "Characters"], [fmt(nsp), "Chars (no spaces)"], [fmt(sentences), "Sentences"], [fmt(paras), "Paragraphs"],
          [words ? Math.max(1, Math.round(words / 200 * 60)) : 0 + "", "Reading time (s)"], [words ? Math.max(1, Math.round(words / 130 * 60)) : 0 + "", "Speaking time (s)"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("wc"); calc();
  };

  E["case-converter"] = function (root) {
    var cases = [
      ["UPPERCASE", function (t) { return t.toUpperCase(); }],
      ["lowercase", function (t) { return t.toLowerCase(); }],
      ["Title Case", function (t) { return t.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }],
      ["Sentence case", function (t) { return t.toLowerCase().replace(/(^[^\s])|([.!?]\s+\w)/g, function (m) { return m.toUpperCase(); }); }],
      ["camelCase", function (t) { return t.toLowerCase().replace(/[^a-z0-9]+(.)?/g, function (m, c) { return c ? c.toUpperCase() : ""; }).replace(/^(.)/, function (c) { return c.toLowerCase(); }); }],
      ["PascalCase", function (t) { return t.toLowerCase().replace(/[^a-z0-9]+(.)?/g, function (m, c) { return c ? c.toUpperCase() : ""; }); }],
      ["snake_case", function (t) { return t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }],
      ["kebab-case", function (t) { return t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }],
      ["CONSTANT_CASE", function (t) { return t.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, ""); }],
      ["aLtErNaTiNg", function (t) { var i = 0; return t.split("").map(function (c) { return /[a-zA-Z]/.test(c) ? (i++ % 2 ? c.toLowerCase() : c.toUpperCase()) : c; }).join(""); }]
    ];
    root.innerHTML = lab("Your text") + areaHtml("cc-in", "The quick brown fox jumps over the lazy dog") +
      '<div class="btn-row">' + cases.map(function (c, i) { return '<button class="btn btn-ghost btn-sm" data-i="' + i + '">' + c[0] + "</button>"; }).join("") + "</div>" +
      outBox("cc-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="cc-copy">' + CT.icon("copy") + "Copy result</button></div>";
    var apply = function (i) {
      var t = q("#cc-in").value;
      var r = t ? cases[i][1](t) : "";
      setOut("cc-out", r || "Type some text above to see conversions.");
      q("#cc-out").dataset.val = r;
    };
    qa(".btn-ghost", root).forEach(function (b) { b.addEventListener("click", function () { apply(+this.getAttribute("data-i")); }); });
    q("#cc-copy").addEventListener("click", function () { CT.copy(q("#cc-out").dataset.val || ""); });
  };

  E["text-reverser"] = function (root) {
    var modes = [
      ["Characters", function (t) { return t.split("").reverse().join(""); }],
      ["Words", function (t) { return t.trim().split(/\s+/).reverse().join(" "); }],
      ["Lines", function (t) { return t.split("\n").reverse().join("\n"); }],
      ["Each word", function (t) { return t.split("(\s+)").join("").split(/(\s+)/).map(function (w) { return /\s/.test(w) ? w : w.split("").reverse().join(""); }).join(""); }]
    ];
    root.innerHTML = lab("Your text") + areaHtml("tr-in", "Hello world") +
      '<div class="btn-row">' + modes.map(function (m, i) { return '<button class="btn btn-ghost btn-sm" data-i="' + i + '">' + m[0] + "</button>"; }).join("") + "</div>" +
      outBox("tr-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="tr-copy">' + CT.icon("copy") + "Copy result</button></div>";
    qa("button", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var i = this.getAttribute("data-i"); if (i == null) return;
        var t = q("#tr-in").value, r = t ? modes[+i][1](t) : "";
        setOut("tr-out", r || "Type some text above first.");
        q("#tr-out").dataset.val = r;
      });
    });
    q("#tr-copy").addEventListener("click", function () { CT.copy(q("#tr-out").dataset.val || ""); });
  };

  E["slug-generator"] = function (root) {
    root.innerHTML = lab("Title or text") + inputHtml("sl-in", "text", "10+ Útil & Free Online Tools — 2026 Edition", 'style="width:100%"') + '<div style="height:18px"></div>' + resultPanel("sl");
    function slugify(t) {
      return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
    }
    function calc() {
      var t = q("#sl-in").value;
      if (!t.trim()) return panelShow("sl", { error: "Enter a title to slugify" });
      panelShow("sl", { main: slugify(t), label: "URL slug", sub: slugify(t).length + " characters" });
    }
    root.addEventListener("input", calc); bindPanelCopy("sl"); calc();
  };

  E["lorem-ipsum-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Amount", inputHtml("li-n", "number", "3", 'min="1" max="20"')),
      fWrap("Unit", selectHtml("li-u", [{ v: "p", n: "Paragraphs" }, { v: "s", n: "Sentences" }, { v: "w", n: "Words" }], "p"))
    ]) + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="li-go">' + CT.icon("article") + "Generate</button></div>" + outBox("li-out") +
      '<div class="btn-row"><button class="btn btn-primary btn-sm" id="li-copy">' + CT.icon("copy") + "Copy</button></div>";
    var W = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");
    function rnd(n) { return W[Math.floor(Math.random() * W.length)] + (n ? "" : ""); }
    function sentence() {
      var len = 6 + Math.floor(Math.random() * 10), s = [];
      for (var i = 0; i < len; i++) s.push(W[Math.floor(Math.random() * W.length)]);
      var str = s.join(" ");
      return str.charAt(0).toUpperCase() + str.slice(1) + ".";
    }
    function para() { var n = 3 + Math.floor(Math.random() * 3), out = []; for (var i = 0; i < n; i++) out.push(sentence()); return out.join(" "); }
    q("#li-go").addEventListener("click", function () {
      var n = clamp(Math.round(num(q("#li-n").value, 1)), 1, 20), u = q("#li-u").value, out;
      if (u === "p") { var ps = []; for (var i = 0; i < n; i++) ps.push(para()); out = ps.join("\n\n"); }
      else if (u === "s") { var ss = []; for (var j = 0; j < n; j++) ss.push(sentence()); out = ss.join(" "); }
      else { var ws = []; for (var k = 0; k < n * 10; k++) ws.push(W[Math.floor(Math.random() * W.length)]); out = ws.join(" "); }
      setOut("li-out", out); q("#li-out").dataset.val = out;
    });
    q("#li-copy").addEventListener("click", function () { CT.copy(q("#li-out").dataset.val || ""); });
    q("#li-go").click();
  };

  E["duplicate-line-remover"] = function (root) {
    root.innerHTML = lab("Your lines") + areaHtml("dl-in", "apple\norange\napple\nbanana") + '<div class="btn-row">' +
      '<label class="switch"><input type="checkbox" id="dl-dup" checked><i></i>Remove duplicates</label>' +
      '<label class="switch"><input type="checkbox" id="dl-empty" checked><i></i>Remove empty lines</label>' +
      '<label class="switch"><input type="checkbox" id="dl-trim" checked><i></i>Trim whitespace</label>' +
      '<label class="switch"><input type="checkbox" id="dl-ci"><i></i>Case-insensitive</label></div>' +
      outBox("dl-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="dl-copy">' + CT.icon("copy") + "Copy result</button></div>";
    function calc() {
      var t = q("#dl-in").value; if (!t.trim()) { setOut("dl-out", "Paste some lines above."); q("#dl-out").dataset.val = ""; return; }
      var lines = t.split("\n");
      if (q("#dl-trim").checked) lines = lines.map(function (l) { return l.trim(); });
      if (q("#dl-empty").checked) lines = lines.filter(function (l) { return l.trim() !== ""; });
      if (q("#dl-dup").checked) {
        var seen = {}, out = [];
        lines.forEach(function (l) { var k = q("#dl-ci").checked ? l.toLowerCase() : l; if (!seen[k]) { seen[k] = 1; out.push(l); } });
        lines = out;
      }
      setOut("dl-out", lines.join("\n")); q("#dl-out").dataset.val = lines.join("\n");
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc);
    q("#dl-copy").addEventListener("click", function () { CT.copy(q("#dl-out").dataset.val || ""); }); calc();
  };

  E["text-sorter"] = function (root) {
    root.innerHTML = lab("Your lines") + areaHtml("ts-in", "banana\napple\ncherry") +
      '<div class="btn-row">' +
      '<button class="btn btn-ghost btn-sm" data-s="az">A → Z</button>' +
      '<button class="btn btn-ghost btn-sm" data-s="za">Z → A</button>' +
      '<button class="btn btn-ghost btn-sm" data-s="len">By length</button>' +
      '<button class="btn btn-ghost btn-sm" data-s="num">Numeric</button>' +
      '<button class="btn btn-ghost btn-sm" data-s="shuf">' + CT.icon("dice-5") + "Shuffle</button></div>" +
      outBox("ts-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="ts-copy">' + CT.icon("copy") + "Copy result</button></div>";
    qa("[data-s]", root).forEach(function (b) {
      b.addEventListener("click", function () {
        var t = q("#ts-in").value; if (!t.trim()) return;
        var lines = t.split("\n");
        var s = this.getAttribute("data-s");
        if (s === "az") lines.sort(function (a, b) { return a.localeCompare(b); });
        if (s === "za") lines.sort(function (a, b) { return b.localeCompare(a); });
        if (s === "len") lines.sort(function (a, b) { return a.length - b.length; });
        if (s === "num") lines.sort(function (a, b) { return parseFloat(a) - parseFloat(b); });
        if (s === "shuf") lines.sort(function () { return Math.random() - 0.5; });
        setOut("ts-out", lines.join("\n")); q("#ts-out").dataset.val = lines.join("\n");
      });
    });
    q("#ts-copy").addEventListener("click", function () { CT.copy(q("#ts-out").dataset.val || ""); });
  };

  E["find-and-replace"] = function (root) {
    root.innerHTML = lab("Your text") + areaHtml("fr-in", "The cat sat on the mat.") +
      fields([fWrap("Find", inputHtml("fr-f", "text", "cat")), fWrap("Replace with", inputHtml("fr-r", "text", "dog"))]) +
      '<div class="btn-row"><label class="switch"><input type="checkbox" id="fr-rx"><i></i>Regular expression</label>' +
      '<label class="switch"><input type="checkbox" id="fr-ci"><i></i>Case-insensitive</label>' +
      '<button class="btn btn-primary btn-sm" id="fr-go">' + CT.icon("replace") + "Replace all</button></div>" +
      outBox("fr-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="fr-copy">' + CT.icon("copy") + "Copy result</button></div>";
    function calc() {
      var t = q("#fr-in").value, f = q("#fr-f").value, r = q("#fr-r").value;
      if (!t || !f) { setOut("fr-out", "Enter text and a search term."); q("#fr-out").dataset.val = ""; return; }
      var flags = q("#fr-ci").checked ? "gi" : "g";
      try {
        var rx = new RegExp(q("#fr-rx").checked ? f : f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
        var count = (t.match(rx) || []).length;
        var out = t.replace(rx, r);
        setOut("fr-out", out); q("#fr-out").dataset.val = out;
        CT.toast(count + " replacement" + (count === 1 ? "" : "s") + " made");
      } catch (e) { setOut("fr-out", "Invalid regex: " + e.message); q("#fr-out").dataset.val = ""; }
    }
    q("#fr-go").addEventListener("click", calc);
    q("#fr-copy").addEventListener("click", function () { CT.copy(q("#fr-out").dataset.val || ""); });
  };

  E["readability-analyzer"] = function (root) {
    root.innerHTML = lab("Your text") + areaHtml("ra-in", "Paste a paragraph to analyze…") + resultPanel("ra");
    function calc() {
      var t = q("#ra-in").value.trim();
      if (!t) return panelShow("ra", { error: "Enter some text to analyze" });
      var words = t.split(/\s+/).length;
      var sentences = Math.max(1, (t.match(/[.!?]+(?:\s|$)/g) || []).length);
      var syll = t.toLowerCase().match(/[aeiouy]{1,2}/g) ? (t.toLowerCase().match(/[aeiouy]+/g) || []).length : Math.round(words * 1.5);
      var flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syll / words);
      var grade = Math.max(1, Math.round(0.39 * (words / sentences) + 11.8 * (syll / words) - 15.59));
      var stop = {the:1,a:1,an:1,and:1,or:1,but:1,in:1,on:1,at:1,to:1,for:1,of:1,with:1,is:1,are:1,was:1,were:1,it:1,this:1,that:1};
      var freq = {};
      t.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).forEach(function (w) { if (w.length > 3 && !stop[w]) freq[w] = (freq[w] || 0) + 1; });
      var top = Object.keys(freq).sort(function (a, b) { return freq[b] - freq[a]; }).slice(0, 5);
      panelShow("ra", { main: fmt(clamp(flesch, -50, 121), 1), label: "Flesch reading ease",
        sub: flesch >= 70 ? "Easy to read (≈ grade " + grade + " or lower)" : flesch >= 50 ? "Standard difficulty (≈ grade " + grade + ")" : "Difficult (≈ grade " + grade + "+)",
        cells: [[fmt(words), "Words"], [fmt(sentences), "Sentences"], [Math.max(1, Math.round(words / 200)) + " min", "Reading time"],
          [top.length ? top.join(", ") : "—", "Top keywords"], [fmt(words / sentences, 1), "Words per sentence"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("ra"); calc();
  };

  E["text-diff-checker"] = function (root) {
    root.innerHTML = fields([
      fWrap("Original text", areaHtml("df-a", "The quick brown fox.")),
      fWrap("Changed text", areaHtml("df-b", "The quick red fox jumps."))
    ]) + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="df-go">' + CT.icon("transform") + "Compare</button></div>" + outBox("df-out");
    q("#df-go").addEventListener("click", function () {
      var A = q("#df-a").value.split("\n"), B = q("#df-b").value.split("\n");
      var n = A.length, m = B.length;
      var dp = []; for (var i = 0; i <= n; i++) dp[i] = [0];
      for (var j = 0; j <= m; j++) dp[0][j] = 0;
      for (var i2 = 1; i2 <= n; i2++) for (var j2 = 1; j2 <= m; j2++)
        dp[i2][j2] = A[i2 - 1] === B[j2 - 1] ? dp[i2 - 1][j2 - 1] + 1 : Math.max(dp[i2 - 1][j2], dp[i2][j2 - 1]);
      var out = [], i3 = n, j3 = m;
      while (i3 > 0 || j3 > 0) {
        if (i3 > 0 && j3 > 0 && A[i3 - 1] === B[j3 - 1]) { out.unshift("  " + A[i3 - 1]); i3--; j3--; }
        else if (j3 > 0 && (i3 === 0 || dp[i3][j3 - 1] >= dp[i3 - 1][j3])) { out.unshift("+ " + B[j3 - 1]); j3--; }
        else { out.unshift("- " + A[i3 - 1]); i3--; }
      }
      setOut("df-out", out.join("\n"));
    });
  };

  E["accent-remover"] = function (root) {
    root.innerHTML = lab("Text with accents") + areaHtml("ac-in", "Café, naïve, über,ação, coração") +
      '<div class="btn-row"><button class="btn btn-primary btn-sm" id="ac-go">' + CT.icon("letter-spacing") + "Remove accents</button></div>" +
      outBox("ac-out") + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="ac-copy">' + CT.icon("copy") + "Copy result</button></div>";
    q("#ac-go").addEventListener("click", function () {
      var out = q("#ac-in").value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      setOut("ac-out", out || "Type some text above first."); q("#ac-out").dataset.val = out;
    });
    q("#ac-copy").addEventListener("click", function () { CT.copy(q("#ac-out").dataset.val || ""); });
  };


  /* ================= DATE & TIME ================= */
  E["date-difference"] = function (root) {
    var t = todayStr();
    root.innerHTML = fields([
      fWrap("Start date", inputHtml("dd-a", "date", t)),
      fWrap("End date", inputHtml("dd-b", "date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)))
    ]) + resultPanel("dd");
    function calc() {
      var a = parseDate(q("#dd-a").value), b = parseDate(q("#dd-b").value);
      if (!a || !b) return panelShow("dd", { error: "Pick both dates" });
      var sign = 1, A = a, B = b;
      if (B < A) { A = b; B = a; sign = -1; }
      var days = daysBetween(A, B);
      var wd = 0, cur = new Date(A);
      for (var i = 0; i < days; i++) { var d = cur.getDay(); if (d !== 0 && d !== 6) wd++; cur.setDate(cur.getDate() + 1); }
      var y = B.getFullYear() - A.getFullYear(), m = B.getMonth() - A.getMonth(), d2 = B.getDate() - A.getDate();
      if (d2 < 0) { m--; var pm = new Date(B.getFullYear(), B.getMonth(), 0).getDate(); d2 += pm; }
      if (m < 0) { y--; m += 12; }
      panelShow("dd", { main: fmt(days) + " day" + (days === 1 ? "" : "s"), label: sign < 0 ? "Difference (end before start)" : "Difference",
        sub: (days < 0 ? "" : "") + y + " year" + (y === 1 ? "" : "s") + ", " + m + " month" + (m === 1 ? "" : "s") + ", " + d2 + " day" + (d2 === 1 ? "" : "s"),
        cells: [[fmt(days / 7, 1), "Weeks"], [fmt(wd), "Business days"], [fmt(days * 24), "Hours"], [fmt(days * 1440), "Minutes"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("dd"); calc();
  };

  E["age-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Date of birth", inputHtml("ag-in", "date", "2000-06-15")),
      fWrap("Age at date (default today)", inputHtml("ag-at", "date", todayStr()))
    ]) + resultPanel("ag");
    function calc() {
      var b = parseDate(q("#ag-in").value), at = parseDate(q("#ag-at").value) || new Date();
      if (!b) return panelShow("ag", { error: "Pick a birth date" });
      if (b > at) return panelShow("ag", { error: "Birth date must be in the past" });
      var y = at.getFullYear() - b.getFullYear(), m = at.getMonth() - b.getMonth(), d = at.getDate() - b.getDate();
      if (d < 0) { m--; d += new Date(at.getFullYear(), at.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }
      var days = daysBetween(b, at);
      var nb = new Date(at.getFullYear(), b.getMonth(), b.getDate());
      if (nb < at) nb.setFullYear(nb.getFullYear() + 1);
      var until = Math.ceil((stripT(nb) - stripT(at)) / 86400000);
      panelShow("ag", { main: y + " year" + (y === 1 ? "" : "s") + ", " + m + " mo, " + d + " d", label: "Exact age",
        cells: [[fmt(days), "Total days"], [fmt(days / 365.2425, 2), "Years (decimal)"], [DAYN[b.getDay()], "Born on a"], [until + " day" + (until === 1 ? "" : "s"), "Until next birthday"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("ag"); calc();
  };

  E["add-subtract-days"] = function (root) {
    root.innerHTML = fields([
      fWrap("Start date", inputHtml("ad-in", "date", todayStr())),
      fWrap("Amount", inputHtml("ad-n", "number", "30", 'step="any"')),
      fWrap("Unit", selectHtml("ad-u", [{ v: "d", n: "Days" }, { v: "w", n: "Weeks" }, { v: "m", n: "Months" }, { v: "y", n: "Years" }], "d")),
      fWrap("Direction", selectHtml("ad-dir", [{ v: "+", n: "Add (+)" }, { v: "-", n: "Subtract (−)" }], "+"))
    ]) + resultPanel("ad");
    function calc() {
      var d = parseDate(q("#ad-in").value);
      if (!d) return panelShow("ad", { error: "Pick a start date" });
      var n = num(q("#ad-n").value), u = q("#ad-u").value, dir = q("#ad-dir").value === "-" ? -1 : 1;
      if (u === "m") d.setMonth(d.getMonth() + dir * n);
      else if (u === "y") d.setFullYear(d.getFullYear() + dir * n);
      else d.setDate(d.getDate() + dir * n * (u === "w" ? 7 : 1));
      panelShow("ad", { main: dOnly(d), label: "Resulting date", sub: dFull(d) });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("ad"); calc();
  };

  E["week-number-calculator"] = function (root) {
    root.innerHTML = lab("Date") + inputHtml("wk-in", "date", todayStr(), 'style="width:100%"') + '<div style="height:18px"></div>' + resultPanel("wk");
    function calc() {
      var d = parseDate(q("#wk-in").value);
      if (!d) return panelShow("wk", { error: "Pick a date" });
      var w = isoWeek(d);
      var monday = new Date(d); monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      var sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
      var start = new Date(d.getFullYear(), 0, 0);
      var doy = Math.floor((stripT(d) - stripT(start)) / 86400000);
      panelShow("wk", { main: "Week " + w, label: dFull(d),
        cells: [["W" + String(w).padStart(2, "0"), "ISO week number"], ["Q" + (Math.floor(d.getMonth() / 3) + 1), "Quarter"],
          [fmt(doy), "Day of year"], [dOnly(monday) + " – " + dOnly(sunday), "Week range"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("wk"); calc();
  };

  E["countdown-timer"] = function (root) {
    var soon = new Date(Date.now() + 36 * 3600000);
    var pad = function (n) { return String(Math.abs(n)).padStart(2, "0"); };
    root.innerHTML = fields([
      fWrap("Target date and time", inputHtml("cd-in", "datetime-local",
        soon.getFullYear() + "-" + pad(soon.getMonth() + 1) + "-" + pad(soon.getDate()) + "T" + pad(soon.getHours()) + ":" + pad(soon.getMinutes()), 'style="width:100%"'))
    ]) + '<div class="big-clock" id="cd-clock">00 : 00 : 00 : 00</div>' +
      '<div class="t-hint" style="text-align:center;margin-top:8px" id="cd-note">days · hours · minutes · seconds</div>';
    var timer = null;
    function tick() {
      var t = parseDate(q("#cd-in").value);
      var el = q("#cd-clock"), note = q("#cd-note");
      if (!t) { el.textContent = "00 : 00 : 00 : 00"; note.textContent = "Pick a target date"; return; }
      var diff = t - new Date();
      if (diff <= 0) { el.textContent = "00 : 00 : 00 : 00"; note.textContent = "This moment has arrived"; return; }
      var s = Math.floor(diff / 1000);
      var d = Math.floor(s / 86400); s -= d * 86400;
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      el.textContent = pad(d) + " : " + pad(h) + " : " + pad(m) + " : " + pad(s);
      note.textContent = d + " days · " + h + " hours · " + m + " minutes · " + s + " seconds";
    }
    root.addEventListener("input", tick);
    timer = setInterval(tick, 250); tick();
  };

  E["stopwatch"] = function (root) {
    root.innerHTML = '<div class="big-clock" id="sw-clock">00:00.00</div>' +
      '<div class="btn-row" style="justify-content:center;margin-top:22px">' +
      '<button class="btn btn-primary" id="sw-start">' + CT.icon("player-play") + "Start</button>" +
      '<button class="btn btn-ghost" id="sw-lap" disabled>' + CT.icon("clock") + "Lap</button>" +
      '<button class="btn btn-ghost" id="sw-reset">' + CT.icon("rotate") + "Reset</button></div>" +
      '<ol class="lap-list" id="sw-laps" hidden></ol>';
    var running = false, t0 = 0, elapsed = 0, laps = [];
    var pad = function (n, l) { return String(n).padStart(l || 2, "0"); };
    function render() {
      var ms = elapsed;
      var m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60, cs = Math.floor(ms / 10) % 100;
      q("#sw-clock").textContent = pad(m) + ":" + pad(s) + "." + pad(cs);
    }
    function tick() { elapsed = performance.now() - t0; render(); }
    q("#sw-start").addEventListener("click", function () {
      if (!running) { running = true; t0 = performance.now() - elapsed; this.innerHTML = CT.icon("player-pause") + "Pause"; q("#sw-lap").disabled = false; CT.__swTimer = setInterval(tick, 33); }
      else { running = false; clearInterval(CT.__swTimer); this.innerHTML = CT.icon("player-play") + "Resume"; }
    });
    q("#sw-lap").addEventListener("click", function () {
      if (!running && elapsed === 0) return;
      laps.push(elapsed);
      var list = q("#sw-laps"); list.hidden = false;
      list.innerHTML = laps.map(function (l, i) {
        var m = Math.floor(l / 60000), s = Math.floor(l / 1000) % 60, cs = Math.floor(l / 10) % 100;
        return "<li><span>Lap " + (i + 1) + "</span><span>" + pad(m) + ":" + pad(s) + "." + pad(cs) + "</span></li>";
      }).reverse().join("");
    });
    q("#sw-reset").addEventListener("click", function () {
      running = false; clearInterval(CT.__swTimer); elapsed = 0; laps = [];
      render(); q("#sw-laps").hidden = true; q("#sw-lap").disabled = true;
      q("#sw-start").innerHTML = CT.icon("player-play") + "Start";
    });
  };

  E["timestamp-converter"] = function (root) {
    root.innerHTML = fields([
      fWrap("Unix timestamp → date", inputHtml("ts-in", "text", String(Math.floor(Date.now() / 1000)), 'placeholder="e.g. 1762000000"')),
      fWrap("Date → timestamp", inputHtml("ts-d", "datetime-local", "", 'style="width:100%"'))
    ]) + resultPanel("ts");
    function calc() {
      var out = [];
      var v = q("#ts-in").value.trim();
      if (v) {
        var n = num(v);
        if (!n && n !== 0) { out.push("Invalid timestamp"); }
        else {
          var ms = Math.abs(n) > 1e11 ? n : n * 1000;
          var d = new Date(ms);
          out.push("Local: " + d.toLocaleString("en-US", { dateStyle: "full", timeStyle: "medium" }));
          out.push("UTC:   " + d.toUTCString());
          out.push("ISO:   " + d.toISOString());
        }
      }
      var dv = q("#ts-d").value;
      if (dv) {
        var d2 = parseDate(dv);
        out.push("Unix: " + Math.floor(d2.getTime() / 1000) + " (s)");
        out.push("Unix: " + d2.getTime() + " (ms)");
      }
      if (!out.length) return panelShow("ts", { error: "Enter a timestamp or a date" });
      panelShow("ts", { main: out[0].replace(/^\S+:\s*/, ""), label: "Conversion", sub: out.join("\n"), copy: out.join("\n") });
    }
    root.addEventListener("input", calc); bindPanelCopy("ts"); calc();
  };

  E["timezone-converter"] = function (root) {
    var ZONES = ["UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Sao_Paulo","America/Mexico_City","Europe/London","Europe/Lisbon","Europe/Madrid","Europe/Paris","Europe/Berlin","Europe/Rome","Europe/Moscow","Africa/Cairo","Africa/Lagos","Asia/Dubai","Asia/Kolkata","Asia/Bangkok","Asia/Shanghai","Asia/Tokyo","Asia/Seoul","Australia/Sydney","Pacific/Auckland"];
    if (window.Intl && Intl.supportedValuesOf) {
      try { ZONES = ZONES.concat(Intl.supportedValuesOf("timeZone").filter(function (z) { return ZONES.indexOf(z) < 0; })); } catch (e) {}
    }
    var local = "UTC";
    try { local = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
    var now = new Date();
    root.innerHTML = fields([
      fWrap("Date and time", inputHtml("tz-in", "datetime-local",
        now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0") + "T12:00", 'style="width:100%"')),
      fWrap("From zone", selectHtml("tz-a", ZONES, local)),
      fWrap("To zone", selectHtml("tz-b", ZONES, "America/New_York"))
    ]) + resultPanel("tz");
    function fmtIn(d, zone) {
      return new Intl.DateTimeFormat("en-US", { timeZone: zone, dateStyle: "full", timeStyle: "short" }).format(d);
    }
    function calc() {
      var v = q("#tz-in").value, a = q("#tz-a").value, b = q("#tz-b").value;
      if (!v) return panelShow("tz", { error: "Pick a date and time" });
      var d = parseDate(v);
      try {
        var offA = new Intl.DateTimeFormat("en-US", { timeZone: a, timeZoneName: "longOffset" }).formatToParts(d).find(function (p) { return p.type === "timeZoneName"; });
        var offB = new Intl.DateTimeFormat("en-US", { timeZone: b, timeZoneName: "longOffset" }).formatToParts(d).find(function (p) { return p.type === "timeZoneName"; });
        panelShow("tz", { main: fmtIn(d, b), label: "Time in " + b, sub: "In " + a + " it is " + fmtIn(d, a),
          cells: [[(offA && offA.value) || "—", a], [(offB && offB.value) || "—", b]], copy: fmtIn(d, b) });
      } catch (e) { panelShow("tz", { error: "Invalid zone combination" }); }
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("tz"); calc();
  };

  E["days-until"] = function (root) {
    root.innerHTML = lab("Date") + inputHtml("du-in", "date", new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10), 'style="width:100%"') + '<div style="height:18px"></div>' + resultPanel("du");
    function calc() {
      var d = parseDate(q("#du-in").value);
      if (!d) return panelShow("du", { error: "Pick a date" });
      var today = new Date(); today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      var diff = daysBetween(today, d);
      var main, sub;
      if (diff >= 0) { main = fmt(diff) + " day" + (diff === 1 ? "" : "s") + " to go"; sub = dFull(d); }
      else { main = fmt(-diff) + " day" + (diff === -1 ? "" : "s") + " ago"; sub = dFull(d); }
      panelShow("du", { main: main, label: "Countdown", sub: sub,
        cells: [[fmt(Math.abs(diff) / 7, 1), "Weeks"], [DAYN[d.getDay()], "Weekday"], [MON[d.getMonth()] + " " + d.getDate(), "Month and day"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("du"); calc();
  };

  E["current-time"] = function (root) {
    root.innerHTML = '<div class="big-clock" id="ct-clock">--:--:--</div>' +
      '<div class="t-hint" style="text-align:center;margin-top:8px" id="ct-tz"></div><br>' + resultPanel("ct");
    var local = "UTC";
    try { local = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
    function calc() {
      var d = new Date();
      var p = function (n, l) { return String(n).padStart(l || 2, "0"); };
      q("#ct-clock").textContent = p(d.getHours()) + " : " + p(d.getMinutes()) + " : " + p(d.getSeconds()) + "." + p(Math.floor(d.getMilliseconds() / 10));
      q("#ct-tz").textContent = local + " · " + d.toLocaleDateString("en-US", { dateStyle: "full" });
      var offset = -d.getTimezoneOffset(), oh = Math.floor(Math.abs(offset) / 60), om = Math.abs(offset) % 60;
      var os = "UTC" + (offset >= 0 ? "+" : "-") + p(oh) + (om ? ":" + p(om) : "");
      panelShow("ct", { main: d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }), label: "Local time",
        cells: [[os, "UTC offset"], [d.toISOString().slice(0, 10), "ISO date"], [String(d.getTime()), "Unix ms"]] });
    }
    setInterval(calc, 100); calc(); bindPanelCopy("ct");
  };


  /* ================= UNIT CONVERTERS ================= */
  var FAM = {
    length: { name: "Length", u: { mm: "Millimeter", cm: "Centimeter", m: "Meter", km: "Kilometer", in: "Inch", ft: "Foot", yd: "Yard", mi: "Mile", nmi: "Nautical mile" },
      f: { mm: .001, cm: .01, m: 1, km: 1000, "in": .0254, ft: .3048, yd: .9144, mi: 1609.344, nmi: 1852 } },
    weight: { name: "Weight", u: { mg: "Milligram", g: "Gram", kg: "Kilogram", t: "Metric ton", oz: "Ounce", lb: "Pound", st: "Stone" },
      f: { mg: 1e-6, g: .001, kg: 1, t: 1000, oz: .028349523125, lb: .45359237, st: 6.35029318 } },
    temperature: { name: "Temperature", u: { C: "Celsius", F: "Fahrenheit", K: "Kelvin" }, special: true },
    area: { name: "Area", u: { m2: "Square meter", km2: "Square kilometer", ha: "Hectare", ft2: "Square foot", yd2: "Square yard", acre: "Acre", mi2: "Square mile" },
      f: { m2: 1, km2: 1e6, ha: 10000, ft2: .09290304, yd2: .83612736, acre: 4046.8564224, mi2: 2589988.110336 } },
    volume: { name: "Volume", u: { ml: "Milliliter", l: "Liter", m3: "Cubic meter", tsp: "Teaspoon (US)", tbsp: "Tablespoon (US)", cup: "Cup (US)", gal: "Gallon (US)", pt: "Pint (US)" },
      f: { ml: .001, l: 1, m3: 1000, tsp: .00492892159375, tbsp: .01478676478125, cup: .2365882365, gal: 3.785411784, pt: .473176473 } },
    speed: { name: "Speed", u: { ms: "Meters/second", kmh: "Kilometers/hour", mph: "Miles/hour", fts: "Feet/second", kn: "Knot" },
      f: { ms: 1, kmh: .2777777778, mph: .44704, fts: .3048, kn: .5144444444 } },
    data: { name: "Data storage (1024)", u: { bit: "Bit", B: "Byte", KB: "Kilobyte", MB: "Megabyte", GB: "Gigabyte", TB: "Terabyte", PB: "Petabyte" },
      f: { bit: .125, B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, PB: 1125899906842624 } },
    time: { name: "Time", u: { ms: "Millisecond", s: "Second", min: "Minute", h: "Hour", d: "Day", wk: "Week", mo: "Month (avg)", yr: "Year" },
      f: { ms: .001, s: 1, min: 60, h: 3600, d: 86400, wk: 604800, mo: 2629746, yr: 31556952 } },
    energy: { name: "Energy", u: { J: "Joule", kJ: "Kilojoule", cal: "Calorie", kcal: "Kilocalorie", Wh: "Watt-hour", kWh: "Kilowatt-hour", BTU: "BTU" },
      f: { J: 1, kJ: 1000, cal: 4.184, kcal: 4184, Wh: 3600, kWh: 3600000, BTU: 1055.05585262 } },
    angle: { name: "Angle", u: { deg: "Degree", rad: "Radian", grad: "Gradian", turn: "Turn", arcmin: "Arcminute" },
      f: { deg: 1, rad: 57.29577951308232, grad: .9, turn: 360, arcmin: 1 / 60 } }
  };
  function tempConvert(v, from, to) {
    var c = from === "C" ? v : from === "F" ? (v - 32) * 5 / 9 : v - 273.15;
    return to === "C" ? c : to === "F" ? c * 9 / 5 + 32 : c + 273.15;
  }
  function convertUI(root, famId, defFrom, defTo, id) {
    var fam = FAM[famId];
    var keys = Object.keys(fam.u);
    var dFrom = defFrom || keys[0], dTo = defTo || keys[Math.min(2, keys.length - 1)];
    root.innerHTML =
      '<div class="t-fields">' +
        '<div><div style="display:flex;gap:12px;align-items:center">' +
          inputHtml(id + "-v", "number", "1", 'step="any" style="flex:1"') +
          '<button class="swap-btn" id="' + id + '-swap" aria-label="Swap units">' + CT.icon("refresh") + "</button></div>" +
        "</div>" +
        "<div>" + selectHtml(id + "-from", keys.map(function (k) { return { v: k, n: fam.u[k] }; }), dFrom) +
        '<div style="height:12px"></div>' + selectHtml(id + "-to", keys.map(function (k) { return { v: k, n: fam.u[k] }; }), dTo) +
        "</div></div>" + resultPanel(id);
    function calc() {
      var v = num(q("#" + id + "-v").value), a = q("#" + id + "-from").value, b = q("#" + id + "-to").value;
      var r = fam.special ? tempConvert(v, a, b) : v * fam.f[a] / fam.f[b];
      if (!isFinite(r)) return panelShow(id, { error: "Enter a valid value" });
      panelShow(id, { main: fmtE(r) + " " + b, label: fmtE(v) + " " + fam.u[a] + " equals", sub: fam.special ? ("Formula applied: " + a + " → " + b) : "1 " + a + " = " + fmtE(fam.f[a] / fam.f[b]) + " " + b });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc);
    q("#" + id + "-swap").addEventListener("click", function () {
      var f = q("#" + id + "-from"), t = q("#" + id + "-to");
      var tmp = f.value; f.value = t.value; t.value = tmp; calc();
    });
    bindPanelCopy(id); calc();
  }
  E["unit-converter"] = function (root) {
    root.innerHTML = lab("Category") + selectHtml("uc-fam", Object.keys(FAM).map(function (k) { return { v: k, n: FAM[k].name }; }), "length") + '<div style="height:16px"></div><div id="uc-slot"></div>';
    function mount(famId) {
      convertUI(q("#uc-slot"), famId, famId === "temperature" ? "C" : null, famId === "temperature" ? "F" : null, "uc-" + famId);
    }
    q("#uc-fam").addEventListener("change", function () { mount(this.value); });
    mount("length");
  };
  E["length-converter"] = function (root) { convertUI(root, "length", "m", "ft", "len"); };
  E["weight-converter"] = function (root) { convertUI(root, "weight", "kg", "lb", "wgt"); };
  E["temperature-converter"] = function (root) { convertUI(root, "temperature", "C", "F", "tmp"); };
  E["area-converter"] = function (root) { convertUI(root, "area", "m2", "ft2", "are"); };
  E["volume-converter"] = function (root) { convertUI(root, "volume", "l", "gal", "vol"); };
  E["speed-converter"] = function (root) { convertUI(root, "speed", "kmh", "mph", "spd"); };
  E["data-storage-converter"] = function (root) { convertUI(root, "data", "MB", "GB", "dat"); };
  E["time-units-converter"] = function (root) { convertUI(root, "time", "h", "min", "tim"); };
  E["energy-converter"] = function (root) { convertUI(root, "energy", "kcal", "kJ", "nrg"); };
  E["angle-converter"] = function (root) { convertUI(root, "angle", "deg", "rad", "ang"); };

  /* ================= DEVELOPER ================= */
  E["base64-encoder"] = function (root) {
    root.innerHTML = lab("Mode") + '<div class="seg" id="b6-seg"><button class="active" data-m="en">Encode</button><button data-m="de">Decode</button></div><br><br>' +
      areaHtml("b6-in", "Type or paste text here") + resultPanel("b6");
    function calc() {
      var mode = root.querySelector("#b6-seg .active").getAttribute("data-m");
      var t = q("#b6-in").value;
      if (!t) return panelShow("b6", { error: "Enter some text" });
      try {
        if (mode === "en") {
          var b = btoa(unescape(encodeURIComponent(t)));
          panelShow("b6", { main: b, label: "Base64 encoded", sub: b.length + " characters" });
        } else {
          var d = decodeURIComponent(escape(atob(t.trim())));
          panelShow("b6", { main: d, label: "Base64 decoded", sub: t.trim().length + " characters in" });
        }
      } catch (e) { panelShow("b6", { error: "Invalid Base64 input" }); }
    }
    root.addEventListener("input", calc);
    root.querySelector("#b6-seg").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      qa("button", this).forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); calc();
    });
    bindPanelCopy("b6"); calc();
  };

  E["json-formatter"] = function (root) {
    root.innerHTML = lab("Your JSON") + areaHtml("js-in", '{ "name": "Clouse Tools", "free": true, "count": 67 }') +
      '<div class="btn-row">' +
      '<select class="t-select" id="js-ind" style="width:auto;padding:10px 14px"><option value="2">2 spaces</option><option value="4">4 spaces</option></select>' +
      '<button class="btn btn-primary btn-sm" id="js-fmt">' + CT.icon("braces") + "Format</button>" +
      '<button class="btn btn-ghost btn-sm" id="js-min">' + CT.icon("arrows-minimize") + "Minify</button></div>" + outBox("js-out");
    function run(minify) {
      var t = q("#js-in").value;
      if (!t.trim()) { setOut("js-out", "Paste JSON above."); return; }
      try {
        var o = JSON.parse(t);
        var out = minify ? JSON.stringify(o) : JSON.stringify(o, null, q("#js-ind").value);
        setOut("js-out", out);
        var ok = document.createElement("div"); ok.className = "ok-note t-hint"; ok.textContent = "Valid JSON · " + out.length + " chars";
        q("#js-out").after(ok); setTimeout(function () { ok.remove(); }, 1500);
      } catch (e) {
        setOut("js-out", "JSON Error: " + e.message);
      }
    }
    q("#js-fmt").addEventListener("click", function () { run(false); });
    q("#js-min").addEventListener("click", function () { run(true); });
  };

  E["url-encoder"] = function (root) {
    root.innerHTML = lab("Mode") + '<div class="seg" id="ur-seg"><button class="active" data-m="en">Encode</button><button data-m="de">Decode</button></div><br><br>' +
      areaHtml("ur-in", "https://clouse.tools/search?q=free tools") + resultPanel("ur");
    function calc() {
      var mode = root.querySelector("#ur-seg .active").getAttribute("data-m");
      var t = q("#ur-in").value;
      if (!t) return panelShow("ur", { error: "Enter a URL or text" });
      try {
        var r = mode === "en" ? encodeURIComponent(t) : decodeURIComponent(t);
        panelShow("ur", { main: r, label: mode === "en" ? "Encoded (component)" : "Decoded" });
      } catch (e) { panelShow("ur", { error: "Malformed percent-encoding" }); }
    }
    root.addEventListener("input", calc);
    root.querySelector("#ur-seg").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      qa("button", this).forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); calc();
    });
    bindPanelCopy("ur"); calc();
  };

  E["html-entity-encoder"] = function (root) {
    root.innerHTML = lab("Mode") + '<div class="seg" id="he-seg"><button class="active" data-m="en">Escape</button><button data-m="de">Unescape</button></div><br><br>' +
      areaHtml("he-in", '<script>alert("this is now safe")<\/script>') + resultPanel("he");
    function calc() {
      var mode = root.querySelector("#he-seg .active").getAttribute("data-m");
      var t = q("#he-in").value;
      if (!t) return panelShow("he", { error: "Enter some text" });
      var r;
      if (mode === "en") r = t.replace(/[&<>"']/g, function (c) { return String.fromCharCode(38) + "#" + c.charCodeAt(0) + ";"; });
      else {
        var ta = document.createElement("textarea"); ta.innerHTML = t; r = ta.value;
      }
      panelShow("he", { main: r, label: mode === "en" ? "Escaped HTML" : "Unescaped text" });
    }
    root.addEventListener("input", calc);
    root.querySelector("#he-seg").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      qa("button", this).forEach(function (x) { x.classList.remove("active"); }); b.classList.add("active"); calc();
    });
    bindPanelCopy("he"); calc();
  };

  E["regex-tester"] = function (root) {
    root.innerHTML = fields([
      fWrap("Pattern", inputHtml("rx-p", "text", "\\bfox\\b", 'style="width:100%" placeholder="e.g. \\d+')),
      fWrap("Flags", inputHtml("rx-f", "text", "gi", 'placeholder="g i m s u y"'))
    ]) + lab("Test text") + areaHtml("rx-t", "The quick brown fox jumps over 42 lazy foxes.") +
      outBox("rx-out") + '<div id="rx-list"></div>';
    function calc() {
      var p = q("#rx-p").value, f = q("#rx-f").value || "g", t = q("#rx-t").value;
      if (!p) { setOut("rx-out", "Enter a pattern."); return; }
      var rx;
      try { rx = new RegExp(p, f); } catch (e) { setOut("rx-out", "Invalid pattern: " + e.message); return; }
      var matches = t.match(new RegExp(p, f.indexOf("g") > -1 ? f : f + "g")) || [];
      var html = esc(t);
      try { html = t.replace(new RegExp(p, f.indexOf("g") > -1 ? f : f + "g"), function (m) { return '<mark class="matchmark">' + esc(m) + "</mark>"; }); } catch (e) {}
      q("#rx-out").innerHTML = html || " ";
      q("#rx-list").innerHTML = matches.length
        ? '<div class="t-hint">' + matches.length + " match" + (matches.length === 1 ? "" : "es") + "</div>"
        : '<div class="t-hint">No matches</div>';
    }
    root.addEventListener("input", calc); calc();
  };

  E["hash-generator"] = function (root) {
    root.innerHTML = lab("Text to hash") + areaHtml("sh-in", "Hello, Clouse Tools!") + resultPanel("sh");
    root.addEventListener("input", calc);
    function calc() {
      var t = q("#sh-in").value;
      if (!t) return panelShow("sh", { error: "Enter some text" });
      var bytes = unescape(encodeURIComponent(t));
      var h = sha256(bytes);
      panelShow("sh", { main: h.match(/.{8}/g).join(" "), label: "SHA-256 digest", sub: "256-bit hash of " + t.length + " characters" });
    }
    bindPanelCopy("sh"); calc();
  };

  E["uuid-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("How many", selectHtml("id-n", [1, 2, 5, 10, 20].map(function (n) { return { v: n, n: n + " UUID" + (n > 1 ? "s" : "") }; }), 5)),
      fWrap("Options", '<label class="switch"><input type="checkbox" id="id-up"><i></i>Uppercase</label><br><br><label class="switch"><input type="checkbox" id="id-noh"><i></i>No hyphens</label>')
    ]) + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="id-go">' + CT.icon("fingerprint") + "Generate</button></div>" + outBox("id-out");
    q("#id-go").addEventListener("click", function () {
      var n = parseInt(q("#id-n").value, 10), out = [];
      for (var i = 0; i < n; i++) {
        var u = crypto.randomUUID ? crypto.randomUUID() : v4();
        if (q("#id-up").checked) u = u.toUpperCase();
        if (q("#id-noh").checked) u = u.replace(/-/g, "");
        out.push(u);
      }
      setOut("id-out", out.join("\n"));
      q("#id-out").dataset.val = out.join("\n");
    });
    bindCopyBtn("#id-out-wrap-copy", function () { return q("#id-out").dataset.val || ""; });
    q("#id-go").click();
    function v4() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0] % 16, v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };

  E["password-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Length", '<div class="range-row"><input type="range" id="pw-len" min="6" max="64" value="18"><span class="range-val" id="pw-lenv">18</span></div>'),
      fWrap("Character sets", '<label class="switch"><input type="checkbox" id="pw-u" checked><i></i>A–Z</label> ' +
        '<label class="switch"><input type="checkbox" id="pw-l" checked><i></i>a–z</label> ' +
        '<label class="switch"><input type="checkbox" id="pw-n" checked><i></i>0–9</label> ' +
        '<label class="switch"><input type="checkbox" id="pw-s" checked><i></i>!@#$%</label>')
    ]) + '<div class="btn-row"><button class="btn btn-primary btn-sm" id="pw-go">' + CT.icon("key") + "Generate</button></div>" +
      '<div class="t-result light" id="pw-panel"><div class="r-label">Your password</div><div class="r-main" id="pw-main" style="font-family:var(--mono);font-size:clamp(1rem,3vw,1.4rem)">—</div><div class="strength-bar"><i id="pw-bar"></i></div><button class="copy-btn" id="pw-copy">' + CT.icon("copy") + "</button></div>";
    q("#pw-len").addEventListener("input", function () { q("#pw-lenv").textContent = this.value; });
    q("#pw-go").addEventListener("click", function () {
      var sets = "";
      if (q("#pw-u").checked) sets += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (q("#pw-l").checked) sets += "abcdefghijklmnopqrstuvwxyz";
      if (q("#pw-n").checked) sets += "0123456789";
      if (q("#pw-s").checked) sets += "!@#$%&*+-=?";
      if (!sets) { q("#pw-main").textContent = "Select at least one set"; return; }
      var len = +q("#pw-len").value, arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      var pw = Array.prototype.map.call(arr, function (n) { return sets[n % sets.length]; }).join("");
      q("#pw-main").textContent = pw;
      q("#pw-panel").dataset.copy = pw;
      var bits = Math.round(len * Math.log2(sets.length));
      var bar = q("#pw-bar");
      bar.style.width = Math.min(100, bits / 128 * 100) + "%";
      bar.style.background = bits < 45 ? "var(--err)" : bits < 75 ? "var(--warn)" : "var(--ok)";
      q("#pw-panel").querySelector(".r-label").textContent = "Your password · " + bits + " bits of entropy";
    });
    q("#pw-copy").addEventListener("click", function () { CT.copy(q("#pw-panel").dataset.copy || ""); });
    q("#pw-go").click();
  };

  E["markdown-previewer"] = function (root) {
    root.innerHTML = fields([
      fWrap("Markdown", areaHtml("md-in", "# Hello Clouse\n\nWrite **bold**, *italic*, `code` and [links](https://example.com).\n\n- Point one\n- Point two")),
      fWrap("Preview", '<div class="out-box" id="md-out" style="min-height:170px;white-space:normal"></div>')
    ]);
    function inline(s) {
      s = esc(s);
      s = s.replace(/`([^`]+)`/g, function (m, c) { return "<code>" + c + "</code>"; });
      s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
      s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, function (m, txt, url) { return '<a href="' + url + '" target="_blank" rel="noopener">' + txt + "</a>"; });
      return s;
    }
    function render() {
      var lines = q("#md-in").value.split("\n");
      var html = [], inList = false, listTag = "ul";
      function closeList() { if (inList) { html.push("</" + listTag + ">"); inList = false; } }
      lines.forEach(function (l) {
        var h = l.match(/^(#{1,4})\s+(.*)/);
        var ul = l.match(/^[-*]\s+(.*)/), ol = l.match(/^\d+\.\s+(.*)/);
        if (h) { closeList(); html.push("<h" + h[1].length + ">" + inline(h[2]) + "</h" + h[1].length + ">"); }
        else if (ul) { if (!inList || listTag !== "ul") { closeList(); html.push("<ul>"); inList = true; listTag = "ul"; } html.push("<li>" + inline(ul[1]) + "</li>"); }
        else if (ol) { if (!inList || listTag !== "ol") { closeList(); html.push('<ol style="padding-left:22px;list-style:decimal">'); inList = true; listTag = "ol"; } html.push("<li>" + inline(ol[1]) + "</li>"); }
        else if (/^\s*$/.test(l)) { closeList(); }
        else if (/^>\s?/.test(l)) { closeList(); html.push("<blockquote style='border-left:3px solid var(--line-2);padding:4px 14px;color:var(--ink-2)'>" + inline(l.replace(/^>\s?/, "")) + "</blockquote>"); }
        else { closeList(); html.push("<p>" + inline(l) + "</p>"); }
      });
      closeList();
      q("#md-out").innerHTML = html.join("") || "Preview appears here…";
    }
    root.addEventListener("input", render); render();
  };


  E["css-minifier"] = function (root) {
    root.innerHTML = lab("Your CSS") + areaHtml("cm-in", "body {\n  color: #333;\n  margin: 0 auto;\n}") + resultPanel("cm");
    function calc() {
      var css = q("#cm-in").value;
      if (!css.trim()) return panelShow("cm", { error: "Paste some CSS" });
      var min = css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/\s*([{}:;,>~+])\s*/g, "$1")
        .replace(/;}/g, "}")
        .trim();
      panelShow("cm", { main: min, label: "Minified CSS", sub: css.length + " → " + min.length + " chars (" + fmt(Math.max(0, (1 - min.length / css.length) * 100), 1) + "% smaller)" });
    }
    root.addEventListener("input", calc); bindPanelCopy("cm"); calc();
  };

  E["jwt-decoder"] = function (root) {
    root.innerHTML = lab("JWT token") + areaHtml("jw-in", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.signature") + resultPanel("jw");
    function b64u(s) {
      s = s.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      return decodeURIComponent(escape(atob(s)));
    }
    root.addEventListener("input", function () {
      var t = q("#jw-in").value.trim();
      if (!t) return panelShow("jw", { error: "Paste a JWT token" });
      var parts = t.split(".");
      if (parts.length < 2) return panelShow("jw", { error: "A JWT has at least 2 dot-separated parts" });
      try {
        var header = JSON.parse(b64u(parts[0]));
        var payload = JSON.parse(b64u(parts[1]));
        var exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString("en-US") : null;
        panelShow("jw", { main: "alg: " + (header.alg || "?"), label: "Decoded token",
          sub: "Header: " + JSON.stringify(header) + "\nPayload: " + JSON.stringify(payload) + (exp ? "\nExpires: " + exp : "") + "\nSignature is NOT verified — this tool never sends data anywhere.",
          copy: JSON.stringify(payload, null, 2) });
      } catch (e) { panelShow("jw", { error: "Invalid JWT encoding" }); }
    });
    bindPanelCopy("jw");
    q("#jw-in").dispatchEvent(new Event("input"));
  };

  E["csv-to-json"] = function (root) {
    root.innerHTML = lab("CSV data (first row = headers)") + areaHtml("cv-in", "name,role,free\nClouse,tools,yes\nPercent,calculator,yes") +
      '<div class="btn-row">' +
      '<select class="t-select" id="cv-d" style="width:auto;padding:10px 14px"><option value=",">Comma</option><option value=";">Semicolon</option><option value="\t">Tab</option></select>' +
      '<label class="switch"><input type="checkbox" id="cv-h" checked><i></i>First row is header</label>' +
      '<button class="btn btn-primary btn-sm" id="cv-go">' + CT.icon("database") + "Convert</button></div>" + outBox("cv-out");
    q("#cv-go").addEventListener("click", function () {
      var raw = q("#cv-in").value.trim();
      if (!raw) { setOut("cv-out", "Paste CSV above."); return; }
      var delim = q("#cv-d").value === "\t" ? "\t" : q("#cv-d").value;
      function splitLine(line) {
        var out = [], cur = "", inQ = false;
        for (var i = 0; i < line.length; i++) {
          var c = line[i];
          if (c === '"') { if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else inQ = !inQ; }
          else if (c === delim && !inQ) { out.push(cur); cur = ""; }
          else cur += c;
        }
        out.push(cur);
        return out.map(function (s) { return s.trim(); });
      }
      var rows = raw.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(splitLine);
      var headers = q("#cv-h").checked ? rows.shift() : rows[0].map(function (_, i) { return "column" + (i + 1); });
      var json = rows.map(function (r) {
        var o = {};
        headers.forEach(function (h, i) { o[h] = r[i] != null ? (isNaN(r[i]) || r[i] === "" ? r[i] : Number(r[i])) : ""; });
        return o;
      });
      setOut("cv-out", JSON.stringify(json, null, 2));
      q("#cv-out").dataset.val = JSON.stringify(json, null, 2);
    });
  };

  /* ================= DESIGN ================= */
  function fileDropZone(id, hint) {
    return '<div class="file-drop" id="' + id + '" role="button" tabindex="0" aria-label="Choose image">' +
      CT.icon("photo") + "<b>Click to choose an image</b><span>" + (hint || "or drop it here — nothing is uploaded, it stays on this device") + "</span>" +
      '<input type="file" id="' + id + '-file" accept="image/*" hidden></div>';
  }
  function wireDrop(id, cb) {
    var zone = q("#" + id), input = q("#" + id + "-file");
    zone.addEventListener("click", function () { input.click(); });
    zone.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", function () { if (input.files[0]) cb(input.files[0]); });
    ["dragover", "dragenter"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove("over"); }); });
    zone.addEventListener("drop", function (e) { if (e.dataTransfer.files[0]) cb(e.dataTransfer.files[0]); });
  }

  E["image-resizer"] = function (root) {
    root.innerHTML = fileDropZone("ir") + '<div id="ir-ui" hidden>' +
      fields([
        fWrap("Width (px)", inputHtml("ir-w", "number", "", 'min="1"')),
        fWrap("Height (px)", inputHtml("ir-h", "number", "", 'min="1"')),
        fWrap("Format", selectHtml("ir-f", [{ v: "image/png", n: "PNG" }, { v: "image/jpeg", n: "JPEG" }, { v: "image/webp", n: "WebP" }], "image/png")),
        fWrap("", '<label class="switch"><input type="checkbox" id="ir-lock" checked><i></i>Lock aspect ratio</label>')
      ]) +
      '<div class="preview-zone" id="ir-prev"></div>' +
      '<div class="btn-row"><button class="btn btn-primary btn-sm" id="ir-go">' + CT.icon("download") + "Resize & download</button></div></div>";
    var img = null, ratio = 1;
    wireDrop("ir", function (file) {
      var url = URL.createObjectURL(file);
      img = new Image();
      img.onload = function () {
        ratio = img.naturalWidth / img.naturalHeight;
        q("#ir-ui").hidden = false;
        q("#ir-w").value = img.naturalWidth; q("#ir-h").value = img.naturalHeight;
        q("#ir-prev").innerHTML = '<img src="' + url + '" alt="Original preview">';
        CT.toast("Image loaded · " + img.naturalWidth + "×" + img.naturalHeight);
      };
      img.src = url;
    });
    q("#ir-w").addEventListener("input", function () { if (q("#ir-lock").checked && img) q("#ir-h").value = Math.max(1, Math.round(this.value / ratio)); });
    q("#ir-h").addEventListener("input", function () { if (q("#ir-lock").checked && img) q("#ir-w").value = Math.max(1, Math.round(this.value * ratio)); });
    q("#ir-go").addEventListener("click", function () {
      if (!img) return;
      var w = clamp(Math.round(num(q("#ir-w").value, 1)), 1, 8000), h = clamp(Math.round(num(q("#ir-h").value, 1)), 1, 8000);
      var c = document.createElement("canvas"); c.width = w; c.height = h;
      var ctx = c.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      if (q("#ir-f").value === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "resized-" + w + "x" + h + "." + q("#ir-f").value.split("/")[1];
        a.click();
        CT.toast("Resized to " + w + "×" + h + " · " + fmt(blob.size / 1024, 1) + " KB");
      }, q("#ir-f").value, 0.92);
    });
  };

  E["image-compressor"] = function (root) {
    root.innerHTML = fileDropZone("ic") + '<div id="ic-ui" hidden>' +
      fields([
        fWrap("Quality", '<div class="range-row"><input type="range" id="ic-q" min="10" max="100" value="75"><span class="range-val" id="ic-qv">75%</span></div>'),
        fWrap("Format", selectHtml("ic-f", [{ v: "image/jpeg", n: "JPEG" }, { v: "image/webp", n: "WebP" }], "image/jpeg"))
      ]) + '<div class="preview-zone" id="ic-prev"></div>' +
      '<div class="btn-row"><button class="btn btn-primary btn-sm" id="ic-go">' + CT.icon("download") + "Compress & download</button></div></div>";
    var img = null, size = 0, name = "image";
    wireDrop("ic", function (file) {
      size = file.size; name = file.name.replace(/\.[^.]+$/, "");
      var url = URL.createObjectURL(file);
      img = new Image();
      img.onload = function () {
        q("#ic-ui").hidden = false;
        q("#ic-prev").innerHTML = '<img src="' + url + '" alt="Preview">';
        CT.toast("Loaded · original " + fmt(size / 1024, 1) + " KB");
      };
      img.src = url;
    });
    q("#ic-q").addEventListener("input", function () { q("#ic-qv").textContent = this.value + "%"; });
    q("#ic-go").addEventListener("click", function () {
      if (!img) return;
      var c = document.createElement("canvas");
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      var ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0);
      var qv = +q("#ic-q").value / 100, f = q("#ic-f").value;
      c.toBlob(function (blob) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name + "-compressed." + f.split("/")[1];
        a.click();
        CT.toast(fmt(blob.size / 1024, 1) + " KB · " + fmt(Math.max(0, (1 - blob.size / size) * 100), 1) + "% smaller");
      }, f, qv);
    });
  };

  E["color-converter"] = function (root) {
    root.innerHTML = lab("Color (HEX, RGB or HSL)") +
      inputHtml("cl-in", "text", "#0071E3", 'style="width:100%"') +
      '<div style="height:16px"></div><div class="swatch-row" id="cl-prev" style="margin-bottom:18px"></div>' + resultPanel("cl");
    function parse(t) {
      t = t.trim().toLowerCase();
      var hex = t.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
      if (hex) {
        var h = hex[1];
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
      }
      var rgb = t.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
      if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };
      var hsl = t.match(/^hsla?\(\s*(\d+)[,\s]+(\d+)%[,\s]+(\d+)%/);
      if (hsl) return hslToRgb(+hsl[1] / 360, +hsl[2] / 100, +hsl[3] / 100);
      return null;
    }
    function toHex(r, g, b) { return "#" + [r, g, b].map(function (x) { return Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0"); }).join("").toUpperCase(); }
    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var mx = Math.max(r, g, b), mn = Math.min(r, g, b), h = 0, s = 0, l = (mx + mn) / 2;
      if (mx !== mn) {
        var d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
        else if (mx === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }
    function hslToRgb(h, s, l) {
      if (s === 0) { var v = Math.round(l * 255); return { r: v, g: v, b: v }; }
      function hue2(p, q2, t) { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q2 - p) * 6 * t; if (t < 1 / 2) return q2; if (t < 2 / 3) return p + (q2 - p) * (2 / 3 - t) * 6; return p; }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      return { r: Math.round(hue2(p, q, h + 1 / 3) * 255), g: Math.round(hue2(p, q, h) * 255), b: Math.round(hue2(p, q, h - 1 / 3) * 255) };
    }
    function calc() {
      var c = parse(q("#cl-in").value);
      if (!c) return panelShow("cl", { error: "Enter a valid HEX, RGB or HSL color" });
      var hsl = rgbToHsl(c.r, c.g, c.b);
      var hex = toHex(c.r, c.g, c.b);
      q("#cl-prev").innerHTML = '<div class="swatch" style="width:100%;height:64px;border-radius:14px;background:' + hex + '" title="' + hex + '"></div>';
      panelShow("cl", { main: hex, label: "HEX",
        cells: [[hex, "HEX"], ["rgb(" + Math.round(c.r) + ", " + Math.round(c.g) + ", " + Math.round(c.b) + ")", "RGB"],
          ["hsl(" + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%)", "HSL"]] });
    }
    root.addEventListener("input", calc); bindPanelCopy("cl"); calc();
  };

  E["gradient-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("From color", '<input type="color" class="t-input" id="gr-a" value="#0071e3" style="padding:8px;height:52px;cursor:pointer">'),
      fWrap("To color", '<input type="color" class="t-input" id="gr-b" value="#a2f2ff" style="padding:8px;height:52px;cursor:pointer">'),
      fWrap("Middle color (optional)", '<input type="color" class="t-input" id="gr-c" value="#ffffff" style="padding:8px;height:52px;cursor:pointer">'),
      fWrap("Type", selectHtml("gr-t", [{ v: "linear", n: "Linear" }, { v: "radial", n: "Radial" }], "linear")),
      fWrap("Angle", '<div class="range-row"><input type="range" id="gr-ang" min="0" max="360" value="135"><span class="range-val" id="gr-angv">135°</span></div>')
    ]) + '<label class="switch" style="margin-bottom:14px"><input type="checkbox" id="gr-usec"><i></i>Use middle color</label>' +
      '<div id="gr-prev" style="height:180px;border-radius:20px;box-shadow:inset 0 0 0 1px var(--line)"></div><br>' + resultPanel("gr");
    function css() {
      var a = q("#gr-a").value, b = q("#gr-b").value, mid = q("#gr-c").value, useC = q("#gr-usec").checked;
      var stops = useC ? a + ", " + mid + " 50%, " + b : a + ", " + b;
      return q("#gr-t").value === "radial" ? "radial-gradient(circle at center, " + stops + ")" : "linear-gradient(" + q("#gr-ang").value + "deg, " + stops + ")";
    }
    function calc() {
      var v = css();
      q("#gr-prev").style.background = v;
      panelShow("gr", { main: v, label: "CSS", copy: "background: " + v + ";" });
    }
    root.addEventListener("input", calc); root.addEventListener("change", calc); bindPanelCopy("gr"); calc();
  };

  E["shadow-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("X offset", '<div class="range-row"><input type="range" id="sh-x" min="-60" max="60" value="12"><span class="range-val" id="sh-xv">12px</span></div>'),
      fWrap("Y offset", '<div class="range-row"><input type="range" id="sh-y" min="-60" max="60" value="24"><span class="range-val" id="sh-yv">24px</span></div>'),
      fWrap("Blur", '<div class="range-row"><input type="range" id="sh-b" min="0" max="120" value="48"><span class="range-val" id="sh-bv">48px</span></div>'),
      fWrap("Spread", '<div class="range-row"><input type="range" id="sh-s" min="-40" max="60" value="-12"><span class="range-val" id="sh-sv">-12px</span></div>'),
      fWrap("Color", '<input type="color" class="t-input" id="sh-c" value="#0b0b0e" style="padding:8px;height:52px;cursor:pointer">'),
      fWrap("Inset", '<label class="switch"><input type="checkbox" id="sh-i"><i></i>Inset shadow</label>')
    ]) +
      '<div style="height:200px;display:grid;place-items:center;border-radius:20px;background:var(--bg);margin-top:6px">' +
      '<div id="sh-prev" style="width:190px;height:110px;border-radius:24px;background:#fff;display:grid;place-items:center;font-weight:600">Preview</div></div><br>' + resultPanel("sh");
    function value() {
      return (q("#sh-i").checked ? "inset " : "") + q("#sh-x").value + "px " + q("#sh-y").value + "px " + q("#sh-b").value + "px " + q("#sh-s").value + "px " + q("#sh-c").value;
    }
    function calc() {
      ["x", "y", "b", "s"].forEach(function (k) { q("#sh-" + k + "v").textContent = q("#sh-" + k).value + "px"; });
      q("#sh-prev").style.boxShadow = value();
      panelShow("sh", { main: value(), label: "CSS", copy: "box-shadow: " + value() + ";" });
    }
    root.addEventListener("input", calc); bindPanelCopy("sh"); calc();
  };

  E["qr-code-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Text or URL", inputHtml("qr-in", "text", "https://clouse.tools", 'style="width:100%"')),
      fWrap("Size", selectHtml("qr-s", [128, 256, 512, 1024].map(function (s) { return { v: s, n: s + " px" }; }), 512))
    ]) + '<div class="preview-zone" id="qr-prev" style="justify-content:center;min-height:240px"></div>' +
      '<div class="btn-row"><button class="btn btn-primary btn-sm" id="qr-go">' + CT.icon("qrcode") + "Generate QR code</button>" +
      '<button class="btn btn-ghost btn-sm" id="qr-dl" disabled>' + CT.icon("download") + "Download PNG</button></div>";
    var lastCanvas = null;
    function ensureLib(cb) {
      if (window.qrcode) return cb(true);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";
      s.onload = function () { cb(!!window.qrcode); };
      s.onerror = function () { cb(false); };
      document.head.appendChild(s);
    }
    q("#qr-go").addEventListener("click", function () {
      var t = q("#qr-in").value.trim();
      if (!t) { CT.toast("Enter text or a URL first"); return; }
      ensureLib(function (ok) {
        if (!ok) { q("#qr-prev").innerHTML = '<div class="t-hint" style="padding:30px">QR library could not load — check your internet connection and try again.</div>'; return; }
        var qr = qrcode(0, "M");
        qr.addData(t); qr.make();
        var size = +q("#qr-s").value;
        var c = document.createElement("canvas"); c.width = size; c.height = size;
        var ctx = c.getContext("2d");
        var count = qr.getModuleCount(), cell = size / (count + 4);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = "#0b0b0e";
        for (var r = 0; r < count; r++) for (var cc = 0; cc < count; cc++)
          if (qr.isDark(r, cc)) ctx.fillRect(Math.floor((cc + 2) * cell), Math.floor((r + 2) * cell), Math.ceil(cell), Math.ceil(cell));
        lastCanvas = c;
        c.style.cssText = "width:min(260px,100%);border-radius:16px;box-shadow:var(--sh-md)";
        q("#qr-prev").innerHTML = ""; q("#qr-prev").appendChild(c);
        q("#qr-dl").disabled = false;
      });
    });
    q("#qr-dl").addEventListener("click", function () {
      if (!lastCanvas) return;
      var a = document.createElement("a");
      a.href = lastCanvas.toDataURL("image/png");
      a.download = "clouse-qr.png"; a.click();
      CT.toast("QR code downloaded");
    });
  };

  E["favicon-generator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Letter or emoji", inputHtml("fv-t", "text", "C", 'maxlength="2" style="width:100%"')),
      fWrap("Background color", '<input type="color" class="t-input" id="fv-bg" value="#0b0b0e" style="padding:8px;height:52px;cursor:pointer">'),
      fWrap("Text color", '<input type="color" class="t-input" id="fv-fg" value="#ffffff" style="padding:8px;height:52px;cursor:pointer">')
    ]) + '<div class="preview-zone" id="fv-prev" style="justify-content:center"></div>' +
      '<div class="btn-row" id="fv-btns"></div>';
    function calc() {
      var t = q("#fv-t").value || "C", bg = q("#fv-bg").value, fg = q("#fv-fg").value;
      var prev = q("#fv-prev"); prev.innerHTML = "";
      [180, 48, 32, 16].forEach(function (s) {
        var c = document.createElement("canvas"); c.width = s; c.height = s;
        var ctx = c.getContext("2d");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, s, s, s * 0.22) : ctx.rect(0, 0, s, s); ctx.fill();
        ctx.fillStyle = fg;
        ctx.font = "700 " + s * 0.58 + "px Inter, Arial, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(t, s / 2, s / 2 + s * 0.02);
        c.style.cssText = "width:" + (s === 16 ? 16 : s === 32 ? 32 : s === 48 ? 48 : 72) + "px;height:auto;border-radius:" + s * 0.22 + "px;box-shadow:var(--sh-sm)";
        prev.appendChild(c);
      });
      q("#fv-btns").innerHTML = [16, 32, 48, 180].map(function (s) {
        return '<button class="btn btn-ghost btn-sm" data-s="' + s + '">' + CT.icon("download") + " " + s + "×" + s + "</button>";
      }).join("");
      qa("#fv-btns button").forEach(function (b) {
        b.addEventListener("click", function () {
          var s = +this.getAttribute("data-s");
          var c = document.createElement("canvas"); c.width = s; c.height = s;
          var ctx = c.getContext("2d");
          ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(0, 0, s, s, s * 0.22) : ctx.rect(0, 0, s, s); ctx.fill();
          ctx.fillStyle = fg; ctx.font = "700 " + s * 0.58 + "px Inter, Arial, sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(t, s / 2, s / 2 + s * 0.02);
          var a = document.createElement("a");
          a.href = c.toDataURL("image/png");
          a.download = "favicon-" + s + ".png"; a.click();
        });
      });
    }
    root.addEventListener("input", calc); calc();
  };

  E["color-palette-extractor"] = function (root) {
    root.innerHTML = fileDropZone("pe", "The image is analyzed locally on canvas") + '<div id="pe-ui" hidden>' +
      '<div class="preview-zone" id="pe-prev" style="justify-content:center"></div><br>' +
      lab("Extracted palette — click a color to copy") + '<div class="swatch-row" id="pe-out"></div></div>';
    wireDrop("pe", function (file) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        q("#pe-ui").hidden = false;
        var s = 80, c = document.createElement("canvas"); c.width = s; c.height = s;
        var ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, s, s);
        q("#pe-prev").innerHTML = '<img src="' + url + '" alt="Image preview">';
        var data = ctx.getImageData(0, 0, s, s).data, pts = [];
        for (var i = 0; i < data.length; i += 4) pts.push([data[i], data[i + 1], data[i + 2]]);
        var K = 6, cent = [];
        for (var k = 0; k < K; k++) cent.push(pts[Math.floor(k * pts.length / K)].slice());
        var assign = [];
        for (var it = 0; it < 12; it++) {
          assign = pts.map(function (p) {
            var bi = 0, bd = 1e12;
            cent.forEach(function (c2, ci) {
              var d = Math.pow(p[0] - c2[0], 2) + Math.pow(p[1] - c2[1], 2) + Math.pow(p[2] - c2[2], 2);
              if (d < bd) { bd = d; bi = ci; }
            });
            return bi;
          });
          for (var ci2 = 0; ci2 < K; ci2++) {
            var grp = [];
            for (var pi = 0; pi < pts.length; pi++) if (assign[pi] === ci2) grp.push(pts[pi]);
            if (grp.length) cent[ci2] = [0, 1, 2].map(function (ch) { return grp.reduce(function (a, p) { return a + p[ch]; }, 0) / grp.length; });
          }
        }
        var hex = cent.map(function (c3) { return "#" + c3.map(function (x) { return Math.round(clamp(x, 0, 255)).toString(16).padStart(2, "0"); }).join("").toUpperCase(); });
        q("#pe-out").innerHTML = hex.map(function (h) {
          return '<button class="swatch" style="background:' + h + '" data-hex="' + h + '" title="Copy ' + h + '" aria-label="Copy ' + h + '"></button>';
        }).join("");
        qa("#pe-out .swatch").forEach(function (sw) {
          sw.addEventListener("click", function () { CT.copy(this.getAttribute("data-hex")); });
        });
        CT.toast("Palette extracted locally");
      };
      img.src = url;
    });
  };

  E["aspect-ratio-calculator"] = function (root) {
    root.innerHTML = fields([
      fWrap("Original width", inputHtml("ar-w", "number", "1920", 'step="any"')),
      fWrap("Original height", inputHtml("ar-h", "number", "1080", 'step="any"')),
      fWrap("New width → find height", inputHtml("ar-nw", "number", "1280", 'step="any"')),
      fWrap("New height → find width", inputHtml("ar-nh", "number", "", 'step="any" placeholder="optional"'))
    ]) + resultPanel("ar");
    function calc() {
      var w = num(q("#ar-w").value), h = num(q("#ar-h").value);
      if (w <= 0 || h <= 0) return panelShow("ar", { error: "Enter original width and height" });
      var g = gcd(Math.round(w), Math.round(h)) || 1;
      var cells = [[Math.round(w / g) + " : " + Math.round(h / g), "Simplified ratio"], [fmt(w / h, 4), "Decimal ratio"]];
      var main = Math.round(w / g) + " : " + Math.round(h / g), label = "Aspect ratio";
      var nw = q("#ar-nw").value;
      if (nw !== "") {
        var nh = num(nw) * h / w;
        main = fmt(nh, 2); label = "Height for width " + num(nw);
        cells.push([fmt(num(nw) * h / w, 2), "New height"]);
      }
      var nhv = q("#ar-nh").value;
      if (nhv !== "") {
        var w2 = num(nhv) * w / h;
        cells.push([fmt(w2, 2), "Width for height " + num(nhv)]);
      }
      panelShow("ar", { main: main, label: label, cells: cells });
    }
    root.addEventListener("input", calc); bindPanelCopy("ar"); calc();
  };

  /* ================= pure-JS SHA-256 ================= */
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), i, j;
    var result = "", words = [];
    var bitLen = ascii.length * 8;
    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var pc = k.length, isC = {};
    for (var cand = 2; pc < 64; cand++) {
      if (!isC[cand]) {
        for (i = 0; i < 313; i += cand) isC[i] = cand;
        hash[pc] = (Math.pow(cand, 0.5) * maxWord) | 0;
        k[pc++] = (Math.pow(cand, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += String.fromCharCode(128);
    while (ascii.length % 64 - 56) ascii += String.fromCharCode(0);
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return "";
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
          (w[i] = i < 16 ? w[i] : w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10)) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [t1 + t2 | 0].concat(hash);
        hash[4] = hash[4] + t1 | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = hash[i] + old[i] | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) {
      var b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
    return result;
  }

  

  const toolFn = E[slug];
  if (!toolFn) {
    return false;
  }

  try {
    toolFn(root);
    return true;
  } catch (err: any) {
    root.innerHTML = '<div class="error-note"><span class="icon-wrapper">' + CT.icon('alert-triangle') + '</span> Could not start this tool: ' + esc(err?.message || 'Unknown error') + '</div>';
    return true;
  }
}

/* ===========================================================
   云朵便利贴 · 交互
   一条最多 20 个字，一共可以贴 3 条。
   贴上去的字会变成手写感的黑字，落在云朵空白里。
   =========================================================== */
(function () {
  "use strict";

  var MAX_ITEMS = 6;
  var MAX_CHARS = 20;

  var note      = document.getElementById("note");
  var paper     = document.getElementById("paper");
  var form      = document.getElementById("composer");
  var input     = document.getElementById("input");
  var addBtn    = document.getElementById("addBtn");
  var countEl   = document.getElementById("count");
  var dotsEl    = document.getElementById("dots");
  var fieldCnt  = document.getElementById("fieldCount");
  var hintEl    = document.getElementById("hint");
  var bubble    = document.getElementById("bubble");
  var resetBtn  = document.getElementById("resetBtn");

  var entries = [];

  /* ---------- 进度点 ---------- */
  for (var i = 0; i < MAX_ITEMS; i++) {
    var dot = document.createElement("span");
    dot.className = "dot";
    dotsEl.appendChild(dot);
  }
  var dots = dotsEl.children;

  /* ---------- 工具 ---------- */
  function chars(str) {
    // 按「字」计数：中文、英文、emoji 都算一个
    return Array.from(str).length;
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  /* ---------- 根据字数自适应字号，保证一行放得下 ---------- */
  function sizeEntries() {
    var list = Array.prototype.slice.call(paper.children);
    if (!list.length) return;

    var noteW = note.clientWidth || 560;
    var noteH = note.clientHeight || noteW;
    var maxW  = noteW * 0.72;          // 云朵里可用的书写宽度
    var cap   = noteW * 0.072;         // 短句最大字号
    var floor = noteW * 0.024;         // 长句最小字号
    var boxH  = paper.clientHeight || noteH * 0.30;
    var gap   = noteH * 0.014;         // 行间距（与 .note__paper 的 gap 对齐）
    var lh    = 1.02;

    // 每一条先按字数定一个「想用多大」的字号
    var sizes = list.map(function (el) {
      var n = Math.max(1, chars(el.dataset.text || el.textContent || ""));
      return clamp((maxW / n) * 0.97, floor, cap);
    });

    // 条数多、行太高时，整体等比缩小，保证 6 条也放得下
    var sum = sizes.reduce(function (a, b) { return a + b; }, 0);
    var need = sum * lh + gap * (list.length - 1);
    if (need > boxH) {
      var scale = (boxH - gap * (list.length - 1)) / (sum * lh);
      sizes = sizes.map(function (s) { return Math.max(s * scale, floor * 0.85); });
    }

    list.forEach(function (el, i) {
      el.style.setProperty("--fs", sizes[i].toFixed(1) + "px");
    });
  }

  /* ---------- 刷新界面状态 ---------- */
  function render() {
    var n = entries.length;
    var full = n >= MAX_ITEMS;

    Array.prototype.forEach.call(dots, function (d, i) {
      d.classList.toggle("on", i < n);
    });

    countEl.textContent = full ? "已经贴满啦" : "还能贴 " + (MAX_ITEMS - n) + " 条";

    input.disabled = full;
    addBtn.disabled = full;
    input.placeholder = full ? "已经贴满啦～" : "写下今天想记住的事…";

    hintEl.textContent = full
      ? "这张便利贴写满了，可以重写一张"
      : "每条最多 " + MAX_CHARS + " 个字，一共可以贴 " + MAX_ITEMS + " 条";

    resetBtn.hidden = n === 0;

    updateFieldCount();
    sizeEntries();
  }

  function updateFieldCount() {
    fieldCnt.textContent = chars(input.value) + "/" + MAX_CHARS;
  }

  /* ---------- 贴一条 ---------- */
  function addEntry(text) {
    var el = document.createElement("div");
    el.className = "entry";
    el.dataset.text = text;
    el.textContent = text;
    // 一点点随机倾斜，像真的手贴上去的
    var rot = (Math.random() * 3 - 1.5).toFixed(2);
    el.style.setProperty("--rot", rot + "deg");

    paper.appendChild(el);
    entries.push(text);

    // 第一条贴上去之后，打招呼的气泡就功成身退
    if (entries.length === 1) {
      bubble.classList.add("is-gone");
      bubble.setAttribute("aria-hidden", "true");
    }

    render();
  }

  /* ---------- 提交 ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (entries.length >= MAX_ITEMS) return;

    var text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    if (chars(text) > MAX_CHARS) {
      text = Array.from(text).slice(0, MAX_CHARS).join("");
    }

    input.value = "";
    addEntry(text);
    if (entries.length < MAX_ITEMS) input.focus();
  });

  /* ---------- 输入时更新字数 ---------- */
  input.addEventListener("input", function () {
    // maxlength 对 emoji 不友好，这里再兜一层
    if (chars(input.value) > MAX_CHARS) {
      input.value = Array.from(input.value).slice(0, MAX_CHARS).join("");
    }
    updateFieldCount();
  });

  /* ---------- 重写 ---------- */
  resetBtn.addEventListener("click", function () {
    entries = [];
    paper.innerHTML = "";
    input.value = "";
    bubble.classList.remove("is-gone");
    bubble.removeAttribute("aria-hidden");
    render();
    input.focus();
  });

  /* ---------- 跟随尺寸变化重新排版 ---------- */
  var resizeTimer = null;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeEntries, 120);
  }
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  /* ---------- 首屏 ---------- */
  render();
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    bubble.style.animation = "none";
  }
})();

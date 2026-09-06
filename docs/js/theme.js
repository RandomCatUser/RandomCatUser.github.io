/* ============================================================
   UNIFIED THEME SYSTEM — shared by every page on the site.
   ------------------------------------------------------------
   - Uses a single localStorage key: 'theme'
   - Applies the theme in all the mechanisms the site uses:
       <html data-theme="dark">            (about, contact, guestbook, MingShi, friends, credits)
       <html class="dark">                 (catsearch, loveletters — Tailwind dark: variants)
       <body class="dark-theme">           (index)
   - Syncs live across open tabs via the 'storage' event.
   ============================================================ */

(function () {
  var THEME_KEY = "theme";

  function getSavedTheme() {
    try {
      var t = localStorage.getItem(THEME_KEY);
      if (t === "dark" || t === "light") return t;
    } catch (e) {}
    // Default: follow system preference
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (e) {}
    return "light";
  }

  function saveTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  // Applies the theme to <html> (data-theme + .dark) and <body> (dark-theme)
  function applyTheme(theme) {
    theme = theme === "dark" ? "dark" : "light";
    // Only write when the value actually changes. This avoids a cross-tab
    // 'storage' ping-pong (tab A writes -> tab B storage handler -> B writes -> ...)
    var stored = null;
    try { stored = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (stored !== theme) saveTheme(theme);
    var html = document.documentElement;
    var body = document.body;

    if (theme === "dark") {
      html.setAttribute("data-theme", "dark");
      html.classList.add("dark");
      if (body) body.classList.add("dark-theme");
    } else {
      html.setAttribute("data-theme", "light");
      html.classList.remove("dark");
      if (body) body.classList.remove("dark-theme");
    }

    // Notify the page (so custom toggle icons can refresh)
    document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
  }

  function isDark() {
    return getSavedTheme() === "dark";
  }

  // Binds a toggle control. Works with checkboxes, buttons, and <div role="button">.
  // Auto-syncs the control's UI (checked state / aria-pressed).
  function bindToggle(el) {
    if (!el) return;

    var updateUI = function () {
      var dark = isDark();
      if (el.type === "checkbox") {
        el.checked = dark;
      } else {
        el.setAttribute("aria-pressed", dark ? "true" : "false");
      }
    };

    if (el.type === "checkbox") {
      // For checkboxes the browser toggles `checked` before the change event
      // fires, so we just read the new state directly — no preventDefault needed.
      el.addEventListener("change", function () {
        applyTheme(el.checked ? "dark" : "light");
      });
    } else {
      var onToggle = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var dark = !isDark();
        applyTheme(dark ? "dark" : "light");
        el.setAttribute("aria-pressed", isDark() ? "true" : "false");
      };
      el.addEventListener("click", onToggle);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(e); }
      });
    }

    // Keep UI in sync with the stored theme
    document.addEventListener("themechange", updateUI);
    // Also re-sync straight from storage (covers cross-tab changes and any
    // event-ordering edge case where the 'themechange' was missed).
    window.addEventListener("storage", updateUI);
    updateUI();
  }

  window.ThemeManager = {
    getTheme: getSavedTheme,
    isDark: isDark,
    applyTheme: applyTheme,
    toggle: function () { applyTheme(isDark() ? "light" : "dark"); },
    bindToggle: bindToggle,
    init: function (selectors) {
      if (selectors) {
        var els = document.querySelectorAll(selectors);
        Array.prototype.forEach.call(els, bindToggle);
      }
    }
  };

  // Live sync across open tabs
  window.addEventListener("storage", function (e) {
    if (e.key === THEME_KEY) {
      applyTheme(getSavedTheme());
    }
  });

  // Ensure the theme is applied once the document is parsed (fills in body class)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyTheme(getSavedTheme());
    });
  } else {
    applyTheme(getSavedTheme());
  }
})();


// starts the 90s clock cursor (js/clock-cursor.js) in site colors,
// re-tints it whenever the light/dark theme changes.
(function () {
  function colors() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var w = '#ffffff';
    return {
      dateColor: w, faceColor: w, secondsColor: w, minutesColor: w, hoursColor: w,
      outlineColor: dark ? 'rgba(20,10,20,0.9)' : 'rgba(107,61,51,0.85)'
    };
  }
  var cur = null;
  function start() {
    try { if (cur) cur.destroy(); } catch (e) {}
    try { cur = window.clockCursor(colors()); } catch (e) { cur = null; }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  try {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].attributeName === 'data-theme') { start(); break; }
      }
    }).observe(document.documentElement, {attributes: true});
  } catch (e) {}
})();

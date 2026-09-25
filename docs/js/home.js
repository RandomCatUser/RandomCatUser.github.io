// index-only: visitor counter, settings panel, theme + voice switches
// (music playback itself lives in player.js so it can persist across pages)
try {
  var v = parseInt(localStorage.getItem('dihan-hits') || '1336', 10) + 1;
  localStorage.setItem('dihan-hits', String(v));
  var counterEl = document.getElementById('counter');
  if (counterEl) counterEl.textContent = String(v).padStart(7, '0');
} catch (e) {}

// settings panel open / close
var setBtn = document.getElementById('setBtn');
var setPanel = document.getElementById('setPanel');
function closeSettings() {
  setPanel.hidden = true;
  setBtn.setAttribute('aria-expanded', 'false');
}
setBtn.onclick = function (e) {
  e.stopPropagation();
  var willOpen = setPanel.hidden;
  setPanel.hidden = !willOpen;
  setBtn.setAttribute('aria-expanded', String(willOpen));
};
document.addEventListener('click', function (e) {
  if (!setPanel.hidden && !e.target.closest('.setwrap')) closeSettings();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeSettings();
});

// theme — shared 'theme' key with the rest of the site
var bLight = document.getElementById('themeLight');
var bDark = document.getElementById('themeDark');
function applyTheme(t) {
  t = (t === 'dark') ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('theme', t); } catch (e) {}
  bLight.classList.toggle('sel', t === 'light');
  bDark.classList.toggle('sel', t === 'dark');
}
bLight.onclick = function () { applyTheme('light'); };
bDark.onclick = function () { applyTheme('dark'); };
applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

// voice tracks switch — talks to the shared player
var bVoiceOn = document.getElementById('voiceOn');
var bVoiceOff = document.getElementById('voiceOff');
function syncVoice() {
  var on = window.MusicPlayer ? window.MusicPlayer.isVoiceOn() : false;
  bVoiceOn.classList.toggle('sel', on);
  bVoiceOff.classList.toggle('sel', !on);
}
bVoiceOn.onclick = function () { if (window.MusicPlayer) window.MusicPlayer.setVoice(true); syncVoice(); };
bVoiceOff.onclick = function () { if (window.MusicPlayer) window.MusicPlayer.setVoice(false); syncVoice(); };
syncVoice();

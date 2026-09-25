// shared persistent music player (used by index + about).
// saves track + position + state, resumes on the next page,
// and makes sure only one tab plays at a time.
(function () {
  var player = document.getElementById('player');
  if (!player) return;

  var tracks = [
    {title:'3:03 PM', artist:'sharou', src:'assets/music/Music1.mp3', art:'./assets/album-arts/music1.jpg'},
    {title:'Fly a letter to the Wind', artist:'JayM', src:'assets/music/Fly a letter to the Wind.mp3', art:'./assets/album-arts/Fly a letter to the Wind.webp'},
    {title:'When the Flowers', artist:'AcousticHappy', src:'assets/music/[음악팀] 꽃이 피면, When the flowers (AcousticHappy) [BGM무료음악브금].mp3', art:'./assets/album-arts/[음악팀] 꽃이 피면, When the flowers (AcousticHappy) [BGM무료음악브금].webp'},
    {title:'心动节奏', artist:'ayi', src:'assets/music/心动节奏.mp3', art:'./assets/album-arts/心动节奏.jpg', voice:true},
    {title:'Mosi Mosi?', artist:'楽音 (Sasane)', src:'assets/music/楽音 (Sasane) - Mosi Mosi.mp3', art:'./assets/album-arts/楽音 (Sasane) - Mosi Mosi.webp', voice:true}
  ];
  // both pages using this live in docs/, so these relative paths work as-is
  var voiceOn = false;
  try { voiceOn = localStorage.getItem('dihan-voice') === 'on'; } catch (e) {}

  var TAB = Math.random().toString(36).slice(2);
  var ti = 0, lastSave = 0;

  var elT = document.getElementById('mTitle'),
    elA = document.getElementById('mArtist'),
    elArt = document.getElementById('mArt'),
    elF = document.getElementById('mFill'),
    elC = document.getElementById('mCur'),
    elD = document.getElementById('mDur'),
    bPlay = document.getElementById('mPlay');

  function fmt(t){ if(!isFinite(t)) return '0:00'; var m = Math.floor(t/60), s = Math.floor(t%60); return m + ':' + String(s).padStart(2,'0'); }
  function allowed(){ return tracks.filter(function(t){ return voiceOn || !t.voice; }); }
  function save(){
    try {
      localStorage.setItem('dihan-music', JSON.stringify({
        ti: ti, time: player.currentTime || 0,
        playing: !player.paused && !player.ended,
        tab: TAB, ts: Date.now()
      }));
    } catch (e) {}
  }
  function load(i, auto){
    ti = (i + tracks.length) % tracks.length;
    player.src = tracks[ti].src;
    elT.textContent = tracks[ti].title;
    elA.textContent = tracks[ti].artist;
    elArt.src = tracks[ti].art;
    if (auto) { player.play().catch(function(){}); }
    save();
  }
  function step(d, auto){
    var list = allowed();
    if (!list.length) return;
    var cur = list.indexOf(tracks[ti]);
    var nxt = list[(cur + d + list.length) % list.length];
    load(tracks.indexOf(nxt), auto);
  }
  function syncBtn(){ bPlay.textContent = (!player.src || player.paused) ? '▶' : '❚❚'; }

  bPlay.onclick = function(){
    if (!player.src) { load(ti, true); return; }
    if (player.paused) { player.play().catch(function(){}); } else { player.pause(); }
  };
  document.getElementById('mNext').onclick = function(){ step(1, true); };
  document.getElementById('mPrev').onclick = function(){ step(-1, true); };
  player.addEventListener('play', function(){ syncBtn(); save(); });
  player.addEventListener('pause', function(){ syncBtn(); save(); });
  player.addEventListener('loadedmetadata', function(){ elD.textContent = fmt(player.duration); });
  player.addEventListener('timeupdate', function(){
    if (player.duration) {
      elF.style.width = (player.currentTime / player.duration * 100) + '%';
      elC.textContent = fmt(player.currentTime);
      elD.textContent = fmt(player.duration);
      var now = Date.now();
      if (!player.paused && now - lastSave > 4000) { lastSave = now; save(); }
    }
  });
  player.addEventListener('ended', function(){ step(1, true); });
  player.addEventListener('error', function(){ step(1, false); });
  document.getElementById('mBar').onclick = function(e){
    if (!player.duration) return;
    var r = e.currentTarget.getBoundingClientRect();
    player.currentTime = player.duration * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  window.addEventListener('beforeunload', save);

  // another tab started playing -> yield so music never doubles
  window.addEventListener('storage', function(e){
    if (e.key !== 'dihan-music' || !e.newValue) return;
    try {
      var s = JSON.parse(e.newValue);
      if (s && s.tab !== TAB && s.playing && !player.paused) player.pause();
    } catch (err) {}
  });

  function setVoice(on){
    voiceOn = !!on;
    try { localStorage.setItem('dihan-voice', voiceOn ? 'on' : 'off'); } catch (e) {}
    if (!voiceOn && tracks[ti] && tracks[ti].voice) step(1, !player.paused);
    else save();
  }

  // restore last session: same track + position, keep playing if it was
  var resume = false, resumeAt = 0;
  try {
    var s = JSON.parse(localStorage.getItem('dihan-music') || 'null');
    if (s && typeof s.ti === 'number' && tracks[s.ti]) {
      ti = s.ti;
      if (!voiceOn && tracks[ti].voice) {
        var list = allowed();
        ti = tracks.indexOf(list[0]);
        resume = false;
      } else {
        resume = !!s.playing;
        resumeAt = s.time || 0;
      }
    }
  } catch (e) {}
  load(ti, false);
  if (resume) {
    player.addEventListener('loadedmetadata', function go(){
      try { player.currentTime = Math.max(0, Math.min(resumeAt, (player.duration || 1) - 0.25)); } catch (e) {}
      // browsers may block this until the tab was clicked once;
      // if so it just sits paused at the right spot
      player.play().catch(function(){});
    }, {once:true});
  }

  window.MusicPlayer = {
    setVoice: setVoice,
    isVoiceOn: function(){ return voiceOn; }
  };
})();

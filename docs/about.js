// ---------- Theme Toggle ----------
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const knobIcon = document.getElementById('knobIcon');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    knobIcon.className = theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    themeToggle.setAttribute('aria-pressed', theme === 'dark');
    try { localStorage.setItem('rc-theme', theme); } catch (e) {}
  }
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('rc-theme') || 'light'; } catch (e) {}
  applyTheme(savedTheme);
  function toggleTheme() {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }
  themeToggle.addEventListener('click', toggleTheme);
  themeToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleTheme(); }
  });

  /* LANYARD WIDGET — Spotify + Discord Activities */
  const LanyardWidget = (() => {
    const DISCORD_ID = '1068541705596448788';
    const WS_URL = 'wss://api.lanyard.rest/socket';
    const HTTP_URL = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
    const POLL_INTERVAL_MS = 10000;
    const RECONNECT_BASE_MS = 2000;
    const RECONNECT_MAX_MS = 30000;

    const els = {
      widget: document.getElementById('statusWrapper'),
      bg: document.getElementById('npBg'),
      label: document.getElementById('npLabel'),
      status: document.getElementById('npStatus'),
      statusText: document.getElementById('npStatusText'),
      body: document.getElementById('npBody'),
      art: document.getElementById('npArt'),
      title: document.getElementById('npTitle'),
      artist: document.getElementById('npArtist'),
      progress: document.getElementById('npProgress'),
      barFill: document.getElementById('npBarFill'),
      barWrap: () => els.progress.querySelector('[role="progressbar"]'),
      current: document.getElementById('npCurrent'),
      total: document.getElementById('npTotal'),
      activityWrap: document.getElementById('activityWidget'),
    };

    let ws = null;
    let heartbeatTimer = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    let pollTimer = null;
    let progressRaf = null;
    let activityTickTimer = null;
    let usingWebSocket = false;
    let lastTrackId = null;
    let currentSpotify = null;
    let currentActivities = []; 

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const formatTime = (ms) => {
      if (!ms || ms < 0) ms = 0;
      const total = Math.floor(ms / 1000);
      const m = Math.floor(total / 60);
      const s = total % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const escapeHtml = (str) => {
      if (str == null) return '';
      return String(str).replace(/[&<>"']/g, c => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[c]));
    };

    // ---------- DISCORD STATUS ----------
    function updateDiscordStatus(discordStatus) {
      const statusMap = {
        online: { label: 'Online', cls: 'is-online' },
        idle:   { label: 'Idle',    cls: 'is-idle' },
        dnd:    { label: 'Do Not Disturb', cls: 'is-dnd' },
        offline:{ label: 'Offline', cls: 'is-offline' },
      };
      const s = statusMap[discordStatus] || statusMap.offline;
      els.status.classList.remove('is-online', 'is-idle', 'is-dnd', 'is-offline');
      els.status.classList.add(s.cls);
      els.statusText.textContent = s.label;
      els.status.setAttribute('aria-label', `Discord status: ${s.label}`);
    }

    // ---------- SPOTIFY ----------
    function applySpotifyData(spotify) {
      if (!spotify || !spotify.track_id) {
        showEmptyState();
        return;
      }
      if (spotify.track_id === lastTrackId) {
        currentSpotify = {
          trackId: spotify.track_id,
          start: spotify.timestamps?.start || Date.now(),
          end: spotify.timestamps?.end || Date.now(),
          trackUrl: `https://open.spotify.com/track/${spotify.track_id}`,
        };
        return;
      }
      crossfadeTrack(() => renderTrack(spotify));
      lastTrackId = spotify.track_id;
    }

    function renderTrack(spotify) {
      currentSpotify = {
        trackId: spotify.track_id,
        start: spotify.timestamps?.start || Date.now(),
        end: spotify.timestamps?.end || Date.now(),
        trackUrl: `https://open.spotify.com/track/${spotify.track_id}`,
      };

      els.body.style.display = 'flex';
      els.progress.style.display = 'flex';
      els.widget.classList.add('is-playing');

      els.art.classList.remove('loaded');
      els.art.onload = null;
      els.art.onerror = null;
      els.art.onload = () => els.art.classList.add('loaded');
      els.art.onerror = () => els.art.classList.remove('loaded');
      els.art.src = spotify.album_art_url;
      els.art.alt = `${spotify.album} cover`;

      els.title.textContent = spotify.song || 'Unknown track';
      els.artist.textContent = spotify.artist || 'Unknown artist';
      els.bg.style.backgroundImage = `url("${spotify.album_art_url}")`;

      extractDominantColor(spotify.album_art_url).then((rgb) => {
        if (rgb) els.widget.style.setProperty('--tint', rgb);
      });

      els.label.textContent = 'Listening to Spotify';
      startProgress();
    }

    function showEmptyState() {
      stopProgress();
      currentSpotify = null;
      lastTrackId = null;
      els.body.style.display = 'none';
      els.progress.style.display = 'none';
      els.widget.classList.remove('is-playing');
      els.bg.style.backgroundImage = '';
      els.label.textContent = 'Not listening to Spotify';
    }

    function crossfadeTrack(callback) {
      const fadeable = [els.body, els.progress];
      if (reducedMotion) { callback(); return; }
      fadeable.forEach(el => el.classList.add('np-fade-out'));
      setTimeout(() => {
        callback();
        fadeable.forEach(el => el.classList.remove('np-fade-out'));
      }, 220);
    }

    function startProgress() {
      stopProgress();
      if (!currentSpotify) return;
      const tick = () => {
        if (!currentSpotify) return;
        const now = Date.now();
        const { start, end } = currentSpotify;
        const duration = end - start;
        let elapsed = now - start;
        if (elapsed >= duration && duration > 0) elapsed = duration;
        const pct = duration > 0 ? (elapsed / duration) * 100 : 0;
        els.barFill.style.width = `${pct}%`;
        els.current.textContent = formatTime(elapsed);
        els.total.textContent = formatTime(duration);
        const bar = els.barWrap();
        if (bar) {
          bar.setAttribute('aria-valuenow', Math.round(pct));
          bar.setAttribute('aria-label', `${formatTime(elapsed)} of ${formatTime(duration)}`);
        }
        progressRaf = requestAnimationFrame(tick);
      };
      if (reducedMotion) { tick(); progressRaf = setInterval(tick, 1000); }
      else { tick(); }
    }

    function stopProgress() {
      if (progressRaf) {
        if (reducedMotion) clearInterval(progressRaf);
        else cancelAnimationFrame(progressRaf);
        progressRaf = null;
      }
    }

    // ---------- DOMINANT COLOR ----------
    let colorCache = new Map();
    function extractDominantColor(url) {
      return new Promise((resolve) => {
        if (!url) return resolve(null);
        if (colorCache.has(url)) return resolve(colorCache.get(url));
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          try {
            const size = 16;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            const data = ctx.getImageData(0, 0, size, size).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
              const a = data[i + 3];
              if (a < 125) continue;
              r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
            }
            if (count === 0) return resolve(null);
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            const rgb = `${r}, ${g}, ${b}`;
            colorCache.set(url, rgb);
            resolve(rgb);
          } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    function openOnSpotify() {
      if (currentSpotify && currentSpotify.trackUrl) {
        window.open(currentSpotify.trackUrl, '_blank', 'noopener,noreferrer');
      }
    }
    els.widget.addEventListener('click', (e) => {
      // Only trigger if clicking the status area, not the activity buttons
      if (!e.target.closest('.activity-btn')) {
        openOnSpotify();
      }
    });
    els.widget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { 
        e.preventDefault(); 
        openOnSpotify(); 
      }
    });

    // =================================================================
    //  ACTIVITIES (GAMES / STREAMING / WATCHING...)
    // =================================================================

    const ACTIVITY_TYPES = {
      0: { label: 'Playing',    icon: 'fa-gamepad' },
      1: { label: 'Streaming',  icon: 'fa-tower-broadcast' },
      2: { label: 'Listening',  icon: 'fa-music' },
      3: { label: 'Watching',   icon: 'fa-eye' },
      4: { label: 'Custom',     icon: 'fa-message' },
      5: { label: 'Competing',  icon: 'fa-trophy' },
    };

    function resolveAssetUrl(applicationId, asset) {
      if (!asset) return null;
      if (asset.startsWith('mp:external/')) {
        return 'https://media.discordapp.net/external/' + asset.slice('mp:external/'.length);
      }
      if (asset.startsWith('mp:')) {
        return 'https://media.discordapp.net/' + asset.slice(3);
      }
      if (asset.startsWith('https://') || asset.startsWith('http://')) return asset;
      if (asset.startsWith('spotify:')) {
        return 'https://i.scdn.co/image/' + asset.slice('spotify:'.length);
      }
      if (applicationId) {
        return `https://cdn.discordapp.com/app-assets/${applicationId}/${asset}.png`;
      }
      return null;
    }

    function formatElapsed(startMs, suffix = 'elapsed') {
      const elapsed = Date.now() - startMs;
      if (elapsed < 0) return `0:00 ${suffix}`;
      const total = Math.floor(elapsed / 1000);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = total % 60;
      if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')} ${suffix}`;
      return `${m}:${s.toString().padStart(2,'0')} ${suffix}`;
    }

    function renderActivityCard(activity) {
      const typeInfo = ACTIVITY_TYPES[activity.type] || { label: 'Activity', icon: 'fa-circle' };
      const largeImg = activity.assets?.large_image
        ? resolveAssetUrl(activity.application_id, activity.assets.large_image)
        : null;
      const smallImg = activity.assets?.small_image
        ? resolveAssetUrl(activity.application_id, activity.assets.small_image)
        : null;

      let imgBlock = '';
      if (largeImg) {
        imgBlock = `
          <div class="activity-img-wrap">
            <img class="activity-img" src="${largeImg}" alt="${escapeHtml(activity.assets?.large_text || activity.name || '')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
            <div class="activity-img-placeholder" style="display:none;"><i class="fa-solid ${typeInfo.icon}"></i></div>
            ${smallImg ? `<img class="activity-img-small" src="${smallImg}" alt="${escapeHtml(activity.assets?.small_text || '')}" loading="lazy" />` : ''}
          </div>
        `;
      }

      const name = escapeHtml(activity.name || 'Unknown Activity');
      const details = activity.details ? `<div class="activity-detail">${escapeHtml(activity.details)}</div>` : '';
      const state = activity.state ? `<div class="activity-state">${escapeHtml(activity.state)}</div>` : '';

      let timeBlock = '';
      const start = activity.timestamps?.start;
      const end = activity.timestamps?.end;
      if (start && !end) {
        timeBlock = `<div class="activity-time" data-start="${start}">
          <span style="width:6px; height:6px; border-radius:50%; background: var(--status-online); display:inline-block; margin-right: 4px;"></span>
          <span>${formatElapsed(start)}</span>
        </div>`;
      } else if (start && end) {
        const now = Date.now();
        const total = end - start;
        const elapsed = Math.min(Math.max(now - start, 0), total);
        timeBlock = `<div class="activity-time" data-start="${start}" data-end="${end}">
          <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>
          <span>${formatTime(elapsed)} / ${formatTime(total)}</span>
        </div>`;
      }

      let buttonsBlock = '';
      if (Array.isArray(activity.buttons) && activity.buttons.length > 0) {
        buttonsBlock = `<div class="activity-buttons">${activity.buttons.map(b => {
          let icon = 'fa-link';
          let url = activity.url || '#';
          if (b.toLowerCase().includes('youtube')) {
            icon = 'fa-youtube';
            url = activity.url || 'https://www.youtube.com';
          }
          return `<a class="activity-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><i class="fa-brands ${icon}"></i> ${escapeHtml(b)}</a>`;
        }).join('')}</div>`;
      }

      return `
        <div class="activity-item" data-activity-id="${escapeHtml(activity.id || '')}">
          ${imgBlock}
          <div class="activity-content" style="${largeImg ? '' : 'width: 100%;'}">
            <div class="activity-type-badge"><i class="fa-solid ${typeInfo.icon}"></i> ${typeInfo.label}</div>
            <div class="activity-name">${name}</div>
            ${details}
            ${state}
            ${timeBlock}
            ${buttonsBlock}
          </div>
        </div>
      `;
    }

    function renderActivities(activities) {
      // Filter out Spotify (handled by its own widget) AND Custom Status (Type 4) completely
      const filtered = (activities || []).filter(a => {
        if (a.type === 2 && (a.name === 'Spotify' || a.name === 'spotify')) return false;
        if (a.type === 4) return false; 
        return true;
      });

      if (filtered.length === 0) {
        currentActivities = [];
        els.activityWrap.innerHTML = `
          <div class="activity-empty">
            <i class="fa-solid fa-gamepad"></i>
            <span>Not playing anything right now</span>
          </div>
        `;
        return;
      }

      let html = '';
      filtered.forEach(a => { html += renderActivityCard(a); });

      els.activityWrap.innerHTML = html;

      currentActivities = filtered
        .filter(a => a.timestamps?.start)
        .map(a => ({ id: a.id, start: a.timestamps.start, end: a.timestamps?.end || null }));
    }

    function startActivityTicker() {
      if (activityTickTimer) return;
      activityTickTimer = setInterval(() => {
        if (!currentActivities.length) return;
        currentActivities.forEach(act => {
          const cards = els.activityWrap.querySelectorAll(`.activity-item[data-activity-id="${act.id}"] .activity-time span:last-child`);
          cards.forEach(node => {
            if (act.end) {
              const now = Date.now();
              const total = act.end - act.start;
              const elapsed = Math.min(Math.max(now - act.start, 0), total);
              node.textContent = `${formatTime(elapsed)} / ${formatTime(total)}`;
            } else {
              node.textContent = formatElapsed(act.start);
            }
          });
        });
      }, 1000);
    }

    function stopActivityTicker() {
      if (activityTickTimer) { clearInterval(activityTickTimer); activityTickTimer = null; }
    }

    // ---------- DATA HANDLER ----------
    function handlePresence(data) {
      if (!data) return;
      updateDiscordStatus(data.discord_status);
      if (data.listening_to_spotify && data.spotify) {
        applySpotifyData(data.spotify);
      } else {
        showEmptyState();
      }
      renderActivities(data.activities);
      startActivityTicker();
    }

    // ---------- WEBSOCKET ----------
    function connectWS() {
      try { ws = new WebSocket(WS_URL); }
      catch (e) {
        console.warn('[Lanyard] WebSocket init failed, falling back to polling.');
        startPolling(); return;
      }

      ws.onopen = () => {
        usingWebSocket = true;
        reconnectAttempts = 0;
        if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.op === 1) {
            if (heartbeatTimer) clearInterval(heartbeatTimer);
            const interval = msg.d?.heartbeat_interval || 30000;
            heartbeatTimer = setInterval(() => {
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
            }, interval);
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
          } else if (msg.op === 0) {
            handlePresence(msg.d);
          }
        } catch (e) {
          console.warn('[Lanyard] Bad WS message:', e);
        }
      };

      ws.onerror = () => {};
      ws.onclose = () => {
        usingWebSocket = false;
        if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
        startPolling();
        scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      if (reconnectTimer) return;
      reconnectAttempts++;
      const delay = Math.min(
        RECONNECT_BASE_MS * Math.pow(1.5, reconnectAttempts),
        RECONNECT_MAX_MS
      );
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectWS();
      }, delay);
    }

    // ---------- HTTP POLLING FALLBACK ----------
    async function fetchOnce() {
      try {
        const res = await fetch(HTTP_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json && json.success && json.data) handlePresence(json.data);
      } catch (e) {
        console.warn('[Lanyard] polling fetch failed:', e.message);
      }
    }
    function startPolling() {
      if (pollTimer) return;
      fetchOnce();
      pollTimer = setInterval(fetchOnce, POLL_INTERVAL_MS);
    }
    function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

    // ---------- LIFECYCLE ----------
    function init() {
      connectWS();
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (progressRaf && !reducedMotion) {
            cancelAnimationFrame(progressRaf); progressRaf = null;
          }
        } else if (currentSpotify && !progressRaf) {
          startProgress();
        }
      });
      window.addEventListener('beforeunload', () => {
        if (ws) ws.close();
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (pollTimer) clearInterval(pollTimer);
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (activityTickTimer) clearInterval(activityTickTimer);
        stopProgress();
      });
    }

    return { init };
  })();

  document.addEventListener('DOMContentLoaded', LanyardWidget.init);
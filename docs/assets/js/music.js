(function () {
    'use strict';

    var dock = document.getElementById('music-dock');
    if (!dock) return;

    var TRACKS = [
        {
            src: 'assets/music/Towards The Sunshine.mp3',
            title: 'Towards the Sunshine',
            artist: 'Dihan Ramanayaka',
            artwork: 'assets/album-arts/Towards The Sunshine.jpg'
        },
        {
            src: 'assets/music/I Have a Little Secret.mp3',
            title: 'I Have a Little Secret',
            artist: 'Dihan Ramanayaka',
            artwork: 'assets/album-arts/I Have a Little Secret.jpg'
        }
        
    ];

    var audio = new Audio();
    audio.preload = 'metadata';

    var compact = document.getElementById('music-dock-compact');
    var expandedPanel = document.getElementById('music-dock-panel');
    var compactArt = document.getElementById('music-dock-art-compact');
    var expandedArt = document.getElementById('music-dock-art-expanded');
    var titleEl = document.getElementById('music-dock-title');
    var artistEl = document.getElementById('music-dock-artist');
    var waveCanvas = document.getElementById('music-dock-wave');
    var waveCtx = waveCanvas.getContext('2d');

    var timeline = document.getElementById('music-dock-timeline');
    var timelineFill = document.getElementById('music-dock-fill');
    var timelineHandle = document.getElementById('music-dock-handle');
    var currentLabel = document.getElementById('music-dock-time-current');
    var remainingLabel = document.getElementById('music-dock-time-remaining');

    var playBtn = document.getElementById('music-dock-play');
    var prevBtn = document.getElementById('music-dock-prev');
    var nextBtn = document.getElementById('music-dock-next');
    var repeatBtn = document.getElementById('music-dock-repeat');
    var pinBtn = document.getElementById('music-dock-pin');

    var currentIndex = 0;
    var expanded = false;
    var pinned = false;
    var repeatEnabled = true;
    var waveFrame = null;
    var waveColor = '#0859d4';
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '0:00';
        var total = Math.floor(seconds);
        var minutes = Math.floor(total / 60);
        var secs = total % 60;
        return minutes + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function readWaveColor() {
        var color = window.getComputedStyle(waveCanvas).color;
        if (color) waveColor = color;
    }

    function drawBars(active) {
        if (!waveCtx) return;
        var width = waveCanvas.width;
        var height = waveCanvas.height;
        var bars = 14;
        var barWidth = 4;
        var barGap = 3;
        var offset = (width - (bars * (barWidth + barGap))) / 2;
        var now = Date.now();
        var progress = now * 0.006;
        var i;
        var blockHeight;
        var x;
        var y;

        waveCtx.clearRect(0, 0, width, height);
        waveCtx.fillStyle = waveColor;

        for (i = 0; i < bars; i++) {
            if (active && !reduceMotion.matches) {
                blockHeight = Math.abs(
                    Math.sin(progress + i * 0.4) *
                    Math.cos(progress * 0.3 + i * 0.15)
                ) * (height - 8) + 5;
            } else {
                blockHeight = 5 + Math.sin(now * 0.0015 + i * 0.8) * 1.5;
            }

            x = offset + i * (barWidth + barGap);
            y = (height - blockHeight) / 2;

            if (typeof waveCtx.roundRect === 'function') {
                waveCtx.beginPath();
                waveCtx.roundRect(x, y, barWidth, blockHeight, 1.5);
                waveCtx.fill();
            } else {
                waveCtx.fillRect(x, y, barWidth, blockHeight);
            }
        }
    }

    function animateWave() {
        drawBars(true);
        if (!audio.paused && !reduceMotion.matches) {
            waveFrame = window.requestAnimationFrame(animateWave);
        }
    }

    function startWave() {
        window.cancelAnimationFrame(waveFrame);
        readWaveColor();
        animateWave();
    }

    function stopWave() {
        window.cancelAnimationFrame(waveFrame);
        waveFrame = null;
        readWaveColor();
        drawBars(false);
    }

    function syncPlaybackUI() {
        var isPlaying = !audio.paused;
        dock.classList.toggle('is-playing', isPlaying);
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        playBtn.setAttribute('title', isPlaying ? 'Pause' : 'Play');

        if (isPlaying) {
            startWave();
        } else {
            stopWave();
        }
    }

    function updateTimeline() {
        var duration = audio.duration;
        var current = audio.currentTime;
        var ratio = isFinite(duration) && duration > 0 ? current / duration : 0;
        var percent = Math.min(1, Math.max(0, ratio)) * 100;
        var currentText = formatTime(current);
        var durationText = formatTime(duration);

        timelineFill.style.width = percent.toFixed(2) + '%';
        timelineHandle.style.left = percent.toFixed(2) + '%';
        currentLabel.textContent = currentText;
        remainingLabel.textContent = '-' + formatTime(
            isFinite(duration) ? Math.max(0, duration - current) : 0
        );
        timeline.setAttribute('aria-valuenow', String(Math.round(percent)));
        timeline.setAttribute('aria-valuetext', currentText + ' of ' + durationText);
    }

    function loadTrack(index, autoplay) {
        currentIndex = (index + TRACKS.length) % TRACKS.length;
        var track = TRACKS[currentIndex];

        audio.src = track.src;
        audio.load();

        compactArt.style.backgroundImage = "url('" + track.artwork + "')";
        expandedArt.style.backgroundImage = "url('" + track.artwork + "')";
        compact.setAttribute('aria-label', 'Open music player: ' + track.title);
        titleEl.textContent = track.title;
        artistEl.textContent = track.artist;

        timelineFill.style.width = '0%';
        timelineHandle.style.left = '0%';
        currentLabel.textContent = '0:00';
        remainingLabel.textContent = '-0:00';
        timeline.setAttribute('aria-valuenow', '0');
        timeline.setAttribute('aria-valuetext', '0:00 of 0:00');

        if (autoplay) {
            var attempt = audio.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {});
            }
        } else {
            syncPlaybackUI();
            stopWave();
        }
    }

    function setExpanded(value) {
        expanded = !!value;
        dock.classList.toggle('is-expanded', expanded);
        compact.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    function setPinned(value) {
        pinned = !!value;
        pinBtn.classList.toggle('is-active', pinned);
        pinBtn.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        pinBtn.setAttribute('aria-label', pinned ? 'Release player' : 'Keep player open');
        pinBtn.setAttribute('title', pinned ? 'Release player' : 'Keep player open');
    }

    function syncRepeat() {
        repeatBtn.classList.toggle('is-active', repeatEnabled);
        repeatBtn.setAttribute('aria-pressed', repeatEnabled ? 'true' : 'false');
    }

    function seekTo(clientX) {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;
        var rect = timeline.getBoundingClientRect();
        var ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        audio.currentTime = audio.duration * ratio;
        updateTimeline();
    }

    audio.addEventListener('play', syncPlaybackUI);
    audio.addEventListener('pause', syncPlaybackUI);
    audio.addEventListener('timeupdate', updateTimeline);
    audio.addEventListener('loadedmetadata', updateTimeline);
    audio.addEventListener('ended', function () {
        if (repeatEnabled) {
            audio.currentTime = 0;
            var attempt = audio.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {});
            }
        } else {
            loadTrack(currentIndex + 1, true);
        }
    });

    compact.addEventListener('click', function () {
        setExpanded(true);
    });

    compact.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setExpanded(true);
            window.setTimeout(function () {
                playBtn.focus();
            }, 0);
        }
    });

    dock.addEventListener('mouseenter', function () {
        setExpanded(true);
    });

    dock.addEventListener('mouseleave', function () {
        if (!pinned && !dock.contains(document.activeElement)) {
            setExpanded(false);
        }
    });

    dock.addEventListener('focusout', function (event) {
        if (!dock.contains(event.relatedTarget) && !pinned) {
            setExpanded(false);
        }
    });

    dock.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && expanded) {
            setPinned(false);
            setExpanded(false);
            compact.focus();
        }
    });

    expandedPanel.addEventListener('click', function (event) {
        if (event.target.closest('button') || event.target.closest('.music-dock__timeline')) {
            return;
        }
        setPinned(false);
        setExpanded(false);
    });

    document.addEventListener('pointerdown', function (event) {
        if (!dock.contains(event.target) && !pinned) {
            setExpanded(false);
        }
    });

    playBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        if (audio.paused) {
            var attempt = audio.play();
            if (attempt && typeof attempt.catch === 'function') {
                attempt.catch(function () {});
            }
        } else {
            audio.pause();
        }
    });

    prevBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        loadTrack(currentIndex - 1, true);
    });

    nextBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        loadTrack(currentIndex + 1, true);
    });

    repeatBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        repeatEnabled = !repeatEnabled;
        syncRepeat();
    });

    pinBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        if (pinned) {
            setPinned(false);
            setExpanded(false);
        } else {
            setPinned(true);
            setExpanded(true);
        }
    });

    timeline.addEventListener('click', function (event) {
        event.stopPropagation();
        seekTo(event.clientX);
    });

    timeline.addEventListener('keydown', function (event) {
        if (!isFinite(audio.duration) || audio.duration <= 0) return;

        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            var delta = event.key === 'ArrowRight' ? 5 : -5;
            audio.currentTime = Math.min(
                audio.duration,
                Math.max(0, audio.currentTime + delta)
            );
            updateTimeline();
        }

        if (event.key === 'Home') {
            event.preventDefault();
            audio.currentTime = 0;
            updateTimeline();
        }

        if (event.key === 'End') {
            event.preventDefault();
            audio.currentTime = audio.duration;
            updateTimeline();
        }
    });

    if ('MutationObserver' in window) {
        new MutationObserver(function () {
            readWaveColor();
            if (audio.paused) drawBars(false);
        }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    syncRepeat();
    setPinned(false);
    loadTrack(0, false);
})();

(function () {
    'use strict';

    var LIT_CLASS        = 'grilla-celdas__lit';
    var LIT_ACTIVE_CLASS = 'is-lit';

    var FADE_DURATION = 600;  
    var REBUILD_DELAY = 200;  
    var HIGHLIGHTS    = 12;   

    function init(config) {
        if (!config || !config.contenedor) return;

        var contenedor      = config.contenedor;
        var totalHighlights = config.highlights || HIGHLIGHTS;
        var soportaHover    = window.matchMedia('(hover: hover)').matches;

        var celdaAncho = 0;
        var celdaAlto  = 0;

        
        function medir() {
            var estilos  = window.getComputedStyle(contenedor);
            var objetivo = parseFloat(estilos.getPropertyValue('--grilla-celda-size')) || 60;

            var ancho = contenedor.offsetWidth;
            var alto  = contenedor.offsetHeight;
            if (!ancho || !alto) return;

            var cols = Math.max(1, Math.round(ancho / objetivo));
            var rows = Math.max(1, Math.round(alto / objetivo));

            celdaAncho = ancho / cols;
            celdaAlto  = alto / rows;

            contenedor.style.setProperty('--grilla-celda-ancho', celdaAncho + 'px');
            contenedor.style.setProperty('--grilla-celda-alto', celdaAlto + 'px');
        }

        medir();

        
        var medirTimer = null;
        function programarMedicion() {
            if (medirTimer) window.clearTimeout(medirTimer);
            medirTimer = window.setTimeout(medir, REBUILD_DELAY);
        }

        window.addEventListener('resize', programarMedicion, { passive: true });
        window.addEventListener('orientationchange', programarMedicion, { passive: true });

        
        if (!soportaHover) return;

        var pool     = [];
        var siguiente = 0;
        var indice;

        for (indice = 0; indice < totalHighlights; indice++) {
            var elemento = document.createElement('div');
            elemento.className = LIT_CLASS;
            contenedor.appendChild(elemento);
            pool.push({ el: elemento, timeout: null });
        }

        function encender(col, row) {
            var item = pool[siguiente];
            siguiente = (siguiente + 1) % pool.length;

            if (item.timeout) {
                window.clearTimeout(item.timeout);
                item.timeout = null;
            }

            
            item.el.style.transition = 'none';
            item.el.classList.remove(LIT_ACTIVE_CLASS);
            item.el.style.transform = 'translate(' + (col * celdaAncho) + 'px, ' + (row * celdaAlto) + 'px)';

            window.requestAnimationFrame(function () {
                item.el.style.transition = '';
                item.el.classList.add(LIT_ACTIVE_CLASS);
            });

            item.timeout = window.setTimeout(function () {
                item.el.classList.remove(LIT_ACTIVE_CLASS);
                item.timeout = null;
            }, FADE_DURATION);
        }

        
        var rafId       = null;
        var ultimaCelda = null;
        var punteroX    = 0;
        var punteroY    = 0;

        contenedor.addEventListener('mousemove', function (evento) {
            punteroX = evento.clientX;
            punteroY = evento.clientY;

            if (rafId) return;

            rafId = window.requestAnimationFrame(function () {
                rafId = null;
                if (!celdaAncho || !celdaAlto) return;

                var rect = contenedor.getBoundingClientRect();
                var col  = Math.floor((punteroX - rect.left) / celdaAncho);
                var row  = Math.floor((punteroY - rect.top) / celdaAlto);
                var celda = col + ':' + row;

                if (celda === ultimaCelda) return;

                ultimaCelda = celda;
                encender(col, row);
            });
        }, { passive: true });

        contenedor.addEventListener('mouseleave', function () {
            ultimaCelda = null;
        });
    }

    window.onlinesGrillaCeldas = { init: init };
})();

(function () {
    'use strict';

    var HERO_SELECTOR      = '.home-hero';
    var CURSOR_SELECTOR    = '.js-home-hero-cursor';
    var APP_SELECTOR       = '.js-home-hero-app';
    var FADEIN_SELECTOR    = '.js-home-hero-fadein';
    var TYPING_SELECTOR    = '.js-home-hero-typing';
    var GRID_SELECTOR      = '.js-home-hero-grilla';
    var SELECCION_SELECTOR = '.js-home-hero-seleccion';
    var FLOAT_SELECTOR     = '.js-home-hero-float';

    
    var SCROLL_LOCK_DURATION = 1500;
    var SCROLL_LOCK_FAILSAFE = 8000;
    var SCROLL_LOCK_CLASS    = 'is-hero-scroll-lock';
    var SCROLL_KEYS = [
        'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'
    ];

    
    var typingCtrl = null;

    var CODE_LINES = [
        '<!DOCTYPE html>',
        '<html lang="en">',
        '<head>',
        '    <meta charset="UTF-8">',
        '    <title>Hello World!</title>',
        '</head>',
        '<body>',
        '    <h1>Hello World!</h1>',
        '</body>',
        '</html>'
    ];

    var CODE_TEXT = CODE_LINES.join('\n');

    var CURSOR_PATHS = {
        desarrollador: [
            [0, 0], [180, -280], [-150, -400], [250, -150], [-200, 20], [80, 40], [0, 0]
        ],
        cliente: [
            [0, 0], [-220, -180], [-350, 50], [-120, 200], [100, 280], [200, 60], [0, 0]
        ],
        director: [
            [0, 0], [200, 150], [350, -80], [150, -250], [-100, -300], [-250, -100], [0, 0]
        ],
        ui: [
            [0, 0], [300, -120], [400, 100], [200, 280], [-50, 200], [-150, 50], [0, 0]
        ],
        ux: [
            [0, 0], [-180, -220], [80, -350], [280, -180], [320, 60], [120, 180], [0, 0]
        ],
        pm: [
            [0, 0], [-250, 150], [-350, -60], [-180, -250], [60, -300], [200, -80], [0, 0]
        ],
        desarrollador2: [
            [0, 0], [150, -320], [-120, -280], [-300, -60], [-180, 150], [60, 200], [0, 0]
        ]
    };

    
    function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function getCursorName(cursor) {
        var classes = cursor.className;
        var names = ['desarrollador2', 'desarrollador', 'cliente', 'director', 'ui', 'ux', 'pm'];
        for (var i = 0; i < names.length; i++) {
            if (classes.indexOf('--' + names[i]) !== -1) return names[i];
        }
        return 'desarrollador';
    }

    function emitLenisControl(eventName) {
        if (typeof window.CustomEvent !== 'function') return;
        window.dispatchEvent(new window.CustomEvent(eventName));
    }

    function stopLenisDuringScrollLock() {
        if (window.onlinesLenis && typeof window.onlinesLenis.stop === 'function') {
            window.onlinesLenis.stop();
        }
        emitLenisControl('onlines:lenis-stop');
    }

    function startLenisAfterScrollLock() {
        emitLenisControl('onlines:lenis-start');
    }

    
    var scheduler = (function () {
        var tasks   = [];
        var rafId   = null;
        var paused  = false;

        function loop(now) {
            for (var i = tasks.length - 1; i >= 0; i--) {
                if (tasks[i](now) === false) {
                    tasks.splice(i, 1);
                }
            }
            if (tasks.length > 0 && !paused) {
                rafId = window.requestAnimationFrame(loop);
            } else {
                rafId = null;
            }
        }

        function kick() {
            if (!paused && tasks.length > 0 && rafId === null) {
                rafId = window.requestAnimationFrame(loop);
            }
        }

        return {
            add: function (fn) {
                if (tasks.indexOf(fn) === -1) tasks.push(fn);
                kick();
            },
            remove: function (fn) {
                var idx = tasks.indexOf(fn);
                if (idx !== -1) tasks.splice(idx, 1);
            },
            pause: function () {
                paused = true;
                if (rafId) {
                    window.cancelAnimationFrame(rafId);
                    rafId = null;
                }
            },
            resume: function () {
                paused = false;
                kick();
            }
        };
    })();

    
    
    function initInteractiveGrid(hero) {
        var gridContainer = hero.querySelector(GRID_SELECTOR);
        if (!gridContainer || !window.onlinesGrillaCeldas) return;

        window.onlinesGrillaCeldas.init({ contenedor: gridContainer });
    }

    
    function initHero() {
        var hero = document.querySelector(HERO_SELECTOR);
        if (!hero) return;

        initInteractiveGrid(hero);

        var cursors  = hero.querySelectorAll(CURSOR_SELECTOR);
        var apps     = hero.querySelectorAll(APP_SELECTOR);
        var fadeEls  = hero.querySelectorAll(FADEIN_SELECTOR);
        var typingNodes = hero.querySelectorAll(TYPING_SELECTOR);

        
        if ('IntersectionObserver' in window) {
            var heroObserver = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    scheduler.resume();
                    if (typingCtrl) typingCtrl.resume();
                } else {
                    scheduler.pause();
                    if (typingCtrl) typingCtrl.pause();
                }
            }, { threshold: 0 });
            heroObserver.observe(hero);
        }

        waitForFirstScroll(hero, cursors, apps, fadeEls, typingNodes);
    }

    
    function startAnimations(hero, cursors, apps, fadeEls, typingNodes) {
        if (hero.getAttribute('data-hero-started') === 'true') return;
        hero.setAttribute('data-hero-started', 'true');

        hero.classList.add('is-started');
        initSeleccionSequence(hero);
        animateCursorsIn(cursors, hero);
        animateAppsIn(apps);
        animateFadeIn(fadeEls);
        initFloatParallax(hero);

        if (typingNodes.length) {
            setTimeout(function () {
                typingCtrl = startTypingControllers(typingNodes);
            }, 1800);
        }
    }

    function startTypingControllers(typingNodes) {
        var ctrls = [];
        Array.prototype.forEach.call(typingNodes, function (node) {
            ctrls.push(startTypingAnimation(node));
        });
        return {
            pause: function () {
                ctrls.forEach(function (ctrl) { ctrl.pause(); });
            },
            resume: function () {
                ctrls.forEach(function (ctrl) { ctrl.resume(); });
            }
        };
    }

    function waitForFirstScroll(hero, cursors, apps, fadeEls, typingNodes) {
        var hasStarted  = false;
        var isLocked    = false;
        var unlockTimer = null;
        var failsafeTimer = null;
        var root   = document.documentElement;
        var titulo = hero.querySelector('.home-hero__titulo');

        if (hero.hasAttribute('data-hero-autostart')) {
            startAnimations(hero, cursors, apps, fadeEls, typingNodes);
            return;
        }

        
        var canHijack = window.scrollY === 0 && !window.location.hash;

        function isEditableTarget(target) {
            if (!target || !target.tagName) return false;
            var tag = target.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
        }

        function onIntent(e) {
            if (isLocked && e.cancelable) e.preventDefault();
            triggerAnimations();
        }

        function onKeyIntent(e) {
            if (isEditableTarget(e.target)) return;
            if (SCROLL_KEYS.indexOf(e.key) === -1) return;
            onIntent(e);
        }

        
        function onScrollFallback() {
            if (isLocked && window.scrollY > 0) window.scrollTo(0, 0);
            triggerAnimations();
        }

        function lockScroll() {
            if (isLocked) return;
            isLocked = true;
            root.classList.add(SCROLL_LOCK_CLASS);
            stopLenisDuringScrollLock();
            window.addEventListener('wheel', onIntent, { passive: false });
            window.addEventListener('touchmove', onIntent, { passive: false });
            window.addEventListener('keydown', onKeyIntent);
            window.addEventListener('scroll', onScrollFallback, { passive: true });
            document.addEventListener('visibilitychange', onVisibilityChange);
            window.addEventListener('pagehide', unlockScroll);
            
            failsafeTimer = window.setTimeout(triggerAnimations, SCROLL_LOCK_FAILSAFE);
        }

        function unlockScroll() {
            if (!isLocked) return;
            isLocked = false;
            root.classList.remove(SCROLL_LOCK_CLASS);
            startLenisAfterScrollLock();
            window.removeEventListener('wheel', onIntent);
            window.removeEventListener('touchmove', onIntent);
            window.removeEventListener('keydown', onKeyIntent);
            window.removeEventListener('scroll', onScrollFallback);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            window.removeEventListener('pagehide', unlockScroll);
            if (unlockTimer !== null) {
                window.clearTimeout(unlockTimer);
                unlockTimer = null;
            }
            if (failsafeTimer !== null) {
                window.clearTimeout(failsafeTimer);
                failsafeTimer = null;
            }
        }

        function onVisibilityChange() {
            if (document.hidden) unlockScroll();
        }

        function triggerAnimations() {
            if (hasStarted) return;
            hasStarted = true;
            window.removeEventListener('scroll', onFirstScroll);
            if (titulo) titulo.removeEventListener('mouseenter', triggerAnimations);
            startAnimations(hero, cursors, apps, fadeEls, typingNodes);

            if (isLocked) {
                if (failsafeTimer !== null) {
                    window.clearTimeout(failsafeTimer);
                    failsafeTimer = null;
                }
                unlockTimer = window.setTimeout(unlockScroll, SCROLL_LOCK_DURATION);
            }
        }

        function onFirstScroll() {
            if (window.scrollY <= 0) return;
            triggerAnimations();
        }

        if (canHijack) {
            lockScroll();
        } else {
            window.addEventListener('scroll', onFirstScroll, { passive: true });
        }

        if (titulo) titulo.addEventListener('mouseenter', triggerAnimations);
    }

    

    
    var CURSOR_BOTTOM_PADDING = 16;

    function getCursorMaxY(cursor, hero) {
        var inner = hero.querySelector('.home-hero__inner');
        if (!inner) return 0;

        
        var previousTransform = cursor.style.transform;
        cursor.style.transform = 'none';

        var cursorRect = cursor.getBoundingClientRect();
        var innerRect  = inner.getBoundingClientRect();

        cursor.style.transform = previousTransform;

        return Math.max(innerRect.bottom - cursorRect.bottom - CURSOR_BOTTOM_PADDING, 0);
    }

    function animateCursorsIn(cursors, hero) {
        if (!cursors.length) return;

        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var limitados    = [];

        cursors.forEach(function (cursor, index) {
            var offsetX     = parseInt(cursor.getAttribute('data-offset-x'), 10) || 0;
            var offsetY     = parseInt(cursor.getAttribute('data-offset-y'), 10) || 0;
            var cursorDelay = parseInt(cursor.getAttribute('data-cursor-delay'), 10) || 0;
            var startX = offsetX * 3;
            var startY = offsetY * 3;

            if (reduceMotion) {
                cursor.style.transform = 'translate(0, 0)';
                cursor.classList.add('is-visible');
                return;
            }

            
            var limite = null;
            if (getCursorName(cursor) === 'desarrollador') {
                limite = { maxY: getCursorMaxY(cursor, hero) };
                limitados.push({ cursor: cursor, limite: limite });
            }

            cursor.style.transform = 'translate(' + startX + 'px, ' + startY + 'px)';

            
            setTimeout(function () {
                cursor.classList.add('is-visible');
                startCursorLoop(cursor, index, [startX, startY], limite);
            }, cursorDelay);
        });

        if (!limitados.length) return;

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                limitados.forEach(function (item) {
                    item.limite.maxY = getCursorMaxY(item.cursor, hero);
                });
            }, 200);
        }, { passive: true });
    }

    function startCursorLoop(cursor, index, entryPoint, limite) {
        var name         = getCursorName(cursor);
        var path         = CURSOR_PATHS[name] || CURSOR_PATHS.desarrollador;
        var limits       = null;
        var currentIndex = 0;
        var phase        = 'pause';
        var phaseStart   = null;
        var clickTriggered = false;
        var fromPoint    = null;
        var toPoint      = null;
        
        var nextX = 0;
        var nextY = 0;

        
        var enEntrada = false;

        if (entryPoint) {
            phase = 'move';
            fromPoint = entryPoint;
            toPoint = path[1] || path[0];
            enEntrada = true;
        }

        function measureCursorLimits() {
            var parent = cursor.parentElement;
            if (!parent) return;

            var inset = 6;
            var minX  = inset - cursor.offsetLeft;
            var maxX  = parent.clientWidth - cursor.offsetLeft - cursor.offsetWidth - inset;
            var minY  = inset - cursor.offsetTop;
            var maxY  = parent.clientHeight - cursor.offsetTop - cursor.offsetHeight - inset;
            limits = { minX: minX, maxX: maxX, minY: minY, maxY: maxY };
        }

        measureCursorLimits();
        window.addEventListener('resize', measureCursorLimits, { passive: true });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measureCursorLimits);
        }

        function triggerClickBurst() {
            cursor.classList.add('is-clicking');
            window.setTimeout(function () {
                if (cursor.isConnected) cursor.classList.remove('is-clicking');
            }, 220);
        }

        function shouldClickOnWaypoint(wi) {
            return wi !== 0 && wi % 2 === index % 2;
        }

        function getPauseDuration() {
            return 420 + ((index + currentIndex) % 3) * 140;
        }

        function getMoveDuration() {
            return 1500 + (index * 130) + ((currentIndex % 2) * 180);
        }

        function tick(timestamp) {
            
            if (!cursor.isConnected) return false;

            if (phaseStart === null) {
                phaseStart = timestamp;
                nextX = path[currentIndex][0];
                nextY = path[currentIndex][1];
            }

            if (phase === 'pause') {
                var pauseElapsed = timestamp - phaseStart;

                if (shouldClickOnWaypoint(currentIndex) && !clickTriggered && pauseElapsed >= 90) {
                    clickTriggered = true;
                    triggerClickBurst();
                }

                if (pauseElapsed >= getPauseDuration()) {
                    var nextIndex = (currentIndex + 1) % path.length;
                    fromPoint      = path[currentIndex];
                    toPoint        = path[nextIndex];
                    phase          = 'move';
                    phaseStart     = timestamp;
                    clickTriggered = false;
                }
            } else {
                var moveElapsed  = timestamp - phaseStart;
                var moveProgress = Math.min(moveElapsed / getMoveDuration(), 1);
                var easedProgress = easeInOutSine(moveProgress);

                nextX = lerp(fromPoint[0], toPoint[0], easedProgress);
                nextY = lerp(fromPoint[1], toPoint[1], easedProgress);

                if (moveProgress >= 1) {
                    currentIndex   = (currentIndex + 1) % path.length;
                    phase          = 'pause';
                    phaseStart     = timestamp;
                    clickTriggered = false;
                    enEntrada      = false;
                }
            }

            
            var salidaY = (limite && !enEntrada) ? Math.min(nextY, limite.maxY) : nextY;
            var salidaX = nextX;

            if (limits && !enEntrada) {
                if (limits.maxX > limits.minX) {
                    salidaX = Math.max(limits.minX, Math.min(nextX, limits.maxX));
                }
                if (limits.maxY > limits.minY) {
                    salidaY = Math.max(limits.minY, Math.min(salidaY, limits.maxY));
                }
            }

            
            cursor.style.transform = 'translate(' + salidaX.toFixed(1) + 'px, ' + salidaY.toFixed(1) + 'px)';
        }

        scheduler.add(tick);
    }

    
    function animateAppsIn(apps) {
        if (!apps.length) return;

        apps.forEach(function (app, index) {
            setTimeout(function () {
                app.classList.add('is-visible');
            }, 300 + index * 120);
        });
    }

    
    function animateFadeIn(elements) {
        if (!elements.length) return;

        elements.forEach(function (el) {
            var delay = parseInt(el.getAttribute('data-fadein-delay'), 10) || 0;
            setTimeout(function () {
                el.classList.add('is-visible');
            }, delay);
        });
    }

    
    function initFloatParallax(hero) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var nodes = hero.querySelectorAll(FLOAT_SELECTOR);
        if (!nodes.length) return;

        var mobileQuery  = window.matchMedia('(max-width: 1023px)');
        var PARALLAX_MAX = 56;

        
        var heroTop    = hero.getBoundingClientRect().top + window.scrollY;
        var cachedScrollY = window.scrollY;

        window.addEventListener('scroll', function () {
            cachedScrollY = window.scrollY;
        }, { passive: true });

        var items      = [];
        var startTime  = null;

        for (var i = 0; i < nodes.length; i++) {
            var el     = nodes[i];
            var styles = window.getComputedStyle(el);
            items.push({
                el:       el,
                centered: el.getAttribute('data-float-center') === '1',
                parallax: parseFloat(el.getAttribute('data-float-parallax')) || 0,
                rot:      parseFloat(styles.getPropertyValue('--he-rot')) || 0,
                scale:    parseFloat(styles.getPropertyValue('--he-scale')) || 1,
                phase:    (i * 1.7) % (Math.PI * 2),
                speed:    0.0006 + (i % 4) * 0.00009,
                amp:      6 + (i % 3),
                ampX:     1.5 + (i % 2),
                rotAmp:   0.5 + (i % 3) * 0.15
            });
        }

        function refreshTokens() {
            heroTop = hero.getBoundingClientRect().top + window.scrollY;
            for (var j = 0; j < items.length; j++) {
                var s = window.getComputedStyle(items[j].el);
                items[j].scale = parseFloat(s.getPropertyValue('--he-scale')) || 1;
                items[j].rot   = parseFloat(s.getPropertyValue('--he-rot')) || 0;
            }
        }

        var resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(refreshTokens, 200);
        }, { passive: true });

        function floatTick(now) {
            if (startTime === null) startTime = now;
            var ramp          = Math.min((now - startTime) / 800, 1);
            var scrolled      = cachedScrollY - heroTop;
            var parallaxScale = mobileQuery.matches ? 0.5 : 1;

            for (var k = 0; k < items.length; k++) {
                var it = items[k];
                var fy = Math.sin(now * it.speed + it.phase) * it.amp * ramp;
                var fx = Math.cos(now * it.speed * 0.8 + it.phase) * it.ampX * ramp;
                var fr = Math.sin(now * it.speed * 0.6 + it.phase) * it.rotAmp * ramp;
                var py = scrolled * it.parallax * parallaxScale;
                if (py > PARALLAX_MAX) py = PARALLAX_MAX;
                else if (py < -PARALLAX_MAX) py = -PARALLAX_MAX;

                it.el.style.transform =
                    (it.centered ? 'translateX(-50%) ' : '') +
                    'translate(' + fx.toFixed(2) + 'px, ' + (fy + py).toFixed(2) + 'px) ' +
                    'rotate(' + (it.rot + fr).toFixed(2) + 'deg) ' +
                    'scale(' + it.scale + ')';
            }
        }

        scheduler.add(floatTick);
    }

    
    function startTypingAnimation(container, text) {
        var fullText  = typeof text === 'string' ? text : CODE_TEXT;
        var textNode   = document.createTextNode('');
        var cursorSpan = document.createElement('span');
        cursorSpan.className = 'js-typing-cursor';
        container.appendChild(textNode);
        container.appendChild(cursorSpan);

        var charIndex      = 0;
        var isDeleting     = false;
        var typingSpeed    = 30;
        var deletingSpeed  = 15;
        var pauseAfterType = 3000;
        var pauseAfterDel  = 800;
        var paused         = false;
        var timerId        = null;

        function scheduleTick(delay) {
            if (!paused) {
                timerId = setTimeout(tick, delay);
            }
        }

        function tick() {
            timerId = null;
            if (paused) return;

            if (!isDeleting) {
                charIndex++;
                textNode.nodeValue = fullText.substring(0, charIndex);

                if (charIndex >= fullText.length) {
                    isDeleting = true;
                    scheduleTick(pauseAfterType);
                    return;
                }
                scheduleTick(typingSpeed + randomBetween(-10, 15));
            } else {
                charIndex--;
                textNode.nodeValue = fullText.substring(0, charIndex);

                if (charIndex <= 0) {
                    isDeleting = false;
                    scheduleTick(pauseAfterDel);
                    return;
                }
                scheduleTick(deletingSpeed);
            }
        }

        scheduleTick(500);

        return {
            pause: function () {
                paused = true;
                if (timerId !== null) {
                    clearTimeout(timerId);
                    timerId = null;
                }
            },
            resume: function () {
                if (!paused) return;
                paused = false;
                scheduleTick(0);
            }
        };
    }

    
    function initSeleccionSequence(hero) {
        var seleccion = hero.querySelector(SELECCION_SELECTOR);
        if (!seleccion) return;

        setTimeout(function () {
            seleccion.classList.add('is-selected');

            
            seleccion.addEventListener('transitionend', function onFadeEnd(e) {
                if (e.target !== seleccion || e.propertyName !== 'opacity') return;
                seleccion.removeEventListener('transitionend', onFadeEnd);
                initDragSeleccion(hero);
            });
        }, 500);
    }

    
    function initDragSeleccion(hero) {
        var seleccion = hero.querySelector(SELECCION_SELECTOR);
        var titulo    = hero.querySelector('.home-hero__titulo');
        if (!seleccion || !titulo) return;

        var inner = hero.querySelector('.home-hero__inner');
        if (!inner) return;

        titulo.classList.add('is-draggable');

        var isDragging  = false;
        var startMouseX = 0, startMouseY = 0;
        var startSelX   = 0, startSelY   = 0;
        var startTitX   = 0, startTitY   = 0;
        
        var innerW = 0, innerH = 0, selW = 0, selH = 0, titW = 0, titH = 0;
        
        var pendingX = 0, pendingY = 0;

        function getPosition(el) {
            var rect       = el.getBoundingClientRect();
            var parentRect = inner.getBoundingClientRect();
            return { x: rect.left - parentRect.left, y: rect.top - parentRect.top };
        }

        
        function dragTick() {
            var dx = pendingX - startMouseX;
            var dy = pendingY - startMouseY;

            var newSelX = Math.max(0, Math.min(startSelX + dx, innerW - selW));
            var newSelY = Math.max(0, Math.min(startSelY + dy, innerH - selH));
            seleccion.style.left = newSelX + 'px';
            seleccion.style.top  = newSelY + 'px';

            var newTitX = Math.max(0, Math.min(startTitX + dx, innerW - titW));
            var newTitY = Math.max(0, Math.min(startTitY + dy, innerH - titH));
            titulo.style.left = newTitX + 'px';
            titulo.style.top  = newTitY + 'px';
        }

        function onPointerDown(e) {
            e.preventDefault();
            isDragging = true;

            var selPos  = getPosition(seleccion);
            startSelX   = selPos.x;
            startSelY   = selPos.y;

            var titPos  = getPosition(titulo);
            startTitX   = titPos.x;
            startTitY   = titPos.y;

            startMouseX = e.clientX;
            startMouseY = e.clientY;
            pendingX    = e.clientX;
            pendingY    = e.clientY;

            
            innerW = inner.offsetWidth;
            innerH = inner.offsetHeight;
            selW   = seleccion.offsetWidth;
            selH   = seleccion.offsetHeight;
            titW   = titulo.offsetWidth;
            titH   = titulo.offsetHeight;

            seleccion.style.left      = startSelX + 'px';
            seleccion.style.top       = startSelY + 'px';
            seleccion.style.transform = 'none';

            titulo.style.left      = startTitX + 'px';
            titulo.style.top       = startTitY + 'px';
            titulo.style.transform = 'none';

            scheduler.add(dragTick);
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        }

        function onPointerMove(e) {
            
            pendingX = e.clientX;
            pendingY = e.clientY;
        }

        function onPointerUp() {
            isDragging = false;
            scheduler.remove(dragTick);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        }

        seleccion.addEventListener('pointerdown', onPointerDown);
        titulo.addEventListener('pointerdown', onPointerDown);
    }

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHero);
    } else {
        initHero();
    }
})();

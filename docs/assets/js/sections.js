(function () {
    'use strict';

    var ACTIVO_CLASS = 'is-activo';
    var STATIC_CLASS = 'is-static';

    function init(config) {
        if (!config || !config.contenedor) return;

        var contenedor = config.contenedor;

        
        var area = config.area || contenedor.parentElement || contenedor;

        
        if (!window.matchMedia('(hover: hover)').matches) {
            contenedor.classList.add(STATIC_CLASS);
            return;
        }

        var rafId    = null;
        var punteroX = '50%';
        var punteroY = '50%';

        function medir(evento) {
            var rect = area.getBoundingClientRect();
            punteroX = (evento.clientX - rect.left) + 'px';
            punteroY = (evento.clientY - rect.top) + 'px';
        }

        function escribir() {
            rafId = null;
            contenedor.style.setProperty('--dot-x', punteroX);
            contenedor.style.setProperty('--dot-y', punteroY);
            contenedor.style.setProperty('--dot-lit-x', punteroX);
            contenedor.style.setProperty('--dot-lit-y', punteroY);
        }

        
        area.addEventListener('mouseenter', function (evento) {
            medir(evento);
            escribir();
            contenedor.classList.add(ACTIVO_CLASS);
        });

        area.addEventListener('mousemove', function (evento) {
            medir(evento);
            if (rafId) return;
            rafId = window.requestAnimationFrame(escribir);
        }, { passive: true });

        
        area.addEventListener('mouseleave', function () {
            if (rafId) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }

            contenedor.classList.remove(ACTIVO_CLASS);
            contenedor.style.setProperty('--dot-x', '50%');
            contenedor.style.setProperty('--dot-y', '50%');
        });
    }

    window.onlinesPatronPuntos = { init: init };
})();

;
(function () {
    'use strict';

    var BLOCK_SELECTOR = '.home-quote-block';
    var STICKY_SELECTOR = '.js-quote-sticky';
    var DOTS_SELECTOR = '.js-quote-dots';
    var WORD_SELECTOR = '.js-quote-word';
    var REVEALED_CLASS = 'is-revealed';
    var ANIMATING_CLASS = 'is-animating';

    
    var DEBUG = false;

    
    var GROUP_RANGES = {
        titulo: { start: 0, end: 0.7333 },
        subtitulo: { start: 0.7333, end: 1 }
    };

    
    function log() {
        if (!DEBUG || !window.console || !window.console.log) return;
        var args = Array.prototype.slice.call(arguments);
        args.unshift('[home-quote-block]');
        window.console.log.apply(window.console, args);
    }

    function throttle(fn, ms) {
        var last = 0;
        return function () {
            var now = Date.now();
            if (now - last >= ms) {
                last = now;
                fn.apply(this, arguments);
            }
        };
    }

    
    
    function initTextReveal(block) {
        var groups = {};
        var groupOrder = ['titulo', 'subtitulo'];

        groupOrder.forEach(function (name) {
            var el = block.querySelector('[data-quote-group="' + name + '"]');
            if (el) {
                groups[name] = el.querySelectorAll('.' + WORD_SELECTOR.replace('.', ''));
            }
        });

        
        var totalWords = 0;
        groupOrder.forEach(function (name) {
            if (groups[name]) totalWords += groups[name].length;
        });
        if (totalWords === 0) return;

        block.classList.add(ANIMATING_CLASS);

        var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        
        function paintWords(words, localProgress) {
            var revealCount = Math.ceil(localProgress * words.length);
            for (var i = 0; i < words.length; i++) {
                if (i < revealCount) {
                    words[i].classList.add(REVEALED_CLASS);
                } else {
                    words[i].classList.remove(REVEALED_CLASS);
                }
            }
        }

        function paintAll() {
            groupOrder.forEach(function (name) {
                if (groups[name]) paintWords(groups[name], 1);
            });
        }

        log('Init', {
            palabrasTitulo: groups.titulo ? groups.titulo.length : 0,
            palabrasSubtitulo: groups.subtitulo ? groups.subtitulo.length : 0,
            reducedMotion: reducedMotion
        });

        
        if (reducedMotion) {
            paintAll();
            return;
        }

        var ultimoTramo = null;
        var sticky = block.querySelector(STICKY_SELECTOR);
        var recorrido = 0;
        var arranque = 0;

        
        function medir() {
            var estilos = window.getComputedStyle(block);
            recorrido = parseFloat(estilos.getPropertyValue('--quote-scroll-distance')) || 0;
            arranque = sticky ? sticky.offsetTop : 0;
        }

        medir();

        function updateWords() {
            if (recorrido <= 0) {
                paintAll();
                return;
            }

            var rect = block.getBoundingClientRect();
            var progress = Math.max(0, Math.min(1, (-rect.top - arranque) / recorrido));

            groupOrder.forEach(function (name) {
                var range = GROUP_RANGES[name];
                var words = groups[name];
                if (!range || !words || !words.length) return;

                
                var localProgress;
                if (progress <= range.start) {
                    localProgress = 0;
                } else if (progress >= range.end) {
                    localProgress = 1;
                } else {
                    localProgress = (progress - range.start) / (range.end - range.start);
                }

                paintWords(words, localProgress);
            });

            
            var tramo = progress <= 0 ? 'inicio' : (progress >= 1 ? 'fin' : 'pineado');
            if (tramo !== ultimoTramo) {
                ultimoTramo = tramo;
                log('Tramo', tramo, Math.round(progress * 100) + '%', 'recorrido', Math.round(recorrido) + 'px');
            }
        }

        var scrollHandler = throttle(updateWords, 16);
        var resizeHandler = throttle(function () {
            medir();
            updateWords();
        }, 16);
        var scrollBound = false;

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        if (!scrollBound) {
                            window.addEventListener('scroll', scrollHandler, { passive: true });
                            window.addEventListener('resize', resizeHandler);
                            scrollBound = true;
                            updateWords();
                        }
                    } else {
                        if (scrollBound) {
                            window.removeEventListener('scroll', scrollHandler);
                            window.removeEventListener('resize', resizeHandler);
                            scrollBound = false;
                        }
                    }
                });
            }, { threshold: 0 });
            observer.observe(block);
        } else {
            window.addEventListener('scroll', scrollHandler, { passive: true });
            window.addEventListener('resize', resizeHandler);
            scrollBound = true;
            updateWords();
        }
    }

    
    function initQuoteBlock() {
        var block = document.querySelector(BLOCK_SELECTOR);
        if (!block) return;

        
        var dots = block.querySelector(DOTS_SELECTOR);
        if (dots) {
            window.onlinesPatronPuntos.init({ contenedor: dots });
        }

        initTextReveal(block);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuoteBlock);
    } else {
        initQuoteBlock();
    }
})();

;
(() => {
    'use strict';

    

    const TITLE_SELECTOR = '.card-servicio--vertical .js-card-servicio-titulo';
    const LINE_CLASS = 'card-servicio__titulo-linea';
    const LINE_TEXT_CLASS = 'card-servicio__titulo-linea-texto';
    const LINE_RULE_CLASS = 'card-servicio__titulo-puntos';
    const MEASURE_CLASS = 'card-servicio__titulo-measure';
    const WORD_CLASS = 'card-servicio__titulo-palabra';
    const TOP_EPSILON = 1;

    const normalizeTitle = (text) => text.replace(/\s+/g, ' ').trim();

    const getOriginalTitle = (titleElement) => {
        const storedTitle = titleElement.dataset.cardServicioTitle || '';

        if (storedTitle) {
            return storedTitle;
        }

        const fallbackTitle = normalizeTitle(titleElement.textContent || '');
        titleElement.dataset.cardServicioTitle = fallbackTitle;

        return fallbackTitle;
    };

    const createMeasureNode = (originalTitle) => {
        const measureNode = document.createElement('span');
        measureNode.className = MEASURE_CLASS;
        measureNode.setAttribute('aria-hidden', 'true');

        const words = originalTitle.split(' ');

        words.forEach((word, index) => {
            const wordNode = document.createElement('span');
            wordNode.className = WORD_CLASS;
            wordNode.textContent = word;
            measureNode.appendChild(wordNode);

            if (index < words.length - 1) {
                measureNode.appendChild(document.createTextNode(' '));
            }
        });

        return measureNode;
    };

    const getWrappedLines = (measureNode) => {
        const wordNodes = Array.from(measureNode.querySelectorAll('.' + WORD_CLASS));

        if (!wordNodes.length) {
            return [];
        }

        const lines = [];
        let currentTop = null;
        let currentWords = [];

        wordNodes.forEach((wordNode) => {
            const wordTop = Math.round(wordNode.offsetTop);

            if (currentTop === null || Math.abs(wordTop - currentTop) <= TOP_EPSILON) {
                currentWords.push(wordNode.textContent || '');
                currentTop = currentTop === null ? wordTop : currentTop;
                return;
            }

            lines.push(currentWords.join(' '));
            currentWords = [wordNode.textContent || ''];
            currentTop = wordTop;
        });

        if (currentWords.length) {
            lines.push(currentWords.join(' '));
        }

        return lines;
    };

    const renderWrappedLines = (titleElement, lines) => {
        const fragment = document.createDocumentFragment();

        lines.forEach((lineText) => {
            const lineNode = document.createElement('span');
            lineNode.className = LINE_CLASS;

            const textNode = document.createElement('span');
            textNode.className = LINE_TEXT_CLASS;
            textNode.textContent = lineText + ' ';

            const ruleNode = document.createElement('span');
            ruleNode.className = LINE_RULE_CLASS;
            ruleNode.setAttribute('aria-hidden', 'true');

            lineNode.append(textNode, ruleNode);
            fragment.appendChild(lineNode);
        });

        titleElement.replaceChildren(fragment);
    };

    const splitTitleIntoLines = (titleElement) => {
        const originalTitle = getOriginalTitle(titleElement);

        if (!originalTitle) {
            return;
        }

        const measureNode = createMeasureNode(originalTitle);
        titleElement.replaceChildren(measureNode);

        const lines = getWrappedLines(measureNode);

        if (!lines.length) {
            titleElement.textContent = originalTitle;
            return;
        }

        renderWrappedLines(titleElement, lines);
    };

    const scheduleSplit = (titleElement) => {
        if (titleElement.cardServicioFrame) {
            cancelAnimationFrame(titleElement.cardServicioFrame);
        }

        titleElement.cardServicioFrame = requestAnimationFrame(() => {
            splitTitleIntoLines(titleElement);
            titleElement.cardServicioFrame = null;
        });
    };

    const observeWidthChanges = (titleElement) => {
        const observedElement = titleElement.closest('.card-servicio__textos') || titleElement;

        if ('ResizeObserver' in window) {
            let lastWidth = Math.round(observedElement.getBoundingClientRect().width);
            const resizeObserver = new ResizeObserver((entries) => {
                const nextWidth = Math.round(entries[0].contentRect.width);

                if (!nextWidth || nextWidth === lastWidth) {
                    return;
                }

                lastWidth = nextWidth;
                scheduleSplit(titleElement);
            });

            resizeObserver.observe(observedElement);
            return;
        }

        const onResize = () => scheduleSplit(titleElement);
        window.addEventListener('resize', onResize, { passive: true });
    };

    const initTitle = (titleElement) => {
        scheduleSplit(titleElement);
        observeWidthChanges(titleElement);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready
                .then(() => {
                    scheduleSplit(titleElement);
                })
                .catch(() => {});
        }
    };

    const init = () => {
        const titleElements = document.querySelectorAll(TITLE_SELECTOR);

        if (!titleElements.length) {
            return;
        }

        titleElements.forEach(initTitle);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    init();
})();

;
(() => {
    const HALFTONE_TYPE = 'holes';
    const HALFTONE_GRID = 'square';
    const SOURCE_LIMIT = 1800;
    const MAX_PIXELS = 1400000;
    const GRAIN_TILE_SHIFT = 9;
    const GRAIN_TILE_SIZE = 1 << GRAIN_TILE_SHIFT;
    const GRAIN_TILE_MASK = GRAIN_TILE_SIZE - 1;
    const POW_TABLE_SIZE = 1024;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const clamp01 = (value) => clamp(value, 0, 1);
    const mix = (start, end, amount) => start + ((end - start) * amount);

    const toNumber = (value, fallback) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    let colorParserContext = null;

    const getColorParserContext = () => {
        if (colorParserContext) {
            return colorParserContext;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        colorParserContext = canvas.getContext('2d');
        return colorParserContext;
    };

    const parseCssColor = (value) => {
        if (!value) {
            return null;
        }

        if (value.charAt(0) === '#') {
            if (value.length === 4) {
                return {
                    r: parseInt(value.charAt(1) + value.charAt(1), 16),
                    g: parseInt(value.charAt(2) + value.charAt(2), 16),
                    b: parseInt(value.charAt(3) + value.charAt(3), 16),
                };
            }

            if (value.length === 7) {
                return {
                    r: parseInt(value.slice(1, 3), 16),
                    g: parseInt(value.slice(3, 5), 16),
                    b: parseInt(value.slice(5, 7), 16),
                };
            }
        }

        const matches = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);

        if (!matches) {
            return null;
        }

        return {
            r: Number(matches[1]),
            g: Number(matches[2]),
            b: Number(matches[3]),
        };
    };

    const parseColor = (value, fallback) => {
        const context = getColorParserContext();

        if (!context) {
            return fallback;
        }

        const fallbackValue = 'rgb(' + fallback.r + ', ' + fallback.g + ', ' + fallback.b + ')';

        try {
            context.fillStyle = fallbackValue;
            context.fillStyle = value || fallbackValue;
            return parseCssColor(context.fillStyle) || fallback;
        } catch (error) {
            return fallback;
        }
    };

    const parseColorUnit = (value, fallback) => {
        const color = parseColor(value, fallback);

        return {
            r: color.r / 255,
            g: color.g / 255,
            b: color.b / 255,
        };
    };

    const hash21 = (x, y) => {
        const seed = Math.sin((x * 12.9898) + (y * 78.233)) * 43758.5453;
        return seed - Math.floor(seed);
    };

    let grainTile = null;

    const getGrainTile = () => {
        if (grainTile) {
            return grainTile;
        }

        grainTile = new Float32Array(GRAIN_TILE_SIZE * GRAIN_TILE_SIZE);

        for (let y = 0; y < GRAIN_TILE_SIZE; y += 1) {
            for (let x = 0; x < GRAIN_TILE_SIZE; x += 1) {
                grainTile[(y * GRAIN_TILE_SIZE) + x] = hash21(x, y);
            }
        }

        return grainTile;
    };

    
    const getLatticeValue = (tile, x, y) => tile[((y & GRAIN_TILE_MASK) << GRAIN_TILE_SHIFT) + (x & GRAIN_TILE_MASK)];

    const powTables = {};

    
    const getPowTable = (exponent) => {
        const key = String(exponent);

        if (powTables[key]) {
            return powTables[key];
        }

        const table = new Float32Array(POW_TABLE_SIZE + 1);

        for (let index = 0; index <= POW_TABLE_SIZE; index += 1) {
            table[index] = Math.pow(index / POW_TABLE_SIZE, exponent);
        }

        powTables[key] = table;
        return table;
    };

    const lookupPow = (table, value) => table[(clamp01(value) * POW_TABLE_SIZE) | 0];

    const isLittleEndian = (() => {
        const probe = new ArrayBuffer(4);
        new Uint32Array(probe)[0] = 1;
        return new Uint8Array(probe)[0] === 1;
    })();

    
    const packPixel = isLittleEndian
        ? (red, green, blue) => (0xff000000 | (blue << 16) | (green << 8) | red)
        : (red, green, blue) => ((red << 24) | (green << 16) | (blue << 8) | 0xff);

    const valueNoise = (tile, x, y) => {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;
        const ux = fx * fx * (3 - (2 * fx));
        const uy = fy * fy * (3 - (2 * fy));
        const a = getLatticeValue(tile, ix, iy);
        const b = getLatticeValue(tile, ix + 1, iy);
        const c = getLatticeValue(tile, ix, iy + 1);
        const d = getLatticeValue(tile, ix + 1, iy + 1);
        return mix(mix(a, b, ux), mix(c, d, ux), uy);
    };

    const normalizeConfig = (inputConfig) => ({
        imageUrl: inputConfig.imageUrl || '',
        width: Math.max(1, Math.round(toNumber(inputConfig.width, 1280))),
        height: Math.max(1, Math.round(toNumber(inputConfig.height, 720))),
        colorBack: inputConfig.colorBack || '#f2f1e8',
        colorFront: inputConfig.colorFront || '#2b2b2b',
        originalColors: inputConfig.originalColors !== false,
        inverted: Boolean(inputConfig.inverted),
        size: clamp(toNumber(inputConfig.size, 0.01), 0, 1),
        radius: clamp(toNumber(inputConfig.radius, 1.01), 0, 2),
        contrast: clamp(toNumber(inputConfig.contrast, 0.01), 0, 1),
        grainMixer: clamp(toNumber(inputConfig.grainMixer, 0.11), 0, 1),
        grainOverlay: clamp(toNumber(inputConfig.grainOverlay, 0), 0, 1),
        grainSize: clamp(toNumber(inputConfig.grainSize, 0), 0, 1),
        scale: clamp(toNumber(inputConfig.scale, 1), 0.1, 4),
        fit: inputConfig.fit === 'contain' ? 'contain' : 'cover',
        type: HALFTONE_TYPE,
        grid: HALFTONE_GRID,
    });

    const getDrawRect = (config, sourceWidth, sourceHeight, targetWidth, targetHeight) => {
        const sourceRatio = sourceWidth / sourceHeight;
        const targetRatio = targetWidth / targetHeight;

        let baseWidth = 0;
        let baseHeight = 0;

        if (config.fit === 'contain') {
            if (sourceRatio > targetRatio) {
                baseWidth = targetWidth;
                baseHeight = baseWidth / sourceRatio;
            } else {
                baseHeight = targetHeight;
                baseWidth = baseHeight * sourceRatio;
            }
        } else if (sourceRatio > targetRatio) {
            baseHeight = targetHeight;
            baseWidth = baseHeight * sourceRatio;
        } else {
            baseWidth = targetWidth;
            baseHeight = baseWidth / sourceRatio;
        }

        const scaledWidth = baseWidth * config.scale;
        const scaledHeight = baseHeight * config.scale;

        return {
            x: (targetWidth - scaledWidth) / 2,
            y: (targetHeight - scaledHeight) / 2,
            width: scaledWidth,
            height: scaledHeight,
        };
    };

    const createSource = (image) => {
        const sourceWidth = image.naturalWidth || image.width;
        const sourceHeight = image.naturalHeight || image.height;
        const factor = Math.min(1, SOURCE_LIMIT / Math.max(sourceWidth, sourceHeight));
        const width = Math.max(1, Math.round(sourceWidth * factor));
        const height = Math.max(1, Math.round(sourceHeight * factor));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
            return null;
        }

        context.drawImage(image, 0, 0, width, height);

        return {
            width,
            height,
            data: context.getImageData(0, 0, width, height).data,
        };
    };

    const createSigmoidTable = (contrast) => {
        const table = new Float32Array(256);

        for (let index = 0; index < 256; index += 1) {
            table[index] = 1 / (1 + Math.exp(-contrast * ((index / 255) - 0.5)));
        }

        return table;
    };

    const buildCellGrid = (source, config, padX, padY, minCellX, minCellY, cellsX, cellsY) => {
        const total = cellsX * cellsY;
        const radiusMod = new Float32Array(total);
        const inverted = new Uint8Array(total);
        const inFrame = new Uint8Array(total);
        const colors = new Float32Array(total * 3);
        const sourceData = source.data;
        const sourceWidth = source.width;
        const sourceHeight = source.height;

        const contrast = config.originalColors
            ? mix(0.1, 4, Math.pow(config.contrast, 2))
            : mix(0, 15, Math.pow(config.contrast, 1.5));
        const baseRadius = config.originalColors
            ? 2 * Math.pow(0.5 * config.radius, 0.3)
            : config.radius;

        const sigmoid = createSigmoidTable(contrast);

        for (let cellY = 0; cellY < cellsY; cellY += 1) {
            const samplingV = ((minCellY + cellY + 1) * padY) + 0.5;
            const insideV = samplingV >= -padY && samplingV <= 1 + padY;
            const sampleY = clamp(Math.round(clamp01(samplingV) * (sourceHeight - 1)), 0, sourceHeight - 1);

            for (let cellX = 0; cellX < cellsX; cellX += 1) {
                const cellIndex = (cellY * cellsX) + cellX;
                const samplingU = ((minCellX + cellX + 1) * padX) + 0.5;

                if (!insideV || samplingU < -padX || samplingU > 1 + padX) {
                    inFrame[cellIndex] = 0;
                    continue;
                }

                inFrame[cellIndex] = 1;

                const sampleX = clamp(Math.round(clamp01(samplingU) * (sourceWidth - 1)), 0, sourceWidth - 1);
                const sourceIndex = ((sampleY * sourceWidth) + sampleX) * 4;
                const alpha = sourceData[sourceIndex + 3] / 255;
                const red = sigmoid[sourceData[sourceIndex]];
                const green = sigmoid[sourceData[sourceIndex + 1]];
                const blue = sigmoid[sourceData[sourceIndex + 2]];

                let luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
                luminance = mix(1, luminance, alpha);

                if (config.inverted) {
                    luminance = 1 - luminance;
                }

                const radius = 0.75 * baseRadius * (1 - luminance);
                radiusMod[cellIndex] = radius - (Math.floor(radius / 0.5) * 0.5);
                inverted[cellIndex] = radius < 0.5 ? 0 : 1;

                const colorIndex = cellIndex * 3;
                colors[colorIndex] = (sourceData[sourceIndex] / 255) * alpha;
                colors[colorIndex + 1] = (sourceData[sourceIndex + 1] / 255) * alpha;
                colors[colorIndex + 2] = (sourceData[sourceIndex + 2] / 255) * alpha;
            }
        }

        return {
            radiusMod,
            inverted,
            inFrame,
            colors,
            cellsX,
            cellsY,
            minCellX,
            minCellY,
        };
    };

    const renderHalftoneFrame = (stage, canvas, source, config) => {
        const cssWidth = Math.max(1, Math.round(stage.clientWidth || config.width));
        const cssHeight = Math.max(1, Math.round(stage.clientHeight || config.height));
        const pixelRatio = clamp(window.devicePixelRatio || 1, 1, 2);

        let width = Math.max(1, Math.round(cssWidth * pixelRatio));
        let height = Math.max(1, Math.round(cssHeight * pixelRatio));
        const totalPixels = width * height;

        if (totalPixels > MAX_PIXELS) {
            const ratio = Math.sqrt(MAX_PIXELS / totalPixels);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const imageData = context.createImageData(width, height);
        const buffer = new Uint32Array(imageData.data.buffer);
        const drawRect = getDrawRect(config, source.width, source.height, width, height);
        const imageAspect = drawRect.width / drawRect.height;

        const cellsPerSide = mix(300, 7, Math.pow(config.size, 0.7));
        const padY = 1 / cellsPerSide;
        const padX = padY / imageAspect;
        const cellPx = Math.max(0.0001, drawRect.height / cellsPerSide);
        const antialias = clamp(1 / cellPx, 0.0001, 0.5);
        const invAntialiasRange = 1 / (2 * antialias);

        const centerX = drawRect.x + (drawRect.width / 2);
        const centerY = drawRect.y + (drawRect.height / 2);
        const invCellPx = 1 / cellPx;
        const startX = ((0.5 - centerX) * invCellPx) - 0.5;
        const startY = ((0.5 - centerY) * invCellPx) - 0.5;

        const minCellX = Math.floor(startX);
        const maxCellX = Math.floor(startX + ((width - 1) * invCellPx));
        const minCellY = Math.floor(startY);
        const maxCellY = Math.floor(startY + ((height - 1) * invCellPx));
        const cellsX = Math.max(1, maxCellX - minCellX + 1);
        const cellsY = Math.max(1, maxCellY - minCellY + 1);

        const grid = buildCellGrid(source, config, padX, padY, minCellX, minCellY, cellsX, cellsY);
        const inFrame = grid.inFrame;
        const radiusMod = grid.radiusMod;
        const invertedCell = grid.inverted;
        const cellColors = grid.colors;

        const back = parseColorUnit(config.colorBack, { r: 242, g: 241, b: 232 });
        const front = parseColorUnit(config.colorFront, { r: 43, g: 43, b: 43 });
        const backRed = back.r * 255;
        const backGreen = back.g * 255;
        const backBlue = back.b * 255;
        const backPixel = packPixel((backRed + 0.5) | 0, (backGreen + 0.5) | 0, (backBlue + 0.5) | 0);
        const frontRed = front.r * 255;
        const frontGreen = front.g * 255;
        const frontBlue = front.b * 255;

        const useGrain = config.grainMixer > 0;
        const useGrainOverlay = config.grainOverlay > 0;
        const tile = (useGrain || useGrainOverlay) ? getGrainTile() : null;
        const grainScale = mix(2000, 200, config.grainSize);
        const grainScaleY = grainScale / imageAspect;
        const grainStepX = grainScale / drawRect.width;
        const grainStartX = (((0.5 - drawRect.x) / drawRect.width) - 0.5) * grainScale;
        const invGrainRange = 1 / ((0.7 + (0.2 * config.grainMixer)) - 0.55);

        
        const columnCell = new Int32Array(width);
        const columnDeltaSq = new Float32Array(width);
        const grainColumnIndex0 = tile ? new Int32Array(width) : null;
        const grainColumnIndex1 = tile ? new Int32Array(width) : null;
        const grainColumnFraction = tile ? new Float32Array(width) : null;

        for (let x = 0; x < width; x += 1) {
            const pixelX = startX + (x * invCellPx);
            const cellX = Math.floor(pixelX);
            const deltaX = (pixelX - cellX) - 0.5;
            columnCell[x] = cellX - minCellX;
            columnDeltaSq[x] = deltaX * deltaX;

            if (tile) {
                const grainX = grainStartX + (x * grainStepX) + 0.5;
                const grainIntX = Math.floor(grainX);
                const grainFractionX = grainX - grainIntX;
                grainColumnIndex0[x] = grainIntX & GRAIN_TILE_MASK;
                grainColumnIndex1[x] = (grainIntX + 1) & GRAIN_TILE_MASK;
                grainColumnFraction[x] = grainFractionX * grainFractionX * (3 - (2 * grainFractionX));
            }
        }

        const cosOne = Math.cos(1);
        const sinOne = Math.sin(1);
        const cosTwo = Math.cos(2);
        const sinTwo = Math.sin(2);
        const overlayStepFirstX = grainStepX * cosOne;
        const overlayStepFirstY = grainStepX * sinOne;
        const overlayStepSecondX = grainStepX * cosTwo;
        const overlayStepSecondY = grainStepX * sinTwo;
        const overlayShapeTable = useGrainOverlay ? getPowTable(1.3) : null;
        const overlayStrengthTable = useGrainOverlay ? getPowTable(0.8) : null;

        for (let y = 0; y < height; y += 1) {
            const pixelY = startY + (y * invCellPx);
            const cellY = Math.floor(pixelY);
            const rowIndex = cellY - minCellY;
            const deltaY = (pixelY - cellY) - 0.5;
            const deltaYSq = deltaY * deltaY;
            const rowInside = rowIndex >= 0 && rowIndex < grid.cellsY;
            const rowOffset = rowIndex * grid.cellsX;
            let index = y * width;

            let grainRow0 = 0;
            let grainRow1 = 0;
            let grainFractionY = 0;
            let grainUvY = 0;
            let overlayFirstX = 0;
            let overlayFirstY = 0;
            let overlaySecondX = 0;
            let overlaySecondY = 0;

            if (tile) {
                const imageV = (y + 0.5 - drawRect.y) / drawRect.height;
                grainUvY = ((imageV - 0.5) * grainScaleY) + 0.5;
                const grainIntY = Math.floor(grainUvY);
                const fractionY = grainUvY - grainIntY;
                grainRow0 = (((grainIntY % GRAIN_TILE_SIZE) + GRAIN_TILE_SIZE) % GRAIN_TILE_SIZE) * GRAIN_TILE_SIZE;
                grainRow1 = ((((grainIntY + 1) % GRAIN_TILE_SIZE) + GRAIN_TILE_SIZE) % GRAIN_TILE_SIZE) * GRAIN_TILE_SIZE;
                grainFractionY = fractionY * fractionY * (3 - (2 * fractionY));

                if (useGrainOverlay) {
                    const grainUvXStart = grainStartX + 0.5;
                    overlayFirstX = (grainUvXStart * cosOne) - (grainUvY * sinOne) + 3;
                    overlayFirstY = (grainUvXStart * sinOne) + (grainUvY * cosOne) + 3;
                    overlaySecondX = (grainUvXStart * cosTwo) - (grainUvY * sinTwo) - 1;
                    overlaySecondY = (grainUvXStart * sinTwo) + (grainUvY * cosTwo) - 1;
                }
            }

            for (let x = 0; x < width; x += 1) {
                let shape = 0;
                let cellIndex = -1;

                if (rowInside) {
                    const columnIndex = columnCell[x];

                    if (columnIndex >= 0 && columnIndex < grid.cellsX) {
                        cellIndex = rowOffset + columnIndex;

                        if (inFrame[cellIndex]) {
                            const distance = Math.sqrt(columnDeltaSq[x] + deltaYSq);
                            const rawEdge = (distance - radiusMod[cellIndex] + antialias) * invAntialiasRange;
                            const edge = rawEdge < 0 ? 0 : (rawEdge > 1 ? 1 : rawEdge);
                            const circle = 1 - (edge * edge * (3 - (2 * edge)));
                            shape = invertedCell[cellIndex] ? 1 - circle : circle;
                        }
                    }
                }

                if (shape === 0 && !useGrainOverlay) {
                    buffer[index] = backPixel;
                    index += 1;
                    continue;
                }

                let finalShape = shape > 1 ? 1 : shape;

                if (useGrain) {
                    const column0 = grainColumnIndex0[x];
                    const column1 = grainColumnIndex1[x];
                    const fractionX = grainColumnFraction[x];
                    const top = mix(tile[grainRow0 + column0], tile[grainRow0 + column1], fractionX);
                    const bottom = mix(tile[grainRow1 + column0], tile[grainRow1 + column1], fractionX);
                    const noise = mix(top, bottom, grainFractionY);
                    const edge = clamp01((noise - 0.55) * invGrainRange);
                    const grain = edge * edge * (3 - (2 * edge)) * config.grainMixer;
                    finalShape = finalShape * (1 - grain);
                }

                let red = 0;
                let green = 0;
                let blue = 0;

                if (config.originalColors) {
                    
                    const ratio = shape >= 0.0001 ? 1 : shape * 10000;
                    const coverage = ratio * finalShape;
                    const colorIndex = cellIndex >= 0 ? cellIndex * 3 : 0;
                    const inverseCoverage = 1 - coverage;

                    red = (cellColors[colorIndex] * coverage * 255) + (backRed * inverseCoverage);
                    green = (cellColors[colorIndex + 1] * coverage * 255) + (backGreen * inverseCoverage);
                    blue = (cellColors[colorIndex + 2] * coverage * 255) + (backBlue * inverseCoverage);
                } else {
                    const inverseShape = 1 - finalShape;
                    red = (frontRed * finalShape) + (backRed * inverseShape);
                    green = (frontGreen * finalShape) + (backGreen * inverseShape);
                    blue = (frontBlue * finalShape) + (backBlue * inverseShape);
                }

                if (useGrainOverlay) {
                    const overlay = lookupPow(overlayShapeTable, mix(
                        valueNoise(tile, overlayFirstX, overlayFirstY),
                        valueNoise(tile, overlaySecondX, overlaySecondY),
                        0.5
                    ));

                    const signedOverlay = (overlay * 2) - 1;
                    const overlayColor = signedOverlay >= 0 ? 255 : 0;
                    const strength = lookupPow(
                        overlayStrengthTable,
                        config.grainOverlay * Math.abs(signedOverlay)
                    ) * 0.5;

                    red = mix(red, overlayColor, strength);
                    green = mix(green, overlayColor, strength);
                    blue = mix(blue, overlayColor, strength);

                    overlayFirstX += overlayStepFirstX;
                    overlayFirstY += overlayStepFirstY;
                    overlaySecondX += overlayStepSecondX;
                    overlaySecondY += overlayStepSecondY;
                }

                buffer[index] = packPixel(
                    ((red + 0.5) | 0) & 255,
                    ((green + 0.5) | 0) & 255,
                    ((blue + 0.5) | 0) & 255
                );
                index += 1;
            }
        }

        context.putImageData(imageData, 0, 0);
    };

    const loadImage = (src) => new Promise((resolve, reject) => {
        if (!src) {
            reject(new Error('missing-image'));
            return;
        }

        const image = new Image();
        image.decoding = 'async';

        if (/^https?:\/\//i.test(src)) {
            image.crossOrigin = 'anonymous';
        }

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image-load-failed'));
        image.src = src;

        if (image.complete && image.naturalWidth > 0) {
            resolve(image);
        }
    });

    const mountHalftone = (stage, canvas, rawConfig) => {
        const config = normalizeConfig(rawConfig || {});
        let destroyed = false;
        let animationFrame = 0;
        let resizeObserver = null;
        let source = null;

        const scheduleRender = () => {
            if (destroyed || !source) {
                return;
            }

            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }

            animationFrame = window.requestAnimationFrame(() => {
                if (!destroyed) {
                    stage.classList.remove('is-loading', 'is-error');
                    renderHalftoneFrame(stage, canvas, source, config);
                }
            });
        };

        const onResize = () => {
            scheduleRender();
        };

        stage.classList.add('is-loading');

        loadImage(config.imageUrl)
            .then((image) => {
                if (destroyed) {
                    return;
                }

                source = createSource(image);

                if (!source) {
                    throw new Error('image-source-failed');
                }

                scheduleRender();

                if ('ResizeObserver' in window) {
                    resizeObserver = new ResizeObserver(onResize);
                    resizeObserver.observe(stage);
                }

                window.addEventListener('resize', onResize);
                window.addEventListener('orientationchange', onResize);
            })
            .catch(() => {
                if (destroyed) {
                    return;
                }

                stage.classList.remove('is-loading');
                stage.classList.add('is-error');
            });

        return () => {
            destroyed = true;

            if (animationFrame) {
                window.cancelAnimationFrame(animationFrame);
            }

            if (resizeObserver) {
                resizeObserver.disconnect();
            }

            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    };

    const instances = new WeakMap();

    const initStage = (stage) => {
        if (!stage || instances.has(stage)) {
            return;
        }

        const canvas = stage.querySelector('.js-shader-halftone-canvas');
        if (!canvas) {
            return;
        }

        let config = {};

        try {
            config = JSON.parse(stage.getAttribute('data-halftone-config') || '{}');
        } catch (error) {
            stage.classList.add('is-error');
            return;
        }

        instances.set(stage, mountHalftone(stage, canvas, config));
    };

    const initAllHalftones = (root = document) => {
        root.querySelectorAll('.js-shader-halftone').forEach((stage) => {
            initStage(stage);
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        initAllHalftones();

        if ('MutationObserver' in window) {
            const observer = new MutationObserver((entries) => {
                entries.forEach((entry) => {
                    entry.addedNodes.forEach((node) => {
                        if (!(node instanceof HTMLElement)) {
                            return;
                        }

                        if (node.matches('.js-shader-halftone')) {
                            initStage(node);
                            return;
                        }

                        initAllHalftones(node);
                    });
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }
    });
})();

;
(function () {
    'use strict';

    

    var BLOCK_SELECTOR = '.home-servicios';
    var ITEM_SELECTOR = '.card-servicio-article';
    var VISIBLE_CLASS = 'is-visible';
    var DELAYS = ['0s', '0.15s', '0.3s'];

    function initBloque(bloque, observer) {
        var items = bloque.querySelectorAll(ITEM_SELECTOR);

        for (var i = 0; i < items.length; i++) {
            items[i].style.setProperty('--item-delay', DELAYS[i % DELAYS.length]);
            observer.observe(items[i]);
        }
    }

    function init() {
        var bloques = document.querySelectorAll(BLOCK_SELECTOR);
        if (!bloques.length) return;

        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add(VISIBLE_CLASS);
                    observer.unobserve(entries[i].target);
                }
            }
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });

        for (var i = 0; i < bloques.length; i++) {
            initBloque(bloques[i], observer);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

;
(function () {
    'use strict';

    var BLOCK_SELECTOR = '.home-bloque-dark-mode';
    var TRIGGER_SELECTOR = '.home-bloque-dark-mode__descripcion';
    var BODY_DARK_CLASS = 'is-dark';
    var SWITCHING_CLASS = 'theme-switching';
    var SWITCHING_DURATION = 850;

    
    var TITULO_WRAP_SELECTOR = '.js-home-bloque-dark-mode-titulo';
    var TITULO_SELECTOR = '.home-bloque-dark-mode__titulo';
    var SELECCION_SELECTOR = '.home-bloque-dark-mode__seleccion';
    var CARD_SELECTOR = '.home-bloque-dark-mode__card';
    var DRAG_AREA_SELECTOR = '.js-home-bloque-dark-mode-drag-area';
    var CONTENIDO_SELECTOR = '.home-bloque-dark-mode__contenido';
    var PARRAFOS_SELECTOR = '.home-bloque-dark-mode__parrafos';
    var DRAGGABLE_CLASS = 'is-draggable';
    var DRAGGING_CLASS = 'is-dragging';
    var DRAG_MIN_WIDTH = 1024; 
    var RESIZE_DEBOUNCE = 150;

    
    var TRIGGER_ROOT_MARGIN = '0px';

    
    var switchingTimeout = null;

    function setDarkMode(activar) {
        var body = document.body;

        if (activar === body.classList.contains(BODY_DARK_CLASS)) {
            return;
        }

        body.classList.add(SWITCHING_CLASS);

        if (activar) {
            body.classList.add(BODY_DARK_CLASS);
        } else {
            body.classList.remove(BODY_DARK_CLASS);
        }

        if (switchingTimeout) {
            clearTimeout(switchingTimeout);
        }

        switchingTimeout = setTimeout(function () {
            body.classList.remove(SWITCHING_CLASS);
            switchingTimeout = null;
        }, SWITCHING_DURATION);
    }

    
    function initDarkModeToggle(blocks) {
        if (!blocks.length) return;

        
        var targets = [];
        for (var b = 0; b < blocks.length; b++) {
            var trigger = blocks[b].querySelector(TRIGGER_SELECTOR) || blocks[b];
            targets.push(trigger);
        }

        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                setDarkMode(entries[i].isIntersecting);
            }
        }, {
            root: null,
            rootMargin: TRIGGER_ROOT_MARGIN,
            threshold: 0
        });

        for (var t = 0; t < targets.length; t++) {
            observer.observe(targets[t]);
        }
    }

    
    function initDragTitulo(block) {
        if (!window.PointerEvent) return;

        var wrap = block.querySelector(TITULO_WRAP_SELECTOR);
        var card = block.querySelector(CARD_SELECTOR);
        var dragArea = block.querySelector(DRAG_AREA_SELECTOR);
        var contenido = block.querySelector(CONTENIDO_SELECTOR);
        var parrafos = block.querySelector(PARRAFOS_SELECTOR);

        if (!wrap || !card) return;

        var mq = window.matchMedia('(min-width: ' + DRAG_MIN_WIDTH + 'px)');
        var enabled = false;

        
        var currentX = 0;
        var currentY = 0;

        
        var activePointerId = null;
        var startMouseX = 0, startMouseY = 0;
        var startOffsetX = 0, startOffsetY = 0;
        
        var pendingX = 0, pendingY = 0;
        
        var minX = 0, maxX = 0, minY = 0, maxY = 0;
        var rafId = null;
        var resizeTimeout = null;

        function aplicarPosicion() {
            if (currentX === 0 && currentY === 0) {
                wrap.style.transform = '';
                return;
            }

            wrap.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0)';
        }

        function resetPosicion() {
            currentX = 0;
            currentY = 0;
            aplicarPosicion();
        }

        
        function getRectVisual() {
            var titulo = wrap.querySelector(TITULO_SELECTOR);
            var rect = titulo ? titulo.getBoundingClientRect() : wrap.getBoundingClientRect();

            if (titulo && titulo.textContent.trim()) {
                var range = document.createRange();
                range.selectNodeContents(titulo);

                var textRect = range.getBoundingClientRect();

                if (textRect.width > 0 && textRect.height > 0) {
                    rect = textRect;
                }
            }

            var top = rect.top;
            var left = rect.left;
            var right = rect.right;
            var bottom = rect.bottom;
            var seleccion = wrap.querySelector(SELECCION_SELECTOR);

            if (seleccion) {
                var selRect = seleccion.getBoundingClientRect();

                if (selRect.width > 0 && selRect.height > 0) {
                    top = Math.min(top, selRect.top);
                    left = Math.min(left, selRect.left);
                    right = Math.max(right, selRect.right);
                    bottom = Math.max(bottom, selRect.bottom);
                }
            }

            return { top: top, left: left, width: right - left, height: bottom - top };
        }

        
        function getAreaSegura() {
            var cardRect = card.getBoundingClientRect();

            if (dragArea) {
                var dragAreaRect = dragArea.getBoundingClientRect();

                if (dragAreaRect.width > 0 && dragAreaRect.height > 0) {
                    return {
                        top: Math.max(cardRect.top, dragAreaRect.top),
                        left: Math.max(cardRect.left, dragAreaRect.left),
                        right: Math.min(cardRect.right, dragAreaRect.right),
                        bottom: Math.min(cardRect.bottom, dragAreaRect.bottom)
                    };
                }
            }

            var contenidoRect = contenido ? contenido.getBoundingClientRect() : cardRect;
            var parrafosRect = parrafos ? parrafos.getBoundingClientRect() : null;

            var left = Math.max(cardRect.left, contenidoRect.left);
            var right = Math.min(cardRect.right, contenidoRect.right);
            var top = Math.max(cardRect.top, contenidoRect.top);
            var bottom = parrafosRect ? parrafosRect.top : Math.min(cardRect.bottom, contenidoRect.bottom);

            return { top: top, left: left, right: right, bottom: bottom };
        }

        
        function dragTick() {
            rafId = null;

            var dx = pendingX - startMouseX;
            var dy = pendingY - startMouseY;

            currentX = Math.max(minX, Math.min(startOffsetX + dx, maxX));
            currentY = Math.max(minY, Math.min(startOffsetY + dy, maxY));

            aplicarPosicion();
        }

        function onPointerDown(e) {
            if (activePointerId !== null) return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            e.preventDefault();

            activePointerId = e.pointerId;
            startMouseX = e.clientX;
            startMouseY = e.clientY;
            pendingX = e.clientX;
            pendingY = e.clientY;
            startOffsetX = currentX;
            startOffsetY = currentY;

            
            var visual = getRectVisual();
            var area = getAreaSegura();
            
            var baseLeft = visual.left - currentX;
            var baseTop = visual.top - currentY;

            minX = area.left - baseLeft;
            maxX = area.right - visual.width - baseLeft;
            minY = area.top - baseTop;
            maxY = area.bottom - visual.height - baseTop;

            
            if (maxX < minX) {
                minX = currentX;
                maxX = currentX;
            }

            if (maxY < minY) {
                minY = currentY;
                maxY = currentY;
            }

            if (wrap.setPointerCapture) {
                try {
                    wrap.setPointerCapture(e.pointerId);
                } catch (err) {}
            }

            wrap.classList.add(DRAGGING_CLASS);

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointercancel', onPointerUp);
        }

        function onPointerMove(e) {
            if (e.pointerId !== activePointerId) return;

            
            pendingX = e.clientX;
            pendingY = e.clientY;

            if (rafId === null) {
                rafId = window.requestAnimationFrame(dragTick);
            }
        }

        function onPointerUp(e) {
            if (e && e.pointerId !== activePointerId) return;
            endDrag();
        }

        function endDrag() {
            if (activePointerId === null) return;

            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
                rafId = null;
            }

            if (wrap.releasePointerCapture) {
                try {
                    wrap.releasePointerCapture(activePointerId);
                } catch (err) {}
            }

            activePointerId = null;
            wrap.classList.remove(DRAGGING_CLASS);

            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointercancel', onPointerUp);
        }

        
        function onResize() {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }

            resizeTimeout = setTimeout(function () {
                resizeTimeout = null;
                endDrag();
                resetPosicion();
            }, RESIZE_DEBOUNCE);
        }

        function enable() {
            if (enabled) return;

            enabled = true;
            wrap.classList.add(DRAGGABLE_CLASS);
            wrap.addEventListener('pointerdown', onPointerDown);
            window.addEventListener('resize', onResize);
        }

        function disable() {
            if (!enabled) return;

            enabled = false;
            endDrag();
            resetPosicion();
            wrap.classList.remove(DRAGGABLE_CLASS);
            wrap.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('resize', onResize);

            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
                resizeTimeout = null;
            }
        }

        function sync() {
            if (mq.matches) {
                enable();
            } else {
                disable();
            }
        }

        sync();

        if (mq.addEventListener) {
            mq.addEventListener('change', sync);
        } else if (mq.addListener) {
            mq.addListener(sync);
        }
    }

    
    function init() {
        var blocks = document.querySelectorAll(BLOCK_SELECTOR);

        if (!blocks.length) return;

        initDarkModeToggle(blocks);

        for (var i = 0; i < blocks.length; i++) {
            initDragTitulo(blocks[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

;
(function () {
    'use strict';

    var BLOQUE_SELECTOR = '.home-equipo';
    var GRID_SELECTOR = '.js-home-equipo-grilla';
    var COMENTARIO_SELECTOR = '.js-home-equipo-comentario';
    var INTEGRANTE_SELECTOR = '.js-home-equipo-integrante';
    var SELECCION_SELECTOR = '.js-home-equipo-seleccion';
    var TITULO_WRAP_SELECTOR = '.home-equipo__titulo-wrap';
    var TITULO_HIGHLIGHT_SELECTOR = '.home-equipo__titulo .js-home-equipo-highlight, .home-equipo__titulo strong';
    var ENTRY_STAGGER_MAX = 300;   
    var ENTRY_STAGGER_BASE = 1800; 

    
    
    function initInteractiveGrid(bloque) {
        var gridContainer = bloque.querySelector(GRID_SELECTOR);
        if (!gridContainer || !window.onlinesGrillaCeldas) return;

        window.onlinesGrillaCeldas.init({ contenedor: gridContainer });
    }

    
    function initBloque() {
        var bloque = document.querySelector(BLOQUE_SELECTOR);
        if (!bloque) return;

        
        initInteractiveGrid(bloque);

        var comentarios = bloque.querySelectorAll(COMENTARIO_SELECTOR);
        var integrantes = bloque.querySelectorAll(INTEGRANTE_SELECTOR);
        var seleccion = bloque.querySelector(SELECCION_SELECTOR);

        positionSelectionOnStrong(bloque, seleccion);

        window.addEventListener('resize', function () {
            positionSelectionOnStrong(bloque, seleccion);
        });

        if ('IntersectionObserver' in window) {
            
            observeElementsOnEnter(comentarios);
            observeElementsOnEnter(integrantes);
            observeSelectionOnEnter(bloque, seleccion);
        } else {
            revealAll(comentarios, integrantes, seleccion);
        }
    }

    
    function scaledDelay(el) {
        var raw = parseInt(el.getAttribute('data-delay'), 10) || 0;
        return Math.round(raw / ENTRY_STAGGER_BASE * ENTRY_STAGGER_MAX);
    }

    
    function observeElementsOnEnter(elementos) {
        if (!elementos.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                observer.unobserve(el);
                setTimeout(function () {
                    el.classList.add('is-visible');
                }, scaledDelay(el));
            });
        }, { threshold: 0.35 });

        elementos.forEach(function (el) {
            observer.observe(el);
        });
    }

    
    function observeSelectionOnEnter(bloque, seleccion) {
        if (!seleccion) return;

        var tituloWrap = bloque.querySelector(TITULO_WRAP_SELECTOR);
        if (!tituloWrap) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                
                positionSelectionOnStrong(bloque, seleccion);
                startSeleccionAnimation(seleccion);
            });
        }, { threshold: 0.5 });

        observer.observe(tituloWrap);
    }

    
    function revealAll(comentarios, integrantes, seleccion) {
        comentarios.forEach(function (el) { el.classList.add('is-visible'); });
        integrantes.forEach(function (el) { el.classList.add('is-visible'); });
        if (seleccion) startSeleccionAnimation(seleccion);
    }

    
    function positionSelectionOnStrong(bloque, seleccion) {
        if (!bloque || !seleccion) return;

        var tituloWrap = bloque.querySelector(TITULO_WRAP_SELECTOR);
        var strongTarget = bloque.querySelector(TITULO_HIGHLIGHT_SELECTOR);

        if (!tituloWrap || !strongTarget) return;

        var wrapRect = tituloWrap.getBoundingClientRect();
        var strongRect = strongTarget.getBoundingClientRect();

        if (!wrapRect.width || !strongRect.width) return;

        var paddingX = 4;
        var paddingY = 6;
        var left = strongRect.left - wrapRect.left - paddingX;
        var top = strongRect.top - wrapRect.top - paddingY;
        var width = strongRect.width + (paddingX * 2);
        var height = strongRect.height + (paddingY * 2);

        seleccion.style.left = left + 'px';
        seleccion.style.top = top + 'px';
        seleccion.style.width = width + 'px';
        seleccion.style.height = height + 'px';
    }

    
    function startSeleccionAnimation(seleccion) {
        
        seleccion.classList.add('is-selecting');

        var fondo = seleccion.querySelector('.home-equipo__seleccion-fondo');
        if (fondo) {
            fondo.addEventListener('animationend', function onHighlightEnd() {
                fondo.removeEventListener('animationend', onHighlightEnd);

                
                seleccion.classList.remove('is-selecting');
                seleccion.classList.add('is-selected');
            });
        }
    }

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBloque);
    } else {
        initBloque();
    }
})();

;
(function () {
    'use strict';

    var BLOQUE_SELECTOR   = '.slider-logos';
    var SLIDER_SELECTOR   = '.js-slider-logos';
    var IMG_SELECTOR      = '.slider-logos__img[data-width-mobile]';

    var WATCHDOG_INTERVAL = 1500; 
    var WATCHDOG_MIN_SHIFT = 5;   

    
    function applyLogoMobileWidths(bloque) {
        var isMobile = window.matchMedia('(max-width: 1023px)').matches;
        var imgs = bloque.querySelectorAll(IMG_SELECTOR);
        imgs.forEach(function (img) {
            if (isMobile) {
                img.style.width = img.getAttribute('data-width-mobile') + 'px';
            } else {
                img.style.width = img.getAttribute('width') + 'px';
            }
        });
    }

    
    function initLogoSlider(bloque) {
        var swiperContainer = bloque.querySelector(SLIDER_SELECTOR);
        if (!swiperContainer) return;

        
        if (typeof Swiper === 'undefined') return;

        var hasAutoplay = swiperContainer.getAttribute('data-autoplay') !== 'false';

        var swiper = new Swiper(swiperContainer, {
            loop: true,

            autoplay: hasAutoplay ? {
                delay: 0,
                disableOnInteraction: false,
            } : false,

            speed: 5000,
            slidesPerView: 'auto',
            spaceBetween: 77,
            allowTouchMove: false,

            
            simulateTouch: false,

            freeMode: true,
        });

        if (hasAutoplay) {
            guardLogoAutoplay(swiper, swiperContainer);
        }
    }

    
    function guardLogoAutoplay(swiper, swiperContainer) {
        var wrapper = swiperContainer.querySelector('.swiper-wrapper');
        if (!wrapper) return;

        var lastTranslate = null;
        var intervalId;

        function rearm() {
            if (swiper.destroyed || !swiper.autoplay || !swiper.autoplay.running) return;
            if (document.hidden) return;

            
            swiper.animating = false;
            swiper.autoplay.resume();
        }

        
        wrapper.addEventListener('transitioncancel', function (event) {
            if (event.target !== wrapper) return;
            rearm();
        });

        
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) rearm();
        });

        
        intervalId = setInterval(function () {
            if (swiper.destroyed) {
                clearInterval(intervalId);
                return;
            }
            if (document.hidden || !swiper.autoplay || !swiper.autoplay.running) {
                lastTranslate = null;
                return;
            }

            var current = wrapperTranslateX(wrapper);

            
            if (lastTranslate !== null && Math.abs(current - lastTranslate) < WATCHDOG_MIN_SHIFT) {
                rearm();
            }

            lastTranslate = current;
        }, WATCHDOG_INTERVAL);
    }

    
    function wrapperTranslateX(wrapper) {
        var transform = window.getComputedStyle(wrapper).transform;
        if (!transform || transform === 'none') return 0;

        var valores = transform.match(/matrix3d\((.+)\)/);
        if (valores) return parseFloat(valores[1].split(',')[12]) || 0;

        valores = transform.match(/matrix\((.+)\)/);
        if (valores) return parseFloat(valores[1].split(',')[4]) || 0;

        return 0;
    }

    
    function initBloques() {
        var bloques = document.querySelectorAll(BLOQUE_SELECTOR);
        if (!bloques.length) return;

        bloques.forEach(function (bloque) {
            applyLogoMobileWidths(bloque);
            initLogoSlider(bloque);
        });

        window.addEventListener('resize', function () {
            bloques.forEach(function (bloque) { applyLogoMobileWidths(bloque); });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBloques);
    } else {
        initBloques();
    }
})();

;
(function () {
    'use strict';

    var BLOQUE_SELECTOR       = '.home-portfolio';
    var TARJETAS_SELECTOR     = '.js-home-portfolio-tarjetas';
    var PROYECTO_SELECTOR     = '.js-home-portfolio-proyecto';
    var COMENTARIO_SELECTOR   = '.js-home-portfolio-comentario';
    var APP_SELECTOR          = '.js-home-portfolio-app';
    var TITULO_SELECTOR       = '.home-portfolio__titulo';

    var ENTRY_STAGGER_MAX     = 300; 
    var ENTRY_STAGGER_BASE    = 700; 
    var TARJETAS_ENTRY_DELAY  = 150; 

    
    function initBloque() {
        var bloque = document.querySelector(BLOQUE_SELECTOR);
        if (!bloque) return;

        var tarjetas    = bloque.querySelector(TARJETAS_SELECTOR);
        var proyectos   = bloque.querySelectorAll(PROYECTO_SELECTOR);
        var comentarios = bloque.querySelectorAll(COMENTARIO_SELECTOR);
        var apps        = bloque.querySelectorAll(APP_SELECTOR);
        var titulo      = bloque.querySelector(TITULO_SELECTOR);

        
        if ('IntersectionObserver' in window) {
            observeTituloOnEnter(bloque, titulo);
            observeTarjetasOnEnter(tarjetas);
            observeElementsOnEnter(proyectos);
            observeElementsOnEnter(comentarios);
            observeElementsOnEnter(apps);
        } else {
            
            revealAll(bloque, tarjetas, proyectos, comentarios, apps);
        }
    }

    

    
    function scaledDelay(el) {
        var raw = parseInt(el.getAttribute('data-delay'), 10) || 0;
        return Math.round(raw / ENTRY_STAGGER_BASE * ENTRY_STAGGER_MAX);
    }

    
    function observeElementsOnEnter(elementos) {
        if (!elementos.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                observer.unobserve(el);
                setTimeout(function () {
                    el.classList.add('is-visible');
                }, scaledDelay(el));
            });
        }, { threshold: 0.35 });

        elementos.forEach(function (el) {
            observer.observe(el);
        });
    }

    
    function observeTarjetasOnEnter(tarjetas) {
        if (!tarjetas) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                setTimeout(function () {
                    tarjetas.classList.add('is-fanned');
                }, TARJETAS_ENTRY_DELAY);
            });
        }, { threshold: 0.25 });

        observer.observe(tarjetas);
    }

    
    function observeTituloOnEnter(bloque, titulo) {
        if (!titulo) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                bloque.classList.add('is-animated');
            });
        }, { threshold: 0.5 });

        observer.observe(titulo);
    }

    
    function revealAll(bloque, tarjetas, proyectos, comentarios, apps) {
        bloque.classList.add('is-animated');
        if (tarjetas) tarjetas.classList.add('is-fanned');
        proyectos.forEach(function (el) { el.classList.add('is-visible'); });
        comentarios.forEach(function (el) { el.classList.add('is-visible'); });
        apps.forEach(function (el) { el.classList.add('is-visible'); });
    }

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBloque);
    } else {
        initBloque();
    }
})();

;
(() => {
    'use strict';

    const TITLE_SELECTOR = '.js-card-noticia-titulo';
    const LINE_CLASS = 'card-noticia__titulo-linea';
    const LINE_TEXT_CLASS = 'card-noticia__titulo-linea-texto';
    const LINE_RULE_CLASS = 'card-noticia__titulo-puntos';
    const MEASURE_CLASS = 'card-noticia__titulo-measure';
    const WORD_CLASS = 'card-noticia__titulo-palabra';
    const WIDTH_EPSILON = 1;

    const normalizeTitle = (text) => text.replace(/\s+/g, ' ').trim();

    const getOriginalTitle = (titleElement) => {
        const storedTitle = titleElement.dataset.cardNoticiaTitle || '';

        if (storedTitle) {
            return storedTitle;
        }

        const fallbackTitle = normalizeTitle(titleElement.textContent || '');
        titleElement.dataset.cardNoticiaTitle = fallbackTitle;

        return fallbackTitle;
    };

    const createMeasureNode = (originalTitle) => {
        const measureNode = document.createElement('span');
        measureNode.className = MEASURE_CLASS;
        measureNode.setAttribute('aria-hidden', 'true');

        const words = originalTitle.split(' ');

        words.forEach((word, index) => {
            const wordNode = document.createElement('span');
            wordNode.className = WORD_CLASS;
            wordNode.textContent = word;
            measureNode.appendChild(wordNode);

            if (index < words.length - 1) {
                measureNode.appendChild(document.createTextNode(' '));
            }
        });

        return measureNode;
    };

    const getWrappedLines = (measureNode) => {
        const wordNodes = Array.from(measureNode.querySelectorAll('.' + WORD_CLASS));

        if (!wordNodes.length) {
            return [];
        }

        const lines = [];
        let currentTop = null;
        let currentWords = [];

        wordNodes.forEach((wordNode) => {
            const wordTop = Math.round(wordNode.offsetTop);

            if (currentTop === null || Math.abs(wordTop - currentTop) <= WIDTH_EPSILON) {
                currentWords.push(wordNode.textContent || '');
                currentTop = currentTop === null ? wordTop : currentTop;
                return;
            }

            lines.push(currentWords.join(' '));
            currentWords = [wordNode.textContent || ''];
            currentTop = wordTop;
        });

        if (currentWords.length) {
            lines.push(currentWords.join(' '));
        }

        return lines;
    };

    const renderWrappedLines = (titleElement, lines) => {
        const fragment = document.createDocumentFragment();

        lines.forEach((lineText) => {
            const lineNode = document.createElement('span');
            lineNode.className = LINE_CLASS;

            const textNode = document.createElement('span');
            textNode.className = LINE_TEXT_CLASS;
            textNode.textContent = lineText + ' ';

            const ruleNode = document.createElement('span');
            ruleNode.className = LINE_RULE_CLASS;
            ruleNode.setAttribute('aria-hidden', 'true');

            lineNode.append(textNode, ruleNode);
            fragment.appendChild(lineNode);
        });

        titleElement.replaceChildren(fragment);
    };

    const splitTitleIntoLines = (titleElement) => {
        const originalTitle = getOriginalTitle(titleElement);

        if (!originalTitle) {
            return;
        }

        const measureNode = createMeasureNode(originalTitle);
        titleElement.replaceChildren(measureNode);

        const lines = getWrappedLines(measureNode);

        if (!lines.length) {
            titleElement.textContent = originalTitle;
            return;
        }

        renderWrappedLines(titleElement, lines);
    };

    const scheduleSplit = (titleElement) => {
        if (titleElement.cardNoticiaFrame) {
            cancelAnimationFrame(titleElement.cardNoticiaFrame);
        }

        titleElement.cardNoticiaFrame = requestAnimationFrame(() => {
            splitTitleIntoLines(titleElement);
            titleElement.cardNoticiaFrame = null;
        });
    };

    const observeWidthChanges = (titleElement) => {
        const observedElement = titleElement.closest('.card-noticia__contenido') || titleElement;

        if ('ResizeObserver' in window) {
            let lastWidth = Math.round(observedElement.getBoundingClientRect().width);
            const resizeObserver = new ResizeObserver((entries) => {
                const nextWidth = Math.round(entries[0].contentRect.width);

                if (!nextWidth || nextWidth === lastWidth) {
                    return;
                }

                lastWidth = nextWidth;
                scheduleSplit(titleElement);
            });

            resizeObserver.observe(observedElement);
            return;
        }

        const onResize = () => scheduleSplit(titleElement);
        window.addEventListener('resize', onResize, { passive: true });
    };

    const initTitle = (titleElement) => {
        scheduleSplit(titleElement);
        observeWidthChanges(titleElement);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready
                .then(() => {
                    scheduleSplit(titleElement);
                })
                .catch(() => {});
        }
    };

    const init = () => {
        const titleElements = document.querySelectorAll(TITLE_SELECTOR);

        if (!titleElements.length) {
            return;
        }

        titleElements.forEach(initTitle);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    init();
})();

;
(function () {
    'use strict';

    if (!document.body.classList.contains('home')) return;

    var ITEM_SELECTOR = '.ultimas-noticias .card-noticia-article';
    var VISIBLE_CLASS = 'is-visible';
    var DELAYS = ['0s', '0.15s', '0.3s'];

    function init() {
        var items = document.querySelectorAll(ITEM_SELECTOR);
        if (!items.length) return;

        var observer = new IntersectionObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add(VISIBLE_CLASS);
                    observer.unobserve(entries[i].target);
                }
            }
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -60px 0px'
        });

        for (var i = 0; i < items.length; i++) {
            items[i].style.setProperty('--item-delay', DELAYS[i % DELAYS.length]);
            observer.observe(items[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

;
(function () {
    'use strict';

    var BLOCK_SELECTOR    = '.home-contacto';
    var DOTS_SELECTOR     = '.js-home-contacto-dots';
    var CARD_SELECTOR     = '.js-home-contacto-card';
    var CHAT_SELECTOR     = '.js-home-contacto-chat';
    var AA_SELECTOR       = '.js-home-contacto-aa';
    var APP_SELECTOR      = '.js-home-contacto-app';
    var CURSOR_SELECTOR   = '.js-home-contacto-cursor';
    var ANIM_AREA_SELECTOR = '.home-contacto__animaciones';
    var TITULO_SELECTOR   = '.home-contacto__titulo';

    var ENTRY_STAGGER_MAX  = 300; 
    var ENTRY_STAGGER_BASE = 480; 
    var CURSOR_LOOP_DELAY  = 380; 

    var CURSOR_WAYPOINTS = [
        { x: 0.41, y: 0.35, pause: 450 },
        { x: 0.20, y: 0.16, pause: 760, click: true },
        { x: 0.57, y: 0.17, pause: 540 },
        { x: 0.89, y: 0.20, pause: 720, click: true },
        { x: 0.82, y: 0.49, pause: 460 },
        { x: 0.62, y: 0.62, pause: 700, click: true },
        { x: 0.23, y: 0.64, pause: 420 },
        { x: 0.10, y: 0.79, pause: 760, click: true },
        { x: 0.33, y: 0.49, pause: 500 },
        { x: 0.48, y: 0.08, pause: 620, click: true }
    ];

    function lerp(start, end, progress) {
        return start + ((end - start) * progress);
    }

    function easeInOutSine(progress) {
        return -(Math.cos(Math.PI * progress) - 1) / 2;
    }

    
    function scaledDelay(node, attrName) {
        var raw = parseInt(node.getAttribute(attrName), 10) || 0;
        return Math.round(raw / ENTRY_STAGGER_BASE * ENTRY_STAGGER_MAX);
    }

    
    function observeReveal(nodeList, attrName) {
        if (!nodeList || !nodeList.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var node = entry.target;
                observer.unobserve(node);
                setTimeout(function () {
                    node.classList.add('is-visible');
                }, scaledDelay(node, attrName));
            });
        }, { threshold: 0.35 });

        nodeList.forEach(function (node) {
            observer.observe(node);
        });
    }

    
    function observeSingle(node, onEnter) {
        if (!node) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                onEnter(node);
            });
        }, { threshold: 0.35 });

        observer.observe(node);
    }

    
    function observeCursorOnEnter(cursor, animArea) {
        if (!cursor) return;

        observeSingle(cursor, function () {
            cursor.classList.add('is-visible');
            window.setTimeout(function () {
                startCursorLoop(cursor, animArea);
            }, CURSOR_LOOP_DELAY);
        });
    }

    
    function revealAll(block, cards, apps, aa, chat, cursor, animArea) {
        block.classList.add('is-animated');
        cards.forEach(function (node) { node.classList.add('is-visible'); });
        apps.forEach(function (node) { node.classList.add('is-visible'); });
        if (aa) aa.classList.add('is-visible');
        if (chat) chat.classList.add('is-visible');
        if (cursor) {
            cursor.classList.add('is-visible');
            window.setTimeout(function () {
                startCursorLoop(cursor, animArea);
            }, CURSOR_LOOP_DELAY);
        }
    }

    function startCursorLoop(cursor, animArea) {
        if (!cursor || !animArea) return;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        var currentIndex = 0;
        var phase = 'pause';
        var phaseStart = null;
        var clickTriggered = false;
        var fromPoint = null;
        var toPoint = null;

        function waypointToPixels(waypoint) {
            return {
                x: animArea.offsetWidth * waypoint.x,
                y: animArea.offsetHeight * waypoint.y
            };
        }

        function setCursorPosition(point) {
            cursor.style.left = point.x + 'px';
            cursor.style.top = point.y + 'px';
        }

        function triggerClickBurst() {
            cursor.classList.add('is-clicking');
            window.setTimeout(function () {
                if (cursor.isConnected) {
                    cursor.classList.remove('is-clicking');
                }
            }, 220);
        }

        function beginMove(timestamp) {
            var nextIndex = (currentIndex + 1) % CURSOR_WAYPOINTS.length;
            fromPoint = waypointToPixels(CURSOR_WAYPOINTS[currentIndex]);
            toPoint = waypointToPixels(CURSOR_WAYPOINTS[nextIndex]);
            phase = 'move';
            phaseStart = timestamp;
            clickTriggered = false;
        }

        function beginPause(timestamp) {
            phase = 'pause';
            phaseStart = timestamp;
            clickTriggered = false;
        }

        function tick(timestamp) {
            if (!cursor.isConnected || !animArea.isConnected) {
                return;
            }

            if (phaseStart === null) {
                phaseStart = timestamp;
                setCursorPosition(waypointToPixels(CURSOR_WAYPOINTS[currentIndex]));
            }

            if (phase === 'pause') {
                var currentWaypoint = CURSOR_WAYPOINTS[currentIndex];
                var pauseElapsed = timestamp - phaseStart;

                if (currentWaypoint.click && !clickTriggered && pauseElapsed >= 90) {
                    clickTriggered = true;
                    triggerClickBurst();
                }

                if (pauseElapsed >= currentWaypoint.pause) {
                    beginMove(timestamp);
                }
            } else {
                var nextIndex = (currentIndex + 1) % CURSOR_WAYPOINTS.length;
                var travelDuration = CURSOR_WAYPOINTS[nextIndex].click ? 1380 : 1100;
                var moveElapsed = timestamp - phaseStart;
                var moveProgress = Math.min(moveElapsed / travelDuration, 1);
                var easedProgress = easeInOutSine(moveProgress);

                setCursorPosition({
                    x: lerp(fromPoint.x, toPoint.x, easedProgress),
                    y: lerp(fromPoint.y, toPoint.y, easedProgress)
                });

                if (moveProgress >= 1) {
                    currentIndex = nextIndex;
                    beginPause(timestamp);
                }
            }

            window.requestAnimationFrame(tick);
        }

        setCursorPosition(waypointToPixels(CURSOR_WAYPOINTS[0]));
        window.requestAnimationFrame(tick);
    }

    function initContacto() {
        var block = document.querySelector(BLOCK_SELECTOR);
        if (!block) return;

        
        var dots = block.querySelector(DOTS_SELECTOR);
        if (dots) {
            window.onlinesPatronPuntos.init({ contenedor: dots });
        }

        var cards    = block.querySelectorAll(CARD_SELECTOR);
        var apps     = block.querySelectorAll(APP_SELECTOR);
        var aa       = block.querySelector(AA_SELECTOR);
        var chat     = block.querySelector(CHAT_SELECTOR);
        var cursor   = block.querySelector(CURSOR_SELECTOR);
        var animArea = block.querySelector(ANIM_AREA_SELECTOR);
        var titulo   = block.querySelector(TITULO_SELECTOR);

        if ('IntersectionObserver' in window) {
            
            observeSingle(titulo, function () { block.classList.add('is-animated'); });
            observeReveal(cards, 'data-card-delay');
            observeSingle(aa, function (node) { node.classList.add('is-visible'); });
            observeSingle(chat, function (node) { node.classList.add('is-visible'); });
            observeReveal(apps, 'data-delay');
            observeCursorOnEnter(cursor, animArea);
        } else {
            revealAll(block, cards, apps, aa, chat, cursor, animArea);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContacto);
    } else {
        initContacto();
    }
})();

;
(function () {
    'use strict';

    var BLOCK_SELECTOR = '.home-testimonios';
    var CARD_SELECTOR = '.js-home-testimonios-tarjeta';

    function revealAll(block, cards) {
        block.classList.add('is-visible');
        cards.forEach(function (node) { node.classList.add('is-visible'); });
    }

    function init() {
        var block = document.querySelector(BLOCK_SELECTOR);
        if (!block) return;

        var cards = block.querySelectorAll(CARD_SELECTOR);

        if (!('IntersectionObserver' in window)) {
            revealAll(block, cards);
            return;
        }

        var titleObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                titleObserver.disconnect();
                block.classList.add('is-visible');
            });
        }, { threshold: 0.4 });
        titleObserver.observe(block);

        var cardObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var node = entry.target;
                cardObserver.unobserve(node);
                var delay = parseInt(node.getAttribute('data-delay'), 10) || 0;
                window.setTimeout(function () {
                    node.classList.add('is-visible');
                }, delay);
            });
        }, { threshold: 0.35 });

        cards.forEach(function (node) {
            cardObserver.observe(node);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

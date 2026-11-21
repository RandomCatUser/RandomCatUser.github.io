/*
 * Spotlight search — macOS Tahoe inspired.
 *
 * Self-mounting: include search-data.js and this file, add a button with
 * data-search-open near the header CTA, then press Cmd/Ctrl+K, "/" or click
 * that button to open. The overlay is hidden until one of those happens.
 */
(function () {
    'use strict';

    var DATA = window.SITE_SEARCH_INDEX;
    if (!Array.isArray(DATA) || !DATA.length) return;

    var CATEGORY_ORDER = ['Pages', 'Sections', 'Projects', 'Writing', 'Links'];
    var MAX_RESULTS = 8;
    var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

    var PATHS = {
        search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-3.7-3.7"/>',
        close: '<path d="M5 5l14 14M19 5 5 19"/>',
        arrow: '<path d="M5 12h13M13 6l6 6-6 6"/>',
        home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
        page: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
        section: '<path d="M5 6h14M5 12h14M5 18h9"/>',
        project: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
        article: '<path d="M5 4h9l4 4v12H5z"/><path d="M8 12h7M8 16h5M14 4v4h4"/>',
        link: '<path d="M10 14a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 0 0-5.7-5.7L11.6 6.7"/><path d="M14 10a4 4 0 0 0-5.7 0l-2.8 2.8a4 4 0 0 0 5.7 5.7l1.2-1.2"/>',
        github: '<path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z"/>',
        contact: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
        sparkle: '<path d="M11.5 3.5l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
        folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 16 9 5 9-5"/>',
        clipboard: '<path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><rect x="9" y="2.5" width="6" height="4" rx="1.2"/>',
        empty: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-3.7-3.7M8.5 11h5"/>'
    };

    var FILLED = { github: true };
    var SITE_ICON = 'https://randomcatuser.github.io/docs/assets/uploads/favicon.png';
    var GITHUB_ICON = 'https://github.githubassets.com/favicons/favicon.svg';
    var BLOG_ICON = 'https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128';

    function svg(name, className) {
        var path = PATHS[name] || PATHS.page;
        var style = FILLED[name]
            ? 'fill="currentColor"'
            : 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
        return '<svg' + (className ? ' class="' + className + '"' : '') +
            ' viewBox="0 0 24 24" aria-hidden="true" ' + style + '>' + path + '</svg>';
    }

    /* ------------------------------------------------------------------ */
    /* Markup                                                             */
    /* ------------------------------------------------------------------ */

    var scrim = document.createElement('div');
    scrim.className = 'ss-scrim';
    scrim.hidden = true;
    document.body.appendChild(scrim);

    var dock = document.createElement('div');
    dock.className = 'ss-dock';
    dock.setAttribute('role', 'search');
    dock.innerHTML = [
        '<div class="ss-bar">',
        '  <div class="ss-field">',
        svg('search', 'ss-search-icon'),
        '    <input class="ss-input" id="ss-input" type="text" placeholder="Spotlight Search" autocomplete="off" autocapitalize="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="ss-results" aria-autocomplete="list" aria-label="Search the site">',
        '    <button class="ss-clear" type="button" aria-label="Clear search" tabindex="-1">' + svg('close') + '</button>',
        '  </div>',
        '  <div class="ss-actions">',
        '    <span class="ss-action-item" style="--ss-i:0"><button class="ss-action" type="button" data-ss-action="random" title="Surprise me" aria-label="Surprise me">' + svg('sparkle') + '</button><span class="ss-action-label">Surprise</span></span>',
        '    <span class="ss-action-item" style="--ss-i:1"><button class="ss-action" type="button" data-ss-action="work" title="Selected work" aria-label="Selected work">' + svg('folder') + '</button><span class="ss-action-label">Work</span></span>',
        '    <span class="ss-action-item" style="--ss-i:2"><button class="ss-action" type="button" data-ss-action="articles" title="Writing" aria-label="Writing">' + svg('layers') + '</button><span class="ss-action-label">Writing</span></span>',
        '    <span class="ss-action-item" style="--ss-i:3"><button class="ss-action" type="button" data-ss-action="contact" title="Get in touch" aria-label="Get in touch">' + svg('clipboard') + '</button><span class="ss-action-label">Contact</span></span>',
        '  </div>',
        '</div>',
        '<div class="ss-panel" id="ss-panel">',
        '  <div class="ss-panel__scroll" data-ss-scroll>',
        '    <div class="ss-results" id="ss-results" role="listbox" aria-label="Search results" data-ss-results></div>',
        '    <div class="ss-empty" data-ss-empty hidden>' + svg('empty') + '<strong>No results</strong><span>Nothing matches “<em data-ss-query></em>”.</span><span>Try “projects”, “writing” or “contact”.</span></div>',
        '  </div>',
        '  <div class="ss-footer">',
        '    <span class="ss-footer__count" data-ss-count></span>',
        '    <div class="ss-footer__hints">',
        '      <span class="ss-footer__hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>',
        '      <span class="ss-footer__hint"><kbd>↵</kbd> open</span>',
        '      <span class="ss-footer__hint"><kbd>esc</kbd> close</span>',
        '    </div>',
        '  </div>',
        '</div>',
        '<p class="ss-sr" data-ss-status role="status" aria-live="polite"></p>'
    ].join('');
    document.body.appendChild(dock);

    var field = dock.querySelector('.ss-field');
    var input = dock.querySelector('.ss-input');
    var clearBtn = dock.querySelector('.ss-clear');
    var resultsEl = dock.querySelector('[data-ss-results]');
    var scrollEl = dock.querySelector('[data-ss-scroll]');
    var emptyEl = dock.querySelector('[data-ss-empty]');
    var emptyQuery = dock.querySelector('[data-ss-query]');
    var countEl = dock.querySelector('[data-ss-count]');
    var statusEl = dock.querySelector('[data-ss-status]');

    /* Add the header search button if a page has an action area. */
    var cta = document.querySelector('.header__cta');
    if (cta && !document.querySelector('[data-search-open]')) {
        var trigger = document.createElement('button');
        trigger.className = 'header-search';
        trigger.type = 'button';
        trigger.setAttribute('data-search-open', '');
        trigger.setAttribute('aria-label', 'Search');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-keyshortcuts', isMac ? 'Meta+K' : 'Control+K');
        trigger.title = 'Search (' + (isMac ? '⌘K' : 'Ctrl+K') + ')';
        trigger.innerHTML = svg('search');
        cta.insertBefore(trigger, cta.firstChild);
    }

    /* ------------------------------------------------------------------ */
    /* State                                                              */
    /* ------------------------------------------------------------------ */

    var isOpen = false;
    var active = -1;
    var renderedEls = [];
    var closeToken = 0;
    var previouslyFocused = null;

    /* ------------------------------------------------------------------ */
    /* Search                                                             */
    /* ------------------------------------------------------------------ */

    function normalize(value) {
        return String(value == null ? '' : value).toLowerCase();
    }

    function tokenize(query) {
        return normalize(query).split(/\s+/).filter(Boolean);
    }

    function categoryRank(category) {
        var index = CATEGORY_ORDER.indexOf(category);
        return index === -1 ? CATEGORY_ORDER.length : index;
    }

    function score(item, tokens) {
        var title = normalize(item.title);
        var description = normalize(item.description);
        var category = normalize(item.category);
        var keywords = normalize((item.keywords || []).join(' '));
        var haystack = title + ' ' + description + ' ' + category + ' ' + keywords;
        var total = 0;

        for (var i = 0; i < tokens.length; i += 1) {
            var token = tokens[i];
            if (haystack.indexOf(token) === -1) return 0;

            if (title === token) total += 100;
            else if (title.indexOf(token) === 0) total += 70;
            else if (title.indexOf(token) !== -1) total += 45;
            else total += 12;

            if (keywords.indexOf(token) !== -1) total += 22;
            if (description.indexOf(token) !== -1) total += 8;
            if (category.indexOf(token) !== -1) total += 6;
        }

        return total;
    }

    function getResults(query) {
        var tokens = tokenize(query);

        if (!tokens.length) {
            return DATA.filter(function (item) {
                return item.featured;
            }).slice(0, 6);
        }

        var matches = [];
        DATA.forEach(function (item) {
            var value = score(item, tokens);
            if (value > 0) matches.push({ item: item, score: value });
        });

        matches.sort(function (a, b) {
            return b.score - a.score ||
                categoryRank(a.item.category) - categoryRank(b.item.category) ||
                a.item.title.localeCompare(b.item.title);
        });

        return matches.slice(0, MAX_RESULTS).map(function (match) {
            return match.item;
        });
    }

    /* ------------------------------------------------------------------ */
    /* Highlighting                                                       */
    /* ------------------------------------------------------------------ */

    function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function appendHighlighted(el, text, tokens) {
        if (!tokens.length) {
            el.textContent = text;
            return;
        }

        var pattern = new RegExp('(' + tokens.map(escapeRegExp).join('|') + ')', 'gi');
        var parts = String(text).split(pattern);

        parts.forEach(function (part) {
            if (!part) return;

            if (tokens.indexOf(part.toLowerCase()) !== -1) {
                var mark = document.createElement('mark');
                mark.textContent = part;
                el.appendChild(mark);
            } else {
                el.appendChild(document.createTextNode(part));
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /* Rendering                                                          */
    /* ------------------------------------------------------------------ */

    function iconUrlFor(item) {
        if (item.iconUrl) return item.iconUrl;
        var url = item.url || '';
        if (/^https:\/\/github\.com\//.test(url)) return GITHUB_ICON;
        if (/randomcatuser\.github\.io/.test(url)) return BLOG_ICON;
        return SITE_ICON;
    }

    function buildResult(item, index, tokens) {
        var link = document.createElement('a');
        link.className = 'ss-result';
        link.id = 'ss-result-' + index;
        link.href = item.url || '#';
        link.setAttribute('role', 'option');
        link.setAttribute('aria-selected', 'false');
        link.setAttribute('data-icon', item.icon || 'page');

        if (item.external) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        var icon = document.createElement('span');
        icon.className = 'ss-result__icon';

        var tile = document.createElement('span');
        tile.className = 'ss-result__tile';
        tile.innerHTML = svg(item.icon || 'page');
        icon.appendChild(tile);

        var iconUrl = iconUrlFor(item);
        if (iconUrl) {
            var favicon = document.createElement('img');
            favicon.className = 'ss-result__favicon';
            favicon.src = iconUrl;
            favicon.alt = '';
            favicon.decoding = 'async';
            favicon.addEventListener('load', function () {
                favicon.classList.add('is-loaded');
            });
            favicon.addEventListener('error', function () {
                if (favicon.parentNode) favicon.parentNode.removeChild(favicon);
            });
            icon.appendChild(favicon);
        }

        link.appendChild(icon);

        var body = document.createElement('span');
        body.className = 'ss-result__body';

        var title = document.createElement('span');
        title.className = 'ss-result__title';
        appendHighlighted(title, item.title, tokens);
        body.appendChild(title);

        if (item.description) {
            var description = document.createElement('span');
            description.className = 'ss-result__desc';
            appendHighlighted(description, item.description, tokens);
            body.appendChild(description);
        }

        link.appendChild(body);

        var arrow = document.createElement('span');
        arrow.className = 'ss-result__arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.innerHTML = svg('arrow');
        link.appendChild(arrow);

        link.addEventListener('mouseenter', function () {
            setActive(index, true);
        });

        link.addEventListener('click', function (event) {
            if (item.action === 'contact') {
                event.preventDefault();
                closeSearch();
                openContact();
                return;
            }
            closeSearch();
        });

        return link;
    }

    function render(query) {
        var tokens = tokenize(query);
        var items = getResults(query);
        var groupIndex = 0;

        dock.classList.toggle('has-query', tokens.length > 0);
        field.classList.toggle('has-value', input.value.length > 0);

        resultsEl.innerHTML = '';
        renderedEls = [];
        active = -1;

        if (!items.length) {
            emptyEl.hidden = false;
            emptyQuery.textContent = query.trim();
            countEl.textContent = '0 results';
            statusEl.textContent = 'No results for ' + query.trim();
            return;
        }

        emptyEl.hidden = true;

        var categories = CATEGORY_ORDER.slice();
        items.forEach(function (item) {
            var category = item.category || 'Other';
            if (categories.indexOf(category) === -1) categories.push(category);
        });

        categories.forEach(function (category) {
            var groupItems = items.filter(function (item) {
                return (item.category || 'Other') === category;
            });
            if (!groupItems.length) return;

            var group = document.createElement('div');
            group.className = 'ss-group';
            group.style.setProperty('--ss-i', String(groupIndex));
            groupIndex += 1;

            var label = document.createElement('span');
            label.className = 'ss-group__label';
            label.textContent = category;
            group.appendChild(label);

            groupItems.forEach(function (item) {
                var link = buildResult(item, renderedEls.length, tokens);
                renderedEls.push(link);
                group.appendChild(link);
            });

            resultsEl.appendChild(group);
        });

        countEl.textContent = tokens.length
            ? items.length + (items.length === 1 ? ' result' : ' results')
            : 'Quick links';

        statusEl.textContent = items.length + (items.length === 1 ? ' result' : ' results') + ' available';

        scrollEl.scrollTop = 0;

        if (isOpen && tokens.length) setActive(0);
    }

    function setActive(index, scroll) {
        if (!renderedEls.length) return;

        var next = Math.max(0, Math.min(index, renderedEls.length - 1));

        if (active >= 0 && renderedEls[active]) {
            renderedEls[active].classList.remove('is-active');
            renderedEls[active].setAttribute('aria-selected', 'false');
        }

        active = next;
        var el = renderedEls[active];
        el.classList.add('is-active');
        el.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', el.id);
        if (scroll) el.scrollIntoView({ block: 'nearest' });
    }

    function hasVisibleResults() {
        return dock.classList.contains('has-query') && renderedEls.length > 0;
    }

    /* ------------------------------------------------------------------ */
    /* Open / close                                                       */
    /* ------------------------------------------------------------------ */

    function lockScroll(lock) {
        if (lock) {
            var gap = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.classList.add('ss-locked');
            if (gap > 0) document.body.style.paddingRight = gap + 'px';
        } else {
            document.documentElement.classList.remove('ss-locked');
            document.body.style.paddingRight = '';
        }
    }

    function contactDialogOpen() {
        var dialog = document.querySelector('.contact-lightbox');
        return !!(dialog && dialog.classList.contains('is-open'));
    }

    function openSearch() {
        if (isOpen) {
            input.focus({ preventScroll: true });
            input.select();
            return;
        }

        if (contactDialogOpen()) return;

        closeToken += 1;
        isOpen = true;
        previouslyFocused = document.activeElement;

        scrim.hidden = false;
        dock.classList.add('is-open');
        input.setAttribute('aria-expanded', 'true');
        lockScroll(true);
        render(input.value);

        /* Flush styles so the field is focusable before the next frame. */
        void dock.offsetWidth;
        input.focus({ preventScroll: true });
        input.select();

        window.requestAnimationFrame(function () {
            scrim.classList.add('is-visible');
            input.focus({ preventScroll: true });
            input.select();
        });
    }

    function closeSearch() {
        if (!isOpen) return;

        closeToken += 1;
        var token = closeToken;
        isOpen = false;

        dock.classList.remove('is-open');
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        scrim.classList.remove('is-visible');
        lockScroll(false);

        if (active >= 0 && renderedEls[active]) {
            renderedEls[active].classList.remove('is-active');
            renderedEls[active].setAttribute('aria-selected', 'false');
        }
        active = -1;

        if (document.activeElement === input) input.blur();

        window.setTimeout(function () {
            if (!isOpen && token === closeToken) scrim.hidden = true;
        }, 320);

        if (previouslyFocused && previouslyFocused !== input &&
            previouslyFocused !== document.body && document.contains(previouslyFocused)) {
            previouslyFocused.focus({ preventScroll: true });
        }
        previouslyFocused = null;
    }

    function openContact() {
        var contactTrigger = document.querySelector('[data-contact-open]');
        if (contactTrigger && typeof contactTrigger.click === 'function') {
            contactTrigger.click();
            return;
        }
        window.location.href = 'index.html#contact';
    }

    function goTo(url) {
        closeSearch();
        window.location.href = url;
    }

    function surpriseMe() {
        var pool = DATA.filter(function (item) {
            return item.url && item.action !== 'contact' && item.category !== 'Links';
        });
        if (!pool.length) return;

        var item = pool[Math.floor(Math.random() * pool.length)];
        closeSearch();

        if (item.external) {
            window.open(item.url, '_blank', 'noopener');
        } else {
            window.location.href = item.url;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Events                                                             */
    /* ------------------------------------------------------------------ */

    input.addEventListener('focus', openSearch);

    input.addEventListener('input', function () {
        render(input.value);
    });

    clearBtn.addEventListener('click', function (event) {
        event.preventDefault();
        input.value = '';
        render('');
        input.focus({ preventScroll: true });
    });

    field.addEventListener('mousedown', function (event) {
        if (event.target === input || event.target.closest('.ss-clear')) return;
        event.preventDefault();
        openSearch();
    });

    scrim.addEventListener('click', closeSearch);

    dock.addEventListener('click', function (event) {
        var button = event.target.closest('[data-ss-action]');
        if (!button) return;

        var action = button.getAttribute('data-ss-action');
        if (action === 'random') {
            surpriseMe();
        } else if (action === 'contact') {
            closeSearch();
            openContact();
        } else if (action === 'work') {
            goTo('index.html#work');
        } else if (action === 'articles') {
            goTo('index.html#articles');
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('[data-search-open]')) {
            event.preventDefault();
            if (isOpen) closeSearch();
            else openSearch();
        }
    });

    document.addEventListener('keydown', function (event) {
        var mod = isMac ? event.metaKey : event.ctrlKey;

        if (mod && (event.key === 'k' || event.key === 'K')) {
            event.preventDefault();
            if (isOpen) closeSearch();
            else openSearch();
            return;
        }

        if (!isOpen) {
            if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey &&
                !isTypingTarget(event.target)) {
                event.preventDefault();
                openSearch();
            }
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeSearch();
            return;
        }

        if (!hasVisibleResults()) return;

        if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
            event.preventDefault();
            setActive((active + 1) % renderedEls.length, true);
            return;
        }

        if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
            event.preventDefault();
            setActive((active - 1 + renderedEls.length) % renderedEls.length, true);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            setActive(0, true);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            setActive(renderedEls.length - 1, true);
            return;
        }

        if (event.key === 'Enter' && active >= 0 && renderedEls[active]) {
            event.preventDefault();
            renderedEls[active].click();
        }
    });

    function isTypingTarget(target) {
        if (!target || !target.tagName) return false;
        var tag = target.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable;
    }

    /* ------------------------------------------------------------------ */
    /* Boot                                                               */
    /* ------------------------------------------------------------------ */

    render('');
    window.SiteSearch = {
        open: openSearch,
        close: closeSearch
    };
})();

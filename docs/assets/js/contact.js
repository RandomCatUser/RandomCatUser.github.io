(function () {
    'use strict';

    var CONTACT_API_URL = 'https://portfolio-contact.dihanramanayaka.workers.dev';
    var triggers = document.querySelectorAll('[data-contact-open]');

    if (!triggers.length || document.getElementById('contact-lightbox')) return;

    var markup = [
        '<div class="contact-lightbox" id="contact-lightbox" aria-hidden="true">',
        '  <div class="contact-lightbox__backdrop" data-contact-close></div>',
        '  <p class="contact-lightbox__announce" role="status" aria-live="polite" data-contact-announce></p>',
        '  <div class="contact-lightbox__dialog" role="dialog" aria-modal="true" aria-labelledby="contact-lightbox-title">',
        '    <button class="contact-lightbox__close" type="button" aria-label="Close contact form" data-contact-close>',
        '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
        '    </button>',
        '    <p class="contact-lightbox__eyebrow">Contact</p>',
        '    <h2 class="contact-lightbox__title" id="contact-lightbox-title">Get in touch</h2>',
        '    <p class="contact-lightbox__intro">Tell me about your project, an idea, or just say hello. I usually reply within a day.</p>',
        '    <form class="contact-lightbox__form" id="contact-lightbox-form" novalidate>',
        '      <label class="contact-lightbox__field">',
        '        <span>Name</span>',
        '        <input type="text" name="name" required maxlength="100" autocomplete="name" placeholder="Your name">',
        '      </label>',
        '      <label class="contact-lightbox__field">',
        '        <span>Email</span>',
        '        <input type="email" name="email" required maxlength="150" autocomplete="email" placeholder="you@example.com">',
        '      </label>',
        '      <label class="contact-lightbox__field contact-lightbox__field--message">',
        '        <span>Message</span>',
        '        <textarea name="message" required maxlength="1000" rows="4" placeholder="What would you like to talk about?"></textarea>',
        '      </label>',
        '      <p class="contact-lightbox__status" role="status" aria-live="polite"></p>',
        '      <button class="contact-lightbox__submit" type="submit">',
        '        <span>Send message</span>',
        '        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>',
        '      </button>',
        '    </form>',
        '    <div class="contact-lightbox__result" role="status" aria-live="polite">',
        '      <span class="contact-lightbox__result-icon">',
        '        <svg class="contact-lightbox__result-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
        '          <path class="contact-lightbox__result-check" d="M4.5 12.5l5 5L19.5 7"></path>',
        '          <path class="contact-lightbox__result-alert" d="M12 7v6"></path>',
        '          <circle class="contact-lightbox__result-alert" cx="12" cy="17.5" r="1.3"></circle>',
        '        </svg>',
        '      </span>',
        '      <h3 class="contact-lightbox__result-title" data-result-title>Done</h3>',
        '      <p class="contact-lightbox__result-text" data-result-text>Your message has been delivered.</p>',
        '      <div class="contact-lightbox__result-actions">',
        '        <button class="contact-lightbox__result-btn contact-lightbox__result-btn--retry" type="button" data-contact-retry hidden>Try again</button>',
        '        <button class="contact-lightbox__result-btn contact-lightbox__result-btn--ghost" type="button" data-contact-close>Close</button>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
    ].join('');

    var holder = document.createElement('div');
    holder.innerHTML = markup;
    var modal = holder.firstElementChild;
    document.body.appendChild(modal);

    var dialog = modal.querySelector('.contact-lightbox__dialog');
    var form = modal.querySelector('#contact-lightbox-form');
    var statusEl = modal.querySelector('.contact-lightbox__status');
    var announceEl = modal.querySelector('[data-contact-announce]');
    var resultTitle = modal.querySelector('[data-result-title]');
    var resultText = modal.querySelector('[data-result-text]');
    var submitBtn = modal.querySelector('.contact-lightbox__submit');
    var retryBtn = modal.querySelector('[data-contact-retry]');
    var resultCloseBtn = modal.querySelector('.contact-lightbox__result-btn--ghost');
    var closeButtons = modal.querySelectorAll('[data-contact-close]');
    var nameInput = form.elements.name;
    var emailInput = form.elements.email;
    var messageInput = form.elements.message;
    var lastFocused = null;
    var submitting = false;
    var requestToken = 0;

    function setStatus(text, type) {
        statusEl.textContent = text;
        statusEl.className = 'contact-lightbox__status' + (type ? ' is-' + type : '');
        announceEl.textContent = text;
    }

    function resetState() {
        requestToken++;
        modal.classList.remove('is-sending', 'is-done', 'is-error');
        retryBtn.hidden = true;
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
        setStatus('', '');
    }

    function open() {
        if (modal.classList.contains('is-open')) return;

        lastFocused = document.activeElement;
        resetState();

        var scrollbar = window.innerWidth - document.documentElement.clientWidth;

        if (scrollbar > 0) {
            document.body.style.paddingRight = scrollbar + 'px';
        }

        document.documentElement.classList.add('is-contact-open');
        document.body.classList.add('is-contact-open');
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');

        window.setTimeout(function () {
            nameInput.focus({ preventScroll: true });
        }, 60);
    }

    function close() {
        if (!modal.classList.contains('is-open')) return;

        requestToken++;
        modal.classList.remove('is-open', 'is-sending', 'is-done', 'is-error');
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('is-contact-open');
        document.body.classList.remove('is-contact-open');
        document.body.style.paddingRight = '';
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');

        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus({ preventScroll: true });
        }

        lastFocused = null;
    }

    function showResult(type) {
        if (!modal.classList.contains('is-open')) {
            submitting = false;
            submitBtn.disabled = false;
            submitBtn.removeAttribute('aria-busy');
            return;
        }

        var done = type === 'done';

        modal.classList.remove('is-sending');
        modal.classList.add(done ? 'is-done' : 'is-error');
        resultTitle.textContent = done ? 'Done' : 'Error';
        resultText.textContent = done ? 'Your message has been delivered.' : 'Something went wrong. Please try again.';
        retryBtn.hidden = done;
        setStatus(done ? 'Done. Your message has been sent.' : 'Error. Your message could not be sent.', done ? 'success' : 'error');

        submitting = false;
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');

        window.setTimeout(function () {
            if (!modal.classList.contains('is-open')) return;
            var target = done ? resultCloseBtn : retryBtn;
            target.focus({ preventScroll: true });
        }, 120);
    }

    function focusableElements() {
        var nodes = modal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
        return Array.prototype.filter.call(nodes, function (node) {
            if (node.disabled || node.hidden) return false;
            if (window.getComputedStyle(node).visibility === 'hidden') return false;
            return !!(node.offsetWidth || node.offsetHeight || node.getClientRects().length);
        });
    }

    document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-contact-open]');
        if (!trigger) return;
        event.preventDefault();
        open();
    });

    Array.prototype.forEach.call(closeButtons, function (button) {
        button.addEventListener('click', close);
    });

    retryBtn.addEventListener('click', function () {
        resetState();
        window.setTimeout(function () {
            nameInput.focus({ preventScroll: true });
        }, 60);
    });

    document.addEventListener('keydown', function (event) {
        if (!modal.classList.contains('is-open')) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            close();
            return;
        }

        if (event.key !== 'Tab') return;

        var focusables = focusableElements();
        if (!focusables.length) return;

        var first = focusables[0];
        var last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        if (submitting) return;

        var name = nameInput.value.trim();
        var email = emailInput.value.trim();
        var message = messageInput.value.trim();

        form.classList.remove('is-invalid');

        if (!form.reportValidity()) return;

        if (!name || !email || !message) {
            setStatus('Please complete every field before sending.', 'error');
            return;
        }

        var payload = {
            name: name,
            email: email,
            message: message
        };

        submitting = true;
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');

        var token = ++requestToken;
        modal.classList.remove('is-done', 'is-error');
        modal.classList.add('is-sending');
        retryBtn.hidden = true;
        resultTitle.textContent = 'Done';
        resultText.textContent = 'Your message has been delivered.';
        setStatus('Sending your message...', '');

        if (!CONTACT_API_URL) {
            if (token === requestToken) showResult('error');
            resultText.textContent = 'The contact form is not configured yet. Please try again later.';
            return;
        }

        fetch(CONTACT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            form.reset();
            if (token === requestToken) showResult('done');
        }).catch(function () {
            if (token === requestToken) showResult('error');
        });
    });
})();

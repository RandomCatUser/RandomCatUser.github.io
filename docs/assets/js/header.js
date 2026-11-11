document.addEventListener('DOMContentLoaded', () => {
    const logos = document.querySelectorAll('.js-header-logo');
    if (!logos.length) return;

    logos.forEach((logo) => {
        const smallContainer = logo.querySelector('.js-header-logo-small');
        const fullContainer  = logo.querySelector('.js-header-logo-full');
        const dot             = logo.querySelector('.js-header-logo-dot');
        const bar             = logo.querySelector('.js-header-logo-bar');

        if (!smallContainer || !fullContainer || !dot || !bar) return;

        
        const blinkTimer = setTimeout(() => {
            bar.classList.add('header-logo--blink');
        }, 1000);

        
        const eraseTimer = setTimeout(() => {
            bar.classList.remove('header-logo--blink');
            bar.classList.add('header-logo--erase');

            
            setTimeout(() => {
                dot.classList.add('header-logo--erase');

                
                setTimeout(() => {
                    smallContainer.classList.add('header-logo__small--hidden');
                    fullContainer.classList.add('header-logo__full--visible');
                    fullContainer.classList.add('header-logo__full--animate-in');
                }, 1000);
            }, 500);
        }, 4000);

        
        logo.addEventListener('onlines:cleanup', () => {
            clearTimeout(blinkTimer);
            clearTimeout(eraseTimer);
        }, { once: true });
    });
});

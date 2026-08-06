// --- Dark Mode Logic ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
} else {
    htmlElement.classList.remove('dark');
}

themeToggle.addEventListener('click', () => {
    if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        localStorage.theme = 'light';
    } else {
        htmlElement.classList.add('dark');
        localStorage.theme = 'dark';
    }
});

// --- Love Letter Logic ---
const generateBtn = document.getElementById('generate-btn');
const exportBtn = document.getElementById('export-btn');
const toNameInput = document.getElementById('to-name');
const fromNameInput = document.getElementById('from-name');

const lDear = document.getElementById('l-dear');
const lBody = document.getElementById('l-body');
const lFrom = document.getElementById('l-from');
const letterCard = document.getElementById('letter-card');
const toast = document.getElementById('toast');

// More authentic, human-sounding confessions
const confessions = [
    "I’m not great with words, but I know my heart beats a little faster when I see you. You make ordinary days feel special, and I’d love to be more than just friends.",
    "I catch myself smiling whenever your name pops up on my screen. I guess what I’m trying to say is, I really like you, and I’d love to take you out for coffee sometime.",
    "You are my favorite hello and my hardest goodbye. I can't imagine my days without your laugh. I'm completely crazy about you.",
    "Every time I look at you, I feel like the luckiest person in the room. I’ve kept this to myself for a while, but I had to let you know how much I care.",
    "I just wanted to let you know that you’ve been on my mind a lot lately. Honestly, everything feels a bit warmer when you're around. I really like you."
];

function generateLetter() {
    const toValue = toNameInput.value.trim();
    const fromValue = fromNameInput.value.trim();

    if (toValue === '' || fromValue === '') {
        toNameInput.classList.add('shake');
        fromNameInput.classList.add('shake');
        setTimeout(() => {
            toNameInput.classList.remove('shake');
            fromNameInput.classList.remove('shake');
        }, 500);
        return;
    }

    // Add fade-in animation
    letterCard.classList.remove('fade-in');
    void letterCard.offsetWidth; 
    letterCard.classList.add('fade-in');

    // Update Text
    lDear.textContent = `Dear ${toValue},`;
    
    // Only replace the body text if the user clicked "Rewrite"
    // This preserves the text if they manually edited it and just wanted to change names
    lBody.innerText = confessions[Math.floor(Math.random() * confessions.length)];
    
    lFrom.textContent = fromValue;
}

async function exportLetter() {
    exportBtn.innerHTML = '<div class="w-4 h-4 border-2 border-maple-red border-t-transparent rounded-full animate-spin"></div> Saving...';
    exportBtn.disabled = true;

    try {
        // Temporarily straighten the card for the image capture
        const originalTransform = letterCard.style.transform;
        letterCard.style.transform = 'none';

        const canvas = await html2canvas(letterCard, {
            scale: 3, // High quality
            backgroundColor: null,
            logging: false,
            useCORS: true
        });

        // Restore the slight tilt
        letterCard.style.transform = originalTransform;

        const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
        const link = document.createElement('a');
        link.download = `Letter-to-${toNameInput.value || 'You'}.png`;
        link.href = image;
        link.click();

        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
        }, 2500);

    } catch (error) {
        console.error('Export failed:', error);
        alert('Oops! Something went wrong while saving the image.');
    } finally {
        exportBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Save as Image';
        exportBtn.disabled = false;
    }
}

generateBtn.addEventListener('click', generateLetter);
exportBtn.addEventListener('click', exportLetter);

fromNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateLetter();
    }
});
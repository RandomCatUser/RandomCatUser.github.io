// --- Dark Mode Logic ---
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Apply saved theme on load
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

// --- App Logic ---
const resultOverlay = document.getElementById('result-overlay');
const catImage = document.getElementById('cat-image');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const closeBtn = document.getElementById('close-btn');
const commentText = document.getElementById('comment-text');
const errorText = document.getElementById('error-text');
const searchContainer = document.getElementById('search-container');
const imgLoader = document.getElementById('img-loader');

const comments = [
    "Look at this cutie, eh! 🍁",
    "The absolute goodest boy, sorry. ❤️",
    "Cuter than a maple syrup pancake!",
    "This one is definitely stealing the spotlight today!",
    "Too cute to handle, isn't it? 🥺",
    "Warning: Extreme Canadian cuteness ahead. ☁️"
];

const validSearches = ['kitty', 'cat', 'meow'];

function triggerError(message) {
    errorText.textContent = message;
    searchContainer.classList.remove('shake');
    void searchContainer.offsetWidth; // trigger reflow to restart animation
    searchContainer.classList.add('shake');
    
    setTimeout(() => {
        errorText.textContent = '';
    }, 3000);
}

async function fetchCat(retryCount = 0) {
    const MAX_RETRIES = 3;
    
    // Set loading state
    searchBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
    searchInput.disabled = true;
    resultOverlay.classList.remove('hidden');
    resultOverlay.classList.add('flex');
    imgLoader.classList.remove('hidden');
    catImage.style.opacity = '0';

    try {
        const response = await fetch('https://api.thecatapi.com/v1/images/search');
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        
        catImage.src = data[0].url;
        catImage.onload = () => {
            imgLoader.classList.add('hidden');
            catImage.style.opacity = '1';
            
            // Reset UI
            searchBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
            searchInput.disabled = false;
            searchInput.value = '';
            
            // Show result
            commentText.textContent = comments[Math.floor(Math.random() * comments.length)];
        };
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            setTimeout(() => fetchCat(retryCount + 1), 1000);
        } else {
            imgLoader.classList.add('hidden');
            searchBtn.innerHTML = '❌';
            searchInput.disabled = false;
            commentText.textContent = "The cats are hiding! Try again later. 🙀";
        }
    }
}

function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (query === '') {
        triggerError("Please type something first, sorry! 🥺");
    } else if (validSearches.includes(query)) {
        fetchCat();
    } else {
        triggerError("Oops! Please type 'kitty', 'cat', or 'meow'. 🐱");
    }
}

// Event Listeners
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

closeBtn.addEventListener('click', () => {
    resultOverlay.classList.add('hidden');
    resultOverlay.classList.remove('flex');
});

// Close overlay if clicking outside the card
resultOverlay.addEventListener('click', (e) => {
    if (e.target === resultOverlay) {
        resultOverlay.classList.add('hidden');
        resultOverlay.classList.remove('flex');
    }
});
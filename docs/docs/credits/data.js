// 1) Tools & Technologies
 const TOOLS_DATA = [
        { name: "HTML5 & CSS3",        desc: "The foundational structure and custom styling, utilizing modern features like CSS variables and backdrop filters." },
        { name: "Tailwind CSS",        desc: "The primary utility-first CSS framework used for rapid UI development and responsive design." },
        { name: "Vanilla JavaScript", desc: "All interactivity (theme switching, modals, accordions, particle effects) is written in pure JS with no heavy libraries." },
        { name: "VS Code",            desc: "The code editor used for development, paired with GitHub Copilot for suggestions." },
        { name: "Git & GitHub",        desc: "Version control and source code hosting." },
        { name: "GitHub Pages",        desc: "Free and seamless static site hosting directly from the repository." },
        { name: "Figma",               desc: "Used for prototyping layouts, picking color palettes, and testing dark/light mode contrasts." },
        { name: "Chrome DevTools",     desc: "Essential for debugging layout issues, testing mobile responsiveness, and profiling animations." }
    ];

    // 2) Assets & UI Attributions
    const ATTRIBUTIONS_DATA = [
        {
            name: "Uiverse.io",
            desc: "The beautiful animated sun/moon theme toggle switch was adapted from RiccardoRapelli's design.",
            link: "https://uiverse.io/"
        },
        {
            name: "Google Fonts (Space Grotesk & Quicksand)",
            desc: "Licensed under the Open Font License.",
            link: "https://fonts.google.com/"
        },
        {
            name: "Heroicons",
            desc: "Beautiful hand-crafted SVG icons. &copy; 2020 Refactoring UI Inc. Licensed under the MIT License.",
            link: "https://heroicons.com/"
        },
        {
            name: "AOS (Animate On Scroll)",
            desc: "&copy; 2016 Michał Sajnóg. Licensed under the MIT License.",
            link: "https://michalsnik.github.io/aos/"
        },
        {
            name: "Image Assets",
            desc: "Profile images and banners are sourced from friends, Unsplash, and Pinterest. Earth favicon from favicon.io.",
            link: null
        }
    ];

    // 3) Music Tracks  
    const MUSIC_DATA = [
        {
            title: '"3:03 PM"',
            artist: "しゃろう (Sharou)",
            artwork: "./assets/album-arts/music1.jpg",
            search: "しゃろう 3:03 PM",
            note: "All rights to this track belong to the artist. Used on this site for non-commercial purposes under free-use provisions."
        },
        {
            title: '"Fly a letter to the Wind"',
            artist: "JayM",
            artwork: "./assets/album-arts/Fly a letter to the Wind.webp",
            search: "JayM Fly a letter to the Wind",
            note: "All rights to this track belong to the artist. Used on this site for non-commercial purposes under free-use provisions."
        },
        {
            title: '"必ずそばに、きみがいる (Not Only Me)"',
            artist: "さんうさぎ (San Usagi)",
            artwork: "./assets/album-arts/フリーBGM必ずそばにきみがいる(Not Only Me)かわいい配信用作業用.webp",
            search: "さんうさぎ 必ずそばにきみがいる",
            note: "フリーBGM (Free BGM) distributed for streaming and work-use. All rights to this track belong to the artist."
        },
        {
            title: '"꽃이 피면, When the Flowers (Acoustic Happy)"',
            artist: "TeamMusicCreative / 당신의 드라마 O.S.T",
            artwork: "./assets/album-arts/[음악팀] 꽃이 피면, When the flowers (AcousticHappy) [BGM무료음악브금].webp",
            search: "꽃이 피면 When the flowers AcousticHappy",
            note: "BGM무료음악 (Free BGM). All rights to this track belong to the creators. Used on this site for non-commercial purposes."
        },
        {
            title: '"Colours"',
            artist: "Stella Jang",
            artwork: "./assets/album-arts/스텔라장(Stella Jang) - Colors.webp",
            search: "Stella Jang Colours",
            note: "All rights to this track belong to the creators. Used on this site for non-commercial purposes."
        },
        {
            title: '"Mosi Mosi?"',
            artist: "楽音 (Sasane)",
            artwork: "./assets/album-arts/楽音 (Sasane) - Mosi Mosi.webp",
            search: "Mosi Mosi?",
            note: "All rights to this track belong to the creators. Used on this site for non-commercial purposes."
        }
    ];

    // 4) Special Thanks
    const SPECIAL_THANKS_DATA = [
        {
            name: 'The "Universe" Crew',
            desc: "Su ZhyZai, Minnie, Chaniru, Minku, Frank,Shizz and Yenuja. Thank you for letting me use your profiles, banners, and quotes!"
        },
        {
            name: "Music Artists",
            desc: "しゃろう (Sharou), JayM, さんうさぎ (San Usagi), Stella Jang, 楽音 (Sasane), and TeamMusicCreative. Thank you for creating such beautiful music and sharing it freely!"
        },
        {
            name: "The Open Source Community",
            desc: "For building and maintaining the incredible tools that make web development accessible and fun."
        },
        {
            name: "Unsplash & Pinterest Creators",
            desc: "For providing high-quality, free-to-use imagery that makes the site look professional."
        },
        {
            name: "You",
            desc: "Thank you for visiting my universe, reading the credits, and especially if you signed the guestbook!"
        }
    ];

    /* ============================================================
     *  RENDERERS — turn data into HTML
     * ============================================================ */

    // Small escape helper to prevent broken HTML from stray quotes
    function esc(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function renderTools() {
        const el = document.getElementById("tools-list");
        if (!el) return;
        el.innerHTML = TOOLS_DATA.map(t => `
            <li><strong>${esc(t.name)}:</strong> ${esc(t.desc)}</li>
        `).join("");
    }

    function renderAttributions() {
        const el = document.getElementById("attributions-list");
        if (!el) return;
        el.innerHTML = ATTRIBUTIONS_DATA.map(a => `
            <li>
                <strong>${esc(a.name)}:</strong> ${esc(a.desc)}
                ${a.link ? `<br><a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer" class="text-orange-600 hover:underline font-medium">${esc(a.name.split(" ")[0])} Website</a>` : ""}
            </li>
        `).join("");
    }

    function renderMusic() {
        const el = document.getElementById("music-tracks-container");
        if (!el) return;
        const ytSearch = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

        el.innerHTML = MUSIC_DATA.map(m => `
            <div class="music-credit-card">
                <a href="${ytSearch(m.search)}" target="_blank" rel="noopener noreferrer" class="music-credit-artwork-link" title="Click to find the original track">
                    <img src="${esc(m.artwork)}" alt="${esc(m.title)} Album Art" class="music-credit-artwork">
                </a>
                <div class="music-credit-info">
                    <div class="music-credit-title">${esc(m.title)}</div>
                    <div class="music-credit-artist">by ${esc(m.artist)}</div>
                    <div class="music-credit-note">${esc(m.note)}</div>
                </div>
            </div>
        `).join("");
    }

    function renderSpecialThanks() {
        const el = document.getElementById("special-thanks-list");
        if (!el) return;
        el.innerHTML = SPECIAL_THANKS_DATA.map(s => `
            <li><strong>${esc(s.name)}:</strong> ${esc(s.desc)}</li>
        `).join("");
    }

    // Run all renderers once DOM is ready
    document.addEventListener("DOMContentLoaded", () => {
        renderTools();
        renderAttributions();
        renderMusic();
        renderSpecialThanks();

        // Re-init AOS so dynamically inserted cards get their scroll animations
        if (window.AOS) {
            AOS.refreshHard();
        }
    });
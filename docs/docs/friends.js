// Hide Preloader after 1.5 seconds
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('hidden');
            }
        }, 1500);

        // Friend Data
        // Add new friends here using the same object format. The page renders cards automatically from this data.
        const friendsData = {
            "Su ZhyZai": {
                emoji: "❤️",
                img: "https://i.pinimg.com/736x/19/69/7e/19697e36c0b08680a24a668930f49d3b.jpg",
                banner: "https://static.vecteezy.com/system/resources/thumbnails/066/832/223/small/colorful-tulips-on-a-white-wooden-background-the-view-from-the-top-with-space-for-text-horizontal-wide-subtitle-cover-copy-space-photo.jpg?auto=format&fit=crop&w=800&q=80",
                bestFriend: true,
                quote: "Always curious about my best friend",
                about: "A wonderful friend who is always curious and loves exploring new things. Has a deep affection for cats and enjoys sharing interesting discoveries.",
                links: [{text: "Search for a cat", url: "./catsearch/catsearch.html", icon: "cat"}]
            },
            "Minnie": {
                emoji: "🏳️‍🌈",
                img: "https://miwcmqwhudshgetmrmhf.supabase.co/storage/v1/object/public/gallery/profile.webp?size=1024",
                banner: "https://miwcmqwhudshgetmrmhf.supabase.co/storage/v1/object/public/gallery/banner.webp?auto=format&fit=crop&w=800&q=80",
                bestFriend: true,
                quote: "Listen to your heart; let the world go quiet for a bit",
                about: "An incredibly creative and thoughtful person. Minnie believes in following your passion and finding peace in the chaos of the world.",
                links: [
                    {text: "My Portfolio", url: "https://amiminnie.github.io/", icon: "globe"},
                    {text: "Look at amminie", url: "amminie.html", icon: "sparkles"}
                ]
            },
            "Chaniru": {
                emoji: "⚽",
                img: "https://cdn.discordapp.com/avatars/1483668063004921936/aa54ca811bebbdc8440ebd71c511bf74.webp?size=1024",
                banner: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                bestFriend: true,
                quote: "Soccer is the best game trust me",
                about: "A passionate gamer and sports enthusiast. Chaniru brings energy to every game and is always up for a competitive match of PONG.",
                links: [{text: "Play PONG", url: "pong.html", icon: "game"}]
            },
            "Minku": {
                emoji: "😂",
                img: "https://cdn.discordapp.com/avatars/1342023233901432893/73a82a6cdc90db54bc08de694469323e.png?size=1024",
                banner: "https://wallpapers-clan.com/wp-content/uploads/2025/04/pokemon-mew-pink-petal-flight-desktop-wallpaper-cover.jpg",
                bestFriend: false,
                quote: "Call me a lazy programmer",
                about: "Minku is the definition of 'work smarter, not harder'. A clever programmer who finds the most efficient solutions to any problem.",
                links: [{text: "Ming Shi", url: "./MingShi/index.html", icon: "paint"}]
            },
            "Frank": {
                emoji: "😩",
                img: "https://cdn.discordapp.com/avatars/1400716262665093206/ebb8814e0aee4ca02fde472662fe06a7.webp?size=1024",
                banner: "https://media.istockphoto.com/id/507717310/photo/view-of-red-maple-tree-and-cn-tower.jpg?s=612x612&w=0&k=20&c=VHtgHHZegFaUi2wwcSj8FRiiXhSbIVHTjF7epZfNxx0=",
                bestFriend: false,
                quote: "I need to study some CS",
                about: "Frank is dedicated to learning and improving his computer science skills. Always grinding to become a better developer.",
                links: []
            },
            "Yenuja": {
                emoji: "😏",
                img: "https://i.pinimg.com/736x/8f/c1/03/8fc103958af12268223c51fe051c6f0f.jpg",
                banner: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgHBeQXycogH40wwk4WnKtRtERkqux8-Etl6ZXo9Z3Tw&s=10",
                bestFriend: false,
                quote: "Do you remember in the evening?",
                about: "Yenuja is a thoughtful and funny person who likes to day dream about his crush.",
                links: [{text: "LoveLetters", url: "./loveletters/loveletters.html", icon: "heart"}]
            },
            "shizz...(｡- .•)": {
                emoji: "🎶",
                img: "https://cdn.discordapp.com/avatars/1100263587756384316/4ca8a07bab89274c7b8528a5a99d831a.png?size=1024",
                banner: "https://i.pinimg.com/originals/4b/fd/1a/4bfd1a7f0d9ae87669996a03074e9e8b.gif=-",
                bestFriend: false,
                quote: "Your way to become a master ♫",
                about: "Shizz is a intresting person who likes to do most intresting stuff.",
                links: []
            }
        };

        const friendsContainer = document.getElementById('friends-wrapper');

        const renderFriends = () => {
            friendsContainer.innerHTML = '';
            Object.entries(friendsData).forEach(([name, data], index) => {
                const rotationClass = `rot-${(index % 6) + 1}`;
                const cardHtml = `
                    <div class="friend-card ${rotationClass} w-40 md:w-56 flex flex-col items-center p-3 md:p-4" data-emoji="${data.emoji || ''}" data-name="${name}">
                        ${data.bestFriend ? '<div class="best-friend-badge">Best Friend</div>' : ''}
                        <img src="${data.img}" alt="${name}" class="avatar-img w-full h-32 md:h-48 object-cover mb-3 rounded-2xl transition-all duration-300">
                        <span class="font-bold text-gray-800 text-lg">${name}</span>
                        <div class="details absolute inset-0 bg-white/80 p-4 flex flex-col items-center justify-center text-center">
                            <p class="text-sm font-semibold text-orange-600">${data.quote ? `"${data.quote}"` : ''}</p>
                            <span class="mt-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Click to view more</span>
                        </div>
                    </div>
                `;
                friendsContainer.insertAdjacentHTML('beforeend', cardHtml);
            });
            bindCardEvents(); // Bind events after rendering
        };

        renderFriends();

        // SVG Icons for Links
        const getIconSvg = (iconName) => {
            switch(iconName) {
                case 'cat':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.5C21 16.6 17.6 20 13.5 20H10c-4.4 0-8-3.6-8-8 0-2.2 1.8-4 4-4h.5C7.2 6.8 8 5 10 5c1.5 0 2.7.8 3.5 2C15.5 6.3 17.8 7 19 8.5c1.2 1.5 2 2.5 2 4z" /></svg>';
                case 'globe':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M3.6 9h16.8 M3.6 15h16.8 M11.5 3a17 17 0 000 18 M12.5 3a17 17 0 010 18" /></svg>';
                case 'sparkles':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>';
                case 'game':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>';
                case 'paint':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7h3m-3 4h3" /></svg>';
                case 'heart':
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>';
                default:
                    return '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>';
            }
        };

        // Particle Burst Animation & Lightbox Logic
        function bindCardEvents() {
            document.querySelectorAll('.friend-card').forEach(card => {
                // Particle burst
                card.addEventListener('mouseenter', (e) => {
                    const emoji = card.getAttribute('data-emoji');
                    if (!emoji) return;
                    const rect = card.getBoundingClientRect();
                    const points = [
                        {x: rect.left, y: rect.top},
                        {x: rect.right, y: rect.top},
                        {x: rect.left, y: rect.bottom},
                        {x: rect.right, y: rect.bottom}
                    ];
                    points.forEach(pos => {
                        const p = document.createElement('div');
                        p.className = 'particle';
                        p.innerText = emoji;
                        p.style.left = pos.x + 'px';
                        p.style.top = pos.y + 'px';
                        const dx = (Math.random() - 0.5) * 150;
                        const dy = (Math.random() - 0.5) * 150 - 50;
                        p.style.setProperty('--dx', dx + 'px');
                        p.style.setProperty('--dy', dy + 'px');
                        document.body.appendChild(p);
                        setTimeout(() => p.remove(), 1000);
                    });
                });

                // Open Lightbox
                card.addEventListener('click', () => {
                    const name = card.getAttribute('data-name');
                    const emoji = card.getAttribute('data-emoji');
                    const data = friendsData[name];
                    if(!data) return;

                    let badgeHtml = data.bestFriend ? `
                        <div class="banner-badge">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            Best Friend
                        </div>
                    ` : '';

                    bannerArea.innerHTML = `
                        <div class="relative w-full">
                            <img src="${data.banner}" class="banner-img" alt="Banner">
                            <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
                            ${badgeHtml}
                        </div>
                        <div class="w-full flex justify-center">
                            <img src="${data.img}" class="lightbox-avatar" alt="${name}">
                        </div>
                    `;

                    let linksHtml = '';
                    if(data.links && data.links.length > 0) {
                        linksHtml = '<div class="connect-stack w-full mt-2">';
                        data.links.forEach(link => {
                            linksHtml += `
                                <a href="${link.url}" target="_blank" class="link-card" title="${link.text}">
                                    <div class="link-icon-box">
                                        ${getIconSvg(link.icon)}
                                    </div>
                                </a>
                            `;
                        });
                        linksHtml += '</div>';
                    } else {
                        linksHtml = `<div class="w-full mt-2 p-4 bg-white/30 rounded-2xl border border-white/50 text-center">
                            <p class="text-gray-400 italic text-sm flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                No personal links available
                            </p>
                        </div>`;
                    }

                    let emojiHtml = emoji ? `<div class="text-xl mb-1">${emoji}</div>` : '';

                    body.innerHTML = `
                        <div class="mt-2 text-center">
                            ${emojiHtml}
                            <h2 class="text-2xl font-bold text-gray-800 tracking-tight">${name}</h2>
                            <p class="text-sm font-semibold text-orange-600 italic mt-1 px-4">"${data.quote}"</p>
                        </div>
                        
                        <div class="mt-5 w-full text-left bg-black/5 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
                            <h3 class="font-bold text-gray-500 mb-2 text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                About
                            </h3>
                            <p class="text-sm text-gray-700 leading-relaxed">${data.about}</p>
                        </div>
                        
                        <div class="mt-6 w-full text-left">
                            <h3 class="font-bold text-gray-500 mb-3 text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Connect
                            </h3>
                            ${linksHtml}
                        </div>
                    `;

                    scrollArea.scrollTop = 0;
                    backdrop.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent background scrolling
                });
            });
        }

        // Lightbox Variables
        const backdrop = document.getElementById('lightbox-backdrop');
        const content = document.getElementById('lightbox-content');
        const scrollArea = document.getElementById('lightbox-scroll-area');
        const bannerArea = document.getElementById('lightbox-banner-area');
        const body = document.getElementById('lightbox-body');
        const closeBtn = document.getElementById('lightbox-close');

        function closeLightbox() {
            backdrop.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restore scrolling
        }

        closeBtn.addEventListener('click', closeLightbox);
        backdrop.addEventListener('click', (e) => {
            if(e.target === backdrop) closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeLightbox();
        });

        // === THEME MANAGEMENT & SETTINGS DROPDOWN SCRIPT ================ //
        (function() {
            var themeToggle = document.getElementById('theme-toggle');
            var settingsBtn = document.getElementById('settings-btn');
            var settingsDropdown = document.getElementById('settings-dropdown');

            // Sync checkbox state with stored theme (default: light)
            var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            themeToggle.checked = (currentTheme === 'dark');

            // Toggle theme on switch change
            themeToggle.addEventListener('change', function() {
                if (this.checked) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                    localStorage.setItem('theme', 'light');
                }
            });

            // Toggle settings dropdown
            settingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                settingsDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', function(e) {
                if (!settingsDropdown.contains(e.target) && !settingsBtn.contains(e.target)) {
                    settingsDropdown.classList.remove('show');
                }
            });

            // Close dropdown on Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    settingsDropdown.classList.remove('show');
                }
            });
        })();
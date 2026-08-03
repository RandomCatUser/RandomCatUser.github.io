// =============================
// SUPABASE INITIALIZATION
// =============================
const SUPABASE_URL = "https://hlcohkseahqddctnduso.supabase.co";
const SUPABASE_KEY = "sb_publishable_77Ja7au_gSrZVVJuou3SiA_FlSVil2O";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true
    }
});

// =============================
// EMOJI DATA
// =============================
const EMOJI_DATA = {
    smileys: { label: "Smileys & People", emojis: "😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😋 😛 😝 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫡 🤭 🫢 🫣 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👻 💀 👽 🤖 🎃 😺 😸 😹 😻 😼 😽 🙀 😿 😾".split(" ") },
    gestures: { label: "Gestures & Body", emojis: "👍 👎 👊 ✊ 🤛 🤜 👏 🙌 👐 🤲 🙏 🤝 💪 🫶 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤙 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 💋 🩸".split(" ") },
    hearts: { label: "Hearts & Emotion", emojis: "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 🔥 ✨ 🌟 ⭐ 💫 ⚡ 💥 💢 💨 💦 🕳️ 💬 👁️‍🗨️ 🗯️ 💭 💯 ✅ ❌ ❓ ❗ ⭕ 🚫 💢".split(" ") },
    animals: { label: "Animals & Nature", emojis: "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🐣 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🦟 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐈 🐓 🦃 🦚 🦜 🦢 🦩 🕊️ 🐇 🐁 🐀 🐿️ 🦔 🌸 🌺 🌻 🌹 🌷 🌼 🌿 🌱 🌳 🌲 🌴 🌵 🍀 🍁 🍂 🌍 🌙 ⭐ 🌟 ✨ ⚡ ☀️ 🌈 ☁️ ❄️ 🔥 💧 🌊".split(" ") },
    food: { label: "Food & Drink", emojis: "🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🦴 🌭 🍔 🍟 🍕 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🫖 🍵 🧃 🥤 🍶 🍺 🍻 🥂 🍷 🥃 🍸 🍹 🧉 🍾".split(" ") },
    symbols: { label: "Symbols & Objects", emojis: "✨ 🌟 ⭐ 💫 🔥 💯 ✅ ❌ ❓ ❗ ⭕ 🚫 💢 💥 💧 🌈 ☀️ 🌙 ☁️ ❄️ ⚡ 🎉 🎊 🎈 🎁 🏆 🥇 🥈 🥉 🏅 🎖️ 🎵 🎶 🎸 🎹 🎺 🎻 🥁 🎧 🎤 📷 🎬 🎮 🎯 🎲 🧩 🎨 🖌️ 📚 📖 ✏️ ✒️ 📝 💼 💻 📱 ⌚ 🔔 📢 👑 💎 🔑 🔒 🔓 🏠 🏡 🌍 🌎 🌏 🚀 ✈️ 🚗 🏎️ ⚓ ⛵ 🚲 🛴 🛹 ⚠️ ♻️ 🔄 🔁 🔚 🔙 🔛 🔝 🔜 🆗 🆕 🆓 🆒 🆙 🈶 🈚 🈯 🉐 ㊗️ ㊙️".split(" ") }
};

let currentEmojiCategory = "smileys";
let activeEmojiTarget = null;

// =============================
// THEME LOGIC
// =============================
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
        themeToggle.checked = (theme === 'dark');
    }
    try { localStorage.setItem('gb-theme', theme); } catch (e) {}
}

let savedTheme = 'dark';
try { savedTheme = localStorage.getItem('gb-theme') || 'dark'; } catch (e) {}
applyTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('change', () => {
        const next = themeToggle.checked ? 'dark' : 'light';
        applyTheme(next);
    });
}

// =============================
// EMOJI PICKER LOGIC
// =============================
function renderEmojiGrid(category) {
    currentEmojiCategory = category;
    const grid = document.getElementById('emojiGrid');
    const header = document.getElementById('emojiHeader');
    const data = EMOJI_DATA[category];

    if (header) header.textContent = data.label;
    document.querySelectorAll('.emoji-cat-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === category);
    });

    if (grid) {
        grid.innerHTML = data.emojis.map(emoji =>
            `<button class="emoji-item" onclick="insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
    }
}

function toggleEmojiPicker(targetId) {
    const picker = document.getElementById(`emojiPicker-${targetId}`);
    const btn = document.getElementById(`emojiBtn-${targetId}`);

    if (!picker || !btn) return;

    const isOpen = picker.classList.contains('open');
    document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('open'));
    document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));

    if (!isOpen) {
        activeEmojiTarget = targetId;
        picker.classList.add('open');
        btn.classList.add('active');
        renderEmojiGrid(currentEmojiCategory);
    }
}

function insertEmoji(emoji) {
    const target = document.getElementById(activeEmojiTarget);
    if (!target) return;

    const start = target.selectionStart;
    const end = target.selectionEnd;
    const text = target.value;

    target.value = text.slice(0, start) + emoji + text.slice(end);
    target.focus();

    const newPos = start + emoji.length;
    target.setSelectionRange(newPos, newPos);

    if (activeEmojiTarget === 'message') updateCharCount();
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.emoji-picker') && !e.target.closest('.emoji-btn')) {
        document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
    }
    if (e.target.classList.contains('emoji-cat-btn')) {
        renderEmojiGrid(e.target.dataset.cat);
    }
});

// =============================
// CHARACTER COUNT
// =============================
function updateCharCount() {
    const msg = document.getElementById('message');
    const count = document.getElementById('charCount');
    if (msg && count) {
        count.textContent = `${msg.value.length} / 500`;
        count.style.color = msg.value.length > 450 ? '#EF4444' : 'var(--muted)';
    }
}

document.addEventListener('input', (e) => {
    if (e.target.id === 'message') updateCharCount();
});

// =============================
// HELPER FUNCTIONS
// =============================
// Fetches IP Address to prevent clearing site data to re-like
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        let visitorID = localStorage.getItem("visitor_id");
        if (!visitorID) {
            visitorID = crypto.randomUUID();
            localStorage.setItem("visitor_id", visitorID);
        }
        return visitorID;
    }
}

function escapeHTML(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.innerText = text;
    return div.innerHTML;
}

function formatDateTime(dateString) {
    if (!dateString) return "Unknown date";
    let dateStr = String(dateString);
    if (dateStr.indexOf('T') === -1 && dateStr.indexOf(' ') !== -1) {
        dateStr = dateStr.replace(' ', 'T');
    }
    const timePart = dateStr.split('T')[1] || '';
    const hasTimezone = timePart.includes('Z') || timePart.includes('+') || (timePart.includes('-') && timePart.indexOf('-') > 0);
    if (!hasTimezone) {
        dateStr += 'Z';
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Unknown date";

    const options = { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    };
    return date.toLocaleString(undefined, options);
}

// =============================
// ADMIN LIGHTBOX MODAL LOGIC
// =============================
function checkAdminRoute() {
    if (window.location.hash === '#admin') {
        openAdminModal();
    } else {
        closeAdminModal(false);
    }
}

function openAdminModal() {
    const modal = document.getElementById('adminLightbox');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeAdminModal(updateHash = true) {
    const modal = document.getElementById('adminLightbox');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
    if (updateHash && window.location.hash === '#admin') {
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('adminLightbox');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'adminLightbox') closeAdminModal();
        });
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('adminLightbox')?.classList.contains('open')) {
            closeAdminModal();
        }
        document.querySelectorAll('.emoji-picker').forEach(p => p.classList.remove('open'));
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
    }
});

window.addEventListener('hashchange', checkAdminRoute);
checkAdminRoute();

// =============================
// LOAD PUBLIC MESSAGES
// =============================
async function loadMessages() {
    const { data, error } = await supabaseClient
        .from("guestbook")
        .select("*, likes:guestbook_likes(ip_address)")
        .eq("approved", true)
        .order("created_at", { ascending: false });

    const container = document.getElementById("messages");

    if (error) {
        container.innerHTML = `<div class="np-empty"><i class="fa-solid fa-triangle-exclamation"></i><span>Error loading messages.</span></div>`;
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="np-empty"><i class="fa-regular fa-comment-dots"></i><span>No messages yet. Be the first to say hi! 👋</span></div>`;
        return;
    }

    const currentUserIP = await getUserIP();
    let html = "";

    data.forEach((item, index) => {
        const likeCount = item.likes ? item.likes.length : 0;
        const hasLiked = item.likes ? item.likes.some(l => l.ip_address === currentUserIP) : false;
        const delay = Math.min(index * 0.06, 0.6);

        html += `
        <div class="card message-card stagger-item" style="animation-delay: ${delay}s;">
            <div class="flex justify-between items-start gap-3">
                <div class="author">${escapeHTML(item.name)}</div>
                <div class="date whitespace-nowrap">${formatDateTime(item.created_at)}</div>
            </div>
            <div class="content">${escapeHTML(item.message)}</div>

            <button class="like-btn ${hasLiked ? 'liked' : ''}" onclick="toggleLike('${item.id}', this)">
                <i class="fa-${hasLiked ? 'solid' : 'regular'} fa-heart"></i>
                <span>${likeCount}</span>
            </button>

            ${item.admin_reply ? `
                <div class="reply-block">
                    <div class="text-xs uppercase tracking-widest mb-1 flex items-center gap-1" style="color: var(--like-color);">
                        <i class="fa-solid fa-reply"></i> Admin Reply
                    </div>
                    <p class="text-sm mt-1" style="line-height: 1.6;">${escapeHTML(item.admin_reply)}</p>
                </div>
            ` : ""}
        </div>`;
    });

    container.innerHTML = html;
}

// =============================
// ADD MESSAGE
// =============================
async function addMessage() {
    const nameInput = document.getElementById("name");
    const messageInput = document.getElementById("message");

    let name = nameInput.value.trim();
    let message = messageInput.value.trim();

    if (!name || !message) {
        showToast("Please fill in all fields.", "error");
        return;
    }

    const button = event.target.closest('button');
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';
    button.disabled = true;

    const { error } = await supabaseClient
        .from("guestbook")
        .insert([{ name, message, approved: true }]);

    if (error) {
        showToast("Error posting message: " + error.message, "error");
        button.innerHTML = originalHTML;
        button.disabled = false;
        return;
    }

    nameInput.value = "";
    messageInput.value = "";
    updateCharCount();
    button.innerHTML = originalHTML;
    button.disabled = false;

    showToast("Message sent! 🎉", "success");
    loadMessages();
}

// =============================
// TOAST NOTIFICATIONS
// =============================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#22C55E' : 'var(--fg)';
    const icon = type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info';

    toast.style.cssText = `
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(80px);
        background: ${bg}; color: white; padding: 12px 24px; border-radius: 100px;
        font-size: 0.9rem; font-weight: 500; z-index: 9999; opacity: 0;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 8px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(12px);
    `;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(80px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// =============================
// TOGGLE LIKE SYSTEM (IP + Anonymous Token)
// =============================
async function toggleLike(messageId, btnElement) {
    const userIP = await getUserIP();
    const isLiked = btnElement.classList.contains('liked');
    const countSpan = btnElement.querySelector('span');
    const icon = btnElement.querySelector('i');

    // Optimistic UI Update
    if (isLiked) {
        btnElement.classList.remove('liked');
        icon.className = 'fa-regular fa-heart';
        countSpan.innerText = Math.max(0, parseInt(countSpan.innerText) - 1);
    } else {
        btnElement.classList.add('liked');
        icon.className = 'fa-solid fa-heart';
        countSpan.innerText = parseInt(countSpan.innerText) + 1;
        createFloatingHeart(btnElement);
    }

    // Database Operation (Secured by Anonymous Token RLS)
    if (isLiked) {
        const { error } = await supabaseClient
            .from("guestbook_likes")
            .delete()
            .match({ message_id: messageId, ip_address: userIP });

        if (error) {
            btnElement.classList.add('liked');
            icon.className = 'fa-solid fa-heart';
            countSpan.innerText = parseInt(countSpan.innerText) + 1;
            showToast("Error removing reaction.", "error");
        }
    } else {
        const { error } = await supabaseClient
            .from("guestbook_likes")
            .insert([{ message_id: messageId, ip_address: userIP }]);

        if (error) {
            btnElement.classList.remove('liked');
            icon.className = 'fa-regular fa-heart';
            countSpan.innerText = Math.max(0, parseInt(countSpan.innerText) - 1);
            
            if (error.code === '23505') {
                showToast("You already liked this message ❤️", "info");
                btnElement.classList.add('liked');
                icon.className = 'fa-solid fa-heart';
                countSpan.innerText = parseInt(countSpan.innerText) + 1;
            } else {
                showToast("Error liking message: " + error.message, "error");
            }
        }
    }
}

function createFloatingHeart(element) {
    const rect = element.getBoundingClientRect();
    const heart = document.createElement('div');
    heart.innerHTML = '❤️';
    heart.style.cssText = `
        position: fixed; left: ${rect.left + rect.width / 2}px; top: ${rect.top}px;
        font-size: 1.5rem; pointer-events: none; z-index: 9999;
        animation: floatHeart 1s ease-out forwards;
    `;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
}

const style = document.createElement('style');
style.textContent = `
@keyframes floatHeart {
    0% { opacity: 1; transform: translate(-50%, 0) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -60px) scale(1.5); }
}`;
document.head.appendChild(style);

// =============================
// AUTHENTICATION (Admin & Anonymous)
// =============================
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showToast(error.message, "error");
    } else {
        showToast("Welcome back, Admin! 👑", "success");
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    showToast("Logged out successfully.", "info");
    // Immediately sign back in anonymously to maintain secure session
    supabaseClient.auth.signInAnonymously(); 
}

// =============================
// ADMIN DASHBOARD
// =============================
async function loadAdminMessages() {
    const { data, error } = await supabaseClient
        .from("guestbook")
        .select("*, likes:guestbook_likes(ip_address)")
        .order("created_at", { ascending: false });

    const container = document.getElementById("adminMessages");

    if (error) { showToast(error.message, "error"); return; }

    let html = "";

    if (!data || data.length === 0) {
        container.innerHTML = "<div class='np-empty'><span>No messages to moderate.</span></div>";
        return;
    }

    data.forEach((item, index) => {
        const likeCount = item.likes ? item.likes.length : 0;
        const delay = Math.min(index * 0.05, 0.5);

        html += `
        <div class="card message-card stagger-item" style="animation-delay: ${delay}s;">
            <div class="flex justify-between items-start gap-3">
                <div class="flex-1 min-w-0">
                    <div class="author">${escapeHTML(item.name)}</div>
                    <div class="text-sm mt-1" style="color: var(--muted); line-height: 1.5;">${escapeHTML(item.message)}</div>
                </div>
                <div class="${item.approved ? 'badge-visible' : 'badge-hidden'} whitespace-nowrap">
                    ${item.approved ? "Visible" : "Hidden"}
                </div>
            </div>

            <div class="mt-3 text-sm flex items-center gap-2" style="color: var(--muted);">
                <i class="fa-solid fa-heart" style="color: var(--like-color);"></i> ${likeCount} Likes
                <span class="mx-1">•</span>
                <i class="fa-regular fa-clock"></i> ${formatDateTime(item.created_at)}
            </div>

            <textarea id="reply-${item.id}" class="custom-input mt-4" rows="2" placeholder="Write admin reply...">${escapeHTML(item.admin_reply || "")}</textarea>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                <button class="action-btn" style="background: var(--accent-grad); color: var(--bg); border-color: transparent;" onclick="saveReply('${item.id}')">
                    <i class="fa-solid fa-save mr-1"></i> Save
                </button>
                <button class="action-btn" onclick="toggleMessage('${item.id}', ${item.approved})">
                    <i class="fa-solid fa-eye${item.approved ? '-slash' : ''} mr-1"></i> ${item.approved ? "Hide" : "Approve"}
                </button>
                <button class="action-btn" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);" onclick="clearAllLikes('${item.id}')">
                    <i class="fa-solid fa-heart-crack mr-1"></i> Clear Likes
                </button>
                <button class="action-btn btn-logout" onclick="deleteMessage('${item.id}')">
                    <i class="fa-solid fa-trash mr-1"></i> Delete
                </button>
            </div>
        </div>`;
    });

    container.innerHTML = html;
}

async function saveReply(id) {
    const reply = document.getElementById("reply-" + id).value;
    const { error } = await supabaseClient
        .from("guestbook")
        .update({ admin_reply: reply })
        .eq("id", id);

    if (error) { showToast(error.message, "error"); return; }
    showToast("Reply saved! 💬", "success");
    loadAdminMessages();
    loadMessages();
}

async function clearAllLikes(id) {
    if (!confirm("Remove ALL heart reactions from this message?")) return;

    const { error } = await supabaseClient
        .from("guestbook_likes")
        .delete()
        .eq("message_id", id);

    if (error) { 
        showToast(error.message, "error"); 
        return; 
    }
    showToast("All reactions cleared.", "success");
    loadAdminMessages();
    loadMessages();
}

async function deleteMessage(id) {
    if (!confirm("Delete this message permanently?")) return;

    const { error } = await supabaseClient
        .from("guestbook")
        .delete()
        .eq("id", id);

    if (error) { showToast(error.message, "error"); return; }
    showToast("Message deleted.", "info");
    loadAdminMessages();
    loadMessages();
}

async function toggleMessage(id, status) {
    const { error } = await supabaseClient
        .from("guestbook")
        .update({ approved: !status })
        .eq("id", id);

    if (error) { showToast(error.message, "error"); return; }
    showToast(status ? "Message hidden." : "Message approved!", "success");
    loadAdminMessages();
    loadMessages();
}

// =============================
// APP INITIALIZATION (Anonymous Token Logic)
// =============================
loadMessages();

// Listen to auth state changes (Handles both Admin logins and Anonymous sessions)
supabaseClient.auth.onAuthStateChange((event, session) => {
    const loginForm = document.getElementById('adminLoginForm');
    const dashboard = document.getElementById('adminDashboard');

    if (session && !session.user.is_anonymous) {
        // Admin is logged in
        if (loginForm) loginForm.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
        loadAdminMessages();
    } else {
        // Anonymous user or logged out
        if (dashboard) dashboard.classList.add('hidden');
        
        // Only show login form if on #admin route
        if (window.location.hash === '#admin' && loginForm) {
            loginForm.classList.remove('hidden');
        } else if (loginForm) {
            loginForm.classList.add('hidden');
        }

        // If user logs out or has no session, immediately sign them in anonymously
        if (event === 'SIGNED_OUT' || !session) {
            supabaseClient.auth.signInAnonymously();
        }
    }
});

// Initial auth check
supabaseClient.auth.getSession().then(({ data }) => {
    if (!data.session) {
        // No session found, sign in anonymously to get the Signed Anonymous Token
        supabaseClient.auth.signInAnonymously();
    } else if (data.session.user.is_anonymous) {
        // Already have an anonymous session, RLS is secured
    }
});
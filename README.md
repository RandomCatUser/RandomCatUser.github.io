<div align="center">
  
  # 👋 Dihan Ramanayaka's Portfolio
  
  **A creative, dark-mode enabled, interactive personal portfolio built with Tailwind CSS, Vanilla JS, and GSAP.**
  
  ![GitHub last commit](https://img.shields.io/github/last-commit/RandomCatUser/RandomCatUser.github.io?style=for-the-badge&color=%232196f3)
  ![GitHub repo size](https://img.shields.io/github/repo-size/RandomCatUser/RandomCatUser.github.io?style=for-the-badge&color=%2314b8a6)
  

---

### 📖 About The Project

Welcome to the source code of my personal portfolio! I am a student designer and developer from Sri Lanka passionate about programming, developing innovative applications, and continuously improving my technical skills.

This website isn't just a standard resume; it's an interactive playground. It features a custom-built local music "Dynamic Island" player, an animated dark/light mode system, custom SVG cursors, and an experimental "Quiz" quiz mode that serves random trivia questions on page load.

### 🤝 Connect

Feel free to reach out to me or check out my other projects:

-   **GitHub:** [RandomCatUser](https://github.com/RandomCatUser)
-   **Blog:** [RandomThoughts](https://randomcatuser.github.io/RandomThoughts-/)

### 🔒 Contact form deployment

The site is hosted on GitHub Pages, so the Discord webhook must not be placed in its public JavaScript. The contact form sends to the Cloudflare Worker in `worker/contact.js` instead.

1. Revoke any webhook URL that has been shared or committed, then create a replacement.
2. Deploy the Worker with Wrangler: run `npx wrangler login` and `npx wrangler deploy`, then run `npx wrangler secret put DISCORD_WEBHOOK_URL` and enter the replacement webhook when prompted.
3. Set `CONTACT_API_URL` in `docs/assets/js/contact.js` to the Worker URL printed by Wrangler.

The Worker only accepts requests from this site, validates messages, limits each IP to five submissions per minute, and keeps the Discord URL in a Cloudflare secret. The form remains unavailable until `CONTACT_API_URL` is configured.

### 📝 License

This project is licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).

---


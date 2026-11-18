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

The site is hosted on GitHub Pages, so the Discord webhook must never be placed in its public JavaScript. Submitting the form triggers a GitHub Actions workflow (`.github/workflows/contact-discord.yml`), which reads `DISCORD_WEBHOOK_URL` from a repository secret and posts the message to Discord. No Cloudflare Worker or other server is involved.

1. In GitHub, open **Settings → Secrets and variables → Actions** and add a repository secret named `DISCORD_WEBHOOK_URL` containing your webhook URL. Never commit the URL or paste it into chat.
2. Create a fine-grained personal access token under **Settings → Developer settings → Personal access tokens → Fine-grained tokens**. Limit it to this repository and give it only **Actions: Read and write**.
3. Add the token as a second repository secret named `CONTACT_DISPATCH_TOKEN`. It is injected into `docs/assets/js/contact.js` by `.github/workflows/pages.yml` at deploy time, so it never enters git — GitHub push protection blocks personal access tokens committed to a public repository.
4. Make sure **Settings → Pages → Build and deployment → Source** is **GitHub Actions**, then push to `main`. The **Deploy site** workflow publishes the site with the token injected, and the form dispatches **Contact form**.

> [!WARNING]
> The injected `CONTACT_DISPATCH_TOKEN` is readable by anyone who opens the live site. It can only trigger workflows in this repository, so the worst case is Action spam and Discord spam, but it cannot change code. If it is abused, revoke the token, create a new one, and update the `CONTACT_DISPATCH_TOKEN` secret (then re-run **Deploy site**).

The browser only queues the workflow; it never sees the webhook. A successful submission means GitHub accepted the dispatch, so if a message does not arrive, check the latest runs of **Contact form** in the repository's **Actions** tab.

### 📝 License

This project is licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).

---


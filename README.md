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
3. In `docs/assets/js/contact.js`, set `CONTACT_DISPATCH_TOKEN` to that token. If the repository or workflow filename changes, update `CONTACT_REPO` and `CONTACT_WORKFLOW` as well.
4. Push to `main`. The form dispatches the workflow, which validates the fields and posts an embed to Discord.

> [!WARNING]
> `CONTACT_DISPATCH_TOKEN` is readable by anyone who opens the site. It can only trigger workflows in this repository, so the worst case is Action spam and Discord spam, but it cannot change code. GitHub may flag or revoke a token committed to a public repository, and tokens expire: if the form stops working, create a new token and update the file. Rotating it periodically is recommended.

The browser only queues the workflow; it never sees the webhook. A successful submission means GitHub accepted the dispatch, so if a message does not arrive, check the latest runs of **Contact form** in the repository's **Actions** tab.

### 📝 License

This project is licensed under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).

---


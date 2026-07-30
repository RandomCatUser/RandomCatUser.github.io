
<div align="center">
  
  # 👋 Dihan Ramanayaka's Portfolio
  
  **A creative, dark-mode enabled, interactive personal portfolio built with Tailwind CSS, Vanilla JS, and GSAP.**
  
  ![GitHub last commit](https://img.shields.io/github/last-commit/RandomCatUser/RandomCatUser.github.io?style=for-the-badge&color=%232196f3)
  ![GitHub repo size](https://img.shields.io/github/repo-size/RandomCatUser/RandomCatUser.github.io?style=for-the-badge&color=%2314b8a6)
  ![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
  
  <p>
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-experimental-features">Experimental</a> •
    <a href="#-local-setup">Setup</a> •
    <a href="#-connect">Connect</a>
  </p>
  
</div>

---

###  About The Project

Welcome to the source code of my personal portfolio! I am a student from Sri Lanka passionate about programming, developing innovative applications, and continuously improving my technical skills. 

This website isn't just a standard resume; it's an interactive playground. It features a custom-built local music "Dynamic Island", an animated dark/light mode system, custom SVG cursors, and an experimental "Happy Days" historical fact generator.


### Tech Stack

-   **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
-   **Styling:** Tailwind CSS
-   **Animations:** GSAP (GreenSock) & ScrollTrigger
-   **Icons:** Bootstrap Icons, Material Icons, FontAwesome
-   **APIs:** 
    -   [Byabbe/se-on-this-day](https://github.com/Byabbe/se-on-this-day) (Historical events)
    -   Wikipedia REST API (Event images)

### Local Setup

Because this site uses local audio parsing (`jsmediatags`) and fetches local JSON data, you cannot just double-click the `index.html` file (the `file:///` protocol will block API requests). You need to run a local web server.

**Option 1: Using VS Code (Recommended)**
1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.
2. Open the project folder in VS Code.
3. Right-click `index.html` and select **"Open with Live Server"**.

**Option 2: Using Python**
If you have Python installed, navigate to the project folder in your terminal and run:
```bash
# Python 3
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser.

### 📂 Project Structure

```
RandomCatUser.github.io/
├── assets/             # Images, icons, cursor SVGs, and local music
├── css/                # Tailwind build & custom index.css
├── docs/               # Additional HTML pages (About, Friends, etc.)
├── index.html          # Main landing page
└── index.js            # Core JavaScript logic
```

### 🤝 Connect

Feel free to reach out to me or check out my other projects:

-   **GitHub:** [RandomCatUser](https://github.com/RandomCatUser)
-   **Blog:** [RandomThoughts](https://randomcatuser.github.io/RandomThoughts-/)

---


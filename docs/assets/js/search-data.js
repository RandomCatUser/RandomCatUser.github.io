/*
 * Spotlight search index.
 *
 * Plain, JSON-shaped data. Add or edit entries here; search.js reads
 * window.SITE_SEARCH_INDEX at load time.
 *
 * Fields:
 *   title       Result title
 *   description Short line shown under the title
 *   url         Where to go (relative or absolute)
 *   category    Group heading: Pages, Sections, Projects, Writing, Links
 *   icon        Fallback icon: home | page | section | project | article | link | github | contact
 *   iconUrl     Real favicon/image shown in the result row
 *   keywords    Extra words that should match
 *   featured    Shown before typing (max 6)
 *   external    Open in a new tab
 *   action      "contact" opens the contact dialog instead of navigating
 */
window.SITE_SEARCH_INDEX = [
  {
    "title": "Home",
    "description": "Dihan Ramanayaka — student designer and developer in Sri Lanka.",
    "url": "index.html",
    "category": "Pages",
    "icon": "home",
    "keywords": [
      "start",
      "portfolio",
      "dihan",
      "ramanayaka",
      "main",
      "hero"
    ],
    "featured": true,
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Selected work",
    "description": "Apps, tools and experiments designed and built by Dihan.",
    "url": "index.html#work",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "projects",
      "work",
      "apps",
      "tools",
      "experiments",
      "portfolio"
    ],
    "featured": true,
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Writing",
    "description": "Essays on education, the web and Linux.",
    "url": "index.html#articles",
    "category": "Sections",
    "icon": "article",
    "keywords": [
      "articles",
      "blog",
      "posts",
      "essays",
      "writing",
      "thoughts",
      "randomthoughts"
    ],
    "featured": true,
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Contact",
    "description": "Send a message and get a reply within a day.",
    "url": "index.html#contact",
    "category": "Pages",
    "icon": "contact",
    "action": "contact",
    "keywords": [
      "contact",
      "email",
      "message",
      "get in touch",
      "hire",
      "freelance",
      "hello",
      "work together"
    ],
    "featured": true,
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Credits",
    "description": "Imagery, icons, typefaces, libraries and music used on the site.",
    "url": "credits.html",
    "category": "Pages",
    "icon": "page",
    "keywords": [
      "credits",
      "licenses",
      "fonts",
      "thanks",
      "unsplash",
      "simple icons"
    ],
    "featured": true,
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "GitHub",
    "description": "Open source projects and code by RandomCatUser.",
    "url": "https://github.com/RandomCatUser",
    "category": "Links",
    "icon": "github",
    "keywords": [
      "github",
      "code",
      "repos",
      "repositories",
      "source",
      "open source"
    ],
    "featured": true,
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Frontend development",
    "description": "Accessible interfaces built with HTML, CSS, JavaScript and React.",
    "url": "index.html#services",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "frontend",
      "front-end",
      "html",
      "css",
      "javascript",
      "react",
      "ui",
      "interface",
      "design"
    ],
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Machine learning & AI",
    "description": "Models for classification, prediction and experiments.",
    "url": "index.html#services",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "machine learning",
      "ml",
      "ai",
      "python",
      "models",
      "neural",
      "data science"
    ],
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Backend & databases",
    "description": "APIs, file servers and data storage.",
    "url": "index.html#services",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "backend",
      "back-end",
      "api",
      "database",
      "server",
      "node",
      "sql",
      "self-hosted"
    ],
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "What my friends say",
    "description": "Testimonials from people Dihan has worked with.",
    "url": "index.html#testimonials",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "testimonials",
      "friends",
      "reviews",
      "recommendations",
      "quotes"
    ],
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": "Let's build something together",
    "description": "Start a project or just say hello.",
    "url": "index.html#contact",
    "category": "Sections",
    "icon": "section",
    "keywords": [
      "collaborate",
      "project",
      "hire",
      "contact",
      "quote",
      "together"
    ],
    "iconUrl": "https://randomcatuser.github.io/docs/assets/uploads/favicon.png"
  },
  {
    "title": ".oppsie",
    "description": "Image format and converter desktop app.",
    "url": "https://randomcatuser.github.io/.oppsie/",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "oppsie",
      "image",
      "converter",
      "format",
      "png",
      "jpg",
      "webp",
      "desktop",
      "app"
    ],
    "external": true,
    "iconUrl": "https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128"
  },
  {
    "title": "SweetVibe",
    "description": "Terminal-based music player.",
    "url": "https://github.com/RandomCatUser/SweetVibe/",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "sweetvibe",
      "music",
      "player",
      "terminal",
      "cli",
      "audio"
    ],
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Cats Drive",
    "description": "Self-hosted local file server for your PC.",
    "url": "https://github.com/RandomCatUser/CatsDrive",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "cats drive",
      "file server",
      "files",
      "self-hosted",
      "nas",
      "sharing",
      "pc"
    ],
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Fake News Detection",
    "description": "Classifies articles as real or fake.",
    "url": "https://github.com/RandomCatUser/Fake-News-Detection",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "fake news",
      "machine learning",
      "classification",
      "nlp",
      "articles",
      "python"
    ],
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Heart Disease Prediction",
    "description": "Predicts heart disease risk from patient data.",
    "url": "https://github.com/RandomCatUser/Heart-Disease-Prediction",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "heart disease",
      "health",
      "prediction",
      "machine learning",
      "medical",
      "risk"
    ],
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Stock Direction Predictor",
    "description": "Predicts stock price direction.",
    "url": "https://github.com/RandomCatUser/Stock-Direction-Predictor",
    "category": "Projects",
    "icon": "project",
    "keywords": [
      "stock",
      "stocks",
      "finance",
      "prediction",
      "trading",
      "machine learning"
    ],
    "external": true,
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg"
  },
  {
    "title": "Why Sri Lanka's education system feels broken",
    "description": "What needs to change for students in Sri Lanka.",
    "url": "https://randomcatuser.github.io/RandomThoughts-/posts/WhySrilankanEducationSystemSucks.html",
    "category": "Writing",
    "icon": "article",
    "keywords": [
      "education",
      "sri lanka",
      "school",
      "students",
      "system",
      "essay"
    ],
    "external": true,
    "iconUrl": "https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128"
  },
  {
    "title": "Reimagining the Web as an Operating System",
    "description": "What the browser can learn from desktop operating systems.",
    "url": "https://randomcatuser.github.io/RandomThoughts-/posts/yoeshi.html",
    "category": "Writing",
    "icon": "article",
    "keywords": [
      "web",
      "browser",
      "operating system",
      "os",
      "design",
      "essay"
    ],
    "external": true,
    "iconUrl": "https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128"
  },
  {
    "title": "It's Just Code",
    "description": "Why Linux is having a moment.",
    "url": "https://randomcatuser.github.io/RandomThoughts-/posts/Itsjustcode.html",
    "category": "Writing",
    "icon": "article",
    "keywords": [
      "linux",
      "code",
      "open source",
      "essay"
    ],
    "external": true,
    "iconUrl": "https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128"
  },
  {
    "title": "RandomThoughts blog",
    "description": "Long-form posts and notes.",
    "url": "https://randomcatuser.github.io/RandomThoughts-/",
    "category": "Links",
    "icon": "link",
    "keywords": [
      "blog",
      "randomthoughts",
      "posts",
      "writing",
      "notes"
    ],
    "external": true,
    "iconUrl": "https://www.google.com/s2/favicons?domain=randomcatuser.github.io&sz=128"
  }
];

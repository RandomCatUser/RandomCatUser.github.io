const RESPONSIVE_WIDTH = 1024

let headerWhiteBg = false
let isHeaderCollapsed = window.innerWidth < RESPONSIVE_WIDTH
const collapseBtn = document.getElementById("collapse-btn")
const collapseHeaderItems = document.getElementById("collapsed-header-items")



function onHeaderClickOutside(e) {
    if (!collapseBtn || !collapseHeaderItems) return

    if (collapseBtn.contains(e.target) || collapseHeaderItems.contains(e.target)) {
        return
    }

    toggleHeader()
}


function toggleHeader(event) {
    if (event && typeof event.stopPropagation === "function") {
        event.stopPropagation()
    }

    if (!collapseBtn || !collapseHeaderItems) return

    if (isHeaderCollapsed) {
        collapseHeaderItems.classList.add("active", "expanded", "show")
        collapseHeaderItems.style.width = window.innerWidth < RESPONSIVE_WIDTH ? "100%" : "60vw"
        collapseBtn.classList.remove("bi-list")
        collapseBtn.classList.add("bi-x", "max-lg:tw-fixed")
        isHeaderCollapsed = false

        setTimeout(() => window.addEventListener("click", onHeaderClickOutside), 1)

    } else {
        collapseHeaderItems.classList.remove("active", "expanded", "show", "opacity-100")
        collapseHeaderItems.style.width = "0vw"
        collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed")
        collapseBtn.classList.add("bi-list")
        isHeaderCollapsed = true
        window.removeEventListener("click", onHeaderClickOutside)

    }
}

function responsive() {
    if (!collapseBtn || !collapseHeaderItems) return

    if (window.innerWidth > RESPONSIVE_WIDTH) {
        collapseHeaderItems.style.width = ""
        collapseHeaderItems.classList.remove("active", "expanded", "show", "opacity-100")
        collapseBtn.classList.remove("bi-x", "max-lg:tw-fixed")
        collapseBtn.classList.add("bi-list")
        isHeaderCollapsed = true

    } else {
        collapseHeaderItems.style.width = isHeaderCollapsed ? "0vw" : "100%"
        isHeaderCollapsed = true
    }
}

window.addEventListener("resize", responsive)


if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger)

    gsap.set(".reveal-hero-text", {
        opacity: 0,
        y: "100%",
    })

    gsap.set(".reveal-hero-img", {
        opacity: 0,
        y: "100%",
    })

    gsap.set(".reveal-up", {
        opacity: 0,
        y: "100%",
    })


    const runHeroReveal = function () {
        gsap.to(".reveal-hero-text", {
            opacity: 1,
            y: "0%",
            duration: 0.7,
            stagger: 0.15,
        })

        gsap.to(".reveal-hero-img", {
            opacity: 1,
            y: "0%",
            duration: 0.7,
        })
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", runHeroReveal)
    } else {
        runHeroReveal()
    }


    const sections = gsap.utils.toArray("section")

    sections.forEach((sec) => {

        const revealUptimeline = gsap.timeline({paused: true, 
                                                scrollTrigger: {
                                                                trigger: sec,
                                                                start: "top 85%",
                                                                once: true,
                                                            }})

        revealUptimeline.to(sec.querySelectorAll(".reveal-up"), {
            opacity: 1,
            duration: 0.7,
            y: "0%",
            stagger: 0.12,
            clearProps: "transform",
        })


    })
    window.addEventListener("load", function () {
        ScrollTrigger.refresh()
    })
} else {
    document.querySelectorAll(".reveal-hero-text, .reveal-hero-img, .reveal-up").forEach((el) => {
        el.style.opacity = "1"
        el.style.transform = "none"
    })
}



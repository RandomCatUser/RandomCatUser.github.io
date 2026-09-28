// initialization

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


/**
 * Animations
 */

gsap.registerPlugin(ScrollTrigger)

gsap.to(".reveal-hero-text", {
    opacity: 0,
    y: "100%",
})

gsap.to(".reveal-hero-img", {
    opacity: 0,
    y: "100%",
})


gsap.to(".reveal-up", {
    opacity: 0,
    y: "100%",
})


window.addEventListener("load", () => {
    // animate from initial position
    gsap.to(".reveal-hero-text", {
        opacity: 1,
        y: "0%",
        duration: 0.8,
        // ease: "power3.out",
        stagger: 0.5, // Delay between each word's reveal,
        // delay: 3
    })

    gsap.to(".reveal-hero-img", {
        opacity: 1,
        y: "0%",
    })

    
})


// ------------- reveal section animations ---------------

const sections = gsap.utils.toArray("section")

sections.forEach((sec) => {

    const revealUptimeline = gsap.timeline({paused: true, 
                                            scrollTrigger: {
                                                            trigger: sec,
                                                            start: "10% 80%", // top of trigger hits the top of viewport
                                                            end: "20% 90%",
                                                            // markers: true,
                                                            // scrub: 1,
                                                        }})

    revealUptimeline.to(sec.querySelectorAll(".reveal-up"), {
        opacity: 1,
        duration: 0.8,
        y: "0%",
        stagger: 0.2,
    })


})



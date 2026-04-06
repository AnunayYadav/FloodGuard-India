/* ═══════════════════════════════════════════════════════════
   App Entry — Initialize all modules
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize Map Core Module
    MapModule.init();

    // Initialize New UI Components (History, Contacts, Safety)
    if (typeof UIModule !== 'undefined') {
        UIModule.init();
    }

    // Initialize Scroll Animations
    if (typeof ScrollReveal !== 'undefined') {
        ScrollReveal.init();
    }

    // Initialize Charts (lazy — when section scrolls into view)
    let chartsLoaded = false;
    const chartsSection = document.getElementById('charts-section');
    if (chartsSection) {
        const chartObs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !chartsLoaded) {
                chartsLoaded = true;
                ChartsModule.initAll();
                chartObs.unobserve(chartsSection);
            }
        }, { threshold: 0.1 });
        chartObs.observe(chartsSection);
    }

    // Timeline slider
    const slider = document.getElementById('timelineSlider');
    const yearDisplay = document.getElementById('timelineYearDisplay');
    if (slider) {
        slider.addEventListener('input', () => {
            const year = parseInt(slider.value);
            yearDisplay.textContent = year;
            if (chartsLoaded) ChartsModule.updateYear(year);
        });
    }

    // Theme change listener — recreate charts
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Slight delay to let CSS vars update
            setTimeout(() => {
                if (chartsLoaded) ChartsModule.initAll();
                // Update map tile layer
                updateMapTiles();
            }, 100);
        });
    }

    function updateMapTiles() {
        // Map tiles adapt via CSS, no tile swap needed for dark CARTO tiles
    }
});

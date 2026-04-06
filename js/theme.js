/* ═══════════════════════════════════════════════════════════
   Theme Toggle — persisted to localStorage
   ═══════════════════════════════════════════════════════════ */

(function initTheme() {
    const saved = localStorage.getItem('fg-theme');
    const theme = saved || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
})();

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('fg-theme', next);
        lucide.createIcons();
    });
});

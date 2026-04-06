/* ═══════════════════════════════════════════════════════════
   Animations — Premium scroll reveals, counters, wave, navbar
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── Universal Scroll Observer ───
    // Animate: .fade-in, .reveal-up, .scale-in, .slide-left, .slide-right
    const animatedEls = document.querySelectorAll('.fade-in, .reveal-up, .scale-in, .slide-left, .slide-right');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => entry.target.classList.add('visible'), Number(delay));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    animatedEls.forEach(el => observer.observe(el));

    // ─── Animated Counters ───
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    counters.forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
        const targetAttr = el.dataset.target;
        if (!targetAttr) return; // Skip if no target is defined

        const target = parseInt(targetAttr);
        const duration = 2200;
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Smooth ease-out-quart
            const eased = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.round(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target.toLocaleString() + '+';
        }
        requestAnimationFrame(update);
    }

    // ─── Navbar scroll ───
    const navbar = document.getElementById('navbar');
    const scrollProgress = document.getElementById('scrollProgress');
    const isHomePage = !!document.querySelector('.hero-section');

    window.addEventListener('scroll', () => {
        // Only toggle transparent/scrolled on home page (which has the full hero)
        if (isHomePage) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
        // Scroll progress bar
        const h = document.documentElement.scrollHeight - window.innerHeight;
        const pct = h > 0 ? (window.scrollY / h) * 100 : 0;
        if (scrollProgress) scrollProgress.style.width = pct + '%';
    });

    // ─── Mobile Menu ───
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => navMenu.classList.toggle('open'));
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => navMenu.classList.remove('open'));
        });
    }

    // ─── Hero Wave Canvas — Enhanced ───
    const canvas = document.getElementById('waveCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w, h;
        function resize() {
            w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        resize();
        window.addEventListener('resize', resize);

        let t = 0;
        function drawWave() {
            const cw = canvas.offsetWidth;
            const ch = canvas.offsetHeight;
            ctx.clearRect(0, 0, cw, ch);
            
            const theme = document.documentElement.getAttribute('data-theme');
            const colors = theme === 'dark' 
                ? ['59, 130, 246', '167, 139, 250', '52, 211, 153']
                : ['37, 99, 235', '109, 40, 217', '5, 150, 105'];
            
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(0, ch);
                for (let x = 0; x <= cw; x += 3) {
                    const y = ch * 0.55 
                        + Math.sin(x * 0.003 + t + i * 1.8) * 22 * (i + 1)
                        + Math.sin(x * 0.006 + t * 0.6 + i * 0.7) * 12
                        + Math.cos(x * 0.001 + t * 0.3) * 8;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(cw, ch);
                ctx.closePath();
                const alpha = 0.035 - i * 0.007;
                ctx.fillStyle = `rgba(${colors[i % colors.length]}, ${alpha})`;
                ctx.fill();
            }
            t += 0.012;
            requestAnimationFrame(drawWave);
        }
        drawWave();
    }

    // ─── Safety Tabs ───
    const safetyTabs = document.querySelectorAll('.safety-tab');
    safetyTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            safetyTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.safety-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelId = 'panel-' + tab.dataset.tab;
            document.getElementById(panelId).classList.add('active');
            const panelFades = document.getElementById(panelId).querySelectorAll('.fade-in');
            panelFades.forEach(el => {
                el.classList.remove('visible');
                observer.observe(el);
            });
        });
    });

    // ─── Smooth section divider animation ───
    const dividers = document.querySelectorAll('.section-divider');
    const dividerObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = '80px';
                entry.target.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                dividerObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    dividers.forEach(d => {
        d.style.width = '0px';
        dividerObs.observe(d);
    });

    // ─── Parallax on hero elements ───
    window.addEventListener('scroll', () => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && window.scrollY < window.innerHeight) {
            const offset = window.scrollY * 0.15;
            heroContent.style.transform = `translateY(${offset}px)`;
            heroContent.style.opacity = 1 - (window.scrollY / window.innerHeight * 0.6);
        }
    });
});

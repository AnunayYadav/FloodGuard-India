/* ═══════════════════════════════════════════════════════════
   UI Component Generators (History, Safety, Contacts)
   ═══════════════════════════════════════════════════════════ */

const UIModule = {
    init: function () {
        this.renderHistoryTimeline();
        this.renderSafetyAccordions();
        this.renderEmergencyContacts();
        this.attachAccordionListeners();
    },

    /**
     * Re-observe dynamically injected elements that use scroll-reveal
     * animation classes (.fade-in, .reveal-up, .scale-in, etc.)
     * so they become visible when scrolled into view.
     */
    observeDynamic: function (container) {
        if (!container) return;
        const animatedEls = container.querySelectorAll('.fade-in, .reveal-up, .scale-in, .slide-left, .slide-right');
        if (animatedEls.length === 0) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const delay = entry.target.dataset.delay || 0;
                    setTimeout(() => entry.target.classList.add('visible'), Number(delay));
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

        animatedEls.forEach(el => observer.observe(el));
    },

    attachAccordionListeners: function () {
        const headers = document.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const item = header.parentElement;
                const column = item.closest('.safety-phase-column');
                const isActive = item.classList.contains('active');

                // Close all items within the same column only
                if (column) {
                    column.querySelectorAll('.accordion-item').forEach(acc => acc.classList.remove('active'));
                } else {
                    document.querySelectorAll('.accordion-item').forEach(acc => acc.classList.remove('active'));
                }

                // Toggle current accordion
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    },

    renderHistoryTimeline: function () {
        const container = document.getElementById('historyTimeline');
        if (!container || !window.HISTORICAL_FLOODS) return;

        // Sort chronologically: oldest first (left) → newest last (right)
        const sorted = [...window.HISTORICAL_FLOODS].sort((a, b) => a.year - b.year);

        let html = '';
        sorted.forEach((event, index) => {
            const delay = 80 * (index % 6); // Stagger animations

            html += `
                <div class="timeline-item fade-in" data-severity="${event.severity}" data-delay="${delay}">
                    <div class="timeline-content">
                        <div class="timeline-year">${event.year}</div>
                        <h3>${event.name}</h3>
                        <div class="timeline-region">
                            <i data-lucide="map-pin"></i> ${event.region}
                        </div>
                        <p class="timeline-desc">${event.description}</p>
                        
                        <div class="timeline-stats">
                            <div class="stat-pill">
                                <i data-lucide="cloud-lightning"></i>
                                <span>Cause: <strong>${event.cause}</strong></span>
                            </div>
                            <div class="stat-pill">
                                <i data-lucide="users"></i>
                                <span>Lives Lost: <strong>${event.livesLost}</strong></span>
                            </div>
                            <div class="stat-pill">
                                <i data-lucide="trending-down"></i>
                                <span>Impact: <strong>${event.damage}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Re-observe injected elements for scroll-reveal
        this.observeDynamic(container);
    },

    renderSafetyAccordions: function () {
        const container = document.getElementById('safetyAccordionContainer');
        if (!container || !window.SAFETY_GUIDELINES) return;

        let html = '';
        window.SAFETY_GUIDELINES.forEach((section, index) => {
            const PhaseTitle = section.category;
            const ColumnIcon = section.icon || "shield-alert";

            let itemsHtml = '';
            section.tips.forEach((tipString, i) => {
                // Ensure the first item of the first column is open by default
                const isActive = (index === 0 && i === 0) ? 'active' : '';

                let tipTitle = `Tip ${i + 1}`;
                let tipDesc = tipString;

                if (tipString.includes(':')) {
                    const parts = tipString.split(':');
                    tipTitle = parts[0].trim();
                    tipDesc = parts.slice(1).join(':').trim();
                }

                itemsHtml += `
                    <div class="accordion-item ${isActive}">
                        <div class="accordion-header">
                            <span class="accordion-title"><i data-lucide="check-circle-2"></i> ${tipTitle}</span>
                            <i data-lucide="chevron-down" class="accordion-icon"></i>
                        </div>
                        <div class="accordion-content">
                            <p>${tipDesc}</p>
                        </div>
                    </div>
                `;
            });

            html += `
                <div class="safety-phase-column fade-in" data-delay="${index * 100}">
                    <h3 class="phase-heading"><i data-lucide="${ColumnIcon}"></i> ${PhaseTitle}</h3>
                    <div class="accordion-list">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Re-observe injected elements for scroll-reveal
        this.observeDynamic(container);
    },

    renderEmergencyContacts: function () {
        const container = document.getElementById('helplinesContainer');
        if (!container || !window.EMERGENCY_CONTACTS) return;

        // Render National Contacts first
        let html = `
            <div class="contacts-wrapper">
                <div class="contacts-category national-contacts fade-in">
                    <h3><i data-lucide="shield"></i> National Emergency Numbers</h3>
                    <div class="helplines-grid">
        `;

        window.EMERGENCY_CONTACTS.national.forEach(contact => {
            html += `
                        <div class="helpline-item">
                            <div class="helpline-number">${contact.numbers.join(', ')}</div>
                            <div class="helpline-label">${contact.name}</div>
                        </div>
            `;
        });

        html += `
                    </div>
                </div>
                
                <div class="contacts-category state-contacts fade-in" data-delay="150">
                    <h3><i data-lucide="map"></i> State-wise SDRF Control Rooms</h3>
                    <div class="state-contacts-grid">
        `;

        window.EMERGENCY_CONTACTS.stateSDRF.forEach(stateItem => {
            html += `
                        <div class="state-contact-item">
                            <div class="state-name">${stateItem.state}</div>
                            <div class="state-numbers-list">
                                ${stateItem.numbers.map(num => `<span class="state-number"><i data-lucide="phone"></i>${num}</span>`).join('')}
                            </div>
                        </div>
            `;
        });

        html += `
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();

        // Re-observe injected elements for scroll-reveal
        this.observeDynamic(container);
    }
};

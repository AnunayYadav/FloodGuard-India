/* ═══════════════════════════════════════════════════════════
   Charts Module — Chart.js powered analytics
   ═══════════════════════════════════════════════════════════ */

const ChartsModule = (() => {
    let rainfallChart = null;
    let floodEventsChart = null;
    let riverImpactChart = null;
    let causesChart = null;
    let currentYear = 2024;

    function getChartColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        return {
            cyan: theme === 'dark' ? '#22D3EE' : '#0891B2',
            blue: theme === 'dark' ? '#38BDF8' : '#0284C7',
            indigo: theme === 'dark' ? '#6366F1' : '#4F46E5',
            grid: theme === 'dark' ? 'rgba(148,163,184,0.06)' : 'rgba(71,85,105,0.06)',
            text: theme === 'dark' ? '#94A3B8' : '#475569',
            bg: theme === 'dark' ? 'rgba(56,189,248,0.08)' : 'rgba(14,165,233,0.08)'
        };
    }

    function chartDefaults(c) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.9)',
                    titleColor: '#F1F5F9',
                    bodyColor: '#94A3B8',
                    borderColor: 'rgba(56,189,248,0.2)',
                    borderWidth: 1,
                    cornerRadius: 10,
                    padding: 12,
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'Inter' }
                }
            },
            scales: {
                x: {
                    grid: { color: c.grid, drawBorder: false },
                    ticks: { color: c.text, font: { family: 'Inter', size: 10 } }
                },
                y: {
                    grid: { color: c.grid, drawBorder: false },
                    ticks: { color: c.text, font: { family: 'Inter', size: 10 } }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuart' }
        };
    }

    function buildRainfallChart(year) {
        const ctx = document.getElementById('rainfallChart');
        if (!ctx) return;
        const c = getChartColors();
        const hd = getHistoricalData(year);

        if (rainfallChart) rainfallChart.destroy();
        rainfallChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hd.months,
                datasets: [{
                    label: 'Avg Rainfall (mm)',
                    data: hd.rainfallData,
                    borderColor: c.cyan,
                    backgroundColor: c.bg,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: c.cyan,
                    pointBorderColor: 'transparent',
                    pointHoverRadius: 7
                }]
            },
            options: {
                ...chartDefaults(c),
                plugins: {
                    ...chartDefaults(c).plugins,
                    legend: { display: false }
                }
            }
        });
    }

    function buildFloodEventsChart(year) {
        const ctx = document.getElementById('floodEventsChart');
        if (!ctx) return;
        const c = getChartColors();
        const fed = getFloodEventsData(year);

        if (floodEventsChart) floodEventsChart.destroy();
        floodEventsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: fed.years,
                datasets: [{
                    label: 'Flood Events',
                    data: fed.events,
                    backgroundColor: fed.events.map((_, i) => {
                        const ratio = i / fed.events.length;
                        return `rgba(34, 211, 238, ${0.4 + ratio * 0.5})`;
                    }),
                    borderColor: c.cyan,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: chartDefaults(c)
        });
    }

    function buildRiverImpactChart() {
        const ctx = document.getElementById('riverImpactChart');
        if (!ctx) return;
        const c = getChartColors();

        if (riverImpactChart) riverImpactChart.destroy();
        riverImpactChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: RIVER_BASINS.map(r => r.name),
                datasets: [{
                    label: 'Impact Score',
                    data: RIVER_BASINS.map(r => r.impact),
                    backgroundColor: RIVER_BASINS.map(r => {
                        if (r.impact >= 85) return 'rgba(239, 68, 68, 0.6)';
                        if (r.impact >= 70) return 'rgba(249, 115, 22, 0.6)';
                        return 'rgba(34, 211, 238, 0.6)';
                    }),
                    borderRadius: 5
                }]
            },
            options: {
                ...chartDefaults(c),
                indexAxis: 'y',
                scales: {
                    x: {
                        ...chartDefaults(c).scales.x,
                        max: 100
                    },
                    y: {
                        ...chartDefaults(c).scales.y
                    }
                }
            }
        });
    }

    function buildCausesChart() {
        const ctx = document.getElementById('causesChart');
        if (!ctx) return;
        const c = getChartColors();

        if (causesChart) causesChart.destroy();
        causesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: FLOOD_CAUSES.map(f => f.cause),
                datasets: [{
                    data: FLOOD_CAUSES.map(f => f.percentage),
                    backgroundColor: FLOOD_CAUSES.map(f => f.color),
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: c.text,
                            font: { family: 'Inter', size: 10 },
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: chartDefaults(c).plugins.tooltip
                }
            }
        });
    }

    function updateDashboardStats() {
        // Update stats from NATIONAL_STATS if elements exist
        const statsMap = {
            'statEvents': NATIONAL_STATS.totalEvents,
            'statAffected': NATIONAL_STATS.peopleAffected,
            'statLives': NATIONAL_STATS.livesLost,
            'statHomeless': NATIONAL_STATS.homeless
        };

        Object.entries(statsMap).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    }

    function updateInfographics(year) {
        const hd = getHistoricalData(year);
        const elements = {
            'infoMonsoon': hd.monsoonIntensity,
            'infoFrequency': hd.events + ' major',
            'infoBasin': hd.basins + ' basins',
            'infoAffected': hd.affected + 'M people'
        };

        const bars = {
            'infoMonsoonBar': hd.monsoonPct,
            'infoFrequencyBar': Math.min(100, hd.events * 4),
            'infoBasinBar': Math.min(100, hd.basins * 6),
            'infoAffectedBar': Math.min(100, hd.affected * 5)
        };

        Object.entries(elements).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        Object.entries(bars).forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.style.width = val + '%';
        });
    }

    function initAll() {
        buildRainfallChart(currentYear);
        buildFloodEventsChart(currentYear);
        buildRiverImpactChart();
        buildCausesChart();
        updateInfographics(currentYear);
        updateDashboardStats();
    }

    function updateYear(year) {
        currentYear = year;
        const yearLabel = document.getElementById('selectedYear');
        if (yearLabel) yearLabel.textContent = year;
        
        buildRainfallChart(year);
        buildFloodEventsChart(year);
        updateInfographics(year);
    }

    return { initAll, updateYear };
})();

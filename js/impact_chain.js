/**
 * Flood Impact Chain Visualizer Logic - Section Diagnostic Edition
 * Handles section-specific calculations, % change indicators, and interactive visuals.
 */

let activeNodeId = 'trigger'; // Local state to track which node is focused

const nodeData = {
    trigger: {
        icon: '🌧️',
        title: 'Stage 1: Primary Trigger',
        metricLabel: 'Rainfall Intensity',
        baseValue: 50,
        unit: '%',
        historical: '42%',
        description: 'Initial rainfall or sudden water release. A 5% increase in rainfall intensity can trigger a 2x increase in flash flood velocity.',
        explanation: 'Sudden atmospheric changes or infrastructure failures in dams can initiate this stage. High-intensity rainfall leads to rapid saturation of the soil, causing immediate surface runoff. This is often the point of no return for flash flood events.',
        contextStats: { mechanism: 'Atmospheric River', trigger: 'Cloudburst/Monsoon' }
    },
    flood: {
        icon: '🌊',
        title: 'Stage 2: Hydrological Hazard',
        metricLabel: 'Flood Depth',
        baseValue: 0.65,
        unit: 'm',
        historical: '0.45m',
        description: 'Movement of water into inhabited areas. Waterlogging duration is heavily dependent on urban drainage efficiency.',
        explanation: 'Water accumulation in low-lying areas. Urban surfaces increase the velocity of water flow due to lack of permeable ground. This stage represents the primary physical hazard to life and property, requiring active rescue and relief operations.',
        contextStats: { duration: '3-10 Days', type: 'Fluvial Flooding' }
    },
    damage: {
        icon: '🌾',
        title: 'Stage 3: Physical & Asset Loss',
        metricLabel: 'Crop Destruction',
        baseValue: 6.8,
        unit: '%',
        historical: '8%',
        description: 'Direct impact on crops and livestock. Saturated soil can lead to anaerobic conditions destroying pulses in 48 hours.',
        explanation: 'Assets like agricultural land, buildings, and livestock are directly hit. In rural areas, this means loss of the primary livelihood through crop inundation. In urban areas, it leads to massive structural and automotive damages.',
        contextStats: { livestock_risk: 'High', infrastructure: 'Critical' }
    },
    economy: {
        icon: '💰',
        title: 'Stage 4: Financial Disruption',
        metricLabel: 'Economic Shock',
        baseValue: 4550,
        unit: 'Cr',
        historical: '₹450Cr',
        prefix: '₹',
        description: 'Loss of income for daily workers. Local supply chains often collapse within 72 hours of primary breach.',
        explanation: 'Commercial centers are paralyzed. Beyond direct physical loss, the halt in local trade and labor supply causes a cascading economic effect. Wage workers are hardest hit as daily income streams dry up during recovery.',
        contextStats: { wage_loss: '65%', supply_chain: 'Disrupted' }
    },
    social: {
        icon: '🚶',
        title: 'Stage 5: Human Migration',
        metricLabel: 'Displaced Population',
        baseValue: 1.38,
        unit: 'M',
        historical: '0.8M',
        description: 'Large scale movement of population. Displacement leads to temporary settlements and school disruptions.',
        explanation: 'Migration begins. Families are forced into temporary shelters, often lacking basic sanitation. This displacement disrupts schooling and increases the risk of waterborne diseases, creating a long-term social burden on the community.',
        contextStats: { health_risk: 'Waterborne', shelter: 'Needed' }
    },
    poverty: {
        icon: '📉',
        title: 'Stage 6: Chronic Poverty',
        metricLabel: 'Poverty Incidence',
        baseValue: 26.2,
        unit: '%',
        historical: '3.1%',
        description: 'Long-term legacy. Debt cycles from crop loss often trap families in poverty for 3-5 years post-event.',
        explanation: 'The end point of the cycle. Without insurance or government support, families often take predatory loans to rebuild. This debt trap, combined with lost assets, ensures that the economic impact of a single flood lasts for generations.',
        contextStats: { debt_ratio: '1:4', recovery_time: 'Years' }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup All Sliders
    const sliderIds = ['rainSlider', 'drainageSlider', 'treesSlider', 'densitySlider', 'warningSlider', 'bankSlider', 'gradientSlider', 'resilienceSlider'];
    
    sliderIds.forEach(id => {
        const sliderEl = document.getElementById(id);
        const valEl = document.getElementById(id.replace('Slider', 'Val'));
        if (sliderEl && valEl) {
            sliderEl.addEventListener('input', () => {
                valEl.innerText = sliderEl.value + '%';
                updateSimulation();
            });
        }
    });

    // 2. Setup Chain Node Interaction
    const nodes = document.querySelectorAll('.chain-node');
    nodes.forEach(node => {
        node.addEventListener('click', () => {
            activeNodeId = node.getAttribute('data-node-id');
            nodes.forEach(n => n.classList.remove('active'));
            node.classList.add('active');
            updateSimulation(); // Refresh box with active node specific data
        });
    });

    // Initial state
    updateSimulation();
});

/**
 * Advanced Simulation Engine
 * Calculates metrics and updates the Active Detail Box
 */
function updateSimulation() {
    // Current Inputs
    const rain = parseInt(document.getElementById('rainSlider').value);
    const drain = parseInt(document.getElementById('drainageSlider').value);
    const trees = parseInt(document.getElementById('treesSlider').value);
    const dens = parseInt(document.getElementById('densitySlider').value);
    const warn = parseInt(document.getElementById('warningSlider').value);
    const bank = parseInt(document.getElementById('bankSlider').value);
    const slope = parseInt(document.getElementById('gradientSlider').value);
    const resilience = parseInt(document.getElementById('resilienceSlider').value);

    // --- SCIENTIFIC CALCULATIONS (Non-linear Response) ---
    
    // 1. Primary Trigger: Rainfall (Normalized)
    const liveRain = rain;

    // 2. Hydrological Hazard: Flood Depth (m)
    // Factors: Rain (Increases), Slope (Accelerates Concentration), Drainage (Reduces), Infrastructure/Banks (Limits)
    const runoffCoefficient = 0.3 + (dens * 0.005) - (trees * 0.003); 
    let liveDepth = (rain * runoffCoefficient) * (1 + (slope/200)) / (1 + (drain/50) + (bank/60));
    liveDepth = Math.max(0.1, parseFloat(liveDepth.toFixed(2)));

    // 3. Physical Asset Loss: Crop/Property Damage (%)
    // Vulnerability decreases with Banks and Community Resilience
    let liveCrop = (liveDepth * 25) * (1.1 - (bank/200)) * (1.2 - (resilience/250));
    liveCrop = Math.min(100, Math.max(0, parseFloat(liveCrop.toFixed(1))));

    // 4. Financial Shock: Economic Damage (Cr)
    // Urban centers (Dens) suffer more, Warnings allow mitigation
    let liveEcon = (liveDepth * (dens * 35)) * (1.3 - (warn/100)) * (1.1 - (resilience/300));
    liveEcon = Math.max(0, parseInt(liveEcon * 85));

    // 5. Social Impact: Displacement (Millions)
    // High density populations with steep terrain and low warnings face mass displacement
    let livePop = (liveDepth * (dens * 0.06)) * (1.2 - (warn/150)) * (1.1 + (slope/300));
    livePop = Math.max(0, parseFloat(livePop.toFixed(2)));

    // 6. Long-term Impact: Poverty Incubation (%)
    // Dependent on total economic loss vs Community Resilience capacity
    let livePov = (liveEcon / 2500) * 8 + (livePop / 1.5) * 4 * (1.5 - (resilience/100));
    livePov = Math.min(100, Math.max(0, parseFloat(livePov.toFixed(1))));

    // Results Mapping
    const results = {
        trigger: liveRain,
        flood: liveDepth,
        damage: liveCrop,
        economy: liveEcon,
        social: livePop,
        poverty: livePov
    };

    // Update Node Severity Indicators (the health bars on top cards)
    Object.keys(results).forEach(id => {
        const node = document.querySelector(`.chain-node[data-node-id="${id}"]`);
        if (node) {
            const val = mapToPercentage(id, results[id]);
            const fill = node.querySelector('.severity-fill');
            fill.style.width = `${val}%`;
            
            // Color logic
            const color = val < 30 ? 'var(--risk-low)' : val < 60 ? 'var(--risk-moderate)' : val < 85 ? 'var(--risk-high)' : 'var(--risk-critical)';
            fill.style.background = color;
        }
    });

    // UPDATE ACTIVE DETAIL BOX
    renderDetailBox(activeNodeId, results[activeNodeId]);
}

/**
 * Normalizes values to 0-100% for the severity bars
 */
function mapToPercentage(id, val) {
    const limits = { trigger: 100, flood: 4, damage: 100, economy: 10000, social: 10, poverty: 25 };
    return Math.min(100, (val / limits[id]) * 100);
}

/**
 * Renders the big information panel at the bottom
 */
function renderDetailBox(id, liveValue) {
    const data = nodeData[id];
    const panel = document.getElementById('nodeContextPanel');
    if (!data || !panel) return;

    // Calculate % Increase from Base
    const diff = liveValue - data.baseValue;
    const percentChange = ((diff / data.baseValue) * 100).toFixed(1);
    const isIncrease = diff >= 0;
    const changeClass = isIncrease ? 'change-up' : 'change-down';
    const arrow = isIncrease ? '↑' : '↓';

    panel.classList.add('active');
    panel.innerHTML = `
        <div class="diagnostic-context-panel">
            <div class="panel-header">
                <div class="header-main">
                    <span class="header-icon">${data.icon}</span>
                    <h3>${data.title}</h3>
                </div>
                <div class="live-badge">REAL-TIME SIMULATION</div>
            </div>

            <div class="panel-body">
                <div class="simulation-metric-card">
                    <div class="metric-top">
                        <span class="metric-label">${data.metricLabel}</span>
                        <div class="metric-change ${changeClass}">
                            ${arrow} ${Math.abs(percentChange)}%
                        </div>
                    </div>
                    <div class="metric-value">
                        ${data.prefix || ''}${liveValue}${data.unit}
                    </div>
                    <div class="metric-footer">
                        <span>Base Projection: ${data.prefix || ''}${data.baseValue}${data.unit}</span>
                    </div>
                </div>
 
                <div class="info-content">
                    <div class="data-grid">
                        <div class="data-item">
                            <span class="label">Historical Average</span>
                            <span class="val">${data.historical}</span>
                        </div>
                        ${Object.keys(data.contextStats).map(key => `
                            <div class="data-item">
                                <span class="label">${key.replace(/_/g, ' ')}</span>
                                <span class="val">${data.contextStats[key]}</span>
                            </div>
                        `).join('')}
                    </div>
                    <p class="description-text">${data.description}</p>
                </div>
            </div>

            <div class="panel-footer-explanation">
                <div class="explanation-chip">Detailed Impact Analysis</div>
                <p class="explanation-text">${data.explanation}</p>
            </div>
        </div>
    `;
}

/* ═══════════════════════════════════════════════════════════
   Interactive India Flood Risk Map — Leaflet + GeoJSON
   ─────────────────────────────────────────────────────────
   GeoJSON source: udit-001/india-maps-data (correct India
   boundaries with J&K + Ladakh). The combined file has
   district-level polygons, each with:
     • st_nm     — state name
     • district  — district name
     • st_code   — state code
   ═══════════════════════════════════════════════════════════ */

const MapModule = (() => {
    let map = null;
    let allFeaturesGeoJSON = null;  // full GeoJSON stored in memory
    let indiaLayer = null;          // state-colored layer (all districts)
    let stateDrillLayer = null;     // district-colored layer for one state
    let stateLabelsLayer = null;    // state name labels
    let districtLabelsLayer = null; // district name labels
    let currentView = 'india';     // 'india' | 'state'
    let currentStateName = null;

    const INDIA_GEOJSON_URL =
        'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/geojson/india.geojson';

    const RISK_COLORS = {
        low: '#22c55e',
        moderate: '#eab308',
        high: '#f97316',
        critical: '#ef4444',
        loading: '#64748b' // Slate 500 grey
    };

    function riskColor(r) { return RISK_COLORS[r] || '#64748b'; }
    function riskLabel(r) {
        return { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Very High', loading: 'Loading...' }[r] || 'Unknown';
    }
    function riskClass(r) {
        return { low: 'risk-low', moderate: 'risk-moderate', high: 'risk-high', critical: 'risk-critical', loading: 'risk-loading' }[r] || '';
    }

    /* ── Init ───────────────────────────────────────────── */
    function init() {
        if (!document.getElementById('floodMap')) return;

        map = L.map('floodMap', {
            center: [22.5, 82],
            zoom: 5,
            minZoom: 4,
            maxZoom: 12,
            zoomControl: true,
            attributionControl: false
        });

        // Theme-aware tile layers
        const darkTiles = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap, &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }
        );
        const lightTiles = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            { attribution: '&copy; OpenStreetMap, &copy; CARTO', subdomains: 'abcd', maxZoom: 19 }
        );

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        (currentTheme === 'dark' ? darkTiles : lightTiles).addTo(map);

        // Listen for theme changes
        const themeObserver = new MutationObserver(() => {
            const theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                if (map.hasLayer(lightTiles)) map.removeLayer(lightTiles);
                if (!map.hasLayer(darkTiles)) darkTiles.addTo(map);
            } else {
                if (map.hasLayer(darkTiles)) map.removeLayer(darkTiles);
                if (!map.hasLayer(lightTiles)) lightTiles.addTo(map);
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        L.control.attribution({ position: 'bottomright' })
            .addAttribution('FloodGuard India')
            .addTo(map);

        loadGeoJSON();
        wireBackButton();
    }

    /* ── Load GeoJSON ───────────────────────────────────── */
    async function loadGeoJSON() {
        try {
            const res = await fetch(INDIA_GEOJSON_URL);
            if (!res.ok) throw new Error('fetch failed');
            allFeaturesGeoJSON = await res.json();
            console.log(`[MapModule] Loaded ${allFeaturesGeoJSON.features.length} features`);
            // Debug: log unique st_nm values
            const stNames = [...new Set(allFeaturesGeoJSON.features.map(f => f.properties.st_nm))];
            console.log('[MapModule] States in GeoJSON:', stNames.join(', '));
            showIndiaView();
        } catch (err) {
            console.error('GeoJSON load error:', err);
            renderFallbackMarkers();
        }
    }

    /* ── Match st_nm → our INDIA_STATES_DATA key ────────── */
    function matchState(geoStNm) {
        if (!geoStNm) return null;
        if (INDIA_STATES_DATA[geoStNm]) return geoStNm;

        const lower = geoStNm.toLowerCase().trim();
        // Direct lowercase match
        for (const key of Object.keys(INDIA_STATES_DATA)) {
            if (key.toLowerCase() === lower) return key;
        }
        // Alias map
        const aliases = {
            'nct of delhi': 'Delhi',
            'ncr': 'Delhi',
            'jammu & kashmir': 'Jammu & Kashmir',
            'jammu and kashmir': 'Jammu & Kashmir',
            'orissa': 'Odisha',
            'uttaranchal': 'Uttarakhand'
        };
        if (aliases[lower]) return aliases[lower];

        // Partial match
        for (const key of Object.keys(INDIA_STATES_DATA)) {
            if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return key;
        }
        return null;
    }

    /* ── Robust feature name extraction ──────────────── */
    function getDistrictNameFromFeature(feature) {
        const p = feature.properties || {};
        return p.district || p.dtname || p.DISTRICT || p.NAME_2 || p.Dist_Name || p.name || p.NAME || p.DTNAME || p.dt_name || '';
    }

    function getStateNameFromFeature(feature) {
        const p = feature.properties || {};
        return p.st_nm || p.ST_NM || p.state || p.STATE || p.NAME_1 || p.name || '';
    }

    /* ── India View (state-level coloring) ─────────────── */
    function showIndiaView() {
        clearLayers();
        currentView = 'india';
        currentStateName = null;
        document.getElementById('backToIndia').style.display = 'none';
        document.getElementById('mapViewLabel').textContent = 'All States';
        document.getElementById('statsPanelEmpty').style.display = 'flex';
        document.getElementById('statsPanelContent').style.display = 'none';

        if (typeof WeatherModule !== 'undefined' && WeatherModule.startNationalSync) {
            WeatherModule.startNationalSync();
        }

        // Each feature (district) gets colored by its parent state's risk
        indiaLayer = L.geoJSON(allFeaturesGeoJSON, {
            style: feature => {
                const stKey = matchState(feature.properties.st_nm);
                const d = stKey ? INDIA_STATES_DATA[stKey] : null;
                const risk = d ? d.risk : 'moderate';
                return {
                    fillColor: riskColor(risk),
                    fillOpacity: 0.45,
                    color: '#0f172a',         // dark border between districts
                    weight: 0.5,
                    opacity: 0.6
                };
            },
            onEachFeature: (feature, layer) => {
                const stNm = getStateNameFromFeature(feature);
                const stKey = matchState(stNm);
                const stData = stKey ? INDIA_STATES_DATA[stKey] : null;
                const displayName = stKey || stNm || 'Region';

                // Tooltip — show state name
                layer.bindTooltip(
                    `<strong>${displayName}</strong>` +
                    (stData ? `<br>Risk: ${riskLabel(stData.risk)}<br>Rainfall: ${stData.rainfall} mm` : ''),
                    { sticky: true, className: 'map-tooltip', direction: 'auto' }
                );

                // NO hover effect on India view — states are composed of
                // many district polygons so per-polygon hover looks broken

                // Click → show state stats + drill into districts
                layer.on('click', () => {
                    if (stKey && stData) {
                        showStateStats(stKey, stData);
                        drillIntoState(stKey);
                    }
                });
            }
        }).addTo(map);

        // Add state-level labels (one per state)
        addStateLabels();

        map.flyTo([22.5, 82], 5, { duration: 0.6 });
    }

    /* ── Add state name labels ─────────────────────────── */
    function addStateLabels() {
        if (stateLabelsLayer) map.removeLayer(stateLabelsLayer);
        stateLabelsLayer = L.layerGroup();

        // Group features by state to calculate proper centroids
        const stateGroups = {};
        allFeaturesGeoJSON.features.forEach(f => {
            const stName = matchState(f.properties.st_nm);
            if (!stName) return;
            if (!stateGroups[stName]) stateGroups[stName] = [];
            stateGroups[stName].push(f);
        });

        Object.keys(stateGroups).forEach(stName => {
            let totalLat = 0, totalLng = 0, count = 0;
            stateGroups[stName].forEach(f => {
                const c = getCentroid(f.geometry);
                if (c) {
                    totalLat += c[0];
                    totalLng += c[1];
                    count++;
                }
            });

            if (count > 0) {
                const lat = totalLat / count;
                const lng = totalLng / count;

                const label = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'state-label-icon',
                        html: `<span class="state-label">${stName}</span>`,
                        iconSize: [0, 0],
                        iconAnchor: [0, 0]
                    }),
                    interactive: false
                });
                stateLabelsLayer.addLayer(label);
            }
        });

        stateLabelsLayer.addTo(map);
    }

    /* ── Drill into State (district view) ─────────────── */
    function drillIntoState(stateKey) {
        clearLayers();
        currentView = 'state';
        currentStateName = stateKey;
        document.getElementById('backToIndia').style.display = 'inline-flex';
        document.getElementById('mapViewLabel').textContent = stateKey;
        lucide.createIcons();

        // Filter features for this state — ONLY include features that have a district property
        // The GeoJSON may contain state-level boundary polygons without district names
        const stateFeatures = allFeaturesGeoJSON.features.filter(function (f) {
            if (matchState(f.properties.st_nm) !== stateKey) return false;
            // Exclude features without a district name (state-level boundary polygons)
            return !!(f.properties.district || f.properties.dtname || f.properties.DISTRICT);
        });

        if (stateFeatures.length === 0) {
            showIndiaView();
            return;
        }

        console.log('[MapModule] Drill into ' + stateKey + ': ' + stateFeatures.length + ' districts');

        var stateGeoJSON = { type: 'FeatureCollection', features: stateFeatures };

        // Single L.geoJSON — the CORRECT Leaflet pattern
        stateDrillLayer = L.geoJSON(stateGeoJSON, {
            style: function (feature) {
                var dName = feature.properties.district || feature.properties.dtname || 'Unknown';
                var dData = genDistrict(dName, stateKey);
                return {
                    fillColor: riskColor(dData.risk),
                    fillOpacity: 0.5,
                    color: 'rgba(15, 23, 42, 0.6)',
                    weight: 1,
                    opacity: 0.8
                };
            },
            onEachFeature: function (feature, layer) {
                var dName = feature.properties.district || feature.properties.dtname || 'Unknown';
                var dData = genDistrict(dName, stateKey);


                layer.bindTooltip(
                    '<strong>' + dName + '</strong><br>Risk: ' + riskLabel(dData.risk) + '<br>' + stateKey,
                    { sticky: true, className: 'map-tooltip', direction: 'auto' }
                );

                layer.on('mouseover', function (e) {
                    e.target.setStyle({ weight: 2, color: 'rgba(255,255,255,0.5)', opacity: 1 });
                });
                layer.on('mouseout', function (e) {
                    stateDrillLayer.resetStyle(e.target);
                });

                layer.on('click', function () {

                    showDistrictStats(dName, dData, stateKey);
                });
            }
        }).addTo(map);

        // Fit bounds
        if (stateDrillLayer.getBounds().isValid()) {
            map.fitBounds(stateDrillLayer.getBounds(), { padding: [40, 40], duration: 0.8 });
        }

        // District labels
        addDistrictLabels(stateFeatures);

        // 4. Live District Sync (requested feature)
        if (typeof WeatherModule !== 'undefined' && WeatherModule.startDistrictSync) {
            WeatherModule.startDistrictSync(stateKey, stateFeatures, function (dName, stName) {
                const dKey = stName + '::' + dName;
                if (!districtCache[dKey]) genDistrict(dName, stName);
                return districtCache[dKey];
            }, getCentroid);
        }
    }

    /* ── Add district name labels (centroid based) ─────── */
    function addDistrictLabels(features) {
        if (districtLabelsLayer) map.removeLayer(districtLabelsLayer);
        districtLabelsLayer = L.layerGroup();

        // features is an array of GeoJSON Feature objects with _distName pre-computed
        const featureList = features.features || features; // handle both array and FeatureCollection
        featureList.forEach(f => {
            const name = f._distName || f.properties.district || '';
            if (!name) return;
            const center = getCentroid(f.geometry);
            if (!center) return;

            const label = L.marker(center, {
                icon: L.divIcon({
                    className: 'district-label-icon',
                    html: `<span class="district-label">${name}</span>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                }),
                interactive: false
            });
            districtLabelsLayer.addLayer(label);
        });
        districtLabelsLayer.addTo(map);
    }

    /* ── Calculate centroid of a geometry ──────────────── */
    function getCentroid(geometry) {
        let coords = [];
        if (geometry.type === 'Polygon') {
            coords = geometry.coordinates[0];
        } else if (geometry.type === 'MultiPolygon') {
            // Use the largest polygon
            let maxLen = 0;
            geometry.coordinates.forEach(poly => {
                if (poly[0].length > maxLen) {
                    maxLen = poly[0].length;
                    coords = poly[0];
                }
            });
        }
        if (coords.length === 0) return null;
        let sumLat = 0, sumLng = 0;
        coords.forEach(c => { sumLng += c[0]; sumLat += c[1]; });
        return [sumLat / coords.length, sumLng / coords.length];
    }

    /* ── Generate district-level data (deterministic) ──── */
    const districtCache = {};
    function genDistrict(districtName, stateName) {
        const key = stateName + '::' + districtName;
        // Prioritize live data from sync if it exists
        if (districtCache[key] && districtCache[key].lastUpdate) return districtCache[key];
        if (districtCache[key]) return districtCache[key];

        const stData = INDIA_STATES_DATA[stateName];
        const base = stData || { risk: 'moderate', rainfall: 1000, floodFreq: 5 };

        // Use different hash seeds for each property so they vary independently
        const h1 = hashStr(key + '_risk');
        const h2 = hashStr(key + '_rain');
        const h3 = hashStr(key + '_pop');
        const h4 = hashStr(key + '_prox');
        const h5 = hashStr(key + '_freq');

        const p1 = (h1 & 0xFFFF) / 0xFFFF;
        const p2 = (h2 & 0xFFFF) / 0xFFFF;
        const p3 = (h3 & 0xFFFF) / 0xFFFF;
        const p4 = (h4 & 0xFFFF) / 0xFFFF;
        const p5 = (h5 & 0xFFFF) / 0xFFFF;

        // Ensure the district always shows loading until `weather.js` actually performs the API fetch and assigns `lastUpdate`.
        const risk = 'loading';

        const rainfall = Math.round((base.rainfall || 1000) * (0.4 + p2 * 1.2));
        const popList = ['120K', '250K', '380K', '520K', '700K', '950K', '1.4M', '2.1M', '3.5M'];
        const population = popList[Math.floor(p3 * popList.length)];
        const proximityList = ['Very Close', 'Close', 'Medium', 'Far'];
        const riverProximity = proximityList[Math.floor(p4 * proximityList.length)];
        const floodFreq = Math.max(1, Math.round(base.floodFreq * (0.15 + p5 * 1.4)));

        const d = { risk, rainfall, population, riverProximity, floodFreq };
        districtCache[key] = d;
        return d;
    }

    function hashStr(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        return Math.abs(h);
    }

    /* ── Stats panel: show state info ─────────────────── */
    function showStateStats(name, data) {
        const empty = document.getElementById('statsPanelEmpty');
        const content = document.getElementById('statsPanelContent');
        if (!data || !empty || !content) return;

        empty.style.display = 'none';
        content.style.display = 'flex';

        document.getElementById('statsRegionName').textContent = name;
        const badge = document.getElementById('statsRiskBadge');
        badge.textContent = riskLabel(data.risk);
        badge.className = 'risk-badge ' + riskClass(data.risk);
        document.getElementById('statsRegionType').textContent = 'State / UT';

        document.getElementById('statsPanelGrid').innerHTML = `
            <div class="stats-metric premium-card-rain">
                <div class="stats-icon-wrapper"><i data-lucide="cloud-rain"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${data.rainfall} <span class="stats-unit">mm</span></div>
                    <div class="stats-metric-label">Avg Rainfall</div>
                </div>
            </div>
            <div class="stats-metric premium-card-pop">
                <div class="stats-icon-wrapper"><i data-lucide="users"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${data.population}</div>
                    <div class="stats-metric-label">Population</div>
                </div>
            </div>
            <div class="stats-metric premium-card-freq">
                <div class="stats-icon-wrapper"><i data-lucide="history"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${data.floodFreq}<span class="stats-unit">/yr</span></div>
                    <div class="stats-metric-label">Flood Events</div>
                </div>
            </div>
            <div class="stats-metric premium-card-risk ${riskClass(data.risk)}">
                <div class="stats-icon-wrapper"><i data-lucide="shield-alert"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${riskLabel(data.risk)}</div>
                    <div class="stats-metric-label">Risk Level</div>
                </div>
            </div>`;
        if (window.lucide) window.lucide.createIcons();

        const hazard = data.lastHazard || { p: 0, r: 0, sm: 0, h: 0 };
        const tags = data.rivers.map(r => `<span class="stats-river-tag">${r}</span>`).join('');

        document.getElementById('statsPanelExtra').innerHTML = `
            <div class="stats-rivers-section">
                <div class="stats-rivers-title">Live Hazard Parameters</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
                    <div style="font-size:0.65rem;color:var(--text-muted)">Precipitation: <span style="color:var(--text-primary)">${hazard.p.toFixed(1)}mm/h</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">River Discharge: <span style="color:var(--text-primary)">${Math.round(hazard.r)}m³/s</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">Soil Moisture: <span style="color:var(--text-primary)">${(hazard.sm * 100).toFixed(0)}%</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">Humidity: <span style="color:var(--text-primary)">${hazard.h}%</span></div>
                </div>
            </div>
            <div class="stats-rivers-section" style="margin-top:10px">
                <div class="stats-rivers-title">Major Rivers</div>
                <div class="stats-rivers-list">${tags}</div>
            </div>
            <div class="stats-district-hint">
                <i data-lucide="mouse-pointer-click"></i>
                <span>Click "Back to India" to return, or click districts for detailed data</span>
            </div>`;
        lucide.createIcons();
    }

    /* ── Stats panel: show district info ────────────── */
    function showDistrictStats(districtName, dData, stateName) {
        const empty = document.getElementById('statsPanelEmpty');
        const content = document.getElementById('statsPanelContent');
        if (!empty || !content) return;

        empty.style.display = 'none';

        // Force re-render animation by briefly hiding then showing
        content.style.display = 'none';
        void content.offsetHeight; // trigger reflow
        content.style.display = 'flex';

        document.getElementById('statsRegionName').textContent = districtName;
        const badge = document.getElementById('statsRiskBadge');
        badge.textContent = riskLabel(dData.risk);
        badge.className = 'risk-badge ' + riskClass(dData.risk);
        document.getElementById('statsRegionType').textContent = 'District • ' + stateName;

        document.getElementById('statsPanelGrid').innerHTML = `
            <div class="stats-metric premium-card-rain">
                <div class="stats-icon-wrapper"><i data-lucide="cloud-rain"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${dData.rainfall} <span class="stats-unit">mm</span></div>
                    <div class="stats-metric-label">Avg Rainfall</div>
                </div>
            </div>
            <div class="stats-metric premium-card-pop">
                <div class="stats-icon-wrapper"><i data-lucide="users"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${dData.population}</div>
                    <div class="stats-metric-label">Population</div>
                </div>
            </div>
            <div class="stats-metric premium-card-freq">
                <div class="stats-icon-wrapper"><i data-lucide="history"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${dData.floodFreq}<span class="stats-unit">/yr</span></div>
                    <div class="stats-metric-label">Flood Events</div>
                </div>
            </div>
            <div class="stats-metric premium-card-proximity">
                <div class="stats-icon-wrapper"><i data-lucide="waves"></i></div>
                <div class="stats-details">
                    <div class="stats-metric-value">${dData.riverProximity}</div>
                    <div class="stats-metric-label">River Proximity</div>
                </div>
            </div>`;
        if (window.lucide) window.lucide.createIcons();

        const hazard = dData.lastHazard || { p: 0, r: 0, sm: 0, h: 0 };
        const pct = { low: 25, moderate: 50, high: 75, critical: 95 }[dData.risk] || 30;

        document.getElementById('statsPanelExtra').innerHTML = `
            <div class="stats-rivers-section">
                <div class="stats-rivers-title">Live Diagnostic Data</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0;">
                    <div style="font-size:0.65rem;color:var(--text-muted)">Precip: <span style="color:var(--text-primary)">${hazard.p.toFixed(1)}mm/h</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">River: <span style="color:var(--text-primary)">${Math.round(hazard.r)}m³/s</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">Soil: <span style="color:var(--text-primary)">${(hazard.sm * 100).toFixed(0)}%</span></div>
                    <div style="font-size:0.65rem;color:var(--text-muted)">Humid: <span style="color:var(--text-primary)">${hazard.h}%</span></div>
                </div>
                <div style="border-top:1px solid rgba(255,255,255,0.05);padding-top:8px">
                    <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--text-muted);margin-bottom:4px">
                        <span>Cumulative Risk Score</span>
                        <span style="color:${riskColor(dData.risk)};font-weight:600">${pct}%</span>
                    </div>
                    <div style="height:6px;background:rgba(255,255,255,.05);border-radius:99px;overflow:hidden">
                        <div style="height:100%;width:${pct}%;background:${riskColor(dData.risk)};border-radius:99px;transition:width .5s ease"></div>
                    </div>
                </div>
            </div>
            <div class="stats-district-hint">
                <i data-lucide="map-pin"></i>
                <span>Sensors calibrated for ${districtName}</span>
            </div>`;
        lucide.createIcons();
    }

    /* ── Clear all map layers ─────────────────────────── */
    function clearLayers() {
        if (indiaLayer) { map.removeLayer(indiaLayer); indiaLayer = null; }
        if (stateDrillLayer) { map.removeLayer(stateDrillLayer); stateDrillLayer = null; }
        if (stateLabelsLayer) { map.removeLayer(stateLabelsLayer); stateLabelsLayer = null; }
        if (districtLabelsLayer) { map.removeLayer(districtLabelsLayer); districtLabelsLayer = null; }
    }

    /* ── Back to India ────────────────────────────────── */
    function wireBackButton() {
        const handler = () => showIndiaView();
        const btn = document.getElementById('backToIndia');
        if (btn) btn.addEventListener('click', handler);
        document.addEventListener('DOMContentLoaded', () => {
            const b = document.getElementById('backToIndia');
            if (b) b.addEventListener('click', handler);
        });
    }

    /* ── Fallback markers ─────────────────────────────── */
    function renderFallbackMarkers() {
        Object.entries(INDIA_STATES_DATA).forEach(([name, d]) => {
            const m = L.circleMarker([d.lat, d.lng], {
                radius: 8,
                fillColor: riskColor(d.risk),
                color: riskColor(d.risk),
                weight: 2,
                fillOpacity: 0.6
            }).addTo(map);
            m.bindTooltip(`<strong>${name}</strong><br>Risk: ${riskLabel(d.risk)}`, { sticky: true });
            m.on('click', () => { showStateStats(name, d); });
        });
        addStateLabels();
    }

    /* ── Search integration ───────────────────────────── */
    function getAllLocations() {
        if (!allFeaturesGeoJSON) return [];

        const status = [];

        // 1. States
        Object.keys(INDIA_STATES_DATA).forEach(stName => {
            const d = INDIA_STATES_DATA[stName];
            status.push({ name: stName, lat: d.lat, lng: d.lng, type: 'State', risk: d.risk });
        });

        // 2. Cities
        INDIAN_CITIES.forEach(c => {
            status.push({ name: `${c.name}, ${c.state}`, lat: c.lat, lng: c.lng, type: 'City' });
        });

        // 3. Districts from GeoJSON
        const districtsSeen = new Set();
        allFeaturesGeoJSON.features.forEach(f => {
            const dName = getDistrictNameFromFeature(f);
            const stNm = getStateNameFromFeature(f);
            const stKey = matchState(stNm);

            if (dName && !districtsSeen.has(`${dName}|${stKey}`)) {
                const center = getCentroid(f.geometry);
                if (center) {
                    status.push({
                        name: dName,
                        state: stKey || stNm,
                        lat: center[0],
                        lng: center[1],
                        type: 'District',
                        stateKey: stKey
                    });
                    districtsSeen.add(`${dName}|${stKey}`);
                }
            }
        });

        return status;
    }

    function zoomToLocation(lat, lng, zoom = 8, stateKey = null, districtName = null) {
        if (!map) return;
        if (stateKey) {
            drillIntoState(stateKey);
            // If district also provided, wait for transition then potentially highlight?
            // For now, just fly to the specific point
        }
        map.flyTo([lat, lng], zoom, { duration: 1 });
    }

    function refresh() {
        if (!map) return;
        if (currentView === 'india') {
            indiaLayer.setStyle(feature => {
                const stKey = matchState(feature.properties.st_nm);
                const d = stKey ? INDIA_STATES_DATA[stKey] : null;
                const risk = d ? d.risk : 'moderate';
                return { fillColor: riskColor(risk) };
            });
        } else if (currentView === 'state' && stateDrillLayer) {
            stateDrillLayer.setStyle(feature => {
                const dName = feature.properties.district || feature.properties.dtname || 'Unknown';
                const dData = genDistrict(dName, currentStateName);
                return { fillColor: riskColor(dData.risk) };
            });

            // If a state's data changed, refresh the panel if it's currently showing state stats
            // (Not as critical for district unless genDistrict changes, but good for consistency)
            const stData = INDIA_STATES_DATA[currentStateName];
            if (stData) {
                // We only refresh if we aren't specifically looking at a district stats view 
                // but usually showStateStats is called during drill-down.
                // For simplicity, let's just refresh if it's state view.
                showStateStats(currentStateName, stData);
            }
        }
    }

    return { init, getAllLocations, zoomToLocation, refresh };
})();

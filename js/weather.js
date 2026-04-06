/* ═══════════════════════════════════════════════════════════
   Weather Module — Open-Meteo API integration
   ═══════════════════════════════════════════════════════════ */

const WeatherModule = (() => {
    const BASE = 'https://api.open-meteo.com/v1/forecast';
    const FLOOD_BASE = 'https://flood-api.open-meteo.com/v1/flood';

    async function fetchWeather(lat, lng) {
        const params = new URLSearchParams({
            latitude: lat,
            longitude: lng,
            current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,soil_moisture_0_to_7cm,evapotranspiration',
            hourly: 'precipitation_probability',
            timezone: 'Asia/Kolkata',
            forecast_days: 1
        });
        const res = await fetch(`${BASE}?${params}`);
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
    }

    async function fetchRiverDischarge(lat, lng) {
        try {
            const params = new URLSearchParams({
                latitude: lat,
                longitude: lng,
                daily: 'river_discharge_max',
                forecast_days: 1
            });
            const res = await fetch(`${FLOOD_BASE}?${params}`);
            if (!res.ok) return 0;
            const data = await res.json();
            return data.daily?.river_discharge_max?.[0] || 0;
        } catch { return 0; }
    }

    function calculateRisk(weatherData, riverDischarge, exposure, vulnerability) {
        const c = weatherData.current;

        // 1. Hazard Calculation (Normalized to 0-1)
        // Normalization ranges (approximate for typical extreme weather in India)
        const P = Math.min(1, c.precipitation / 50); // 50mm/hr is extreme
        const R = Math.min(1, riverDischarge / 5000); // 5000 m³/s is major
        const SM = Math.min(1, c.soil_moisture_0_to_7cm / 0.5); // 0.5 m³/m³ is saturated
        const H = c.relative_humidity_2m / 100;
        const W = Math.min(1, c.wind_speed_10m / 100); // 100 km/h is severe
        const ET = Math.min(1, c.evapotranspiration / 2); // 2mm/hr is high

        const hazard = (0.35 * P) + (0.25 * R) + (0.15 * SM) + (0.10 * H) + (0.10 * W) + (0.05 * ET);

        // 2. Final Flood Risk
        const riskScore = hazard * exposure * vulnerability;

        // 3. Risk Classification
        if (riskScore >= 0.8) return 'critical';
        if (riskScore >= 0.6) return 'high';
        if (riskScore >= 0.3) return 'moderate';
        return 'low';
    }

    function updateMapTimestamp(status = '') {
        const el = document.getElementById('mapLastUpdated');
        if (el) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (status) {
                el.innerHTML = `<span class="pulse-dot"></span> Syncing ${status}... <small>(${timeStr})</small>`;
                el.parentNode.style.background = 'rgba(34, 211, 238, 0.12)';
                el.parentNode.style.color = 'var(--accent-cyan)';
            } else {
                el.innerHTML = `<span class="pulse-dot"></span> Live: ${timeStr}`;
                el.parentNode.style.background = 'rgba(34, 197, 94, 0.08)';
                el.parentNode.style.color = '#22c55e';
            }
        }
    }

    function updateUI(data, locationName, riskLevel) {
        const c = data.current;
        const tempEl = document.getElementById('wTemp');
        const rainEl = document.getElementById('wRain');
        const windEl = document.getElementById('wWind');
        const precipEl = document.getElementById('wPrecip');
        const humidEl = document.getElementById('wHumid') || document.getElementById('wHumidity');
        const locNameEl = document.getElementById('weatherLocationName');
        const timeEl = document.getElementById('weatherTimestamp');

        if (tempEl) tempEl.textContent = Math.round(c.temperature_2m);
        if (rainEl) rainEl.textContent = c.precipitation.toFixed(1);
        if (windEl) windEl.textContent = Math.round(c.wind_speed_10m);

        const probs = data.hourly?.precipitation_probability || [];
        const maxProb = probs.length ? Math.max(...probs) : 0;
        if (precipEl) precipEl.textContent = maxProb;
        if (humidEl) humidEl.textContent = c.relative_humidity_2m;

        if (locNameEl) locNameEl.textContent = locationName;
        if (timeEl) {
            timeEl.textContent = 'Live • ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
    }

    async function loadWeather(lat, lng, name, stData = null) {
        try {
            updateMapTimestamp(name.split(',')[0]);
            const [weather, river] = await Promise.all([
                fetchWeather(lat, lng),
                fetchRiverDischarge(lat, lng)
            ]);

            let risk = 'moderate';
            if (stData) {
                risk = calculateRisk(weather, river, stData.exposure, stData.vulnerability);
                stData.risk = risk;
                // Store hazard details for UI
                stData.lastHazard = {
                    p: weather.current.precipitation,
                    r: river,
                    sm: weather.current.soil_moisture_0_to_7cm,
                    h: weather.current.relative_humidity_2m
                };
            }

            updateUI(weather, name, risk);
            updateMapTimestamp();
            if (typeof MapModule !== 'undefined' && MapModule.refresh) MapModule.refresh();
        } catch (err) {
            console.error('Weather error:', err);
            updateMapTimestamp('Error');
        }
    }

    // ── Live Risk Engine (Background Worker) ──
    let syncInterval = null;
    let syncScope = 'national'; // 'national' | 'state'
    let syncQueue = [];
    let queueIndex = 0;

    async function syncLocation(lat, lng, storeObj, label, isDistrict = false) {
        try {
            const [weather, river] = await Promise.all([
                fetchWeather(lat, lng),
                fetchRiverDischarge(lat, lng)
            ]);
            const risk = calculateRisk(weather, river, storeObj.exposure || 0.5, storeObj.vulnerability || 0.5);
            storeObj.risk = risk;
            storeObj.lastUpdate = Date.now();
            storeObj.lastHazard = {
                p: weather.current.precipitation,
                r: river,
                sm: weather.current.soil_moisture_0_to_7cm,
                h: weather.current.relative_humidity_2m
            };

            // Format time for the label
            const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            storeObj.lastUpdatedDisplay = timeStr;
            return true;
        } catch (e) { return false; }
    }

    function _startSyncLoop() {
        if (syncInterval) clearInterval(syncInterval);
        queueIndex = 0;

        // Sync 1 item every 3.5 seconds (prevents Open-Meteo rate limit bursts)
        // For ~30-40 items (states or districts), a full loop takes ~2 minutes!
        syncInterval = setInterval(async () => {
            if (syncQueue.length === 0) return;

            const item = syncQueue[queueIndex];
            if (item) {
                updateMapTimestamp(item.name);
                await syncLocation(item.lat, item.lng, item.dataObj, item.name, syncScope === 'state');

                // Tell MapModule to refresh visuals with new data
                if (typeof MapModule !== 'undefined' && MapModule.refresh) MapModule.refresh();

                // Show completed sync status for 2 seconds
                setTimeout(() => updateMapTimestamp(), 2000);
            }

            queueIndex = (queueIndex + 1) % syncQueue.length;
        }, 3500);
    }

    // Called from app.js initially
    async function initLiveEngine() {
        startNationalSync();
    }

    // Called when switching to India view
    async function startNationalSync() {
        syncScope = 'national';
        syncQueue = Object.keys(INDIA_STATES_DATA).map(stateName => {
            const d = INDIA_STATES_DATA[stateName];
            return { name: stateName, lat: d.lat, lng: d.lng, dataObj: d };
        });

        console.log(`[WeatherModule] Starting National Live Sync (${syncQueue.length} states)...`);
        _startSyncLoop();
    }

    // Called when switching to a State view
    async function startDistrictSync(stateName, districtFeatures, getOrInitDistrictData, getCentroid) {
        syncScope = 'state';
        syncQueue = [];

        // Build the queue of districts based on GeoJSON features
        districtFeatures.forEach(f => {
            const dName = f._distName || f.properties.district || f.properties.dtname || f.properties.DISTRICT;
            if (!dName) return;

            const centroid = getCentroid(f.geometry);
            if (!centroid) return;

            const dData = getOrInitDistrictData(dName, stateName);
            syncQueue.push({
                name: dName,
                lat: centroid[0],
                lng: centroid[1],
                dataObj: dData
            });
        });

        console.log(`[WeatherModule] Starting District Live Sync for ${stateName} (${syncQueue.length} districts)...`);
        _startSyncLoop();
    }

    return { loadWeather, initLiveEngine, syncLocation, startNationalSync, startDistrictSync };
})();

/* ─── Location Search System ─── */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('locationInput');
    const suggestions = document.getElementById('searchSuggestions');
    const searchBtn = document.getElementById('searchLocationBtn');
    const locateBtn = document.getElementById('locateMeBtn');
    const ticker = document.getElementById('heroTicker');

    if (!input) return;

    // Build searchable list on demand (districts are dynamic)
    function getSearchData() {
        const mapLocations = (typeof MapModule !== 'undefined' && MapModule.getAllLocations)
            ? MapModule.getAllLocations()
            : [];

        // Combine with static data if map not fully loaded yet
        if (mapLocations.length > 0) return mapLocations;

        return [
            ...INDIAN_CITIES.map(c => ({ name: c.name, state: c.state, lat: c.lat, lng: c.lng, type: 'City' })),
            ...Object.entries(INDIA_STATES_DATA).map(([name, d]) => ({ name, lat: d.lat, lng: d.lng, type: 'State' }))
        ];
    }

    let searchTimeout;

    input.addEventListener('input', () => {
        const val = input.value.trim().toLowerCase();
        if (val.length < 1) {
            suggestions.classList.remove('open');
            return;
        }

        // Clear existing timeout
        clearTimeout(searchTimeout);

        // 1. Show Local Matches Immediately
        const allLocations = getSearchData();
        const localMatches = allLocations
            .filter(l => l.name.toLowerCase().includes(val) || (l.state && l.state.toLowerCase().includes(val)))
            .slice(0, 8);

        renderSuggestions(localMatches, val);

        // 2. Fetch from Nominatim API for Villages/Blocks (Debounced)
        if (val.length >= 3) {
            searchTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`);
                    const apiData = await response.json();

                    const apiMatches = apiData.map(item => ({
                        name: item.display_name.split(',')[0],
                        state: item.address.state || item.address.country,
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                        type: 'Global',
                        full: item.display_name
                    }));

                    // Combine and re-render
                    const combined = [...localMatches];
                    apiMatches.forEach(am => {
                        // Avoid duplicates if coordinates are very close
                        if (!combined.some(cm => Math.abs(cm.lat - am.lat) < 0.01 && Math.abs(cm.lng - am.lng) < 0.01)) {
                            combined.push(am);
                        }
                    });

                    renderSuggestions(combined.slice(0, 12), val);
                } catch (err) {
                    console.error("Geocoding error:", err);
                }
            }, 600);
        }
    });

    function renderSuggestions(matches, query) {
        if (!matches.length) {
            if (query.length < 3) suggestions.classList.remove('open');
            return;
        }

        suggestions.innerHTML = matches.map(m => {
            const subtitle = m.type === 'District' ? `District in ${m.state}` : (m.type === 'Global' ? m.full : (m.state ? m.state : 'India'));
            let icon = 'map-pin';
            if (m.type === 'State') icon = 'map';
            if (m.type === 'City') icon = 'building-2';
            if (m.type === 'District') icon = 'navigation';

            const typeLabel = m.type === 'Global' ? 'Village/Local' : m.type;
            const typeClass = `type-${(m.type || 'global').toLowerCase()}`;

            return `
                <div class="search-suggestion-item" 
                     data-lat="${m.lat}" 
                     data-lng="${m.lng}" 
                     data-name="${m.name}" 
                     data-type="${m.type}" 
                     data-state="${m.stateKey || ''}">
                    <i data-lucide="${icon}"></i>
                    <div class="suggestion-info">
                        <span class="suggestion-name">${m.name}</span>
                        <span class="suggestion-sub">${subtitle}</span>
                    </div>
                    <span class="suggestion-type ${typeClass}">${typeLabel}</span>
                </div>`;
        }).join('');

        suggestions.classList.add('open');
        lucide.createIcons();

        // Click handlers
        suggestions.querySelectorAll('.search-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                handleSelection(item.dataset);
            });
        });
    }

    function handleSelection(data) {
        const lat = parseFloat(data.lat);
        const lng = parseFloat(data.lng);
        const name = data.name;
        const type = data.type;
        const stateKey = data.stateKey || data.state; // handle both naming conventions

        input.value = name;
        suggestions.classList.remove('open');

        // Load weather with live risk data if it's a state/district
        const stKey = stateKey || (type === 'State' ? name : null);
        const stData = stKey ? INDIA_STATES_DATA[stKey] : null;

        WeatherModule.loadWeather(lat, lng, name + (stKey ? `, ${stKey}` : ''), stData);

        // Interaction with map
        if (typeof MapModule !== 'undefined' && MapModule.zoomToLocation) {
            let zoom = 10;
            if (type === 'State') zoom = 6;
            else if (type === 'District') zoom = 8;
            else if (type === 'City') zoom = 10;
            else zoom = 13;

            MapModule.zoomToLocation(lat, lng, zoom, stKey, type === 'District' ? name : null);
        }
    }

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-input-group')) suggestions.classList.remove('open');
    });

    // Search button
    searchBtn.addEventListener('click', () => {
        const first = suggestions.querySelector('.search-suggestion-item');
        if (first && suggestions.classList.contains('open')) {
            first.click();
        } else {
            const val = input.value.trim().toLowerCase();
            const all = getSearchData();
            const match = all.find(l => l.name.toLowerCase().includes(val));
            if (match) handleSelection({
                lat: match.lat,
                lng: match.lng,
                name: match.name,
                type: match.type,
                state: match.stateKey
            });
        }
    });

    // Enter key
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = suggestions.querySelector('.search-suggestion-item');
            if (first && suggestions.classList.contains('open')) first.click();
            else searchBtn.click();
        }
    });

    // Locate Me
    locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
        locateBtn.innerHTML = '<i data-lucide="loader-2"></i><span>Locating...</span>';
        lucide.createIcons();
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                WeatherModule.loadWeather(latitude, longitude, `Lat ${latitude.toFixed(2)}, Lng ${longitude.toFixed(2)}`);
                locateBtn.innerHTML = '<i data-lucide="crosshair"></i><span>Locate Me</span>';
                lucide.createIcons();
            },
            () => {
                alert('Location access denied');
                locateBtn.innerHTML = '<i data-lucide="crosshair"></i><span>Locate Me</span>';
                lucide.createIcons();
            }
        );
    });

    // Default weather — Delhi
    WeatherModule.loadWeather(28.7041, 77.1025, 'New Delhi, India', INDIA_STATES_DATA["Delhi"]);

    // Start background risk engine
    WeatherModule.initLiveEngine();

    // Ticker update
    setTimeout(() => {
        if (ticker) ticker.textContent = 'Live Flood Risk Engine Active • Monitoring 36 States/UTs • Updating Every 2 Mins';
    }, 2000);
});

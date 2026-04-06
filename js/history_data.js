/* ═══════════════════════════════════════════════════════════
   Comprehensive Historical Flood Data
   ═══════════════════════════════════════════════════════════ */

const HISTORICAL_FLOODS = [
    {
        year: 2023,
        name: "Sikkim Flash Floods",
        region: "Sikkim & Teesta River Basin",
        cause: "Glacial Lake Outburst Flood (GLOF) & Cloudburst",
        livesLost: "100+",
        damage: "Extensive damage to Chungthang Dam, NH-10 washed away",
        description: "A catastrophic glacial lake outburst from South Lhonak Lake triggered a massive flash flood down the Teesta river valley, wiping out major infrastructure and military camps.",
        severity: "critical"
    },
    {
        year: 2023,
        name: "North India Floods",
        region: "Himachal Pradesh, Uttarakhand, Punjab, Delhi",
        cause: "Interaction of Western Disturbance and Monsoon",
        livesLost: "150+",
        damage: "₹10,000+ Crore",
        description: "Unprecedented rainfall led to the Yamuna river crossing its highest ever danger mark in Delhi (208.66m). Himachal Pradesh saw massive landslides and structural collapses.",
        severity: "critical"
    },
    {
        year: 2022,
        name: "Assam & Sylhet Floods",
        region: "Assam, Meghalaya",
        cause: "Pre-monsoon extreme rainfall",
        livesLost: "190+",
        damage: "Millions displaced, severe agricultural loss",
        description: "Some of the worst pre-monsoon floods in recent history. Silchar town remained under water for weeks due to a breached embankment.",
        severity: "high"
    },
    {
        year: 2019,
        name: "Bihar & Assam Floods",
        region: "Bihar, Assam",
        cause: "Heavy Monsoon Rains",
        livesLost: "250+",
        damage: "₹4,000+ Crore",
        description: "Millions were affected across both states. In Bihar, the Kosi and Bagmati rivers caused severe inundation, while the Brahmaputra flooded Kaziranga National Park.",
        severity: "high"
    },
    {
        year: 2018,
        name: "Kerala Floods",
        region: "Kerala",
        cause: "Unusually high rainfall & reservoir releases",
        livesLost: "480+",
        damage: "₹40,000 Crore",
        description: "The worst flooding in Kerala in nearly a century. All 35 of the state's major reservoirs were opened for the first time in history.",
        severity: "critical"
    },
    {
        year: 2017,
        name: "Gujarat Floods",
        region: "Gujarat, Rajasthan",
        cause: "Heavy Monsoon Rain",
        livesLost: "220+",
        damage: "Significant agricultural and infrastructural loss",
        description: "Severe flooding heavily impacted the Banaskantha and Patan districts. The IAF and NDRF conducted massive rescue operations.",
        severity: "high"
    },
    {
        year: 2015,
        name: "South Indian Floods (Chennai)",
        region: "Tamil Nadu, Andhra Pradesh",
        cause: "Northeast Monsoon & Cyclonic formations",
        livesLost: "500+",
        damage: "₹20,000 to ₹1 Lakh Crore initially estimated",
        description: "Chennai experienced historic rainfall, paralyzing the city. Unregulated urban development and delayed dam releases exacerbated the disaster.",
        severity: "critical"
    },
    {
        year: 2014,
        name: "Kashmir Floods",
        region: "Jammu & Kashmir",
        cause: "Continuous torrential rainfall",
        livesLost: "270+",
        damage: "₹5,000+ Crore",
        description: "The Jhelum river swelled to unprecedented levels, submerging much of Srinagar and causing widespread destruction across the valley.",
        severity: "critical"
    },
    {
        year: 2013,
        name: "North India Floods (Uttarakhand)",
        region: "Uttarakhand, Himachal Pradesh",
        cause: "Cloudbursts causing flash floods",
        livesLost: "5,700+ (presumed dead)",
        damage: "Massive devastation of pilgrimage routes",
        description: "A multi-day cloudburst centered on the pristine Kedarnath valley caused devastating floods and landslides, marking one of India's worst natural disasters.",
        severity: "critical"
    },
    {
        year: 2008,
        name: "Bihar Floods (Kosi)",
        region: "Bihar",
        cause: "Embankment breach in Nepal",
        livesLost: "250+",
        damage: "3 Million people displaced",
        description: "The Kosi river picked up an old channel after a breach in Nepal, flooding areas in Bihar that hadn't seen floods in a half-century.",
        severity: "high"
    },
    {
        year: 2005,
        name: "Maharashtra Floods",
        region: "Maharashtra (Mumbai)",
        cause: "Extreme localized rainfall (944mm in 24 hours)",
        livesLost: "1,000+",
        damage: "Massive urban paralysis",
        description: "Mumbai recorded a staggering 944 mm (37.17 inches) of rain in 24 hours on July 26, bringing the entire metropolitan region to a standstill.",
        severity: "critical"
    },
    {
        year: 1998,
        name: "Gorakhpur Floods",
        region: "Uttar Pradesh",
        cause: "Heavy Monsoon",
        livesLost: "Hundreds",
        damage: "Extensive agricultural damage",
        description: "Severe flooding isolated Gorakhpur and surrounding districts for weeks, causing significant hardship and loss of crops.",
        severity: "moderate"
    }
];

// Export to window
if (typeof window !== 'undefined') {
    window.HISTORICAL_FLOODS = HISTORICAL_FLOODS;
}

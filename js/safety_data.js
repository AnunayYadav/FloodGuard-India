/* ═══════════════════════════════════════════════════════════
   Comprehensive Safety & Emergency Data
   ═══════════════════════════════════════════════════════════ */

const SAFETY_GUIDELINES = [
    {
        category: "Before a Flood (Preparation Phase)",
        icon: "alert-triangle",
        tips: [
            "Weather Alerts: Monitor weather alerts & river levels regularly.",
            "Mobile Charge: Keep mobile phones fully charged.",
            "Emergency Kit: Prepare an emergency kit with drinking water, dry food, torch + batteries, medicines, and waterproofed important documents.",
            "Evacuation Routes: Identify safe evacuation routes in advance.",
            "Property Protection: Move valuables to higher floors of your home."
        ]
    },
    {
        category: "During a Flood (Indoors)",
        icon: "home",
        tips: [
            "Utility Safety: Switch off electricity & gas supply immediately.",
            "Seek Height: Move to higher floors immediately.",
            "Avoid Contact: Avoid contact with flood water as it can be dangerous and contaminated.",
            "Stay Informed: Listen to official updates via radio or mobile devices.",
            "Moving Water: Do NOT step into flowing water."
        ]
    },
    {
        category: "During a Flood (Outdoors/Driving)",
        icon: "car",
        tips: [
            "Driving Hazard: Never drive through flooded roads.",
            "Water Power: Be aware that just 30 cm of water can sweep a car away.",
            "Higher Ground: Move to higher ground immediately if caught outdoors.",
            "Rescue Orders: Follow all rescue team instructions strictly.",
            "Boat Services: Use boats/rescue services if they are available."
        ]
    },
    {
        category: "After a Flood (Recovery Phase)",
        icon: "shield-check",
        tips: [
            "Building Safety: Do not enter damaged buildings immediately.",
            "Power Safety: Check electrical safety before switching on the power.",
            "Sanitization: Disinfect water and surroundings to prevent contamination.",
            "Disease Watch: Watch for diseases like fever and infections.",
            "Medical Help: Seek medical help immediately if you feel unwell."
        ]
    }
];

const EMERGENCY_CONTACTS = {
    national: [
        { name: "National Emergency Number", numbers: ["112"] },
        { name: "Disaster Management Helpline", numbers: ["1078", "1070"] },
        { name: "Police", numbers: ["100"] },
        { name: "Fire Brigade", numbers: ["101"] },
        { name: "Ambulance", numbers: ["108", "102"] },
        { name: "NDRF Control Room", numbers: ["011-24363260"] }
    ],
    stateSDRF: [
        { state: "Assam", numbers: ["1070", "1079", "0361-2237219"] },
        { state: "Bihar", numbers: ["1070", "0612-2217305"] },
        { state: "Uttar Pradesh", numbers: ["1070", "0522-2238200"] },
        { state: "West Bengal", numbers: ["1070", "033-22143526"] },
        { state: "Kerala", numbers: ["1070", "0471-2331639"] },
        { state: "Andaman & Nicobar", numbers: ["1070", "03192-234287"] },
        { state: "Andhra Pradesh", numbers: ["1070", "0866-2488000"] },
        { state: "Arunachal Pradesh", numbers: ["1070", "0360-2215844"] },
        { state: "Chandigarh", numbers: ["1070"] },
        { state: "Chhattisgarh", numbers: ["1070", "0771-2510209"] },
        { state: "Delhi", numbers: ["1077", "011-23438252"] },
        { state: "Goa", numbers: ["1070", "0832-2419550"] },
        { state: "Gujarat", numbers: ["1070", "079-23251900"] },
        { state: "Haryana", numbers: ["1070", "0172-2545938"] },
        { state: "Himachal Pradesh", numbers: ["1070", "1077"] },
        { state: "Jammu & Kashmir", numbers: ["1070", "1077", "0194-2506161"] },
        { state: "Jharkhand", numbers: ["1070", "0651-2481055"] },
        { state: "Karnataka", numbers: ["1070", "080-22340676"] },
        { state: "Madhya Pradesh", numbers: ["1070", "0755-2441419"] },
        { state: "Maharashtra", numbers: ["1070", "022-22027990"] },
        { state: "Manipur", numbers: ["1070", "0385-2450143"] },
        { state: "Meghalaya", numbers: ["1070", "0364-2225289"] },
        { state: "Mizoram", numbers: ["1070", "0389-2342520"] },
        { state: "Nagaland", numbers: ["1070", "0370-2270050"] },
        { state: "Odisha", numbers: ["1070", "0674-2534177"] },
        { state: "Puducherry", numbers: ["1070", "1077"] },
        { state: "Punjab", numbers: ["1070", "0172-2747350"] },
        { state: "Rajasthan", numbers: ["1070", "0141-2227602"] },
        { state: "Sikkim", numbers: ["1070", "03592-201145"] },
        { state: "Tamil Nadu", numbers: ["1070", "044-28593990"] },
        { state: "Telangana", numbers: ["1070", "104"] },
        { state: "Tripura", numbers: ["1070", "0381-2416045"] },
        { state: "Uttarakhand", numbers: ["1070", "0135-2710334"] }
    ]
};

// Export to window if running in browser
if (typeof window !== 'undefined') {
    window.SAFETY_GUIDELINES = SAFETY_GUIDELINES;
    window.EMERGENCY_CONTACTS = EMERGENCY_CONTACTS;
}



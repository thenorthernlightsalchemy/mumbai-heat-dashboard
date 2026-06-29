/**
 * Physics-Informed Data Processing Engine for Mumbai Urban Heat Analysis
 * Integrates: ECOSTRESS LST, NDVI, NDBI, ERA5, CPCB Pollution Data
 */

// ============ ECOSTRESS Data Configuration ============
const ECOSTRESS_CONFIG = {
    coastal_threshold: 37.0,    // °C - Coastal region hotspot threshold
    inland_threshold: 40.0,     // °C - Inland region hotspot threshold
    bounds: {
        north: 19.45,
        south: 18.65,
        east: 73.25,
        west: 72.45
    }
};

// ============ CPCB Air Quality Monitoring Stations ============
const CPCB_STATIONS = [
    { name: "Bandra East", lat: 19.0596, lon: 72.8295, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Colaba", lat: 18.9676, lon: 72.8194, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Mahim", lat: 19.0443, lon: 72.8253, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Powai", lat: 19.1136, lon: 72.9050, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Deonar", lat: 19.0231, lon: 72.9180, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Vile Parle", lat: 19.1170, lon: 72.8570, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Navi Mumbai NEERI", lat: 19.0176, lon: 73.0176, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Fort", lat: 18.9514, lon: 72.8346, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Andheri", lat: 19.1136, lon: 72.8262, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } },
    { name: "Worli", lat: 19.0194, lon: 72.8194, pollutants: { PM2_5: 0, PM10: 0, NO2: 0, SO2: 0 } }
];

// ============ Utility: Inverse Distance Weighting for Spatial Interpolation ============
function calculateIDW(point, stations, pollutant, power = 2) {
    let numerator = 0, denominator = 0;
    
    stations.forEach(station => {
        const distance = Math.hypot(
            point.lat - station.lat,
            point.lon - station.lon
        );
        
        if (distance < 0.001) return station.pollutants[pollutant]; // Exact match
        
        const weight = 1 / Math.pow(distance, power);
        numerator += station.pollutants[pollutant] * weight;
        denominator += weight;
    });
    
    return denominator > 0 ? numerator / denominator : 0;
}

// ============ Utility: Determine if location is coastal ============
function isCoastal(lat, lon) {
    // Simplified: Areas within 2km of western edge are coastal
    const coastalThreshold = 72.50;
    return lon < coastalThreshold;
}

// ============ Core: Generate Hotspots from ECOSTRESS LST ============
function generateHotspotsFromECOSTRESS(ecostressGrid, ndviGrid, ndbiGrid) {
    const hotspots = [];
    const cellSize = 0.01; // ~1km resolution
    
    for (let lat = ECOSTRESS_CONFIG.bounds.south; lat < ECOSTRESS_CONFIG.bounds.north; lat += cellSize) {
        for (let lon = ECOSTRESS_CONFIG.bounds.west; lon < ECOSTRESS_CONFIG.bounds.east; lon += cellSize) {
            
            // Get LST value from ECOSTRESS grid
            const lst = getECOSTRESSValue(ecostressGrid, lat, lon);
            
            // Apply regional threshold
            const threshold = isCoastal(lat, lon) ? 
                ECOSTRESS_CONFIG.coastal_threshold : 
                ECOSTRESS_CONFIG.inland_threshold;
            
            // Hotspot criteria
            if (lst >= threshold) {
                const ndvi = getNDVIValue(ndviGrid, lat, lon);
                const ndbi = getNDBIValue(ndbiGrid, lat, lon);
                
                // Create hotspot geometry (simplified as point with buffer)
                hotspots.push({
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [lon, lat]
                    },
                    properties: {
                        name: generateLocationName(lat, lon),
                        temp: Math.round(lst * 10) / 10,
                        ndvi: Math.round(ndvi * 1000) / 1000,
                        ndbi: Math.round(ndbi * 1000) / 1000,
                        is_coastal: isCoastal(lat, lon),
                        threshold_exceeded: lst - threshold,
                        drivers: calculateHeatDrivers(lat, lon, ndvi, ndbi)
                    }
                });
            }
        }
    }
    
    return {
        type: "FeatureCollection",
        features: hotspots
    };
}

// ============ Core: Calculate Heat Drivers ============
function calculateHeatDrivers(lat, lon, ndvi, ndbi) {
    const drivers = {};
    
    // 1. Urban Heat Island Intensity
    const uhi = (1 - ndvi) * 100; // Urban density proxy
    drivers.uhi_intensity = Math.round(uhi);
    
    // 2. Built-up Impact
    drivers.built_up_fraction = Math.round((ndbi + 0.5) * 100 * 0.6); // Normalized 0-100
    
    // 3. Vegetation Deficit
    drivers.vegetation_deficit = Math.round((0.4 - ndvi) * 250); // Potential greening
    
    // 4. Pollution Impact (from nearest CPCB station)
    const pm25 = calculateIDW({ lat, lon }, CPCB_STATIONS, "PM2_5");
    const no2 = calculateIDW({ lat, lon }, CPCB_STATIONS, "NO2");
    drivers.pm25_concentration = Math.round(pm25);
    drivers.no2_concentration = Math.round(no2);
    
    // 5. Coastal vs Inland classification
    drivers.coastal_proximity = isCoastal(lat, lon) ? "Coastal" : "Inland";
    
    // 6. Combined Driver String for UI
    const driverString = `
        UHI Intensity: ${drivers.uhi_intensity}% | 
        Built-up: ${drivers.built_up_fraction}% | 
        Veg Deficit: ${drivers.vegetation_deficit}m² | 
        PM2.5: ${drivers.pm25_concentration}µg/m³ | 
        NO2: ${drivers.no2_concentration}ppb
    `.trim();
    
    return driverString;
}

// ============ Physics: Temperature Drop from Cooling Interventions ============
function calculateCoolingEffect(
    baseTemp,
    ndvi,
    ndbi,
    vegIncrease = 0,      // 0-100%
    roofAlbedo = 0,       // 0-100%
    pmMitigation = 0,     // 0-100%
    no2Mitigation = 0,    // 0-100%
    so2Mitigation = 0     // 0-100%
) {
    let tempReduction = 0;
    
    // ====== VEGETATION COOLING ======
    // Physics: Latent heat cooling from evapotranspiration
    // Efficiency depends on current vegetation (NDVI)
    const vegCurrentFraction = (ndvi + 0.3) / 1.3; // Normalize to 0-1
    const vegPotential = 1 - vegCurrentFraction; // Room for improvement
    
    // Maximum cooling ~2.5°C from full green canopy (from literature)
    const maxVegCooling = 2.5;
    const newVegCooling = (vegIncrease / 100) * vegPotential * maxVegCooling;
    tempReduction += newVegCooling;
    
    // ====== REFLECTIVE ROOFS (ALBEDO) ======
    // Physics: Shortwave radiation reflection (Stefan-Boltzmann)
    // Efficiency depends on current urban density (NDBI)
    const urbFraction = (ndbi + 0.5) / 1.5; // Normalize urban area
    
    // Maximum cooling ~1.8°C from full cool roof coverage
    const maxRoofCooling = 1.8;
    const newRoofCooling = (roofAlbedo / 100) * urbFraction * maxRoofCooling;
    tempReduction += newRoofCooling;
    
    // ====== PARTICULATE MITIGATION (PM2.5) ======
    // Physics: Reduced atmospheric radiative forcing
    // High PM2.5 creates greenhouse effect (radiative forcing ~0.3-0.5 W/m²)
    // Corresponds to ~0.1-0.15°C warming effect
    
    // Maximum cooling ~0.8°C from full PM2.5 elimination
    const maxPMCooling = 0.8;
    const newPMCooling = (pmMitigation / 100) * maxPMCooling;
    tempReduction += newPMCooling;
    
    // ====== TRAFFIC EMISSION MITIGATION (NO2) ======
    // Physics: Reduced NOx → reduced ozone formation → reduced thermal radiation absorption
    // NO2 contributes ~0.05-0.08°C warming in urban areas
    
    // Maximum cooling ~0.5°C from full NO2 elimination
    const maxNO2Cooling = 0.5;
    const newNO2Cooling = (no2Mitigation / 100) * maxNO2Cooling;
    tempReduction += newNO2Cooling;
    
    // ====== INDUSTRIAL EMISSION MITIGATION (SO2) ======
    // Physics: SO2 aerosols have complex radiative effects (cooling at surface)
    // But reducing SO2 improves air quality; minimal direct thermal effect
    
    // Maximum cooling ~0.3°C (indirect benefits)
    const maxSO2Cooling = 0.3;
    const newSO2Cooling = (so2Mitigation / 100) * maxSO2Cooling;
    tempReduction += newSO2Cooling;
    
    // ====== NON-LINEAR INTERACTION DAMPING ======
    // When multiple interventions applied, effectiveness decreases (diminishing returns)
    const numInterventions = [vegIncrease, roofAlbedo, pmMitigation, no2Mitigation, so2Mitigation]
        .filter(x => x > 0).length;
    
    const damping = 1 - (numInterventions * 0.05); // ~5% reduction per additional intervention
    tempReduction *= damping;
    
    const finalTemp = Math.max(baseTemp - tempReduction, 15); // Floor at 15°C
    
    return {
        finalTemp: Math.round(finalTemp * 10) / 10,
        totalReduction: Math.round(tempReduction * 10) / 10,
        breakdown: {
            veg: Math.round(newVegCooling * 10) / 10,
            roof: Math.round(newRoofCooling * 10) / 10,
            pm: Math.round(newPMCooling * 10) / 10,
            no2: Math.round(newNO2Cooling * 10) / 10,
            so2: Math.round(newSO2Cooling * 10) / 10
        }
    };
}

// ============ Helper: Extract Values from Grids ============
function getECOSTRESSValue(grid, lat, lon) {
    // Placeholder - in real implementation, interpolate from grid
    return 42 + Math.random() * 8; // Dummy: 42-50°C range
}

function getNDVIValue(grid, lat, lon) {
    // Placeholder - interpolate from NDVI grid
    return 0.1 + Math.random() * 0.4; // Dummy: 0.1-0.5 range
}

function getNDBIValue(grid, lat, lon) {
    // Placeholder - interpolate from NDBI grid
    return 0.3 + Math.random() * 0.4; // Dummy: 0.3-0.7 range
}

function generateLocationName(lat, lon) {
    // Simplified neighborhood mapping
    const neighborhoods = {
        "18.9676": "Colaba",
        "19.0596": "Bandra East",
        "19.1136": "Vile Parle",
        "19.0231": "Deonar",
        "19.0194": "Worli"
    };
    
    // Find closest known point
    let closestName = "Unknown Location";
    let minDist = Infinity;
    
    Object.keys(neighborhoods).forEach(knownLat => {
        const dist = Math.abs(parseFloat(knownLat) - lat);
        if (dist < minDist) {
            minDist = dist;
            closestName = neighborhoods[knownLat];
        }
    });
    
    return closestName;
}

// ============ Load CPCB Data from CSV/JSON ============
async function loadCPCBData(dataSource) {
    // This function will be called with data from Google Drive
    // Expected format: Array of {station, date, PM2.5, PM10, NO2, SO2}
    try {
        const response = await fetch(dataSource);
        const data = await response.json();
        
        // Aggregate by station (take latest or average)
        data.forEach(record => {
            const station = CPCB_STATIONS.find(s => s.name === record.station);
            if (station) {
                station.pollutants.PM2_5 = record.PM2_5 || station.pollutants.PM2_5;
                station.pollutants.PM10 = record.PM10 || station.pollutants.PM10;
                station.pollutants.NO2 = record.NO2 || station.pollutants.NO2;
                station.pollutants.SO2 = record.SO2 || station.pollutants.SO2;
            }
        });
        
        console.log("CPCB Data Loaded:", CPCB_STATIONS);
    } catch (err) {
        console.error("Error loading CPCB data:", err);
        // Use dummy data
        initializeDummyPollutionData();
    }
}

// ============ Initialize Dummy Data (Fallback) ============
function initializeDummyPollutionData() {
    CPCB_STATIONS.forEach((station, idx) => {
        station.pollutants = {
            PM2_5: 45 + Math.random() * 25,  // 45-70 µg/m³
            PM10: 80 + Math.random() * 40,   // 80-120 µg/m³
            NO2: 30 + Math.random() * 30,    // 30-60 ppb
            SO2: 8 + Math.random() * 12      // 8-20 ppb
        };
    });
}

// Export for use in map.html
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateHotspotsFromECOSTRESS,
        calculateCoolingEffect,
        calculateHeatDrivers,
        loadCPCBData,
        CPCB_STATIONS,
        isCoastal
    };
}

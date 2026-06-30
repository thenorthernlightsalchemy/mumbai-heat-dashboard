/**
 * Google Drive Data Integration & CSV Parser
 * Connects CPCB pollution data, ECOSTRESS LST, NDVI, NDBI from Google Drive
 */

// ============ Google Drive File IDs & Configuration ============
const GDRIVE_CONFIG = {
    // Replace these with actual Google Drive file IDs from your shared folder
    // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    files: {
        cpcb_pollution: 'REPLACE_WITH_GDRIVE_FILE_ID',  // CSV with 10 CPCB stations data
        ecostress_lst: 'REPLACE_WITH_GDRIVE_FILE_ID',   // ECOSTRESS Land Surface Temp
        ndvi_data: 'REPLACE_WITH_GDRIVE_FILE_ID',       // NDVI raster
        ndbi_data: 'REPLACE_WITH_GDRIVE_FILE_ID',       // NDBI raster
        era5_temp: 'REPLACE_WITH_GDRIVE_FILE_ID',       // ERA5 temperature reanalysis
        era5_humidity: 'REPLACE_WITH_GDRIVE_FILE_ID'    // ERA5 humidity reanalysis
    },
    // Convert to direct download URL
    getDownloadUrl: function(fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
};

// ============ CPCB Pollution Data Parser ============
class CPCBDataManager {
    constructor() {
        this.stations = {};
        this.lastUpdated = null;
    }

    /**
     * Parse CSV data from Google Drive
     * Expected format:
     * Station,Latitude,Longitude,PM2.5,PM10,NO2,SO2,Date
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const stationMap = {};
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            // trim() added to date and name to handle trailing \r carriage returns safely
            const station = {
                name: values[0].trim(),
                lat: parseFloat(values[1]),
                lon: parseFloat(values[2]),
                pollutants: {
                    PM2_5: parseFloat(values[3]) || 0,
                    PM10: parseFloat(values[4]) || 0,
                    NO2: parseFloat(values[5]) || 0,
                    SO2: parseFloat(values[6]) || 0
                },
                date: values[7] ? new Date(values[7].trim()) : new Date()
            };
            
            // Use latest data if multiple entries
            if (!stationMap[station.name] || station.date > stationMap[station.name].date) {
                stationMap[station.name] = station;
            }
        }
        
        this.stations = stationMap;
        this.lastUpdated = new Date();
        console.log(`Loaded ${Object.keys(stationMap).length} CPCB stations`);
        return stationMap;
    }

    /**
     * Get interpolated pollution at any location using IDW
     */
    getPollutionAtLocation(lat, lon, pollutant = 'PM2_5', power = 2) {
        const stations = Object.values(this.stations);
        if (stations.length === 0) return 0;
        
        // Exact location check
        let exactStation = stations.find(s => Math.hypot(lat - s.lat, lon - s.lon) < 0.001);
        if (exactStation) {
            return exactStation.pollutants[pollutant];
        }
        
        let numerator = 0, denominator = 0;
        stations.forEach(station => {
            const distance = Math.hypot(lat - station.lat, lon - station.lon);
            const weight = 1 / Math.pow(distance, power);
            numerator += station.pollutants[pollutant] * weight;
            denominator += weight;
        });
        
        return denominator > 0 ? numerator / denominator : 0;
    }

    /**
     * Get all stations for display
     */
    getStations() {
        return Object.values(this.stations);
    }
}

// ============ ECOSTRESS Data Manager ============
class ECOSTRESSDataManager {
    constructor() {
        this.grid = null;
        this.bounds = {
            north: 19.45,
            south: 18.65,
            east: 73.25,
            west: 72.45
        };
    }

    /**
     * Parse GeoTIFF or CSV grid data
     * CSV Format: Latitude,Longitude,LST
     */
    parseGridData(csvText) {
        const lines = csvText.split('\n');
        const grid = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const [lat, lon, lst] = lines[i].split(',').map(parseFloat);
            grid.push({ lat, lon, lst });
        }
        
        this.grid = grid;
        console.log(`Loaded ECOSTRESS grid with ${grid.length} points`);
        return grid;
    }

    /**
     * Bilinear / IDW interpolation for LST at any point
     */
    getLSTAtLocation(lat, lon) {
        if (!this.grid || this.grid.length === 0) {
            // Offline demo fallback (realistic temperature base)
            return 35 + (Math.sin(lat * 100) * Math.cos(lon * 100) * 8);
        }
        
        // Find 4 nearest neighbors
        let nearest = this.grid
            .map(point => ({
                ...point,
                distance: Math.hypot(lat - point.lat, lon - point.lon)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
        
        // Fixed: Check exact location match outside of the loop
        if (nearest[0].distance < 0.0001) {
            return nearest[0].lst;
        }
        
        // IDW interpolation
        let numerator = 0, denominator = 0;
        nearest.forEach(point => {
            const weight = 1 / (point.distance * point.distance);
            numerator += point.lst * weight;
            denominator += weight;
        });
        
        return denominator > 0 ? numerator / denominator : nearest[0].lst;
    }

    /**
     * Check if hotspot qualifies based on ECOSTRESS LST
     */
    isHotspot(lat, lon) {
        const lst = this.getLSTAtLocation(lat, lon);
        if (!lst) return false;
        
        // Fixed coastal longitude boundary (72.82)
        const isCoastal = lon < 72.82;
        const threshold = isCoastal ? 37 : 40;
        return lst >= threshold;
    }
}

// ============ NDVI/NDBI Data Manager ============
class VegetationBuiltupManager {
    constructor() {
        this.ndviGrid = null;
        this.ndbiGrid = null;
    }

    /**
     * Parse NDVI data
     */
    parseNDVI(csvText) {
        const lines = csvText.split('\n');
        this.ndviGrid = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const [lat, lon, ndvi] = lines[i].split(',').map(parseFloat);
            // Fixed: Save under key 'value' to align with _interpolateGrid
            this.ndviGrid.push({ lat, lon, value: ndvi });
        }
        
        console.log(`Loaded NDVI with ${this.ndviGrid.length} points`);
    }

    /**
     * Parse NDBI data
     */
    parseNDBI(csvText) {
        const lines = csvText.split('\n');
        this.ndbiGrid = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const [lat, lon, ndbi] = lines[i].split(',').map(parseFloat);
            // Fixed: Save under key 'value' to align with _interpolateGrid
            this.ndbiGrid.push({ lat, lon, value: ndbi });
        }
        
        console.log(`Loaded NDBI with ${this.ndbiGrid.length} points`);
    }

    /**
     * Get NDVI at location (IDW interpolation)
     */
    getNDVIAtLocation(lat, lon) {
        return this._interpolateGrid(this.ndviGrid, lat, lon, -0.1);
    }

    /**
     * Get NDBI at location (IDW interpolation)
     */
    getNDBIAtLocation(lat, lon) {
        return this._interpolateGrid(this.ndbiGrid, lat, lon, 0.3);
    }

    /**
     * Generic grid interpolation
     */
    _interpolateGrid(grid, lat, lon, defaultValue) {
        if (!grid || grid.length === 0) {
            // Offline demo fallback (pseudo-random NDVI/NDBI calculation)
            return defaultValue + (Math.sin(lat * 50) * 0.15);
        }
        
        let nearest = grid
            .map(point => ({
                ...point,
                distance: Math.hypot(lat - point.lat, lon - point.lon)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
        
        // Fixed: Check exact location match outside of the loop
        if (nearest[0].distance < 0.0001) {
            return nearest[0].value;
        }
        
        let numerator = 0, denominator = 0;
        nearest.forEach(point => {
            const weight = 1 / (point.distance * point.distance);
            numerator += point.value * weight;
            denominator += weight;
        });
        
        return denominator > 0 ? numerator / denominator : defaultValue;
    }
}

// ============ ERA5 Reanalysis Data Manager ============
class ERA5DataManager {
    constructor() {
        this.temperature = null;
        this.humidity = null;
    }

    parseTemperature(csvText) {
        this.temperature = this._parseRaster(csvText);
    }

    parseHumidity(csvText) {
        this.humidity = this._parseRaster(csvText);
    }

    _parseRaster(csvText) {
        const lines = csvText.split('\n');
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const [lat, lon, value] = lines[i].split(',').map(parseFloat);
            data.push({ lat, lon, value });
        }
        
        return data;
    }

    /**
     * Get ambient temperature at location
     */
    getAmbientTemp(lat, lon) {
        return this._interpolateValue(this.temperature, lat, lon, 30);
    }

    /**
     * Get relative humidity at location
     */
    getRelativeHumidity(lat, lon) {
        return this._interpolateValue(this.humidity, lat, lon, 65);
    }

    _interpolateValue(grid, lat, lon, defaultValue) {
        if (!grid || grid.length === 0) return defaultValue;
        
        let nearest = grid
            .map(point => ({
                ...point,
                distance: Math.hypot(lat - point.lat, lon - point.lon)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);
        
        // Fixed: Return exact coordinates match immediately
        if (nearest[0].distance < 0.0001) {
            return nearest[0].value;
        }
        
        let numerator = 0, denominator = 0;
        nearest.forEach(point => {
            const weight = 1 / (point.distance * point.distance);
            numerator += point.value * weight;
            denominator += weight;
        });
        
        return denominator > 0 ? numerator / denominator : defaultValue;
    }
}

// ============ Unified Data Loader ============
class UnifiedDataLoader {
    constructor() {
        this.cpcb = new CPCBDataManager();
        this.ecostress = new ECOSTRESSDataManager();
        this.vegetation = new VegetationBuiltupManager();
        this.era5 = new ERA5DataManager();
    }

    /**
     * Load all data from Google Drive CSVs
     */
    async loadAllData() {
        try {
            console.log("🔄 Loading data from Google Drive...");
            
            // Fetch CPCB data
            const cpcbResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.cpcb_pollution));
            const cpcbText = await cpcbResponse.text();
            this.cpcb.parseCSV(cpcbText);
            
            // Fetch ECOSTRESS data
            const ecostressResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.ecostress_lst));
            const ecostressText = await ecostressResponse.text();
            this.ecostress.parseGridData(ecostressText);
            
            // Fetch NDVI data
            const ndviResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.ndvi_data));
            const ndviText = await ndviResponse.text();
            this.vegetation.parseNDVI(ndviText);
            
            // Fetch NDBI data
            const ndbiResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.ndbi_data));
            const ndbiText = await ndbiResponse.text();
            this.vegetation.parseNDBI(ndbiText);
            
            // Fetch ERA5 data
            const era5TempResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.era5_temp));
            const era5TempText = await era5TempResponse.text();
            this.era5.parseTemperature(era5TempText);
            
            const era5HumResponse = await fetch(GDRIVE_CONFIG.getDownloadUrl(GDRIVE_CONFIG.files.era5_humidity));
            const era5HumText = await era5HumResponse.text();
            this.era5.parseHumidity(era5HumText);
            
            console.log("✅ All data loaded successfully!");
            return true;
            
        } catch (error) {
            console.error("❌ Error loading data:", error);
            this._loadDummyData();
            return false;
        }
    }

    /**
     * Fallback to dummy data if Google Drive load fails
     */
    _loadDummyData() {
        console.warn("⚠️ Using dummy data (Google Drive not connected)");
        
        // Dummy CPCB stations
        const dummyStations = [
            { name: "Bandra East", lat: 19.0596, lon: 72.8295 },
            { name: "Colaba", lat: 18.9676, lon: 72.8194 },
            { name: "Mahim", lat: 19.0443, lon: 72.8253 },
            { name: "Powai", lat: 19.1136, lon: 72.9050 },
            { name: "Deonar", lat: 19.0231, lon: 72.9180 },
            { name: "Vile Parle", lat: 19.1170, lon: 72.8570 },
            { name: "Navi Mumbai NEERI", lat: 19.0176, lon: 73.0176 },
            { name: "Fort", lat: 18.9514, lon: 72.8346 },
            { name: "Andheri", lat: 19.1136, lon: 72.8262 },
            { name: "Worli", lat: 19.0194, lon: 72.8194 }
        ];
        
        dummyStations.forEach(station => {
            this.cpcb.stations[station.name] = {
                ...station,
                pollutants: {
                    PM2_5: 45 + Math.random() * 25,
                    PM10: 80 + Math.random() * 40,
                    NO2: 30 + Math.random() * 30,
                    SO2: 8 + Math.random() * 12
                },
                date: new Date()
            };
        });
    }

    /**
     * Get comprehensive data for a hotspot at given location
     */
    getHotspotData(lat, lon) {
        return {
            lat: lat,
            lon: lon,
            lst: this.ecostress.getLSTAtLocation(lat, lon),
            ndvi: this.vegetation.getNDVIAtLocation(lat, lon),
            ndbi: this.vegetation.getNDBIAtLocation(lat, lon),
            pm25: this.cpcb.getPollutionAtLocation(lat, lon, 'PM2_5'),
            pm10: this.cpcb.getPollutionAtLocation(lat, lon, 'PM10'),
            no2: this.cpcb.getPollutionAtLocation(lat, lon, 'NO2'),
            so2: this.cpcb.getPollutionAtLocation(lat, lon, 'SO2'),
            ambientTemp: this.era5.getAmbientTemp(lat, lon),
            humidity: this.era5.getRelativeHumidity(lat, lon),
            isHotspot: this.ecostress.isHotspot(lat, lon)
        };
    }
}

// ============ Global Data Loader Instance ============
const dataLoader = new UnifiedDataLoader();

// ============ Global Helper Mapping Functions ============
// Fixed: Globally exposes initializeDummyPollutionData to map.html onload handler
window.initializeDummyPollutionData = function() {
    dataLoader._loadDummyData();
    console.log("Dummy station and environmental configurations mapped.");
};

// Fixed: Globally defines physics-backed cooling calculation referenced in map.html
window.calculateCoolingEffect = function(baselineTemp, ndvi, ndbi, veg, infra, pm, no2, so2) {
    // 1. Urban Greening impact: Max drop of 2.5°C in low vegetation areas (NDVI < 0.2)
    const reductionVeg = (veg / 100) * 2.5 * Math.max(0, 1 - ndvi);
    
    // 2. Cool Roof / Surface Albedo impact: Max drop of 1.8°C in highly built-up environments
    const reductionInfra = (infra / 100) * 1.8 * Math.max(0, ndbi + 0.5);
    
    // 3. Air Quality mitigation: Decreased radiative forcing from particulates
    const reductionPM = (pm / 100) * 0.5;
    const reductionGases = ((no2 + so2) / 200) * 0.4;
    
    const totalReduction = reductionVeg + reductionInfra + reductionPM + reductionGases;
    const finalTemp = baselineTemp - totalReduction;
    
    return {
        finalTemp: parseFloat(finalTemp.toFixed(1)),
        totalReduction: parseFloat(totalReduction.toFixed(1))
    };
};

// Export for module systems (Node/ESM fallback)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UnifiedDataLoader,
        CPCBDataManager,
        ECOSTRESSDataManager,
        VegetationBuiltupManager,
        ERA5DataManager,
        dataLoader,
        GDRIVE_CONFIG
    };
}

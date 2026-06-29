# Thermal Earth Framework - Physics-Backed Urban Heat Analysis

## 🎯 Project Overview

A physics-informed machine learning system for analyzing urban heat stress in Mumbai using:
- **ECOSTRESS** Land Surface Temperature (LST) data
- **NDVI** (Normalized Difference Vegetation Index) for vegetation coverage
- **NDBI** (Normalized Difference Built-up Index) for urban density
- **CPCB** air quality monitoring (10 stations)
- **ERA5** climate reanalysis data
- **Physics-backed cooling interventions** simulation

---

## 📊 Data Sources & Thresholds

### Hotspot Classification Criteria
| Region Type | Temperature Threshold | Rationale |
|---|---|---|
| **Coastal Areas** | ≥ 37°C | High evaporative heat loss, urban density |
| **Inland Areas** | ≥ 40°C | More sensitive to anthropogenic heat |

### Data Integration

#### 1. ECOSTRESS LST (Land Surface Temperature)
- **Resolution:** ~70m
- **Time:** Multiple passes (see Google Drive)
- **Usage:** Primary hotspot identification
- **Interpolation:** Bilinear with IDW weighting

#### 2. NDVI (Vegetation Index)
- **Range:** -1.0 to +1.0
  - < 0.15: Minimal vegetation (high heat risk)
  - 0.15-0.30: Low vegetation (urban areas)
  - 0.30-0.50: Moderate vegetation
  - > 0.50: Dense vegetation (cooling effect)
- **Physics:** Higher NDVI → more evapotranspiration → lower surface temperature
- **Cooling Potential:** 2.5°C maximum from full green canopy

#### 3. NDBI (Built-up Index)
- **Range:** -0.5 to +0.8
  - < 0.0: Water/vegetation dominant
  - 0.0-0.3: Mixed urban-vegetation
  - > 0.3: Dense urban infrastructure
- **Physics:** Higher NDBI → more shortwave radiation absorption
- **Cooling Potential:** 1.8°C maximum from full cool roof coverage

#### 4. CPCB Air Quality Data (10 Stations)

**Station Locations:**
1. Bandra East: 19.0596°N, 72.8295°E
2. Colaba: 18.9676°N, 72.8194°E
3. Mahim: 19.0443°N, 72.8253°E
4. Powai: 19.1136°N, 72.9050°E
5. Deonar: 19.0231°N, 72.9180°E
6. Vile Parle: 19.1170°N, 72.8570°E
7. Navi Mumbai NEERI: 19.0176°N, 73.0176°E
8. Fort: 18.9514°N, 72.8346°E
9. Andheri: 19.1136°N, 72.8262°E
10. Worli: 19.0194°N, 72.8194°E

**Pollutants Measured:**
- PM2.5 (Fine Particulates): 0-200 µg/m³
- PM10 (Coarse Particulates): 0-500 µg/m³
- NO2 (Nitrogen Dioxide): 0-200 ppb
- SO2 (Sulfur Dioxide): 0-50 ppb

**Physics:**
- PM2.5: Creates atmospheric greenhouse effect (~0.3-0.5 W/m² radiative forcing)
- NO2: Contributes to tropospheric ozone formation → thermal absorption
- SO2: Complex radiative effects (surface cooling but poor air quality)

#### 5. ERA5 Reanalysis Data
- **Temperature:** Ambient air temperature (synoptic scale)
- **Humidity:** Relative humidity (affects evaporative cooling efficiency)
- **Usage:** Context for UHI intensity calculation

---

## 🔬 Physics-Backed Cooling Interventions

### 1. Urban Greening (Vegetation Increase)
**Physics Mechanism:** Latent Heat Cooling (Evapotranspiration)

```
Max Cooling = 2.5°C (full canopy coverage)
Efficiency = f(current NDVI, available urban area)
Formula: ΔT = (increase% / 100) × (1 - current_veg_fraction) × 2.5°C
```

**Current NDVI Mapping:**
- NDVI < 0.15 → High potential (0.05 efficiency)
- NDVI ≥ 0.15 → Lower potential (0.02 efficiency)

---

### 2. Reflective Cool Roofs (Albedo Increase)
**Physics Mechanism:** Shortwave Radiation Reflection (Stefan-Boltzmann Law)

```
Max Cooling = 1.8°C (full albedo upgrade)
Efficiency = f(urban fraction from NDBI)
Formula: ΔT = (increase% / 100) × urban_fraction × 1.8°C
```

**Current NDBI Mapping:**
- NDBI > 0.55 → High urban density (0.04 efficiency)
- NDBI ≤ 0.55 → Lower density (0.02 efficiency)

---

### 3. Particulate Mitigation (PM2.5)
**Physics Mechanism:** Reduced Atmospheric Radiative Forcing

```
Max Cooling = 0.8°C (complete PM2.5 elimination)
Radiative Forcing: PM2.5 ≈ +0.3-0.5 W/m² (warming effect)
Formula: ΔT = (mitigation% / 100) × 0.8°C
```

---

### 4. Traffic Emission Mitigation (NO2)
**Physics Mechanism:** Reduced NOx → Lower Ozone Formation → Reduced Absorption

```
Max Cooling = 0.5°C (complete NO2 elimination)
Urban Contribution: ~0.05-0.08°C warming
Formula: ΔT = (mitigation% / 100) × 0.5°C
```

---

### 5. Industrial Emission Mitigation (SO2)
**Physics Mechanism:** Indirect Air Quality Benefits

```
Max Cooling = 0.3°C (complete SO2 elimination)
SO2 has complex radiative forcing (≈0%)
Primary benefit: Health improvements, reduced pollution
Formula: ΔT = (mitigation% / 100) × 0.3°C
```

---

### 🔄 Interaction Damping (Non-Linear Effects)

When multiple interventions are applied simultaneously, effectiveness decreases due to:
1. Saturation effects (can't cool below ambient)
2. Reduced marginal benefit from each additional intervention

**Damping Function:**
```
damping_factor = 1 - (num_active_interventions × 0.05)
final_ΔT = total_ΔT × damping_factor
```

**Example:** 5 interventions simultaneously = 75% effectiveness

---

## 📁 Google Drive Data Setup

### Required Files Format

#### 1. CPCB Pollution Data (CSV)
```csv
Station,Latitude,Longitude,PM2.5,PM10,NO2,SO2,Date
Bandra East,19.0596,72.8295,55.2,95.3,42.1,12.5,2024-06-28
Colaba,18.9676,72.8194,48.5,88.2,38.9,10.2,2024-06-28
...
```

#### 2. ECOSTRESS LST Data (CSV)
```csv
Latitude,Longitude,LST
18.65,72.45,38.2
18.65,72.46,39.1
...
```

#### 3. NDVI Data (CSV)
```csv
Latitude,Longitude,NDVI
18.65,72.45,0.12
18.65,72.46,0.25
...
```

#### 4. NDBI Data (CSV)
```csv
Latitude,Longitude,NDBI
18.65,72.45,0.42
18.65,72.46,0.38
...
```

#### 5. ERA5 Temperature (CSV)
```csv
Latitude,Longitude,Temperature
18.65,72.45,29.5
18.65,72.46,29.8
...
```

#### 6. ERA5 Humidity (CSV)
```csv
Latitude,Longitude,RelativeHumidity
18.65,72.45,72.1
18.65,72.46,71.5
...
```

### Setup Instructions

1. **Create Google Drive Folder** with the 6 CSV files above
2. **Get File IDs:**
   - Right-click file → Share
   - Extract ID from URL: `https://drive.google.com/file/d/{FILE_ID}/view`
3. **Update `gdrive-data-loader.js`:**
   ```javascript
   const GDRIVE_CONFIG = {
       files: {
           cpcb_pollution: 'YOUR_FILE_ID_HERE',
           ecostress_lst: 'YOUR_FILE_ID_HERE',
           ndvi_data: 'YOUR_FILE_ID_HERE',
           ndbi_data: 'YOUR_FILE_ID_HERE',
           era5_temp: 'YOUR_FILE_ID_HERE',
           era5_humidity: 'YOUR_FILE_ID_HERE'
       }
   };
   ```

4. **Enable Public Access:**
   - Each file → Share → "Anyone with the link can view"

---

## 🚀 Quick Start

### 1. Access the Dashboard
```
https://thenorthernlightsalchemy.github.io/mumbai-heat-dashboard/
```

### 2. Workflow Steps

**Step 1: Locate Region**
- Search neighborhood (e.g., "Bandra")
- OR enter coordinates
- OR click on map

**Step 2: Enable Heat Stress Layer**
- Click "See Heat Stress Map (ECOSTRESS)"
- Shows LST overlay (28.5°C → 48°C color scale)
- Legend visible in top-right corner

**Step 3: Identify Hotspots**
- Click "See Heat Spots (AI-Detected)"
- Red polygons = identified hotspots
- Physics criteria applied (≥37°C coastal, ≥40°C inland)

**Step 4: Analyze Heat Drivers**
- Click "See key drivers of heat"
- Hover over hotspots to view:
  - UHI intensity (%)
  - Built-up fraction (%)
  - Vegetation deficit (m²)
  - PM2.5, NO2 concentrations
  - Coastal/Inland classification

**Step 5: Test Cooling Interventions**
- Click "Show cooling interventions"
- Click a hotspot to activate
- Adjust 5 sliders:
  - 🌲 Urban Greening (0-100%)
  - 🏢 Cool Roofs (0-100%)
  - 🍃 Particulate Reduction (0-100%)
  - 🚗 Traffic Mitigation (0-100%)
  - 🏭 Industrial Reduction (0-100%)
- Real-time temperature display shows simulated cooling

---

## 📐 Technical Architecture

### File Structure
```
mumbai-heat-dashboard/
├── index.html              # Landing page
├── map.html                # Main interactive map
├── data-processor.js       # Physics calculations
├── gdrive-data-loader.js   # Google Drive integration
├── hotspots.geojson        # Pre-computed hotspot geometries
├── mumbai_ecostress.png    # ECOSTRESS overlay image
└── README.md               # This file
```

### Key JavaScript Classes

#### `CPCBDataManager`
- Parses pollution CSV data
- IDW interpolation for any location
- Methods: `getPollutionAtLocation()`, `getStations()`

#### `ECOSTRESSDataManager`
- Manages LST grid data
- Bilinear interpolation
- Hotspot qualification checking
- Methods: `getLSTAtLocation()`, `isHotspot()`

#### `VegetationBuiltupManager`
- NDVI and NDBI data handling
- Spatial interpolation
- Methods: `getNDVIAtLocation()`, `getNDBIAtLocation()`

#### `ERA5DataManager`
- Temperature and humidity reanalysis
- Methods: `getAmbientTemp()`, `getRelativeHumidity()`

#### `UnifiedDataLoader`
- Orchestrates all data sources
- Fallback to dummy data if Google Drive unavailable
- Method: `getHotspotData(lat, lon)` returns comprehensive data object

### Core Physics Function: `calculateCoolingEffect()`

**Inputs:**
- `baseTemp`: Current LST (°C)
- `ndvi`: Current vegetation index (-1 to +1)
- `ndbi`: Current built-up index (-0.5 to +0.8)
- `vegIncrease`: Greening intervention (0-100%)
- `roofAlbedo`: Cool roof deployment (0-100%)
- `pmMitigation`: Particulate reduction (0-100%)
- `no2Mitigation`: Traffic mitigation (0-100%)
- `so2Mitigation`: Industrial reduction (0-100%)

**Outputs:**
```javascript
{
    finalTemp: float,           // Simulated temperature after interventions
    totalReduction: float,      // Total cooling achieved (°C)
    breakdown: {
        veg: float,             // Greening contribution
        roof: float,            // Cool roof contribution
        pm: float,              // PM2.5 mitigation contribution
        no2: float,             // NO2 mitigation contribution
        so2: float              // SO2 mitigation contribution
    }
}
```

---

## 🎓 Physics References

### Heat Transfer Mechanisms in Urban Areas

1. **Sensible Heat Storage** (Urban Heat Island)
   - High thermal mass of buildings/pavements
   - Reduced evaporation due to low vegetation
   - Effect: +3-5°C above rural areas

2. **Latent Heat Cooling** (Evapotranspiration)
   - Green vegetation releases moisture
   - Effect: -1 to -2.5°C per 10% canopy increase
   - Efficiency depends on NDVI (water availability)

3. **Shortwave Radiation Reflection** (Albedo)
   - Light-colored surfaces (cool roofs) reflect solar radiation
   - Effect: -0.5 to -1.8°C per albedo increase
   - Efficiency depends on urban density (NDBI)

4. **Longwave Radiation Absorption** (GHGs/Aerosols)
   - Atmospheric pollutants trap heat
   - PM2.5: +0.3-0.5 W/m² radiative forcing
   - NO2/SOx: Complex but net warming in urban areas

5. **Ventilation & Advection**
   - Wind-driven heat transport
   - Sea breeze effects (coastal areas cooler)
   - Controlled via humidity (ERA5 data)

### References
- Oke, T.R. (1987). Boundary Layer Climates
- Santamouris, M. (2013). Using Cool Pavements as a Strategy to Improve Urban Microclimate
- Peng, S. et al. (2012). Surface urban heat island across 419 global cities

---

## 🐛 Troubleshooting

### Issue: "Google Drive data not loading"
**Solution:** Check file IDs in `gdrive-data-loader.js`. Fallback dummy data will activate.

### Issue: "Hotspots not appearing"
**Solution:** Ensure ECOSTRESS layer is enabled first ("See Heat Stress Map" button).

### Issue: "Cooling interventions show no effect"
**Solution:** Select a hotspot by clicking it before adjusting sliders.

### Issue: "Map is blank"
**Solution:** Check browser console (F12) for errors. Ensure Leaflet.js CDN is accessible.

---

## 📝 License & Attribution

- **ECOSTRESS Data:** NASA/JPL
- **ERA5 Data:** Copernicus Climate Data Store
- **CPCB Data:** Central Pollution Control Board, India
- **Mapping:** Leaflet.js + CartoDB tiles
- **Custom Physics:** Thermal Earth Framework

---

## ✅ Hackathon Submission Checklist

- [x] Physics-backed hotspot identification (ECOSTRESS LST + thresholds)
- [x] Driver analysis (NDVI, NDBI, CPCB pollution data)
- [x] Realistic cooling intervention simulation (5 mechanisms)
- [x] Non-linear interaction damping
- [x] Google Drive data integration
- [x] Interactive map visualization (Leaflet.js)
- [x] Real-time temperature impact display
- [x] Fallback dummy data for testing
- [x] Comprehensive documentation

---

**Last Updated:** June 29, 2026  
**Maintainer:** thenorthernlightsalchemy  
**GitHub:** https://github.com/thenorthernlightsalchemy/mumbai-heat-dashboard

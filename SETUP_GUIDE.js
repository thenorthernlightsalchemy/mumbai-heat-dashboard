/**
 * SETUP GUIDE & CONFIGURATION
 * 
 * This file contains step-by-step instructions to configure the Thermal Earth
 * dashboard with your Google Drive data sources.
 */

// ============================================================
// STEP 1: PREPARE YOUR DATA ON GOOGLE DRIVE
// ============================================================

/*
Create a folder in Google Drive with these 6 CSV files:

1. CPCB_Pollution_Data.csv
   - Contains air quality measurements from 10 CPCB monitoring stations
   - Fields: Station, Latitude, Longitude, PM2.5, PM10, NO2, SO2, Date
   - Example rows:
     Bandra East,19.0596,72.8295,55.2,95.3,42.1,12.5,2024-06-28
     Colaba,18.9676,72.8194,48.5,88.2,38.9,10.2,2024-06-28

2. ECOSTRESS_LST.csv
   - Land Surface Temperature from NASA ECOSTRESS satellite
   - Fields: Latitude, Longitude, LST (°C)
   - Resolution: ~70m grid cells covering Mumbai
   - Temperature range: 28-50°C

3. NDVI_Data.csv
   - Normalized Difference Vegetation Index
   - Fields: Latitude, Longitude, NDVI (-1 to +1)
   - Values: -0.3 (barren) to +0.7 (dense forest)

4. NDBI_Data.csv
   - Normalized Difference Built-up Index
   - Fields: Latitude, Longitude, NDBI (-0.5 to +0.8)
   - Values: -0.5 (water) to +0.8 (dense urban)

5. ERA5_Temperature.csv
   - Ambient air temperature from ERA5 reanalysis
   - Fields: Latitude, Longitude, Temperature (°C)

6. ERA5_Humidity.csv
   - Relative humidity from ERA5 reanalysis
   - Fields: Latitude, Longitude, RelativeHumidity (%)
*/

// ============================================================
// STEP 2: GET GOOGLE DRIVE FILE IDs
// ============================================================

/*
For each CSV file:
1. Right-click the file in Google Drive
2. Select "Share" or "Get link"
3. Copy the sharing link
4. Extract the FILE_ID from: https://drive.google.com/file/d/[FILE_ID]/view
5. The FILE_ID is the long alphanumeric string between /d/ and /view

Example:
  URL: https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view
  FILE_ID: 1A2B3C4D5E6F7G8H9I0J
*/

// ============================================================
// STEP 3: UPDATE gdrive-data-loader.js
// ============================================================

/*
Open gdrive-data-loader.js and update this section:

BEFORE:
  const GDRIVE_CONFIG = {
      files: {
          cpcb_pollution: 'REPLACE_WITH_GDRIVE_FILE_ID',
          ecostress_lst: 'REPLACE_WITH_GDRIVE_FILE_ID',
          ndvi_data: 'REPLACE_WITH_GDRIVE_FILE_ID',
          ndbi_data: 'REPLACE_WITH_GDRIVE_FILE_ID',
          era5_temp: 'REPLACE_WITH_GDRIVE_FILE_ID',
          era5_humidity: 'REPLACE_WITH_GDRIVE_FILE_ID'
      }
  };

AFTER (Example):
  const GDRIVE_CONFIG = {
      files: {
          cpcb_pollution: '1aBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3',
          ecostress_lst: '2bCdEfGhIjKlMnOpQrStUvWxYz2b3c4',
          ndvi_data: '3cDeEfGhIjKlMnOpQrStUvWxYz3c4d5',
          ndbi_data: '4dEfGhIjKlMnOpQrStUvWxYz4d5e6',
          era5_temp: '5eEfGhIjKlMnOpQrStUvWxYz5e6f7',
          era5_humidity: '6fEfGhIjKlMnOpQrStUvWxYz6f7g8'
      }
  };
*/

// ============================================================
// STEP 4: SET FILE SHARING PERMISSIONS
// ============================================================

/*
For each CSV file in Google Drive:
1. Click "Share" button
2. Change permission to "Anyone with the link can view"
3. Make sure "Editor" access is NOT enabled (view-only is sufficient)
4. Copy and verify the share link works
*/

// ============================================================
// STEP 5: VERIFY DATA FORMAT
// ============================================================

/*
Test your CSV files:

A. Open each CSV in a text editor (not Excel, which may corrupt formatting)
B. Verify:
   - First line is header (no data)
   - Data starts from line 2
   - All commas are correctly placed
   - No quotes inside quoted values
   - No trailing commas at end of lines

C. Example of CORRECT format:
   Station,Latitude,Longitude,PM2.5,PM10,NO2,SO2,Date
   Bandra East,19.0596,72.8295,55.2,95.3,42.1,12.5,2024-06-28

D. Example of INCORRECT format (will cause errors):
   "Station","Latitude","Longitude","PM2.5","PM10","NO2","SO2","Date"
   (extra quotes cause parsing issues)
*/

// ============================================================
// STEP 6: TEST THE DASHBOARD
// ============================================================

/*
Testing Procedure:

1. Open browser console (F12)
2. Go to https://thenorthernlightsalchemy.github.io/mumbai-heat-dashboard/
3. Wait 3-5 seconds for data to load
4. Check console for messages:
   ✅ "Loaded X CPCB stations"
   ✅ "Loaded ECOSTRESS grid with Y points"
   ✅ "All data loaded successfully!"
   
5. If you see:
   ⚠️ "Using dummy data (Google Drive not connected)"
   → File IDs are incorrect or files not shared
   → Check Step 2-4 above

6. Test workflow:
   - Click "See Heat Stress Map (ECOSTRESS)"
   - Click "See Heat Spots (AI-Detected)"
   - Click "See key drivers of heat"
   - Hover over hotspots to see driver data
   - Click "Show cooling interventions"
   - Click a hotspot and adjust sliders
*/

// ============================================================
// DATA DICTIONARY
// ============================================================

/*
CPCB_Pollution_Data.csv
├─ Station (string)
│  └─ Name of air quality monitoring station
├─ Latitude (float)
│  └─ Decimal degrees, range: 18.6 - 19.5
├─ Longitude (float)
│  └─ Decimal degrees, range: 72.4 - 73.3
├─ PM2.5 (float)
│  └─ Fine particulates in µg/m³
│     Units: micrograms per cubic meter
│     WHO guideline: 15 µg/m³
│     Mumbai typical: 40-70 µg/m³
├─ PM10 (float)
│  └─ Coarse particulates in µg/m³
│     Units: micrograms per cubic meter
│     WHO guideline: 45 µg/m³
│     Mumbai typical: 80-150 µg/m³
├─ NO2 (float)
│  └─ Nitrogen dioxide in ppb
│     Units: parts per billion
│     EPA standard: 53 ppb
│     Mumbai typical: 30-80 ppb
├─ SO2 (float)
│  └─ Sulfur dioxide in ppb
│     Units: parts per billion
│     EPA standard: 75 ppb
│     Mumbai typical: 5-20 ppb
└─ Date (string)
   └─ ISO format: YYYY-MM-DD
      When measurements were recorded

ECOSTRESS_LST.csv
├─ Latitude (float)
│  └─ Decimal degrees, range: 18.6 - 19.5
├─ Longitude (float)
│  └─ Decimal degrees, range: 72.4 - 73.3
└─ LST (float)
   └─ Land Surface Temperature in °C
      Resolution: ~70m per pixel
      Range: 28-50°C in Mumbai
      Time: Daytime satellite pass

NDVI_Data.csv
├─ Latitude (float)
├─ Longitude (float)
└─ NDVI (float)
   └─ Normalized Difference Vegetation Index
      Range: -1.0 (barren) to +1.0 (dense green)
      -0.3 to -0.1: Bare ground, urban areas
      0.0 to 0.2: Sparse vegetation
      0.2 to 0.4: Moderate vegetation
      0.4 to 0.6: Good vegetation
      0.6 to 1.0: Dense forest/vegetation

NDBI_Data.csv
├─ Latitude (float)
├─ Longitude (float)
└─ NDBI (float)
   └─ Normalized Difference Built-up Index
      Range: -0.5 (water) to +0.8 (dense urban)
      -0.5 to 0.0: Water, vegetation
      0.0 to 0.2: Mixed urban-vegetation
      0.2 to 0.4: Urban areas, buildings
      0.4 to 0.8: Dense urban, concrete

ERA5_Temperature.csv
├─ Latitude (float)
├─ Longitude (float)
└─ Temperature (float)
   └─ Ambient air temperature in °C
      From climate reanalysis
      Typical range: 25-35°C in Mumbai

ERA5_Humidity.csv
├─ Latitude (float)
├─ Longitude (float)
└─ RelativeHumidity (float)
   └─ Relative humidity as percentage (0-100)
      Typical range: 60-85% in Mumbai
      Higher over sea, lower over land
*/

// ============================================================
// TROUBLESHOOTING CHECKLIST
// ============================================================

/*
Problem: Map is blank / not loading
Solution:
  □ Check browser console (F12) for JavaScript errors
  □ Verify Leaflet.js CDN is accessible
  □ Try refreshing page (Ctrl+Shift+R for hard refresh)
  □ Check internet connection

Problem: Hotspots not appearing
Solution:
  □ Did you click "See Heat Stress Map" first? (Required)
  □ Did you click "See Heat Spots (AI-Detected)"?
  □ Check console for data loading status
  □ Verify hotspots.geojson exists in repository

Problem: Google Drive data not loading
Solution:
  □ Check file IDs in gdrive-data-loader.js are correct
  □ Verify each file is shared "Anyone with the link"
  □ Test direct download: 
      https://drive.google.com/uc?export=download&id=YOUR_FILE_ID
  □ Check console for CORS errors
  □ Dashboard will fallback to dummy data (with warning)

Problem: Cooling interventions not working
Solution:
  □ Did you click on a red hotspot polygon first?
  □ Check that selectedHotspotData is defined (console)
  □ Verify data-processor.js is loaded
  □ Try adjusting one slider at a time

Problem: Incorrect temperature calculations
Solution:
  □ Verify NDVI is in range -1 to +1
  □ Verify NDBI is in range -0.5 to +0.8
  □ Check base temperature is between 15-60°C
  □ Review physics calculations in data-processor.js
*/

// ============================================================
// PERFORMANCE TIPS
// ============================================================

/*
Optimize for better performance:

1. Reduce grid resolution
   - If using 1000+ grid points, consider decimating to 100-200
   - Reduces loading time and computation

2. Lazy load data
   - Load only data for visible map bounds
   - Not implemented in current version but recommended

3. Precompute hotspots
   - Instead of generating hotspots dynamically
   - Pre-compute and store in hotspots.geojson
   - Current version uses pre-computed geojson (recommended)

4. Use web workers
   - Move physics calculations to background thread
   - Keeps UI responsive during complex simulations

5. Cache interpolation results
   - Store recently computed grid values
   - Reduces redundant calculations
*/

// ============================================================
// PHYSICS VALIDATION
// ============================================================

/*
Sanity checks for your data:

1. ECOSTRESS LST should be hotter than ERA5 Temperature
   Example: LST=42°C, Ambient=28°C
   Difference: 14°C (reasonable for daytime)

2. NDVI + NDBI relationship
   Generally: High NDVI areas have low NDBI (vegetation not built-up)
   Example: Forest area = NDVI 0.6, NDBI -0.2 ✓

3. PM2.5 should spike near traffic/industrial areas
   Example: High NDBI area has high PM2.5 ✓

4. Coastal areas should be slightly cooler
   Example: Coastal LST 35°C, Inland LST 42°C ✓

5. Cooling intervention results should be < 5°C total
   Example: All sliders at 100% = 2-3°C cooling ✓
   (Real physics, not magic!)
*/

// ============================================================
// NEXT STEPS
// ============================================================

/*
After setup is complete:

1. Validate with real data
   - Compare ECOSTRESS LST to weather stations
   - Verify CPCB pollution against official reports
   - Check NDVI against satellite imagery

2. Calibrate cooling models
   - Test against ground-truth intervention studies
   - Adjust efficiency coefficients if needed
   - Document any deviations

3. Add more regions
   - Extend to other Indian cities
   - Generalize physics for different climates
   - Compare urban vs. rural UHI

4. Publish results
   - Document methodology
   - Share findings with stakeholders
   - Contribute to climate adaptation policy
*/

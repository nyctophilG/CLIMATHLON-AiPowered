import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const REGIONAL_SEED_FILES = {
  waste: [
    {
      filename: 'ergene_textile_dyeing_sludge.log',
      content: `[LIMS_TELEMETRY_HEADER]
FACILITY_ID: TR-59-ERGENE-OSB-014
FACILITY_NAME: Ergene Havzasi Integrated Denim & Textile Dyeing Corp. (Velimese / Ergene OSB)
STREAM_ID: WASTE_TEXTILE_SLUDGE_01
BY-PRODUCT STREAM: Physico-Chemical Coagulation & Biological Textile Dyeing Sludge (Filter Press Cake)
EWC_CODE: 04 02 19* / 04 02 20 (Sludges from on-site effluent treatment in textile industry)

[STOICHIOMETRIC_ASSAY_DRY_BASIS]
- Iron (III) Hydroxide / Ferric Oxide (Fe2O3 from FeCl3 coagulant): 28.4%
- Aluminum Oxide (Al2O3 from PAC/Alum flocculant): 14.6%
- Silicon Dioxide (SiO2): 11.2%
- Calcium Oxide (CaO from lime neutralization): 9.8%
- Organic Dye & Cellulosic Lint Volatile Matter (LOI): 31.5%
- Calorific Value (LHV Dry Basis): 9.4 MJ/kg
- Heavy Metals (ICP-OES): Zn 180 mg/kg, Cu 95 mg/kg, Cr(III) 62 mg/kg, Cd < 0.8 mg/kg

[PHYSICAL_AND_LOGISTICS_METRICS]
- Filter Press Discharge Moisture: 34.0% (Thermally dewatered via stenters waste-heat)
- Residual pH: 7.8
- Annual Generation Rate: 18,500 metric tons/year
- Current Status Quo Disposal: Licensed industrial landfill & haulage fee (€68/ton)
`
    },
    {
      filename: 'tekirdag_thermal_coal_fly_ash.log',
      content: `[LIMS_TELEMETRY_HEADER]
FACILITY_ID: TR-59-TEKIRDAG-PWR-002
FACILITY_NAME: Tekirdag Marmara Ereglisi Co-Generation & Thermal Power Plant
STREAM_ID: WASTE_FLY_ASH_CLASS_F
BY-PRODUCT STREAM: Electrostatic Precipitator Aluminosilicate Coal Fly Ash
EWC_CODE: 10 01 02 (Coal fly ash - Non-Hazardous)

[STOICHIOMETRIC_ASSAY_DRY_BASIS]
- Silicon Dioxide (SiO2): 55.4%
- Aluminum Oxide (Al2O3): 26.8%
- Iron Oxide (Fe2O3): 6.1%
- Calcium Oxide (CaO): 4.2%
- Reactive Oxide Sum (SiO2 + Al2O3 + Fe2O3): 88.3%
- Loss on Ignition (LOI / Unburned Carbon): 1.9%
- Alkali Content (Na2O eq.): 1.4%

[PHYSICAL_AND_LOGISTICS_METRICS]
- Silo Moisture Content: 0.3% (Dry pneumatic storage)
- Blaine Fineness: 4,250 cm2/g (45 micron sieve residue: 12%)
- Annual Generation Rate: 32,000 metric tons/year
- Current Status Quo Disposal: Ash depot gate fee & dust stabilization (€44/ton)
`
    },
    {
      filename: 'corlu_eaf_steel_slag.log',
      content: `[LIMS_TELEMETRY_HEADER]
FACILITY_ID: TR-59-CORLU-MET-008
FACILITY_NAME: Corlu 1. OSB Heavy Alloy & Electric Arc Furnace (EAF) Steelworks
STREAM_ID: WASTE_EAF_STEEL_SLAG
BY-PRODUCT STREAM: Crushed & Magnetically Separated EAF Black Steel Slag
EWC_CODE: 10 02 02 (Unprocessed/processed slag from iron and steel industry - Non-Hazardous)

[STOICHIOMETRIC_ASSAY_DRY_BASIS]
- Calcium Oxide (CaO): 41.2%
- Iron Oxide (FeO / Fe2O3): 24.5%
- Silicon Dioxide (SiO2): 16.8%
- Magnesium Oxide (MgO): 7.9%
- Aluminum Oxide (Al2O3): 6.4%
- Free Lime (f-CaO): 1.6% (Weather-stabilized for 30 days)

[PHYSICAL_AND_LOGISTICS_METRICS]
- Moisture Content: 1.8%
- Bulk Specific Gravity: 3.45 g/cm3 (High density mineral aggregate / clinker flux)
- Granulometry: 0 - 12 mm crushed fraction
- Annual Generation Rate: 45,000 metric tons/year
- Current Status Quo Disposal: Slag yard stockpiling & industrial landfill fee (€35/ton)
`
    },
    {
      filename: 'cerkezkoy_foundry_silica_sand.log',
      content: `[LIMS_TELEMETRY_HEADER]
FACILITY_ID: TR-59-CERKEZKOY-FND-019
FACILITY_NAME: Cerkezkoy OSB Automotive Precision Iron & Ductile Casting Foundry
STREAM_ID: WASTE_FOUNDRY_SILICA_SAND
BY-PRODUCT STREAM: Spent Green & Bentonite-Bonded Foundry Molding Silica Sand
EWC_CODE: 10 09 08 (Casting cores and moulds which have undergone pouring - Non-Hazardous)

[STOICHIOMETRIC_ASSAY_DRY_BASIS]
- Silicon Dioxide (SiO2 - Quartz Grain Core): 88.6%
- Aluminum Oxide (Al2O3 from residual sodium/calcium bentonite clay): 5.8%
- Iron Oxide (Fe2O3): 1.9%
- Loss on Ignition (LOI - Sea coal / carbonaceous binder film): 2.4%
- Soluble Salts / Chlorides: < 0.05%

[PHYSICAL_AND_LOGISTICS_METRICS]
- Moisture Content: 1.1%
- Grain Fineness Number (AFS-GFN): 55 - 65 (Sub-angular silica sand)
- Residual pH: 8.3
- Annual Generation Rate: 14,000 metric tons/year
- Current Status Quo Disposal: Municipal/industrial inert landfill gate fee (€38/ton)
`
    }
  ],
  resource: [
    {
      filename: 'tralleis_cement_kiln_raw_meal.log',
      content: `[ERP_PROCUREMENT_HEADER]
FACILITY_ID: TR-59-THRACE-CEM-101
FACILITY_NAME: Thrace Integrated Clinker & Rotary Cement Kiln Plant (Saray / Tekirdag)
FEEDSTOCK_ID: REQ_KILN_RAW_MEAL_FLUX
RAW MATERIAL NEED: Alternative CaO-Fe2O3-SiO2 Mineralizer & Co-Processing Raw Meal Corrective

[TECHNICAL_SPECIFICATION_AND_TOLERANCES]
- Target Oxides: High CaO (25% - 45%), Fe2O3 (10% - 30%), SiO2 (12% - 55%), Al2O3 (5% - 25%)
- Thermal Co-Processing Bonus: Accepts organic/carbonaceous LOI up to 35% (utilizes calorific value in 1,450 C kiln calciner)
- Maximum Moisture Content: < 38.0% (Pre-heater waste heat flash-dries up to 35% moisture)
- Heavy Metal Encapsulation: Incorporates non-volatile transition metals (Fe, Al, Zn, Cu, Cr-III) into clinker mineral phases (C3S / C4AF)
- Prohibited: Volatile Mercury (Hg > 2 ppm) or Halogens/Fluorides (F > 0.5%)
- Target Annual Demand: 40,000 metric tons/year (Replaces quarried limestone, iron ore corrective, and petcoke).
`
    },
    {
      filename: 'corlu_geopolymer_precast_binder.log',
      content: `[ERP_PROCUREMENT_HEADER]
FACILITY_ID: TR-59-CORLU-GEO-102
FACILITY_NAME: Corlu OSB Low-Carbon Geopolymer Precast & Infrastructure Elements Inc.
FEEDSTOCK_ID: REQ_POZZOLAN_ALUMINOSILICATE
RAW MATERIAL NEED: High-Purity Amorphous Aluminosilicate Binder Precursor & Silica Aggregate

[TECHNICAL_SPECIFICATION_AND_TOLERANCES]
- Combined Pozzolanic Oxides (SiO2 + Al2O3 + Fe2O3): Minimum 70.0% (Ideal > 85% for binder; or > 85% SiO2 for micro-aggregate filler)
- Reactive SiO2 / Al2O3 Ratio: 1.8 - 3.2 molar window for alkali-activated polycondensation
- Maximum Loss on Ignition (LOI): < 4.5% (High organic carbon inhibits alkali activation)
- Maximum Moisture Content: < 2.0% (Direct pneumatic silo dosing)
- Free Lime (f-CaO): < 2.5% to prevent flash setting
- EWC Compliance: Non-Hazardous mineral by-products only (EN 450-1 / ASTM C618)
- Target Annual Demand: 28,000 metric tons/year.
`
    },
    {
      filename: 'ergene_vitrified_brick_works.log',
      content: `[ERP_PROCUREMENT_HEADER]
FACILITY_ID: TR-59-ERGENE-BRK-103
FACILITY_NAME: Ergene Valley Structural Terracotta & Vitrified Clay Brick Works
FEEDSTOCK_ID: REQ_SILICA_DEPLASTICIZER_PORE_AGENT
RAW MATERIAL NEED: Quartz Silica Sand De-Plasticizer & Pore-Forming Clay Body Additive

[TECHNICAL_SPECIFICATION_AND_TOLERANCES]
- Primary Mineral Requirement: High SiO2 Quartz Sand (50% - 92% SiO2) or Aluminosilicate temper to reduce brick drying shrinkage
- Secondary Residual Clay/Bentonite Bonus: 4% - 15% Al2O3 + Fe2O3 aids ceramic vitrification at 950 C - 1,050 C tunnel kiln firing
- Organic Pore-Forming Tolerance: Accepts up to 20% organic fiber/sludge (burns out during firing to create lightweight thermal-insulating micro-pores)
- Maximum Moisture Content: < 35.0% (Wet pug-mill extrusion mixes water anyway)
- Granulometry: < 4 mm particle size (Cannot use coarse unmilled >10mm heavy slag without crushing)
- Target Annual Demand: 16,000 metric tons/year.
`
    },
    {
      filename: 'marmara_acid_regeneration_plant.log',
      content: `[ERP_PROCUREMENT_HEADER]
FACILITY_ID: TR-59-MARMARA-CHEM-104
FACILITY_NAME: Marmara Industrial Coagulant & Acid Regeneration Plant (Cerkezkoy / Ergene)
FEEDSTOCK_ID: REQ_FE_AL_SLUDGE_RECOVERY
RAW MATERIAL NEED: Ferric/Aluminum Hydroxide Filter Cake for Wet-Chemical Coagulant Regeneration

[TECHNICAL_SPECIFICATION_AND_TOLERANCES]
- Target Metal Hydroxides/Oxides: Combined Fe2O3 + Al2O3 >= 35.0% dry basis (Specifically designed to leach Fe3+ and Al3+ from water/textile treatment sludges)
- Process Chemistry: Sulfuric/Hydrochloric acid digestion + oxidative organic destruction (Fenton-like regeneration of Polyaluminum Chloride & Ferric Sulfate)
- Acceptable Moisture Content: Up to 45.0% filter-press cake
- Prohibited Streams: Inert crystalline silicates (> 40% quartz SiO2) or highly alkaline CaO slags (> 25% CaO) which neutralize acid and form gypsum scaling
- Target Annual Demand: 15,000 metric tons/year (Produces recycled coagulants for Ergene OSB wastewater treatment plants).
`
    }
  ]
}

function ensureSeededOnDisk(force = false) {
  const seeded = { waste: [], resource: [] }
  for (const folder of ['waste', 'resource']) {
    const dirPath = path.resolve(process.cwd(), 'database', folder)
    fs.mkdirSync(dirPath, { recursive: true })
    const existingFiles = fs.readdirSync(dirPath).filter((f) => !f.startsWith('.'))

    if (existingFiles.length === 0 || force) {
      for (const item of REGIONAL_SEED_FILES[folder]) {
        const targetFile = path.join(dirPath, item.filename)
        if (!fs.existsSync(targetFile) || force) {
          fs.writeFileSync(targetFile, item.content, 'utf-8')
          seeded[folder].push(item.filename)
        }
      }
    }
  }
  return seeded
}

function scanDatabaseDirectory(folder) {
  const dirPath = path.resolve(process.cwd(), 'database', folder)
  fs.mkdirSync(dirPath, { recursive: true })
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    const fullPath = path.join(dirPath, entry.name)
    const stat = fs.statSync(fullPath)
    const content = fs.readFileSync(fullPath, 'utf-8')
    files.push({
      filename: entry.name,
      path: `database/${folder}/${entry.name}`,
      content,
      size: stat.size,
      updatedAt: stat.mtime.toISOString()
    })
  }

  // Sort with .log regional OSB files first, then alphabetically
  files.sort((a, b) => {
    const aIsLog = a.filename.endsWith('.log') ? 0 : 1
    const bIsLog = b.filename.endsWith('.log') ? 0 : 1
    if (aIsLog !== bIsLog) return aIsLog - bIsLog
    return a.filename.localeCompare(b.filename)
  })

  return files
}

// Custom middleware plugin for N-to-M Regional Industrial Registry (/api/database/list, /api/database/seed, /api/database/save)
function databaseFolderPlugin() {
  return {
    name: 'database-folder-api',
    configureServer(server) {
      // Automatically run seed check when the Vite dev server starts
      ensureSeededOnDisk(false)

      // GET /api/database/list
      server.middlewares.use('/api/database/list', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        try {
          const waste = scanDatabaseDirectory('waste')
          const resource = scanDatabaseDirectory('resource')
          res.setHeader('Content-Type', 'application/json')
          res.statusCode = 200
          res.end(JSON.stringify({ waste, resource }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })

      // POST /api/database/seed
      server.middlewares.use('/api/database/seed', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let body = ''
        req.on('data', (chunk) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            let force = false
            if (body) {
              try {
                force = Boolean(JSON.parse(body).force)
              } catch {
                force = false
              }
            }
            const seeded = ensureSeededOnDisk(force)
            const waste = scanDatabaseDirectory('waste')
            const resource = scanDatabaseDirectory('resource')
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, seeded, waste, resource }))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })

      // POST /api/database/save
      server.middlewares.use('/api/database/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk.toString()
        })
        req.on('end', () => {
          try {
            const { folder, filename, content } = JSON.parse(body)
            if (!['waste', 'resource'].includes(folder) || !filename) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid folder or filename' }))
              return
            }

            const safeName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
            const targetDir = path.resolve(process.cwd(), 'database', folder)
            fs.mkdirSync(targetDir, { recursive: true })
            const filePath = path.join(targetDir, safeName)
            fs.writeFileSync(filePath, content ?? '', 'utf-8')
            const stat = fs.statSync(filePath)

            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 200
            res.end(
              JSON.stringify({
                ok: true,
                path: `database/${folder}/${safeName}`,
                filename: safeName,
                size: stat.size,
                updatedAt: stat.mtime.toISOString()
              })
            )
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), databaseFolderPlugin()],
})

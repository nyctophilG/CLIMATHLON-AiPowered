# SymbioMatch Enterprise — Industrial Symbiosis NLP Marketplace

> **Climathon Task 4 Final Product** • **COP31 Aligned** • **Siemens Impact Area** • **UN SDGs 9, 12 & 13**

**SymbioMatch Enterprise** is a B2B Industrial Symbiosis Telemetry & Secondary Raw Material Valuation Platform built for regional organized industrial zones (**Tekirdağ / Ergene / Çorlu / Çerkezköy OSB**). It transforms unstructured laboratory waste assays (`.log`, `.txt`, `.md`, `.csv`) and industrial procurement specifications into verified stoichiometric matches, Scope 1+3 carbon abatement ledgers, geospatial transport break-even analyses, and audit-ready **TSRS / EU CSRD "Circular 10-K"** compliance certificates.

---

## 1. Executive Problem & Solution

### The Problem (Linear Industrial Friction)
In industrial manufacturing corridors, valuable secondary raw materials (coal fly ash, EAF steel slag, spent foundry silica sand, physico-chemical textile sludges) are routinely landfilled because generator lab reports (XRF oxide assays, moisture percentages, EWC hazard codes) and off-taker procurement specs are trapped in incompatible technical formats. Manual waste brokerage takes 6–9 months and lacks transparent Scope 3 transport and regulatory auditing.

### The SymbioMatch Solution
1. **Unstructured Stoichiometric NLP Parsing**: Extracts reactive oxide mass fractions ($\text{SiO}_2$, $\text{Al}_2\text{O}_3$, $\text{Fe}_2\text{O}_3$, $\text{CaO}$), Loss on Ignition (LOI), moisture deltas, particle granulometry, and European Waste Catalogue (EWC) hazard limits.
2. **N-to-M Regional Registry & Autonomous 1-to-N Scanning**: Evaluates a single generator waste stream against all registered regional off-taker facilities simultaneously, ranking candidates by stoichiometric compatibility (`0–100%`).
3. **Geospatial Scope 3 Logistics & Break-Even Modeling**: Deducts inter-facility transport emissions and freight costs (`Euro 6 Heavy Truck` vs. `Electric Freight Rail`) from gross process savings and computes the exact **Break-Even Symbiosis Radius (km)**.
4. **Mandatory Corporate Disclosure ("Circular 10-K")**: Generates cryptographically hashed **TSRS / EU CSRD (ESRS E5) / EU Waste Framework Directive Art. 6** audit certificates exportable as `.json`, `.txt`, or print-ready PDF.

---

## 2. Key Platform Capabilities

### A. Regional Registry Explorer & Live File Ingestion
- **Dual System Input Logs (`SYS_LOG_A` & `SYS_LOG_B`)**: Monospaced industrial telemetry editors for **Company A (Waste Output)** and **Company B (Raw Material Need)**.
- **Multi-Format Upload (`.log`, `.txt`, `.md`, `.csv`)**: Uses browser `FileReader` to ingest external laboratory files and persists them directly to `/database/waste/` and `/database/resource/` on disk via a custom Vite server middleware plugin.
- **Pre-Seeded Thrace / Ergene / Çorlu OSB Dataset**:
  - **`/database/waste`**:
    - `tekirdag_thermal_coal_fly_ash.log` — Class F Aluminosilicate Coal Fly Ash (`EWC 10 01 02`)
    - `ergene_textile_dyeing_sludge.log` — Fe/Al Coagulation Textile Dyeing Filter Cake (`EWC 04 02 19* / 20`)
    - `corlu_eaf_steel_slag.log` — Electric Arc Furnace Crushed Black Steel Slag (`EWC 10 02 02`)
    - `cerkezkoy_foundry_silica_sand.log` — Spent Bentonite-Bonded Foundry Silica Sand (`EWC 10 09 08`)
    - `fly_ash_class_f.txt`, `brewery_spent_grain.md`, `semiconductor_acid_sludge.csv`
  - **`/database/resource`**:
    - `corlu_geopolymer_precast_binder.log` — Low-Carbon Geopolymer Precast Binder Spec (`EN 450-1`)
    - `tralleis_cement_kiln_raw_meal.log` — Rotary Cement Kiln Alternative Flux & Co-Processing Spec
    - `ergene_vitrified_brick_works.log` — Structural Vitrified Clay Brick Silica Temper Spec
    - `marmara_acid_regeneration_plant.log` — Wet-Chemical Fe/Al Coagulant Regeneration Spec
    - `geopolymer_concrete_spec.txt`, `mycelium_acoustic_substrate.md`, `organic_soil_amendment.csv`

### B. Hybrid AI & Deterministic Zero-Config Engine
- **Zero-Config Deterministic Mode (Default)**: Out-of-the-box stoichiometric evaluation matrix that works offline without an API key for instant jury and auditor verification.
- **Live Gemini API Mode (`@google/genai`)**: Click **`MODE: ZERO_CONFIG`** in the top header to supply a Gemini API key (or set `VITE_GEMINI_API_KEY` in `.env`) to run live structured JSON inference via `gemini-3.8-flash` (`client.interactions.create`).

### C. Geospatial Logistics & Net-Zero Valuation Simulator
- **Annual By-Product Tonnage Slider**: Scale throughput from `1,000 t/yr` (Pilot) to `100,000 t/yr` (Regional Scale).
- **Inter-Facility Logistics Distance Slider**: Model haul distances from `5 km` (intra-OSB pipeline/short haul) to `500 km` (regional corridor).
- **Transport Mode Toggle**:
  - **Euro 6 Heavy Truck**: `0.062 kg CO2e / ton-km` and `€0.11 / ton-km` freight rate.
  - **Electric Freight Rail**: `0.022 kg CO2e / ton-km` and `€0.04 / ton-km` freight rate.
- **Net-Zero Accounting**:
  $$\text{Net Verified CO}_2\text{e Abatement} = \text{Gross Process Abatement} - \text{Transport Scope 3 Penalty}$$
  $$\text{Break-Even Gate-Fee Radius (km)} = \left\lfloor \frac{\text{Status Quo Disposal Gate Fee (€/t)}}{\text{Freight Cost Rate (€/t-km)}} \right\rfloor$$

### D. TSRS / EU CSRD "Circular 10-K" Audit Certificate Modal
- Generates an official regulatory filing with:
  - Deterministic **SHA-256 Document Verification Hash** & ISO-8601 UTC timestamp
  - **Generator & Off-Taker Facility IDs** and EWC classifications
  - **Stoichiometric Tolerance Verification Table** (`PASS` / `CONDITIONAL` / `FAIL` badges)
  - **Audited Scope 3 Abatement & Landfill Diversion Ledger**
  - One-click export to **`.json`**, **`.txt`**, or **Print / Save PDF** (`window.print()`).

---

## 3. Project Architecture

```text
ai-native-week1/
├── database/
│   ├── waste/                          # Regional OSB waste stream logs (.log, .txt, .md, .csv)
│   └── resource/                       # Regional OSB off-taker resource specs (.log, .txt, .md, .csv)
├── src/
│   ├── components/
│   │   ├── Header.jsx                  # Enterprise telemetry bar, COP31/Siemens/SDG badges & API key toggle
│   │   ├── InputSection.jsx            # Regional Registry Explorer pill bars, FileReader upload & SYS_LOG_A/B
│   │   ├── ImpactCalculator.jsx        # Match score, NLP tokens, tonnage/distance sliders & Recharts view
│   │   └── CircularManifestModal.jsx   # TSRS / CSRD Circular 10-K audit certificate modal & JSON/TXT/PDF export
│   ├── services/
│   │   └── geminiService.js            # @google/genai (gemini-3.8-flash) + N-to-M stoichiometry engine
│   ├── App.jsx                         # Root state, 1-to-1 match & 1-to-N Autonomous Registry Leaderboard
│   ├── main.jsx                        # React DOM entry point
│   └── index.css                       # Tailwind directives, enterprise range sliders & print media rules
├── vite.config.js                      # Vite config + custom databaseFolderPlugin (/api/database/*)
├── tailwind.config.js                  # Corporate Navy/Slate/Indigo palette & JetBrains Mono typography
└── package.json                        # Project dependencies and scripts
```

---

## 4. Local Database Middleware API (`vite.config.js`)

During development (`npm run dev`), `vite.config.js` mounts the `databaseFolderPlugin()` middleware with three endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/database/list` | `GET` | Scans `database/waste` and `database/resource` on disk and returns `{ waste: [...], resource: [...] }` with `{ filename, path, content, size, updatedAt }`. |
| `/api/database/seed` | `POST` | Automatically seeds the 8 regional Tekirdağ / Ergene / Çorlu OSB `.log` files if either directory is empty (also runs automatically on server startup). |
| `/api/database/save` | `POST` | Persists uploaded or edited `.log`, `.txt`, `.md`, or `.csv` files directly into `database/waste/` or `database/resource/`. |

---

## 5. Getting Started

### Prerequisites
- **Node.js** `>= 18.x` (Node `>= 20.x` recommended)
- **npm** `>= 9.x`

### Installation & Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server (auto-seeds /database/waste and /database/resource)
npm run dev

# 3. Build for production verification
npm run build

# 4. Preview production build locally
npm run preview
```

### Optional: Live Gemini API Configuration
The platform runs with full functionality in **Zero-Config Mode** out of the box. To enable live LLM evaluation with `@google/genai` (`gemini-3.8-flash`):
1. Click **`MODE: ZERO_CONFIG`** in the top-right header bar and paste your Gemini API key, **or**
2. Create a `.env` file in the project root:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

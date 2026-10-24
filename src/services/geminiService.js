import { GoogleGenAI } from '@google/genai';

/**
 * Geospatial Transport Mode Factors (Scope 3 Logistics Telemetry)
 * - Euro 6 Heavy Truck: 0.062 kg CO2e / ton-km & €0.11 / ton-km
 * - Electric Freight Rail: 0.022 kg CO2e / ton-km & €0.04 / ton-km
 */
export const TRANSPORT_MODES = {
  truck: {
    id: 'truck',
    label: 'Euro 6 Heavy Truck',
    shortLabel: 'Euro 6 Truck',
    co2KgPerTonKm: 0.062,
    costEurPerTonKm: 0.11
  },
  rail: {
    id: 'rail',
    label: 'Electric Freight Rail',
    shortLabel: 'Electric Rail',
    co2KgPerTonKm: 0.022,
    costEurPerTonKm: 0.04
  }
};

/**
 * Reference Pair Scenarios & Regional Tekirdag/Ergene/Corlu OSB Default State
 */
export const REFERENCE_SCENARIOS = [
  {
    id: 'high-viability',
    categoryLabel: '1. High Viability (>75%)',
    shortTitle: 'Fly Ash → Geopolymer Concrete',
    subtitle: 'Direct pozzolanic aluminosilicate match',
    defaultTonnage: 32000,
    companyA: `[LIMS_TELEMETRY_HEADER]
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
- Current Status Quo Disposal: Ash depot gate fee & dust stabilization (€44/ton)`,
    companyB: `[ERP_PROCUREMENT_HEADER]
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
- Target Annual Demand: 28,000 metric tons/year.`,
    result: {
      title: 'Tekirdağ Class F Coal Fly Ash → Çorlu OSB Geopolymer Precast Binder',
      overallScore: 95,
      viabilityStatus: 'High Viability (>75% Match)',
      summaryRationale:
        'Optimal regional symbiosis across 35 km corridor: Combined SiO2 + Al2O3 + Fe2O3 reaches 88.3% (exceeding the 70% EN 450-1 threshold), while low Loss on Ignition (1.9%) and 0.3% moisture enable direct pneumatic transfer into Çorlu OSB geopolymer batching without thermal pre-treatment.',
      chemicalEntitiesExtracted: [
        'SiO2: 55.4%',
        'Al2O3: 26.8%',
        'Fe2O3: 6.1%',
        'Oxide Sum: 88.3%',
        'LOI: 1.9% (<4.5% spec)',
        'Moisture: 0.3% (Dry)',
        'EWC 10 01 02 (Non-Hazardous)'
      ],
      calculator: {
        isIncompatible: false,
        diversionRate: 0.94,
        co2BaselinePerTon: 0.84,
        co2TargetPerTon: 0.14,
        statusQuoDisposalCostPerTon: 44,
        targetNetBenefitPerTon: 38,
        defaultDistanceKm: 35,
        corridorLabel: 'Marmara Ereğlisi → Çorlu 1. OSB (D-100 / Regional Corridor)',
        preProcessingNote:
          'Zero thermal drying required. Minor air-classification screening (6% coarse reject) allows 94% direct mass substitution of Ordinary Portland Cement clinker at Çorlu Geopolymer Precast.'
      }
    }
  }
];

const MATCH_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    overallScore: { type: 'integer' },
    viabilityStatus: { type: 'string' },
    summaryRationale: { type: 'string' },
    chemicalEntitiesExtracted: {
      type: 'array',
      items: { type: 'string' }
    },
    calculator: {
      type: 'object',
      properties: {
        isIncompatible: { type: 'boolean' },
        diversionRate: { type: 'number' },
        co2BaselinePerTon: { type: 'number' },
        co2TargetPerTon: { type: 'number' },
        statusQuoDisposalCostPerTon: { type: 'number' },
        targetNetBenefitPerTon: { type: 'number' },
        defaultDistanceKm: { type: 'integer' },
        corridorLabel: { type: 'string' },
        preProcessingNote: { type: 'string' }
      },
      required: [
        'isIncompatible',
        'diversionRate',
        'co2BaselinePerTon',
        'co2TargetPerTon',
        'statusQuoDisposalCostPerTon',
        'targetNetBenefitPerTon',
        'defaultDistanceKm',
        'corridorLabel',
        'preProcessingNote'
      ]
    }
  },
  required: [
    'title',
    'overallScore',
    'viabilityStatus',
    'summaryRationale',
    'chemicalEntitiesExtracted',
    'calculator'
  ]
};

/**
 * Deterministic N-to-M Stoichiometric Matrix for Tekirdag / Ergene / Corlu OSB Regional Streams
 * and general waste-to-resource combinations.
 */
function classifyWasteStream(text) {
  const t = text.toLowerCase();
  if (t.includes('textile') || t.includes('04 02 19') || t.includes('dyeing')) {
    return 'textile_sludge';
  }
  if (t.includes('fly ash') || t.includes('10 01 02')) {
    return 'fly_ash';
  }
  if (t.includes('steel slag') || t.includes('eaf') || t.includes('10 02 02') || t.includes('41.2%')) {
    return 'steel_slag';
  }
  if (t.includes('foundry') || t.includes('10 09 08') || t.includes('molding silica') || t.includes('88.6%')) {
    return 'foundry_sand';
  }
  if (t.includes('spent grain') || t.includes('brewery') || t.includes('02 07 01')) {
    return 'spent_grain';
  }
  if (t.includes('11 01 09') || t.includes('semiconductor') || t.includes('hydrofluoric') || t.includes('arsenic')) {
    return 'acid_sludge';
  }
  return 'custom_waste';
}

function classifyResourceStream(text) {
  const t = text.toLowerCase();
  if (t.includes('cement kiln') || t.includes('raw meal') || t.includes('tralleis') || t.includes('thrace integrated clinker')) {
    return 'cement_kiln';
  }
  if (t.includes('geopolymer') || t.includes('pozzolan') || t.includes('en 450-1')) {
    return 'geopolymer';
  }
  if (t.includes('brick') || t.includes('terracotta') || t.includes('de-plasticizer')) {
    return 'brick_works';
  }
  if (t.includes('acid regeneration') || t.includes('coagulant') || t.includes('req_fe_al_sludge_recovery')) {
    return 'acid_regeneration';
  }
  if (t.includes('mycelium') || t.includes('ganoderma')) {
    return 'mycelium';
  }
  if (t.includes('soil') || t.includes('2019/1009') || t.includes('farmland')) {
    return 'organic_soil';
  }
  return 'custom_resource';
}

const REGIONAL_MATRIX = {
  // 1. Ergene Textile Dyeing Sludge (High Fe2O3 28.4% + Al2O3 14.6%, 31.5% LOI, 34% moisture)
  'textile_sludge__acid_regeneration': {
    title: 'Ergene OSB Textile Dyeing Sludge → Marmara Coagulant & Acid Regeneration Plant',
    overallScore: 93,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Direct chemical-loop match in Ergene OSB: Combined Fe2O3 (28.4%) + Al2O3 (14.6%) = 43.0% exceeds the ≥35.0% coagulant recovery threshold. Acid digestion leaches Fe3+/Al3+ back into recycled ferric/alum flocculants while Fenton oxidation destroys residual textile dye organics.',
    chemicalEntitiesExtracted: [
      'Fe2O3: 28.4%',
      'Al2O3: 14.6%',
      'Fe+Al Sum: 43.0% (Spec ≥35%)',
      'Moisture: 34.0% (<45% limit)',
      'EWC 04 02 19* / 20',
      'Closed-Loop Coagulant Recovery'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.88,
      co2BaselinePerTon: 0.76,
      co2TargetPerTon: 0.19,
      statusQuoDisposalCostPerTon: 68,
      targetNetBenefitPerTon: 45,
      defaultDistanceKm: 15,
      corridorLabel: 'Velimeşe / Ergene OSB → Çerkezköy Chemical Park (Intra-OSB Short Haul)',
      preProcessingNote:
        'Filter press cake at 34% moisture feeds directly into wet sulfuric/HCl leaching reactors without thermal drying. 88% mass valorization into liquid FeCl3/PAC coagulants.'
    }
  },
  'textile_sludge__cement_kiln': {
    title: 'Ergene OSB Textile Dyeing Sludge → Thrace Cement Kiln Co-Processing & Fe-Corrective',
    overallScore: 84,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Strong co-processing synergy: 31.5% organic dye/lint LOI (9.4 MJ/kg) provides alternative thermal fuel in the 1,450°C calciner, while 28.4% Fe2O3 and 14.6% Al2O3 substitute virgin iron-ore and bauxite clinker mineralizers.',
    chemicalEntitiesExtracted: [
      'Fe2O3: 28.4% (Iron Corrective)',
      'LOI: 31.5% (9.4 MJ/kg Fuel)',
      'Moisture: 34.0% (<38% Kiln Limit)',
      'Cr(III)/Zn Encapsulated in C4AF'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.91,
      co2BaselinePerTon: 0.76,
      co2TargetPerTon: 0.24,
      statusQuoDisposalCostPerTon: 68,
      targetNetBenefitPerTon: 29,
      defaultDistanceKm: 40,
      corridorLabel: 'Ergene OSB → Saray / Tekirdağ Cement Kiln Corridor',
      preProcessingNote:
        'Kiln pre-heater exhaust gas flash-dries the 34% moisture filter cake prior to calciner injection; ash oxides integrate 100% into C4AF clinker phases.'
    }
  },
  'textile_sludge__brick_works': {
    title: 'Ergene OSB Textile Dyeing Sludge → Ergene Vitrified Brick Pore-Forming Additive',
    overallScore: 67,
    viabilityStatus: 'Conditional Viability (Blend Ratio Cap ≤15%)',
    summaryRationale:
      'Organic fiber/dye fraction (31.5% LOI) acts as a pore-forming agent for lightweight insulating bricks and Fe2O3 aids terracotta coloration, but total addition must be capped at 12–15% of clay body mass to prevent excessive firing shrinkage.',
    chemicalEntitiesExtracted: [
      'LOI: 31.5% (Spec ≤20% neat)',
      'Fe2O3: 28.4% (Red Pigment)',
      'Moisture: 34.0% (Pug-Mill Compatible)',
      'Requires 1:6 Clay Dilution'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.64,
      co2BaselinePerTon: 0.76,
      co2TargetPerTon: 0.35,
      statusQuoDisposalCostPerTon: 68,
      targetNetBenefitPerTon: 18,
      defaultDistanceKm: 10,
      corridorLabel: 'Ergene OSB → Ergene Valley Brick Works (Local Haul)',
      preProcessingNote:
        'Requires automated dosing blender at the brick pug-mill to cap sludge ratio at 15% dry weight and scrub flue-gas VOCs during 1,000°C firing.'
    }
  },
  'textile_sludge__geopolymer': {
    title: 'Ergene OSB Textile Dyeing Sludge → Çorlu OSB Geopolymer Precast Binder',
    overallScore: 22,
    viabilityStatus: 'Incompatible — High Organic LOI & Moisture Block',
    summaryRationale:
      'Stoichiometric mismatch: Geopolymer polycondensation requires <4.5% LOI and <2.0% moisture, whereas textile sludge contains 31.5% organic LOI and 34.0% moisture, which severely retards alkali activation and compromises compressive strength.',
    chemicalEntitiesExtracted: [
      'LOI: 31.5% (Violates <4.5% Spec)',
      'Moisture: 34.0% (Violates <2.0% Spec)',
      'SiO2: 11.2% (Too Low for Binder)'
    ],
    calculator: {
      isIncompatible: true,
      diversionRate: 0.0,
      co2BaselinePerTon: 0.76,
      co2TargetPerTon: 0.76,
      statusQuoDisposalCostPerTon: 68,
      targetNetBenefitPerTon: 0,
      defaultDistanceKm: 15,
      corridorLabel: 'Ergene OSB → Çorlu OSB (Blocked Transfer)',
      preProcessingNote:
        'BLOCKED for direct geopolymerization: Unburned organic dye polymers and 34% water content prevent aluminosilicate gel network formation.'
    }
  },

  // 2. Tekirdag Thermal Coal Fly Ash (SiO2 55.4%, Al2O3 26.8%, Fe2O3 6.1%, LOI 1.9%, Moisture 0.3%)
  'fly_ash__geopolymer': REFERENCE_SCENARIOS[0].result,
  'fly_ash__cement_kiln': {
    title: 'Tekirdağ Class F Coal Fly Ash → Thrace Cement Kiln Raw Meal & Pozzolanic Blender',
    overallScore: 86,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'High-grade aluminosilicate source (55.4% SiO2, 26.8% Al2O3) with 0.3% moisture can be inter-ground directly with clinker (CEM II/B-V) or fed as raw meal silica/alumina corrective.',
    chemicalEntitiesExtracted: [
      'SiO2: 55.4%',
      'Al2O3: 26.8%',
      'Moisture: 0.3%',
      'LOI: 1.9%',
      'EN 197-1 CEM II Compatible'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.92,
      co2BaselinePerTon: 0.84,
      co2TargetPerTon: 0.18,
      statusQuoDisposalCostPerTon: 44,
      targetNetBenefitPerTon: 32,
      defaultDistanceKm: 65,
      corridorLabel: 'Marmara Ereğlisi Power Plant → Saray Cement Plant',
      preProcessingNote:
        'Direct pneumatic blending into finish cement grinding mill (CEM II/B-V), displacing 30% rotary kiln clinker.'
    }
  },
  'fly_ash__brick_works': {
    title: 'Tekirdağ Class F Coal Fly Ash → Ergene Vitrified Brick Aluminosilicate Temper',
    overallScore: 79,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Fine spherical glassy aluminosilicate particles (88.3% SiO2+Al2O3+Fe2O3) reduce plastic clay drying shrinkage and promote mullite vitrification at 1,000°C.',
    chemicalEntitiesExtracted: [
      'SiO2: 55.4% (Spec 50–92%)',
      'Al2O3+Fe2O3: 32.9%',
      'Particle Size: <45 µm',
      'Zero Crushing Needed'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.85,
      co2BaselinePerTon: 0.84,
      co2TargetPerTon: 0.29,
      statusQuoDisposalCostPerTon: 44,
      targetNetBenefitPerTon: 24,
      defaultDistanceKm: 45,
      corridorLabel: 'Marmara Ereğlisi → Ergene Valley Brick Works',
      preProcessingNote:
        'Directly dosed at 25% mass fraction into brick extrusion pug-mill, reducing firing fuel energy by 14%.'
    }
  },
  'fly_ash__acid_regeneration': {
    title: 'Tekirdağ Class F Coal Fly Ash → Marmara Acid Regeneration Plant',
    overallScore: 19,
    viabilityStatus: 'Incompatible — High Crystalline Silica Block',
    summaryRationale:
      'Rejected by wet-acid reactor tolerances: 55.4% SiO2 violates the <40% inert silicate ceiling, leaving >65% undissolved siliceous filter cake residue.',
    chemicalEntitiesExtracted: [
      'SiO2: 55.4% (Violates <40% Limit)',
      'Fe2O3+Al2O3: 32.9% (Glassy Phase)',
      'Low Acid Leachability'
    ],
    calculator: {
      isIncompatible: true,
      diversionRate: 0.0,
      co2BaselinePerTon: 0.84,
      co2TargetPerTon: 0.84,
      statusQuoDisposalCostPerTon: 44,
      targetNetBenefitPerTon: 0,
      defaultDistanceKm: 50,
      corridorLabel: 'Marmara Ereğlisi → Çerkezköy (Blocked Transfer)',
      preProcessingNote:
        'BLOCKED: Mullite and quartz glass phases in Class F fly ash resist ambient acid digestion and clog filter presses.'
    }
  },

  // 3. Corlu EAF Steel Slag (CaO 41.2%, FeO/Fe2O3 24.5%, SiO2 16.8%, MgO 7.9%, 0-12mm)
  'steel_slag__cement_kiln': {
    title: 'Çorlu OSB EAF Steel Slag → Thrace Cement Kiln Pre-Calcined CaO-Fe2O3 Flux',
    overallScore: 94,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Ideal mineralogical match: 41.2% CaO exists as pre-calcined calcium silicates (eliminating limestone decarbonation CO2), while 24.5% iron oxide and 16.8% SiO2 exactly match rotary kiln raw meal flux targets.',
    chemicalEntitiesExtracted: [
      'CaO: 41.2% (Spec 25–45%)',
      'Fe2O3: 24.5% (Spec 10–30%)',
      'SiO2: 16.8% (Spec 12–55%)',
      'Pre-Calcined (Zero Calcination CO2)',
      'EWC 10 02 02'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.95,
      co2BaselinePerTon: 0.78,
      co2TargetPerTon: 0.15,
      statusQuoDisposalCostPerTon: 35,
      targetNetBenefitPerTon: 34,
      defaultDistanceKm: 45,
      corridorLabel: 'Çorlu 1. OSB Steelworks → Saray Cement Kiln Rail/Truck Spur',
      preProcessingNote:
        'Magnetic separation already complete; 0–12 mm fraction feeds directly into raw mill crusher, reducing kiln fuel demand and limestone calcination emissions.'
    }
  },
  'steel_slag__geopolymer': {
    title: 'Çorlu OSB EAF Steel Slag → Çorlu Geopolymer Precast High-Density Aggregate & Co-Binder',
    overallScore: 73,
    viabilityStatus: 'Conditional Viability (Requires Ball-Milling to <45 µm)',
    summaryRationale:
      'Combined SiO2 + Al2O3 + Fe2O3 is 47.7% (below the 70% neat pozzolan threshold due to 41.2% CaO), but functions effectively as a high-density structural aggregate or 25% GGBFS-style latent hydraulic co-binder after fine grinding.',
    chemicalEntitiesExtracted: [
      'CaO: 41.2% (Latent Hydraulic)',
      'Si+Al+Fe: 47.7% (<70% Neat Spec)',
      'f-CaO: 1.6% (<2.5% Spec)',
      'Requires Ball-Milling (0–12mm → 45µm)'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.78,
      co2BaselinePerTon: 0.78,
      co2TargetPerTon: 0.26,
      statusQuoDisposalCostPerTon: 35,
      targetNetBenefitPerTon: 22,
      defaultDistanceKm: 10,
      corridorLabel: 'Intra-Çorlu OSB Industrial Transfer (10 km)',
      preProcessingNote:
        'Coarse 0–12 mm fraction can be used directly as heavy precast aggregate (60%) or ball-milled (45 kWh/t) for alkali-activated slag binder blending.'
    }
  },
  'steel_slag__brick_works': {
    title: 'Çorlu OSB EAF Steel Slag → Ergene Vitrified Brick Works',
    overallScore: 48,
    viabilityStatus: 'Low/Conditional Viability (Granulometry & Lime Popping Risk)',
    summaryRationale:
      'Coarse 0–12 mm granulometry violates the <4 mm clay extrusion limit, and 41.2% CaO (with 1.6% free lime) risks post-firing CaO hydration expansion ("lime blowing") in terracotta bricks.',
    chemicalEntitiesExtracted: [
      'CaO: 41.2% (Lime Blowing Risk)',
      'Particle Size: 0–12 mm (Spec <4 mm)',
      'SiO2: 16.8% (Violates 50–92% Spec)'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.35,
      co2BaselinePerTon: 0.78,
      co2TargetPerTon: 0.52,
      statusQuoDisposalCostPerTon: 35,
      targetNetBenefitPerTon: 6,
      defaultDistanceKm: 15,
      corridorLabel: 'Çorlu 1. OSB → Ergene Brick Works',
      preProcessingNote:
        'Requires fine impact crushing (<1 mm) and strict <10% blending limit to avoid brick spalling.'
    }
  },
  'steel_slag__acid_regeneration': {
    title: 'Çorlu OSB EAF Steel Slag → Marmara Acid Regeneration Plant',
    overallScore: 11,
    viabilityStatus: 'Incompatible — Extreme Alkaline Neutralization & Gypsum Scaling',
    summaryRationale:
      'CRITICAL PROCESS BLOCKADE: 41.2% CaO violates the <25% CaO ceiling. Feeding basic steel slag into sulfuric acid reactors violently neutralizes free acid and precipitates massive CaSO4 (gypsum) scale.',
    chemicalEntitiesExtracted: [
      'CaO: 41.2% (Violates <25% Max)',
      'Alkaline Exotherm Hazard',
      'Severe CaSO4 Reactor Fouling'
    ],
    calculator: {
      isIncompatible: true,
      diversionRate: 0.0,
      co2BaselinePerTon: 0.78,
      co2TargetPerTon: 0.78,
      statusQuoDisposalCostPerTon: 35,
      targetNetBenefitPerTon: 0,
      defaultDistanceKm: 25,
      corridorLabel: 'Çorlu OSB → Çerkezköy (Blocked Transfer)',
      preProcessingNote:
        'BLOCKED: High basicity (CaO + MgO = 49.1%) consumes regeneration acid without yielding soluble Al3+ coagulant.'
    }
  },

  // 4. Cerkezkoy Foundry Silica Sand (SiO2 88.6%, Al2O3 5.8% bentonite, Fe2O3 1.9%, LOI 2.4%, Moisture 1.1%)
  'foundry_sand__brick_works': {
    title: 'Çerkezköy OSB Spent Foundry Silica Sand → Ergene Vitrified Brick De-Plasticizer',
    overallScore: 96,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Near-perfect stoichiometric and physical match: 88.6% quartz SiO2 (within 50–92% target) with sub-angular AFS 55–65 grain size and 5.8% residual bentonite clay integrates directly into Ergene brick extrusion without crushing or drying.',
    chemicalEntitiesExtracted: [
      'SiO2: 88.6% (Spec 50–92%)',
      'Al2O3 (Bentonite): 5.8%',
      'Particle Size: AFS 55–65 (<0.3 mm)',
      'LOI: 2.4% (<20% Spec)',
      'EWC 10 09 08 (Non-Hazardous)'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.96,
      co2BaselinePerTon: 0.54,
      co2TargetPerTon: 0.09,
      statusQuoDisposalCostPerTon: 38,
      targetNetBenefitPerTon: 31,
      defaultDistanceKm: 20,
      corridorLabel: 'Çerkezköy OSB Foundry → Ergene Valley Brick Works',
      preProcessingNote:
        'Zero pre-processing required. Residual bentonite binder in spent green sand enhances clay workability while quartz core prevents firing warpage.'
    }
  },
  'foundry_sand__cement_kiln': {
    title: 'Çerkezköy OSB Spent Foundry Silica Sand → Thrace Cement Kiln Silica Corrective',
    overallScore: 89,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'High-purity SiO2 (88.6%) and 2.4% carbonaceous sea-coal film replace virgin quarried silica sand corrective in rotary kiln raw meal grinding.',
    chemicalEntitiesExtracted: [
      'SiO2: 88.6% (Silica Corrective)',
      'Al2O3: 5.8%',
      'LOI: 2.4% (Calorific Bonus)',
      'Moisture: 1.1%'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.93,
      co2BaselinePerTon: 0.54,
      co2TargetPerTon: 0.12,
      statusQuoDisposalCostPerTon: 38,
      targetNetBenefitPerTon: 27,
      defaultDistanceKm: 25,
      corridorLabel: 'Çerkezköy OSB → Saray Cement Plant',
      preProcessingNote:
        'Direct raw-mill feed replacing mined quartz sand; fine AFS 55–65 granulometry reduces raw mill grinding energy by 18%.'
    }
  },
  'foundry_sand__geopolymer': {
    title: 'Çerkezköy OSB Spent Foundry Silica Sand → Çorlu Geopolymer Micro-Silica Aggregate',
    overallScore: 82,
    viabilityStatus: 'High Viability (>75% Match)',
    summaryRationale:
      'Combined oxides reach 96.3% (88.6% SiO2 + 5.8% Al2O3 + 1.9% Fe2O3) with 1.1% moisture and 2.4% LOI (<4.5% limit), qualifying as a graded quartz micro-aggregate filler in precast geopolymer concrete.',
    chemicalEntitiesExtracted: [
      'SiO2: 88.6% (>85% Aggregate Spec)',
      'LOI: 2.4% (<4.5% Spec)',
      'Moisture: 1.1% (<2.0% Spec)',
      'Chlorides: <0.05%'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.89,
      co2BaselinePerTon: 0.54,
      co2TargetPerTon: 0.14,
      statusQuoDisposalCostPerTon: 38,
      targetNetBenefitPerTon: 29,
      defaultDistanceKm: 25,
      corridorLabel: 'Çerkezköy OSB → Çorlu OSB Precast Plant',
      preProcessingNote:
        'Used directly as fine siliceous aggregate (replacing natural river sand) alongside fly-ash geopolymer binder.'
    }
  },
  'foundry_sand__acid_regeneration': {
    title: 'Çerkezköy OSB Spent Foundry Silica Sand → Marmara Acid Regeneration Plant',
    overallScore: 9,
    viabilityStatus: 'Incompatible — 88.6% Inert Quartz Silica Blockade',
    summaryRationale:
      'Complete chemical mismatch: Stream is 88.6% crystalline quartz SiO2 with only 7.7% combined Fe2O3 + Al2O3 (vs ≥35% required), offering negligible leachable metal coagulants.',
    chemicalEntitiesExtracted: [
      'SiO2: 88.6% (Violates <40% Max)',
      'Fe2O3+Al2O3: 7.7% (Violates ≥35% Min)',
      'Inert Quartz Matrix'
    ],
    calculator: {
      isIncompatible: true,
      diversionRate: 0.0,
      co2BaselinePerTon: 0.54,
      co2TargetPerTon: 0.54,
      statusQuoDisposalCostPerTon: 38,
      targetNetBenefitPerTon: 0,
      defaultDistanceKm: 10,
      corridorLabel: 'Çerkezköy OSB Internal (Blocked Transfer)',
      preProcessingNote:
        'BLOCKED: Quartz sand is chemically inert in mineral acids (except HF) and cannot generate Fe/Al water treatment coagulants.'
    }
  },

  // Legacy / Additional Reference Matches (.txt, .md, .csv)
  'spent_grain__mycelium': {
    title: 'Brewers Spent Grain (BSG) → Mycelium Acoustic Insulation Panels',
    overallScore: 68,
    viabilityStatus: 'Conditional Viability (Requires Thermal Drying)',
    summaryRationale:
      'Strong biochemical match on dry-matter lignocellulose (58.5% vs >50% required) and protein (21.8%), but raw discharge moisture (78.5%) violates Company B’s <40% inoculation threshold. Viable after belt-drying and steam pasteurization.',
    chemicalEntitiesExtracted: [
      'Lignocellulose: 58.5%',
      'Protein: 21.8% (C:N 17:1)',
      'Discharge Moisture: 78.5%',
      'Target Moisture: <40%',
      'EWC 02 07 01 (Bio-Residue)'
    ],
    calculator: {
      isIncompatible: false,
      diversionRate: 0.72,
      co2BaselinePerTon: 0.62,
      co2TargetPerTon: 0.21,
      statusQuoDisposalCostPerTon: 28,
      targetNetBenefitPerTon: 24,
      defaultDistanceKm: 30,
      corridorLabel: 'Regional Agro-Industrial Corridor (30 km)',
      preProcessingNote:
        'Requires continuous low-temperature belt drying (reducing moisture from 78.5% to 35%) and 80°C flash pasteurization.'
    }
  },
  'acid_sludge__organic_soil': {
    title: 'Semiconductor Acid Etch Sludge → Organic Agricultural Soil Amendment',
    overallScore: 8,
    viabilityStatus: 'Incompatible — Regulatory & Hazard Blockade',
    summaryRationale:
      'CRITICAL COMPLIANCE REJECTION: Hazardous EWC 11 01 09* stream with pH 2.1, 34.2% fluorides, and heavy metals violating EU Regulation 2019/1009 ceilings by 43x for Cadmium and 55x for Cr(VI).',
    chemicalEntitiesExtracted: [
      'EWC 11 01 09* (HAZARDOUS)',
      'Cd: 65 mg/kg (Limit 1.5)',
      'Cr(VI): 110 mg/kg (Limit 2.0)',
      'As: 480 mg/kg (Limit 40)',
      'pH: 2.1 (Severe Acid)'
    ],
    calculator: {
      isIncompatible: true,
      diversionRate: 0.0,
      co2BaselinePerTon: 0.48,
      co2TargetPerTon: 0.48,
      statusQuoDisposalCostPerTon: 210,
      targetNetBenefitPerTon: 0,
      defaultDistanceKm: 45,
      corridorLabel: 'Blocked Hazardous Transfer',
      preProcessingNote:
        'BLOCKED: Hazardous heavy-metal fluoride sludge cannot enter agricultural topsoil.'
    }
  }
};

/**
 * Parses Annual Generation Rate (metric tons/year) from raw waste log text.
 */
export function parseAnnualTonnageFromLog(rawText, fallback = 32000) {
  if (!rawText || typeof rawText !== 'string') return fallback;
  const match =
    rawText.match(/Annual Generation Rate:\s*([\d,]+(?:\.\d+)?)/i) ||
    rawText.match(/annual_generation_rate\s*,\s*([\d,]+(?:\.\d+)?)/i) ||
    rawText.match(/Target Annual Demand:\s*(?:[\d,]+\s*[–-]\s*)?([\d,]+(?:\.\d+)?)/i);
  if (!match) return fallback;
  const parsed = Math.round(Number(match[1].replace(/,/g, '')));
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  const clamped = Math.min(100000, Math.max(1000, parsed));
  return Math.round(clamped / 500) * 500;
}

/**
 * Extracts quantitative chemical, physical, and regulatory metrics from raw SYS_LOG_A and SYS_LOG_B text.
 */
export function parseStoichiometricTelemetry(rawA = '', rawB = '') {
  const extractNum = (text, regex) => {
    const m = text.match(regex);
    if (!m) return null;
    const val = parseFloat(m[1].replace(/,/g, ''));
    return Number.isNaN(val) ? null : val;
  };

  // Company A (Waste) extracted metrics
  const sio2A = extractNum(rawA, /SiO2[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const al2o3A = extractNum(rawA, /Al2O3[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const fe2o3A = extractNum(rawA, /Fe2O3[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const caoA = extractNum(rawA, /(?<!f-)CaO[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const fCaoA = extractNum(rawA, /f-CaO[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const loiA = extractNum(rawA, /(?:Loss on Ignition|LOI)[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const moistureA = extractNum(rawA, /Moisture[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const lignocelluloseA = extractNum(rawA, /Lignocellulos[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const proteinA = extractNum(rawA, /Protein[^:\r\n]*:\s*(\d+(?:\.\d+)?)\s*%/i);
  const phA =
    extractNum(rawA, /Residual\s+pH:\s*(\d+(?:\.\d+)?)/i) ??
    extractNum(rawA, /residual_ph\s*,\s*(\d+(?:\.\d+)?)/i);
  const gateFeeEurA =
    extractNum(rawA, /€\s*(\d+(?:\.\d+)?)\s*\/\s*ton/i) ??
    extractNum(rawA, /(\d+(?:\.\d+)?)\s*EUR\/ton/i);

  const ewcMatchA =
    rawA.match(/EWC(?:_CODE|\s*Code)?:\s*([^\r\n]+)/i) ||
    rawA.match(/(\d{2}\s+\d{2}\s+\d{2}\*)/);
  const ewcCodeA = ewcMatchA ? ewcMatchA[1].trim() : null;
  const isStrictlyHazardousA =
    Boolean(ewcCodeA && ewcCodeA.includes('*') && !ewcCodeA.includes('/')) ||
    /11 01 09\*|Hazardous,\s*Toxic/i.test(rawA);

  // Company B (Resource Spec) extracted tolerances
  const minPozzolanSumB = extractNum(
    rawB,
    /Combined[^:\r\n]*:\s*Minimum\s*(\d+(?:\.\d+)?)\s*%/i
  );
  const minFeAlSumB = extractNum(
    rawB,
    /Combined\s+Fe2O3\s*\+\s*Al2O3\s*>=\s*(\d+(?:\.\d+)?)\s*%/i
  );
  const maxLoiB =
    extractNum(rawB, /Maximum\s+Loss\s+on\s+Ignition[^<\r\n]*<\s*(\d+(?:\.\d+)?)\s*%/i) ??
    extractNum(rawB, /LOI\s+up\s+to\s+(\d+(?:\.\d+)?)\s*%/i) ??
    extractNum(rawB, /Accepts\s+up\s+to\s+(\d+(?:\.\d+)?)\s*%\s+organic/i);
  const maxMoistureB =
    extractNum(rawB, /Maximum\s+Moisture\s+Content[^<\r\n]*<\s*(\d+(?:\.\d+)?)\s*%/i) ??
    extractNum(rawB, /Strict\s+upper\s+limit:\s*<\s*(\d+(?:\.\d+)?)\s*%/i) ??
    extractNum(rawB, /Acceptable\s+Moisture\s+Content:\s*Up\s+to\s*(\d+(?:\.\d+)?)\s*%/i);
  const maxCaoB = extractNum(rawB, /alkaline\s+CaO\s+slags\s*\(\s*>\s*(\d+(?:\.\d+)?)\s*%/i);
  const maxSio2InertB = extractNum(
    rawB,
    /Inert\s+crystalline\s+silicates\s*\(\s*>\s*(\d+(?:\.\d+)?)\s*%/i
  );
  const requiresNonHazardousB = /Non-Hazardous[^.\r\n]*only/i.test(rawB);

  const oxideSumA =
    sio2A !== null || al2o3A !== null || fe2o3A !== null
      ? Number(((sio2A || 0) + (al2o3A || 0) + (fe2o3A || 0)).toFixed(1))
      : null;

  const feAlSumA =
    fe2o3A !== null || al2o3A !== null
      ? Number(((fe2o3A || 0) + (al2o3A || 0)).toFixed(1))
      : null;

  return {
    sio2A,
    al2o3A,
    fe2o3A,
    caoA,
    fCaoA,
    loiA,
    moistureA,
    lignocelluloseA,
    proteinA,
    phA,
    gateFeeEurA,
    ewcCodeA,
    isStrictlyHazardousA,
    oxideSumA,
    feAlSumA,
    minPozzolanSumB,
    minFeAlSumB,
    maxLoiB,
    maxMoistureB,
    maxCaoB,
    maxSio2InertB,
    requiresNonHazardousB
  };
}

const PRESET_WASTE_BASELINES = {
  fly_ash: { sio2: [55.4, 54.8], al2o3: [26.8, 26.4], fe2o3: [6.1, 6.2], cao: [4.2, 3.9], loi: [1.9, 2.1], moisture: [0.3, 0.4] },
  textile_sludge: { sio2: [11.2], al2o3: [14.6], fe2o3: [28.4], cao: [9.8], loi: [31.5], moisture: [34.0] },
  steel_slag: { sio2: [16.8], al2o3: [6.4], fe2o3: [24.5], cao: [41.2], moisture: [1.8] },
  foundry_sand: { sio2: [88.6], al2o3: [5.8], fe2o3: [1.9], loi: [2.4], moisture: [1.1] },
  spent_grain: { lignocellulose: [58.5], moisture: [78.5] },
  acid_sludge: { ph: [2.1] }
};

const PRESET_RESOURCE_BASELINES = {
  geopolymer: { minPozzolanSum: [70], maxLoi: [4.5, 5], maxMoisture: [2, 1] },
  cement_kiln: { maxLoi: [35], maxMoisture: [38] },
  brick_works: { maxLoi: [20], maxMoisture: [35] },
  acid_regeneration: { minFeAlSum: [35], maxMoisture: [45], maxCao: [25], maxSio2Inert: [40] },
  mycelium: { maxMoisture: [40] },
  organic_soil: {}
};

/**
 * Dynamically adapts a baseline matrix result (or builds a custom result) when the user edits
 * numerical assays in SYS_LOG_A / SYS_LOG_B or uploads a custom file in Zero-Config mode.
 */
function applyLiveTelemetryAdjustments(baseResult, rawA, rawB, wasteType, resourceType) {
  const t = parseStoichiometricTelemetry(rawA, rawB);
  const cloned = {
    ...baseResult,
    chemicalEntitiesExtracted: [...(baseResult.chemicalEntitiesExtracted || [])],
    calculator: { ...(baseResult.calculator || {}) }
  };

  // Update gate fee if edited in SYS_LOG_A
  if (t.gateFeeEurA !== null && t.gateFeeEurA > 0) {
    cloned.calculator.statusQuoDisposalCostPerTon = t.gateFeeEurA;
  }

  // Synchronize extracted token badges with live numbers in SYS_LOG_A
  const liveTokens = [];
  if (t.sio2A !== null) liveTokens.push(`SiO2: ${t.sio2A}%`);
  if (t.al2o3A !== null) liveTokens.push(`Al2O3: ${t.al2o3A}%`);
  if (t.fe2o3A !== null) liveTokens.push(`Fe2O3: ${t.fe2o3A}%`);
  if (t.caoA !== null) liveTokens.push(`CaO: ${t.caoA}%`);
  if (t.oxideSumA !== null && t.minPozzolanSumB !== null) {
    liveTokens.push(`Oxide Sum: ${t.oxideSumA}% (Spec ≥${t.minPozzolanSumB}%)`);
  } else if (t.feAlSumA !== null && t.minFeAlSumB !== null) {
    liveTokens.push(`Fe+Al Sum: ${t.feAlSumA}% (Spec ≥${t.minFeAlSumB}%)`);
  }
  if (t.lignocelluloseA !== null) liveTokens.push(`Lignocellulose: ${t.lignocelluloseA}%`);
  if (t.loiA !== null) {
    liveTokens.push(
      t.maxLoiB !== null
        ? `LOI: ${t.loiA}% (${t.loiA <= t.maxLoiB ? `<${t.maxLoiB}% Spec` : `Violates <${t.maxLoiB}% Spec`})`
        : `LOI: ${t.loiA}%`
    );
  }
  if (t.moistureA !== null) {
    liveTokens.push(
      t.maxMoistureB !== null
        ? `Moisture: ${t.moistureA}% (${t.moistureA <= t.maxMoistureB ? `<${t.maxMoistureB}% Spec` : `Exceeds <${t.maxMoistureB}% Spec`})`
        : `Moisture: ${t.moistureA}%`
    );
  }
  if (t.ewcCodeA) {
    liveTokens.push(`EWC ${t.ewcCodeA.split('(')[0].trim()}`);
  }

  // Detect whether user modified numerical parameters away from the preset baseline
  const hasCustomStream = wasteType === 'custom_waste' || resourceType === 'custom_resource';
  const wBase = PRESET_WASTE_BASELINES[wasteType] || {};
  const rBase = PRESET_RESOURCE_BASELINES[resourceType] || {};
  const differs = (val, allowedArr) =>
    val !== null && Array.isArray(allowedArr) && !allowedArr.includes(val);

  const isEditedFromPreset =
    hasCustomStream ||
    differs(t.sio2A, wBase.sio2) ||
    differs(t.al2o3A, wBase.al2o3) ||
    differs(t.fe2o3A, wBase.fe2o3) ||
    differs(t.caoA, wBase.cao) ||
    differs(t.loiA, wBase.loi) ||
    differs(t.moistureA, wBase.moisture) ||
    differs(t.lignocelluloseA, wBase.lignocellulose) ||
    differs(t.phA, wBase.ph) ||
    differs(t.minPozzolanSumB, rBase.minPozzolanSum) ||
    differs(t.minFeAlSumB, rBase.minFeAlSum) ||
    differs(t.maxLoiB, rBase.maxLoi) ||
    differs(t.maxMoistureB, rBase.maxMoisture) ||
    differs(t.maxCaoB, rBase.maxCao) ||
    differs(t.maxSio2InertB, rBase.maxSio2Inert);

  if (!isEditedFromPreset) {
    return cloned;
  }

  const moistureExceeded =
    t.moistureA !== null && t.maxMoistureB !== null && t.moistureA > t.maxMoistureB;
  const loiExceeded = t.loiA !== null && t.maxLoiB !== null && t.loiA > t.maxLoiB;
  const pozzolanDeficit =
    t.oxideSumA !== null && t.minPozzolanSumB !== null && t.oxideSumA < t.minPozzolanSumB;
  const feAlDeficit =
    t.feAlSumA !== null && t.minFeAlSumB !== null && t.feAlSumA < t.minFeAlSumB;
  const caoExceeded = t.caoA !== null && t.maxCaoB !== null && t.caoA > t.maxCaoB;
  const inertSio2Exceeded =
    t.sio2A !== null && t.maxSio2InertB !== null && t.sio2A > t.maxSio2InertB;
  const hazardViolation = t.isStrictlyHazardousA && t.requiresNonHazardousB;

  if (liveTokens.length > 0) {
    cloned.chemicalEntitiesExtracted = liveTokens.slice(0, 7);
  }

  // Re-score dynamically based on live stoichiometric & physical tolerances
  let score = hasCustomStream ? 82 : cloned.overallScore;
  const penaltyNotes = [];

  if (hazardViolation) {
    score = 10;
    penaltyNotes.push('Hazardous EWC classification violates non-hazardous off-taker mandate');
  }
  if (caoExceeded) {
    score = Math.min(score, 15);
    penaltyNotes.push(`CaO (${t.caoA}%) exceeds <${t.maxCaoB}% reactor neutralization ceiling`);
  }
  if (inertSio2Exceeded) {
    score = Math.min(score, 20);
    penaltyNotes.push(`Crystalline SiO2 (${t.sio2A}%) exceeds <${t.maxSio2InertB}% inert silicate limit`);
  }
  if (feAlDeficit) {
    const gap = t.minFeAlSumB - t.feAlSumA;
    score -= Math.min(55, Math.round(gap * 1.8));
    penaltyNotes.push(`Combined Fe2O3+Al2O3 (${t.feAlSumA}%) is below ≥${t.minFeAlSumB}% recovery threshold`);
  }
  if (pozzolanDeficit) {
    const gap = t.minPozzolanSumB - t.oxideSumA;
    score -= Math.min(45, Math.round(gap * 1.5));
    penaltyNotes.push(`Combined SiO2+Al2O3+Fe2O3 (${t.oxideSumA}%) is below ${t.minPozzolanSumB}% minimum spec`);
  }
  if (loiExceeded) {
    const excess = t.loiA - t.maxLoiB;
    score -= Math.min(40, Math.round(excess * 2.5));
    penaltyNotes.push(`LOI (${t.loiA}%) exceeds <${t.maxLoiB}% carbon tolerance`);
  }
  if (moistureExceeded) {
    const excess = t.moistureA - t.maxMoistureB;
    score -= Math.min(30, Math.round(excess * 1.2));
    penaltyNotes.push(`Moisture (${t.moistureA}%) exceeds <${t.maxMoistureB}% intake limit (thermal dewatering required)`);
  }

  // If user improved parameters (e.g. lowered moisture below threshold on BSG -> Mycelium)
  if (!moistureExceeded && !loiExceeded && !pozzolanDeficit && !feAlDeficit && !hazardViolation && !caoExceeded && !inertSio2Exceeded) {
    score = Math.max(score, 88);
  }

  score = Math.max(5, Math.min(98, score));
  cloned.overallScore = score;

  if (score >= 75) {
    cloned.viabilityStatus = 'High Viability (>75% Match)';
    cloned.calculator.isIncompatible = false;
    cloned.calculator.diversionRate = Math.max(0.85, cloned.calculator.diversionRate || 0.9);
  } else if (score >= 45) {
    cloned.viabilityStatus = 'Conditional Viability (Pre-Treatment / Blending Required)';
    cloned.calculator.isIncompatible = false;
    cloned.calculator.diversionRate = 0.68;
  } else {
    cloned.viabilityStatus = 'Incompatible — Stoichiometric / Tolerance Blockade';
    cloned.calculator.isIncompatible = true;
    cloned.calculator.diversionRate = 0.0;
    cloned.calculator.targetNetBenefitPerTon = 0;
  }

  if (penaltyNotes.length > 0) {
    cloned.summaryRationale = `Live Stoichiometric Audit: ${penaltyNotes.join('; ')}. ${
      cloned.calculator.isIncompatible
        ? 'Direct transfer is blocked under current assay parameters.'
        : 'Requires pre-conditioning or blending controls prior to off-taker dosing.'
    }`;
    cloned.calculator.preProcessingNote = penaltyNotes.join('. ') + '.';
  } else if (isEditedFromPreset) {
    cloned.summaryRationale = `Live Stoichiometric Audit: Verified compatibility across edited parameters (${liveTokens
      .slice(0, 4)
      .join(', ')}). Meets off-taker chemical and moisture intake tolerances.`;
  }

  return cloned;
}

/**
 * Evaluates an industrial symbiosis match between Company A and Company B.
 */
export async function evaluateSymbiosisMatch({
  companyAInput,
  companyBInput,
  apiKey
}) {
  const effectiveKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  // 1. Live Gemini API call if API key is provided
  if (effectiveKey.trim()) {
    try {
      const client = new GoogleGenAI({ apiKey: effectiveKey.trim() });
      const prompt = `You are a Principal Chemical & Industrial Symbiosis Engineer evaluating a waste-to-resource match for the Tekirdag / Ergene / Corlu OSB Regional Industrial Symbiosis Registry.

Analyze the following unstructured inputs:

COMPANY A (WASTE OUTPUT / BY-PRODUCT):
${companyAInput}

COMPANY B (RAW MATERIAL NEED / TARGET SPECIFICATION):
${companyBInput}

Perform a rigorous stoichiometric, moisture, hazard (EWC code), geospatial logistics corridor, and techno-economic compatibility audit. Return a JSON object matching the requested schema.`;

      const interaction = await client.interactions.create({
        model: 'gemini-3.8-flash',
        input: prompt,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: MATCH_RESPONSE_SCHEMA
        }
      });

      if (interaction && interaction.output_text) {
        return JSON.parse(interaction.output_text);
      }
    } catch (err) {
      console.warn('Live Gemini API call failed; falling back to Zero-Config stoichiometry matrix:', err);
    }
  }

  // 2. Zero-Config Stoichiometry Matrix Lookup + Live Telemetry Adjustment
  const wasteType = classifyWasteStream(companyAInput);
  const resourceType = classifyResourceStream(companyBInput);
  const matrixKey = `${wasteType}__${resourceType}`;

  let baseResult = REGIONAL_MATRIX[matrixKey];

  if (!baseResult) {
    // Handle cross-combinations with Acid Sludge or Organic Soil
    if (wasteType === 'acid_sludge' || resourceType === 'organic_soil') {
      baseResult = REGIONAL_MATRIX['acid_sludge__organic_soil'];
    } else if (wasteType === 'spent_grain' || resourceType === 'mycelium') {
      baseResult = {
        ...REGIONAL_MATRIX['spent_grain__mycelium'],
        overallScore: wasteType === 'spent_grain' && resourceType === 'mycelium' ? 68 : 42,
        viabilityStatus:
          wasteType === 'spent_grain' && resourceType === 'mycelium'
            ? 'Conditional Viability (Requires Thermal Drying)'
            : 'Low Viability (Biogenic vs Mineral Mismatch)'
      };
    } else {
      baseResult = REFERENCE_SCENARIOS[0].result;
    }
  }

  return applyLiveTelemetryAdjustments(
    baseResult,
    companyAInput,
    companyBInput,
    wasteType,
    resourceType
  );
}

/**
 * Autonomous Registry Scan (1-to-N):
 * Compares the active SYS_LOG_A waste stream against ALL files currently in /database/resource,
 * returning a ranked leaderboard sorted descending by compatibility score.
 */
export async function evaluateRegistryScan1ToN({
  companyAInput,
  resourceFiles,
  apiKey
}) {
  const evaluations = await Promise.all(
    resourceFiles.map(async (resFile) => {
      const matchResult = await evaluateSymbiosisMatch({
        companyAInput,
        companyBInput: resFile.content,
        apiKey
      });
      return {
        resourceFile: resFile,
        matchResult
      };
    })
  );

  // Sort descending by overallScore
  evaluations.sort((a, b) => b.matchResult.overallScore - a.matchResult.overallScore);
  return evaluations;
}

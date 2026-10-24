import React, { useEffect, useState } from 'react';
import {
  Scale,
  Leaf,
  Coins,
  Sliders,
  TrendingUp,
  AlertOctagon,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Cpu,
  Tag,
  Truck,
  TrainFront,
  MapPin,
  Route,
  FileCheck2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { TRANSPORT_MODES } from '../services/geminiService';
import CircularManifestModal from './CircularManifestModal';

export default function ImpactCalculator({
  matchData,
  companyAInput,
  companyBInput,
  annualTonnage,
  setAnnualTonnage
}) {
  const [logisticsDistanceKm, setLogisticsDistanceKm] = useState(
    matchData?.calculator?.defaultDistanceKm || 35
  );
  const [transportMode, setTransportMode] = useState('truck');
  const [isManifestModalOpen, setIsManifestModalOpen] = useState(false);

  // Sync default corridor distance when a new match is evaluated
  useEffect(() => {
    if (matchData?.calculator?.defaultDistanceKm) {
      setLogisticsDistanceKm(matchData.calculator.defaultDistanceKm);
    }
  }, [matchData]);

  if (!matchData) return null;

  const {
    title,
    overallScore,
    viabilityStatus,
    summaryRationale,
    chemicalEntitiesExtracted = [],
    calculator
  } = matchData;

  const {
    isIncompatible,
    diversionRate,
    co2BaselinePerTon,
    co2TargetPerTon,
    statusQuoDisposalCostPerTon,
    targetNetBenefitPerTon,
    corridorLabel = 'Regional Tekirdağ / Ergene / Çorlu OSB Corridor',
    preProcessingNote
  } = calculator;

  const activeTransport = TRANSPORT_MODES[transportMode] || TRANSPORT_MODES.truck;

  // 1. Mass Balance & Landfill Diversion
  const statusQuoLandfillTons = annualTonnage;
  const divertedTons = Math.round(annualTonnage * diversionRate);
  const residualLandfillTons = annualTonnage - divertedTons;

  // 2. Net-Zero Math Refinement (Gross Process Abatement vs. Transport Scope 3 Penalty = Net Verified CO2e Abatement)
  const statusQuoEmissions = Math.round(annualTonnage * co2BaselinePerTon);
  const processTargetEmissions = Math.round(annualTonnage * co2TargetPerTon);
  const grossProcessAbatement = isIncompatible
    ? 0
    : Math.max(0, statusQuoEmissions - processTargetEmissions);

  // Transport Scope 3 Penalty: (tonnage * km * kg_CO2e_per_ton_km) / 1000 -> metric tons CO2e
  const transportPenaltyPerTon = (logisticsDistanceKm * activeTransport.co2KgPerTonKm) / 1000;
  const transportCo2PenaltyTons = isIncompatible
    ? 0
    : Math.round(annualTonnage * transportPenaltyPerTon);

  const netVerifiedCo2Abatement = isIncompatible
    ? 0
    : Math.max(0, grossProcessAbatement - transportCo2PenaltyTons);

  const totalTargetEmissionsWithTransport = isIncompatible
    ? statusQuoEmissions
    : processTargetEmissions + transportCo2PenaltyTons;

  // 3. Financial Value Unlocked & Break-Even Symbiosis Radius (km)
  const statusQuoCost = Math.round(annualTonnage * statusQuoDisposalCostPerTon);
  const grossTargetSavingsOrRevenue = Math.round(annualTonnage * targetNetBenefitPerTon);
  const grossFinancialValueUnlocked = isIncompatible
    ? 0
    : statusQuoCost + grossTargetSavingsOrRevenue;

  // Freight Cost Penalty: tonnage * km * EUR_per_ton_km
  const unitFreightCostPerTon = logisticsDistanceKm * activeTransport.costEurPerTonKm;
  const totalFreightCost = isIncompatible
    ? 0
    : Math.round(annualTonnage * unitFreightCostPerTon);

  const netFinancialUnlocked = isIncompatible
    ? 0
    : grossFinancialValueUnlocked - totalFreightCost;

  // Break-Even Symbiosis Radius (km):
  // Maximum distance (in km) this waste stream can travel before transport costs exceed landfill gate fee savings
  const breakEvenGateFeeRadiusKm = isIncompatible
    ? 0
    : Math.floor(statusQuoDisposalCostPerTon / activeTransport.costEurPerTonKm);

  // Full Value Break-Even Radius (including secondary feedstock margin)
  const breakEvenTotalValueRadiusKm = isIncompatible
    ? 0
    : Math.floor(
        (statusQuoDisposalCostPerTon + targetNetBenefitPerTon) /
          activeTransport.costEurPerTonKm
      );

  const isExceedingGateFeeRadius =
    !isIncompatible && logisticsDistanceKm > breakEvenGateFeeRadiusKm;

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);
  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);

  // Chart data scaled to comparable magnitudes (kt, ktCO2e, €100k) so all 3 bar pairs share the Y-axis cleanly
  const targetNetOperatingEur = isIncompatible
    ? -statusQuoCost
    : grossTargetSavingsOrRevenue - totalFreightCost;

  const chartData = [
    {
      metric: 'Landfill Volume (kt)',
      unitType: 'mass',
      'Status Quo (Linear)': Number((statusQuoLandfillTons / 1000).toFixed(2)),
      'Target State (Symbiosis)': Number((residualLandfillTons / 1000).toFixed(2)),
      rawLinear: `${formatNumber(statusQuoLandfillTons)} t/yr`,
      rawSymbiosis: `${formatNumber(residualLandfillTons)} t/yr`
    },
    {
      metric: 'Carbon Footprint (ktCO2e)',
      unitType: 'co2',
      'Status Quo (Linear)': Number((statusQuoEmissions / 1000).toFixed(2)),
      'Target State (Symbiosis)': Number((totalTargetEmissionsWithTransport / 1000).toFixed(2)),
      rawLinear: `${formatNumber(statusQuoEmissions)} tCO2e/yr`,
      rawSymbiosis: `${formatNumber(totalTargetEmissionsWithTransport)} tCO2e/yr`
    },
    {
      metric: 'Annual Econ Value (€100k)',
      unitType: 'eur',
      'Status Quo (Linear)': Number((-statusQuoCost / 100000).toFixed(2)),
      'Target State (Symbiosis)': Number((targetNetOperatingEur / 100000).toFixed(2)),
      rawLinear: `${formatCurrency(-statusQuoCost)}/yr`,
      rawSymbiosis: `${formatCurrency(targetNetOperatingEur)}/yr`
    }
  ];

  // Distinct vibrant accent styling for the NLP Symbiosis Match Score
  const getMatchScoreVisuals = () => {
    if (overallScore >= 75) {
      return {
        statusBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        scoreCard: 'bg-accent-600 text-white border-accent-700 shadow-md',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-300" />
      };
    }
    if (overallScore >= 50) {
      return {
        statusBadge: 'bg-amber-50 text-amber-800 border-amber-200',
        scoreCard: 'bg-accent-600 text-white border-accent-700 shadow-md',
        icon: <AlertTriangle className="w-5 h-5 text-amber-300" />
      };
    }
    return {
      statusBadge: 'bg-rose-50 text-rose-800 border-rose-200',
      scoreCard: 'bg-rose-700 text-white border-rose-800 shadow-md',
      icon: <XCircle className="w-5 h-5 text-rose-200" />
    };
  };

  const scoreVisuals = getMatchScoreVisuals();

  return (
    <section className="space-y-6 mb-10">
      {/* TOP TELEMETRY PANEL: NLP Symbiosis Match Score (0-100%), Extracted Tokens & Circular 10-K Manifest Action */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 mb-4 border-b border-slate-200">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-navy-900 text-slate-100">
                <Cpu className="w-3.5 h-3.5 text-accent-400" />
                STOICHIOMETRIC MATCH TELEMETRY
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${scoreVisuals.statusBadge}`}>
                {viabilityStatus}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {summaryRationale}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
            {/* Vibrant Accent Card for NLP Symbiosis Match Score (0-100%) */}
            <div className={`flex flex-col justify-between p-4 rounded-xl border min-w-[240px] ${scoreVisuals.scoreCard}`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-90">
                  NLP Symbiosis Match Score
                </span>
                {scoreVisuals.icon}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight">
                  {overallScore}%
                </span>
                <span className="text-xs font-mono opacity-85">
                  / 100% CONFIDENCE
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/25 rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>

            {/* Primary Enterprise Action Button: Generate TSRS / CSRD Circular 10-K Manifest */}
            <button
              type="button"
              onClick={() => setIsManifestModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white font-mono font-semibold text-xs uppercase tracking-wider shadow-sm border border-navy-700 transition-all"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Generate TSRS / CSRD Circular 10-K Manifest</span>
            </button>
          </div>
        </div>

        {/* Extracted NLP Tokens Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mr-1">
            <Tag className="w-3.5 h-3.5 text-accent-600" />
            Extracted NLP Tokens:
          </span>
          {chemicalEntitiesExtracted.map((token, idx) => (
            <span
              key={idx}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-300"
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      {/* QUANTITATIVE IMPACT & GEOSPATIAL LOGISTICS CALCULATOR PANEL */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
        {/* Section Title */}
        <div className="pb-5 mb-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-accent-700 bg-accent-50 px-2.5 py-1 rounded border border-accent-200 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-accent-600" />
              Geospatial Logistics &amp; Net-Zero Valuation Simulator
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Status Quo vs. Target State Quantitative Impact Calculator
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Model annual throughput volume, inter-facility transport distance, and freight mode to verify Net Scope 1+3 CO2e Abatement and Break-Even Symbiosis Radius.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 self-start lg:self-center">
            <MapPin className="w-3.5 h-3.5 text-accent-600 flex-shrink-0" />
            <span>CORRIDOR: {corridorLabel}</span>
          </div>
        </div>

        {/* DUAL TELEMETRY CONTROL BAR: 1. Annual By-Product Tonnage + 2. Inter-Facility Logistics Distance & Transport Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Control 1: Annual By-Product Tonnage Slider */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="tonnage-slider"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700"
                >
                  1. Annual By-Product Tonnage
                </label>
                <span className="text-base sm:text-lg font-mono font-extrabold text-accent-700 bg-accent-50 px-2.5 py-0.5 rounded border border-accent-200">
                  {formatNumber(annualTonnage)} <span className="text-xs font-semibold">t/yr</span>
                </span>
              </div>
              <input
                id="tonnage-slider"
                type="range"
                min={1000}
                max={100000}
                step={500}
                value={annualTonnage}
                onChange={(e) => setAnnualTonnage(Number(e.target.value))}
                className="w-full symbiosis-slider bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
                <span>1,000 t/yr (Pilot)</span>
                <span>50,000 t/yr (OSB Scale)</span>
                <span>100,000 t/yr (Regional)</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] font-mono text-slate-600">
              <span>VALORIZED MASS STREAM:</span>
              <span className="font-bold text-slate-900">
                {formatNumber(divertedTons)} t/yr ({Math.round(diversionRate * 100)}% Diversion)
              </span>
            </div>
          </div>

          {/* Control 2: Geospatial Logistics Telemetry Bar (Distance Slider + Transport Mode Toggle) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label
                  htmlFor="distance-slider"
                  className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                >
                  <Route className="w-3.5 h-3.5 text-accent-600" />
                  <span>2. Inter-Facility Logistics Distance (km)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-mono font-extrabold text-navy-900 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                    {logisticsDistanceKm} <span className="text-xs font-semibold">km</span>
                  </span>
                </div>
              </div>

              <input
                id="distance-slider"
                type="range"
                min={5}
                max={500}
                step={5}
                value={logisticsDistanceKm}
                onChange={(e) => setLogisticsDistanceKm(Number(e.target.value))}
                className="w-full symbiosis-slider bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-1.5">
                <span>5 km (Intra-OSB Pipeline/Haul)</span>
                <span>250 km (Inter-City)</span>
                <span>500 km (Regional Corridor)</span>
              </div>
            </div>

            {/* Transport Mode Toggle (Euro 6 Heavy Truck vs. Electric Freight Rail) */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-semibold text-slate-600">
                TRANSPORT MODE:
              </span>
              <div className="inline-grid grid-cols-2 gap-1.5 bg-slate-200/80 p-1 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setTransportMode('truck')}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition ${
                    transportMode === 'truck'
                      ? 'bg-navy-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Euro 6 Heavy Truck</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('rail')}
                  className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition ${
                    transportMode === 'rail'
                      ? 'bg-navy-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                >
                  <TrainFront className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Electric Freight Rail</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Banner if Incompatible */}
        {isIncompatible && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-950">
            <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm">
              <strong className="font-bold block text-rose-900 font-mono uppercase">
                COMPLIANCE HARD-STOP // STOICHIOMETRIC &amp; EWC HAZARD BLOCKADE
              </strong>
              Stoichiometric or regulatory constraints prohibit transfer between these facilities. <strong>0% diversion</strong> is permitted; metrics remain locked at Status Quo disposal baselines.
            </div>
          </div>
        )}

        {/* 3 Quantitative Comparison Cards (Refined with Scope 3 Transport Penalty & Break-Even Radius) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Card 1: Landfill Diversion & Break-Even Symbiosis Radius */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span>01 // Landfill Diversion</span>
                <Scale className="w-4 h-4 text-navy-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
                {formatNumber(divertedTons)} <span className="text-sm font-sans font-semibold text-slate-500">t / yr</span>
              </div>
              <div className="text-xs font-semibold text-accent-700 mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{Math.round(diversionRate * 100)}% Mass Valorization Rate</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Status Quo Landfill</span>
                  <strong className="text-slate-900 font-mono font-bold">{formatNumber(statusQuoLandfillTons)} t</strong>
                </div>
                <div className="bg-navy-50/70 p-2 rounded-lg border border-navy-200">
                  <span className="text-navy-800 block text-[11px]">Target Residual</span>
                  <strong className="text-navy-950 font-mono font-bold">{formatNumber(residualLandfillTons)} t</strong>
                </div>
              </div>

              {/* Break-Even Symbiosis Radius Callout */}
              <div
                className={`p-2.5 rounded-lg border font-mono ${
                  isIncompatible
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : isExceedingGateFeeRadius
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold uppercase">Break-Even Radius (Gate Fee):</span>
                  <span className="font-extrabold text-sm">{breakEvenGateFeeRadiusKm} km</span>
                </div>
                <div className="flex items-center justify-between text-[10px] opacity-85 mt-0.5">
                  <span>Full Symbiosis Max Radius:</span>
                  <span className="font-semibold">{breakEvenTotalValueRadiusKm} km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Net Verified CO2e Abatement (Gross Process - Transport Penalty) */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span>02 // Net Verified CO2e Abatement</span>
                <Leaf className="w-4 h-4 text-accent-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900">
                {formatNumber(netVerifiedCo2Abatement)}{' '}
                <span className="text-sm font-sans font-semibold text-slate-500">tCO2e / yr</span>
              </div>
              <div className="text-xs font-semibold text-accent-700 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {statusQuoEmissions > 0
                    ? `${Math.round((netVerifiedCo2Abatement / statusQuoEmissions) * 100)}% Net Scope 1+3 Abatement`
                    : '0% Abatement'}
                </span>
              </div>
            </div>

            {/* Gross Process Abatement vs Transport Emissions Penalty Equation Breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 font-sans">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Gross Process Abatement</span>
                  <strong className="text-emerald-700 font-mono font-bold">
                    +{formatNumber(grossProcessAbatement)} tCO2e
                  </strong>
                </div>
                <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-200">
                  <span className="text-rose-800 block text-[11px]">Transport Scope 3 Penalty</span>
                  <strong className="text-rose-700 font-mono font-bold">
                    -{formatNumber(transportCo2PenaltyTons)} tCO2e
                  </strong>
                </div>
              </div>

              <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {activeTransport.shortLabel} ({activeTransport.co2KgPerTonKm} kg/t-km):
                </span>
                <span className="font-bold text-slate-900">
                  {formatNumber(grossProcessAbatement)} - {formatNumber(transportCo2PenaltyTons)} ={' '}
                  <span className="text-accent-700">{formatNumber(netVerifiedCo2Abatement)} t</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Net Financial Value Unlocked (Gross Value - Freight Cost) */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-2">
                <span>03 // Net Financial Value Unlocked</span>
                <Coins className="w-4 h-4 text-navy-700" />
              </div>
              <div
                className={`text-2xl sm:text-3xl font-mono font-extrabold ${
                  netFinancialUnlocked < 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {formatCurrency(netFinancialUnlocked)}{' '}
                <span className="text-sm font-sans font-semibold text-slate-500">/ yr</span>
              </div>
              <div className="text-xs font-semibold text-slate-600 mt-1">
                Avoided Gate Fees + Feedstock Margin - Freight Cost
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Gross Symbiosis Value</span>
                  <strong className="text-emerald-800 font-mono font-bold">
                    +{formatCurrency(grossFinancialValueUnlocked)}
                  </strong>
                </div>
                <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-200">
                  <span className="text-rose-800 block text-[11px]">
                    Logistics Freight ({logisticsDistanceKm} km)
                  </span>
                  <strong className="text-rose-700 font-mono font-bold">
                    -{formatCurrency(totalFreightCost)}
                  </strong>
                </div>
              </div>

              <div className="bg-white px-2.5 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">
                  FREIGHT RATE (€{activeTransport.costEurPerTonKm.toFixed(2)}/t-km):
                </span>
                <span className="font-bold text-slate-900">
                  -€{unitFreightCostPerTon.toFixed(2)}/t vs €{statusQuoDisposalCostPerTon}/t Gate Fee
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Bar Chart Visualization + Stoichiometry & Logistics Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200">
          <div className="lg:col-span-8 h-72 w-full">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-2">
              Telemetry Comparison: Status Quo (Linear) vs. Target State (Net of {logisticsDistanceKm} km {activeTransport.shortLabel})
            </div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
                <XAxis dataKey="metric" tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} />
                <ReferenceLine y={0} stroke="#64748B" strokeWidth={1.5} strokeDasharray="3 3" />
                <Tooltip
                  formatter={(value, name, props) => {
                    const payload = props?.payload;
                    if (!payload) return [value, name];
                    const isLinear = name === 'Status Quo (Linear)';
                    const exactStr = isLinear ? payload.rawLinear : payload.rawSymbiosis;
                    return [`${exactStr} (${value})`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderRadius: '0.5rem',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '6px' }} />
                <Bar dataKey="Status Quo (Linear)" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target State (Symbiosis)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between h-full">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                PROCESS &amp; GEOSPATIAL AUDIT
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2.5 mb-1.5">
                Pre-Treatment &amp; Corridor Economics
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {preProcessingNote}
              </p>
            </div>
            <div className="space-y-2 pt-3 border-t border-slate-200 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">GROSS_ABATEMENT_FACTOR:</span>
                <span className="font-semibold text-slate-900">
                  {isIncompatible ? '0.000' : (co2BaselinePerTon - co2TargetPerTon).toFixed(3)} tCO2e/t
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TRANSPORT_PENALTY_FACTOR:</span>
                <span className="font-semibold text-rose-700">
                  -{isIncompatible ? '0.000' : transportPenaltyPerTon.toFixed(3)} tCO2e/t
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">BREAK_EVEN_GATE_RADIUS:</span>
                <span
                  className={`font-bold ${
                    isExceedingGateFeeRadius ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {breakEvenGateFeeRadiusKm} km ({isExceedingGateFeeRadius ? 'EXCEEDED' : 'OPTIMAL'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TSRS / EU CSRD / UNGC Circular 10-K Audit Certificate Modal */}
      <CircularManifestModal
        isOpen={isManifestModalOpen}
        onClose={() => setIsManifestModalOpen(false)}
        matchData={matchData}
        companyAInput={companyAInput}
        companyBInput={companyBInput}
        annualTonnage={annualTonnage}
        logisticsDistanceKm={logisticsDistanceKm}
        activeTransport={activeTransport}
        metrics={{
          divertedTons,
          residualLandfillTons,
          statusQuoEmissions,
          grossProcessAbatement,
          transportCo2PenaltyTons,
          netVerifiedCo2Abatement,
          statusQuoCost,
          grossFinancialValueUnlocked,
          totalFreightCost,
          netFinancialUnlocked,
          breakEvenGateFeeRadiusKm,
          breakEvenTotalValueRadiusKm
        }}
      />
    </section>
  );
}

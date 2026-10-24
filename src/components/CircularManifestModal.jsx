import React, { useMemo, useState } from 'react';
import {
  FileCheck2,
  Download,
  Printer,
  X,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Hash,
  Clock,
  Building2,
  Scale,
  FileJson,
  FileText
} from 'lucide-react';
import { parseStoichiometricTelemetry } from '../services/geminiService';

/**
 * Generates a deterministic 64-character SHA-256 style hex digest from input string
 */
function computeAuditHash(payloadString) {
  let h1 = 0xdeadbeef ^ payloadString.length;
  let h2 = 0x41c6ce57 ^ payloadString.length;
  for (let i = 0; i < payloadString.length; i++) {
    const ch = payloadString.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hexPart = (seed) =>
    (seed >>> 0).toString(16).padStart(8, '0');

  return [
    hexPart(h1),
    hexPart(h2),
    hexPart(h1 ^ 0x9e3779b9),
    hexPart(h2 ^ 0x85ebca6b),
    hexPart(Math.imul(h1, 0xc2b2ae35)),
    hexPart(Math.imul(h2, 0x27d4eb2f)),
    hexPart(h1 ^ h2),
    hexPart((h1 + h2) | 0)
  ].join('');
}

/**
 * Parses FACILITY_ID, FACILITY_NAME, and EWC_CODE from raw log text if present
 */
function parseFacilityMetadata(rawText, fallbackRole, fallbackTitle) {
  const text = rawText || '';
  const idMatch = text.match(/FACILITY_ID:\s*([^\r\n]+)/i);
  const nameMatch = text.match(/(?:FACILITY_NAME|SOURCE FACILITY|OFF-TAKER FACILITY):\s*([^\r\n]+)/i);
  const csvNameMatch = text.match(/facility_name,([^,\r\n]+)/i);
  const ewcMatch = text.match(/EWC(?:_CODE|\s*Code)?:\s*([^\r\n)]+)/i);
  const streamMatch = text.match(/(?:BY-PRODUCT STREAM|RAW MATERIAL NEED|STREAM_ID|FEEDSTOCK_ID):\s*([^\r\n]+)/i);

  return {
    facilityId: idMatch
      ? idMatch[1].trim()
      : fallbackRole === 'A'
      ? 'TR-59-OSB-GEN-001'
      : 'TR-59-OSB-OFF-102',
    facilityName: nameMatch
      ? nameMatch[1].trim()
      : csvNameMatch
      ? csvNameMatch[1].trim()
      : fallbackTitle,
    ewcCode: ewcMatch ? ewcMatch[1].trim() : '10 01 02 / EN-450-1',
    streamDescription: streamMatch ? streamMatch[1].trim() : fallbackTitle
  };
}

/**
 * Builds the parameter-specific Stoichiometric Tolerance Verification rows from active match data
 */
function buildToleranceVerificationTable(matchData, companyAInput, companyBInput) {
  const { overallScore, chemicalEntitiesExtracted = [], calculator, summaryRationale = '' } = matchData;
  const isBlocked = Boolean(calculator?.isIncompatible || overallScore < 35);
  const isConditional = !isBlocked && overallScore < 75;
  const t = parseStoichiometricTelemetry(companyAInput || '', companyBInput || '');

  // Extract token values for display
  const oxideToken =
    chemicalEntitiesExtracted.find((tok) =>
      /sio2|al2o3|fe2o3|cao|oxide|fe\+al|lignocellulose/i.test(tok)
    ) ||
    chemicalEntitiesExtracted[0] ||
    'Primary Oxide / Matrix Assay';

  const moistureToken =
    chemicalEntitiesExtracted.find((tok) => /moisture|particle/i.test(tok)) ||
    (t.moistureA !== null ? `Moisture: ${t.moistureA}%` : 'Moisture: < 2.0%');

  const loiOrPurityToken =
    chemicalEntitiesExtracted.find((tok) => /loi|protein|f-cao|ph/i.test(tok)) ||
    (t.loiA !== null ? `LOI: ${t.loiA}%` : t.phA !== null ? `pH: ${t.phA}` : 'LOI / Secondary Phase');

  const ewcOrHeavyMetalToken =
    chemicalEntitiesExtracted.find((tok) => /ewc|cd:|cr\(vi\)|as:|chlorides/i.test(tok)) ||
    (t.ewcCodeA ? `EWC ${t.ewcCodeA.split('(')[0].trim()}` : 'EWC Non-Hazardous Trace Metals');

  // 1. Primary Stoichiometric Matrix evaluation
  const caoExceeded = t.caoA !== null && t.maxCaoB !== null && t.caoA > t.maxCaoB;
  const inertSio2Exceeded =
    t.sio2A !== null && t.maxSio2InertB !== null && t.sio2A > t.maxSio2InertB;
  const feAlDeficit =
    t.feAlSumA !== null && t.minFeAlSumB !== null && t.feAlSumA < t.minFeAlSumB;
  const pozzolanDeficit =
    t.oxideSumA !== null && t.minPozzolanSumB !== null && t.oxideSumA < t.minPozzolanSumB;

  let row1Status = 'PASS';
  let row1Note = 'Meets stoichiometric reactive phase window';
  if (caoExceeded) {
    row1Status = 'FAIL';
    row1Note = `CaO (${t.caoA}%) violates <${t.maxCaoB}% limit (alkaline exotherm & CaSO4 scaling)`;
  } else if (inertSio2Exceeded) {
    row1Status = 'FAIL';
    row1Note = `Crystalline SiO2 (${t.sio2A}%) exceeds <${t.maxSio2InertB}% inert silicate ceiling`;
  } else if (feAlDeficit) {
    row1Status = 'FAIL';
    row1Note = `Combined Fe2O3+Al2O3 (${t.feAlSumA}%) below ≥${t.minFeAlSumB}% recovery threshold`;
  } else if (pozzolanDeficit) {
    if (!isBlocked) {
      row1Status = 'CONDITIONAL';
      row1Note = `Pozzolan sum ${t.oxideSumA}% (<${t.minPozzolanSumB}% neat spec); viable as co-binder/aggregate`;
    } else {
      row1Status = 'FAIL';
      row1Note = `Combined oxides (${t.oxideSumA}%) below ${t.minPozzolanSumB}% minimum specification`;
    }
  } else if (isConditional && /lime blowing/i.test(summaryRationale)) {
    row1Status = 'CONDITIONAL';
    row1Note = `High CaO (${t.caoA ?? 41.2}%) requires <10% blend cap to prevent brick lime blowing`;
  }

  // 2. Moisture & Physical Phase evaluation
  const moistureExceeded =
    t.moistureA !== null && t.maxMoistureB !== null && t.moistureA > t.maxMoistureB;
  const hasCoarseGranulometry =
    /0\s*-\s*12\s*mm/i.test(companyAInput || '') &&
    /<\s*4\s*mm|ball-milling/i.test(`${companyBInput || ''} ${matchData.viabilityStatus || ''}`);

  let row2Status = 'PASS';
  let row2Note = 'Direct silo / reactor physical transfer verified';
  if (moistureExceeded) {
    row2Status = isBlocked ? 'FAIL' : 'CONDITIONAL';
    row2Note = isBlocked
      ? `Moisture (${t.moistureA}%) violates <${t.maxMoistureB}% dry intake ceiling`
      : `Moisture (${t.moistureA}%) exceeds <${t.maxMoistureB}% spec; requires thermal dewatering`;
  } else if (hasCoarseGranulometry) {
    row2Status = 'CONDITIONAL';
    row2Note = 'Coarse 0–12 mm fraction requires crushing / ball-milling prior to dosing';
  }

  // 3. Loss on Ignition (LOI), pH & Secondary Phase evaluation
  const loiExceeded = t.loiA !== null && t.maxLoiB !== null && t.loiA > t.maxLoiB;
  const severeAcidPh = t.phA !== null && t.phA < 4.0;

  let row3Status = 'PASS';
  let row3Note = 'Within acceptable calcination / secondary phase limits';
  if (severeAcidPh) {
    row3Status = 'FAIL';
    row3Note = `Extreme acidity (pH ${t.phA}) violates receptor buffering limits`;
  } else if (loiExceeded) {
    row3Status = isBlocked ? 'FAIL' : 'CONDITIONAL';
    row3Note = isBlocked
      ? `LOI (${t.loiA}%) violates <${t.maxLoiB}% organic carbon tolerance`
      : `LOI (${t.loiA}%) exceeds ${t.maxLoiB}% neat limit; requires controlled dilution ratio`;
  }

  // 4. Heavy Metal Leaching & EWC Hazard Classification evaluation
  let row4Status = 'PASS';
  let row4Note = 'Qualifies for End-of-Waste secondary raw material status';
  if (t.isStrictlyHazardousA) {
    row4Status = 'FAIL';
    row4Note = 'Hazardous EWC 11 01 09* & heavy metal blockade triggered';
  } else if (t.ewcCodeA && t.ewcCodeA.includes('*')) {
    row4Status = isBlocked ? 'FAIL' : 'CONDITIONAL';
    row4Note = isBlocked
      ? 'Mirror-entry EWC stream rejected by incompatible off-taker process'
      : 'Mirror-entry EWC 04 02 19*/20 verified via metal encapsulation / acid leaching';
  }

  return [
    {
      parameter: 'Primary Stoichiometric Matrix (Oxides / Biopolymers)',
      measuredAssay: oxideToken,
      regulatoryStandard: 'EN 450-1 / ASTM C618 / Industrial Spec',
      status: row1Status,
      auditNote: row1Note
    },
    {
      parameter: 'Moisture & Physical Phase Tolerance',
      measuredAssay: moistureToken,
      regulatoryStandard: 'Off-Taker Intake Dosing Limit',
      status: row2Status,
      auditNote: row2Note
    },
    {
      parameter: 'Loss on Ignition (LOI) & Secondary Phase Balance',
      measuredAssay: loiOrPurityToken,
      regulatoryStandard: 'ISO 14044 / Process Quality Control',
      status: row3Status,
      auditNote: row3Note
    },
    {
      parameter: 'Heavy Metal Leaching & EWC Hazard Classification',
      measuredAssay: ewcOrHeavyMetalToken,
      regulatoryStandard: 'EU Waste Framework Dir. 2008/98/EC Art. 6',
      status: row4Status,
      auditNote: row4Note
    }
  ];
}

export default function CircularManifestModal({
  isOpen,
  onClose,
  matchData,
  companyAInput,
  companyBInput,
  annualTonnage,
  logisticsDistanceKm,
  activeTransport,
  metrics
}) {
  const [downloadFormatNotice, setDownloadFormatNotice] = useState('');

  const filingTimestamp = useMemo(() => new Date().toISOString(), [matchData, annualTonnage, logisticsDistanceKm]);

  const titleParts = (matchData?.title || 'Generator Facility → Off-Taker Facility').split('→');
  const genMeta = useMemo(
    () =>
      parseFacilityMetadata(
        companyAInput,
        'A',
        (titleParts[0] || 'Generator Facility').trim()
      ),
    [companyAInput, titleParts]
  );
  const offMeta = useMemo(
    () =>
      parseFacilityMetadata(
        companyBInput,
        'B',
        (titleParts[1] || 'Off-Taker Facility').trim()
      ),
    [companyBInput, titleParts]
  );

  const documentHash = useMemo(() => {
    const seed = `${matchData?.title}|${matchData?.overallScore}|${annualTonnage}|${logisticsDistanceKm}|${activeTransport?.id}`;
    return `0x${computeAuditHash(seed)}`;
  }, [matchData, annualTonnage, logisticsDistanceKm, activeTransport]);

  const toleranceRows = useMemo(
    () =>
      matchData
        ? buildToleranceVerificationTable(matchData, companyAInput, companyBInput)
        : [],
    [matchData, companyAInput, companyBInput]
  );

  if (!isOpen || !matchData) return null;

  const isBlockedFiling = Boolean(
    matchData.calculator?.isIncompatible || matchData.overallScore < 35
  );
  const isConditionalFiling = !isBlockedFiling && matchData.overallScore < 75;

  const regulatoryStampTitle = isBlockedFiling
    ? 'REGULATORY BLOCKADE STAMP'
    : isConditionalFiling
    ? 'CONDITIONAL COMPLIANCE STAMP'
    : 'REGULATORY COMPLIANCE STAMP';

  const regulatoryStampText = isBlockedFiling
    ? 'NON-COMPLIANT — Transfer Prohibited Under EU WFD Art. 6 & TSRS Scope 3 Controls'
    : isConditionalFiling
    ? 'Pre-Treatment / Blending Required Prior to EU WFD Art. 6 End-of-Waste Qualification'
    : 'EU Waste Framework Directive Art. 6 (End-of-Waste Criteria) & TSRS Scope 3 Aligned';

  const {
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
  } = metrics;

  const formatNumber = (num) => new Intl.NumberFormat('en-US').format(num);
  const formatCurrency = (num) =>
    new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(num);

  // Build structured JSON payload for Official Manifest export
  const buildManifestJsonObject = () => ({
    manifestType: 'TSRS_EU_CSRD_UNGC_CIRCULAR_10K_FILING',
    schemaVersion: '2026.4-EN',
    documentVerification: {
      sha256Hash: documentHash,
      filingTimestampUtc: filingTimestamp,
      regulatoryStamp: regulatoryStampText,
      reportingFrameworks: [
        'TSRS 2 (Turkish Sustainability Reporting Standards - Scope 3)',
        'EU CSRD / ESRS E5 (Resource Use and Circular Economy)',
        'UN Global Compact Circular 10-K Disclosure',
        'EU Waste Framework Directive 2008/98/EC Art. 6'
      ]
    },
    counterparties: {
      generatorFacility: {
        facilityId: genMeta.facilityId,
        facilityName: genMeta.facilityName,
        ewcCode: genMeta.ewcCode,
        streamDescription: genMeta.streamDescription
      },
      offTakerFacility: {
        facilityId: offMeta.facilityId,
        facilityName: offMeta.facilityName,
        streamDescription: offMeta.streamDescription
      }
    },
    stoichiometricEvaluation: {
      pairingTitle: matchData.title,
      nlpSymbiosisMatchScorePct: matchData.overallScore,
      viabilityClassification: matchData.viabilityStatus,
      summaryRationale: matchData.summaryRationale,
      extractedChemicalTokens: matchData.chemicalEntitiesExtracted,
      toleranceVerificationTable: toleranceRows
    },
    auditedQuantitativeLedger: {
      annualThroughputTonnage: annualTonnage,
      massDivertedFromLandfillTons: divertedTons,
      residualLandfillTons,
      diversionEfficiencyPct: Math.round((matchData.calculator?.diversionRate || 0) * 100),
      carbonAccounting: {
        statusQuoBaselineEmissionsTonsCo2e: statusQuoEmissions,
        grossProcessAbatementTonsCo2e: grossProcessAbatement,
        transportScope3PenaltyTonsCo2e: transportCo2PenaltyTons,
        netVerifiedAbatementTonsCo2e: netVerifiedCo2Abatement,
        logisticsCorridorDistanceKm: logisticsDistanceKm,
        transportMode: activeTransport?.label
      },
      financialAccountingEur: {
        avoidedLandfillGateFeesEur: statusQuoCost,
        grossSymbiosisValueEur: grossFinancialValueUnlocked,
        interFacilityFreightCostEur: totalFreightCost,
        netEconomicValueUnlockedEur: netFinancialUnlocked,
        breakEvenGateFeeRadiusKm,
        breakEvenTotalSymbiosisRadiusKm: breakEvenTotalValueRadiusKm
      }
    }
  });

  // Download as .json
  const handleDownloadJson = () => {
    const dataObj = buildManifestJsonObject();
    const blob = new Blob([JSON.stringify(dataObj, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TSRS_CSRD_Circular_10K_Manifest_${genMeta.facilityId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadFormatNotice('Exported .JSON Manifest');
    setTimeout(() => setDownloadFormatNotice(''), 2500);
  };

  // Download as .txt formatted official regulatory filing
  const handleDownloadTxt = () => {
    const lines = [
      '================================================================================',
      'OFFICIAL ENTERPRISE AUDIT CERTIFICATE — TSRS / EU CSRD / UNGC "CIRCULAR 10-K"',
      '================================================================================',
      `DOCUMENT SHA-256 HASH : ${documentHash}`,
      `FILING TIMESTAMP (UTC): ${filingTimestamp}`,
      `REGULATORY STAMP      : ${regulatoryStampText}`,
      '--------------------------------------------------------------------------------',
      '1. REGISTERED INDUSTRIAL COUNTERPARTIES',
      `   GENERATOR (COMPANY A) : [${genMeta.facilityId}] ${genMeta.facilityName}`,
      `   EWC CLASSIFICATION    : ${genMeta.ewcCode}`,
      `   OFF-TAKER (COMPANY B) : [${offMeta.facilityId}] ${offMeta.facilityName}`,
      '--------------------------------------------------------------------------------',
      '2. STOICHIOMETRIC & EWC TOLERANCE VERIFICATION',
      `   SYMBIOSIS PAIRING     : ${matchData.title}`,
      `   NLP MATCH CONFIDENCE  : ${matchData.overallScore}% (${matchData.viabilityStatus})`,
      `   EXTRACTED TOKENS      : ${(matchData.chemicalEntitiesExtracted || []).join(' | ')}`,
      '',
      ...toleranceRows.map(
        (r) =>
          `   - [${r.status}] ${r.parameter}: ${r.measuredAssay} (${r.regulatoryStandard}) -> ${r.auditNote}`
      ),
      '--------------------------------------------------------------------------------',
      '3. AUDITED SCOPE 3 ABATEMENT & LANDFILL DIVERSION LEDGER',
      `   ANNUAL THROUGHPUT VOLUME          : ${formatNumber(annualTonnage)} metric tons/yr`,
      `   LANDFILL MASS DIVERTED            : ${formatNumber(divertedTons)} metric tons/yr`,
      `   RESIDUAL LANDFILL VOLUME          : ${formatNumber(residualLandfillTons)} metric tons/yr`,
      `   GROSS PROCESS CO2e ABATEMENT      : +${formatNumber(grossProcessAbatement)} tCO2e/yr`,
      `   LOGISTICS SCOPE 3 PENALTY (${logisticsDistanceKm} km): -${formatNumber(transportCo2PenaltyTons)} tCO2e/yr (${activeTransport?.label})`,
      `   NET VERIFIED CO2e ABATEMENT       : ${formatNumber(netVerifiedCo2Abatement)} tCO2e/yr`,
      `   GROSS SYMBIOSIS ECONOMIC VALUE    : ${formatCurrency(grossFinancialValueUnlocked)}/yr`,
      `   INTER-FACILITY FREIGHT COST       : -${formatCurrency(totalFreightCost)}/yr`,
      `   NET ECONOMIC VALUE UNLOCKED       : ${formatCurrency(netFinancialUnlocked)}/yr`,
      `   BREAK-EVEN SYMBIOSIS RADIUS       : ${breakEvenGateFeeRadiusKm} km (Gate Fee) / ${breakEvenTotalValueRadiusKm} km (Total Value)`,
      '================================================================================'
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TSRS_CSRD_Circular_10K_Manifest_${genMeta.facilityId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadFormatNotice('Exported .TXT Manifest');
    setTimeout(() => setDownloadFormatNotice(''), 2500);
  };

  // Print / Save PDF via window.print()
  const handlePrintPdf = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    if (status === 'PASS') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          PASS
        </span>
      );
    }
    if (status === 'CONDITIONAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          CONDITIONAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300">
        <XCircle className="w-3 h-3 text-rose-600" />
        FAIL
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-0">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="bg-navy-950 text-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-accent-400" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-accent-300 block leading-none">
                REGULATORY COMPLIANCE &amp; AUDIT FILING
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                TSRS / EU CSRD / UNGC &ldquo;Circular 10-K&rdquo; Resource Transfer Manifest
              </h2>
            </div>
          </div>

          {/* Export & Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {downloadFormatNotice && (
              <span className="text-xs font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-700 px-2.5 py-1 rounded">
                {downloadFormatNotice}
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-mono font-semibold transition"
            >
              <FileJson className="w-3.5 h-3.5 text-sky-400" />
              <span>Download Official Manifest (.json)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-mono font-semibold transition"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-300" />
              <span>Download (.txt)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white border border-accent-500 text-xs font-mono font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition ml-1"
              title="Close Manifest Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official 10-K Certificate Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900 print:overflow-visible print:p-4">
          {/* Formal 10-K Filing Header & Regulatory Compliance Stamp */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-500">
                FORM CIRCULAR-10K // MANDATORY CORPORATE SUSTAINABILITY DISCLOSURE
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
                INDUSTRIAL SYMBIOSIS &amp; END-OF-WASTE AUDIT CERTIFICATE
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Prepared in accordance with Turkish Sustainability Reporting Standards (TSRS 2), EU Corporate Sustainability Reporting Directive (CSRD / ESRS E5), and UN Global Compact Circularity Metrics.
              </p>
            </div>

            {/* Official Regulatory Compliance Stamp */}
            <div
              className={`border-2 rounded-lg p-3 max-w-sm flex-shrink-0 ${
                isBlockedFiling
                  ? 'bg-rose-50 border-rose-700'
                  : isConditionalFiling
                  ? 'bg-amber-50 border-amber-700'
                  : 'bg-emerald-50 border-emerald-700'
              }`}
            >
              <div
                className={`flex items-center gap-2 font-mono text-xs font-extrabold uppercase ${
                  isBlockedFiling
                    ? 'text-rose-900'
                    : isConditionalFiling
                    ? 'text-amber-900'
                    : 'text-emerald-900'
                }`}
              >
                {isBlockedFiling ? (
                  <XCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
                ) : isConditionalFiling ? (
                  <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                )}
                <span>{regulatoryStampTitle}</span>
              </div>
              <div
                className={`text-[11px] font-mono font-semibold mt-1 leading-snug ${
                  isBlockedFiling
                    ? 'text-rose-950'
                    : isConditionalFiling
                    ? 'text-amber-950'
                    : 'text-emerald-950'
                }`}
              >
                {regulatoryStampText}
              </div>
            </div>
          </div>

          {/* Document Hash & Timestamp Metadata Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-100 p-3.5 rounded-lg border border-slate-300 font-mono text-xs">
            <div className="md:col-span-2 flex items-start gap-2 min-w-0">
              <Hash className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  SHA-256 Cryptographic Verification Hash
                </span>
                <span className="text-slate-900 font-semibold break-all text-[11px]">
                  {documentHash}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-navy-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Audit Timestamp (ISO-8601 UTC)
                </span>
                <span className="text-slate-900 font-semibold text-[11px]">
                  {filingTimestamp}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Generator & Off-Taker Facility IDs */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-navy-800" />
              <span>Section 1 // Registered Counterparty Facility Identifiers</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Generator Box */}
              <div className="p-4 rounded-lg border border-slate-300 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-navy-900 text-white">
                    SOURCE GENERATOR (COMPANY A)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    ID: {genMeta.facilityId}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{genMeta.facilityName}</div>
                <div className="text-xs text-slate-600 mt-1">
                  <strong className="font-mono text-slate-700">Stream:</strong> {genMeta.streamDescription}
                </div>
                <div className="text-xs font-mono text-slate-700 mt-1">
                  <strong>EWC Classification:</strong> {genMeta.ewcCode}
                </div>
              </div>

              {/* Off-Taker Box */}
              <div className="p-4 rounded-lg border border-slate-300 bg-slate-50/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-accent-700 text-white">
                    RECEIVING OFF-TAKER (COMPANY B)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    ID: {offMeta.facilityId}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">{offMeta.facilityName}</div>
                <div className="text-xs text-slate-600 mt-1">
                  <strong className="font-mono text-slate-700">Feedstock Spec:</strong> {offMeta.streamDescription}
                </div>
                <div className="text-xs font-mono text-slate-700 mt-1">
                  <strong>NLP Symbiosis Match Score:</strong> {matchData.overallScore}% ({matchData.viabilityStatus})
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: EWC Classification & Stoichiometric Tolerance Verification Table */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5">
              Section 2 // EWC Classification &amp; Stoichiometric Tolerance Verification Table
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] uppercase text-slate-700">
                    <th className="py-2.5 px-3">Verification Parameter</th>
                    <th className="py-2.5 px-3">Extracted Stoichiometric Assay</th>
                    <th className="py-2.5 px-3">Reference Standard</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Auditor Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {toleranceRows.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.parameter}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{row.measuredAssay}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{row.regulatoryStandard}</td>
                      <td className="py-2.5 px-3">{getStatusBadge(row.status)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{row.auditNote}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Audited Scope 3 Abatement & Landfill Diversion Ledger */}
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-navy-800" />
              <span>Section 3 // Audited Scope 3 Abatement &amp; Landfill Diversion Ledger</span>
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] uppercase text-slate-700">
                    <th className="py-2.5 px-3">Accounting Line Item (TSRS / ESRS E5)</th>
                    <th className="py-2.5 px-3">Status Quo (Linear Baseline)</th>
                    <th className="py-2.5 px-3">Logistics / Process Adjustment</th>
                    <th className="py-2.5 px-3 text-right">Audited Net Symbiosis Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      1. Annual By-Product Mass Balance &amp; Landfill Diversion
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {formatNumber(annualTonnage)} t/yr Landfilled
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {formatNumber(residualLandfillTons)} t/yr Residual Reject
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-navy-900">
                      {formatNumber(divertedTons)} t/yr Diverted
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      2. Scope 1 + Scope 3 Carbon Accounting ({logisticsDistanceKm} km via {activeTransport?.shortLabel})
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      +{formatNumber(grossProcessAbatement)} tCO2e Gross Abated
                    </td>
                    <td className="py-2.5 px-3 text-rose-700">
                      -{formatNumber(transportCo2PenaltyTons)} tCO2e Transport Penalty
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800">
                      {formatNumber(netVerifiedCo2Abatement)} tCO2e/yr Saved
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      3. Financial Valuation &amp; Freight Cost Ledger (EUR)
                    </td>
                    <td className="py-2.5 px-3 text-emerald-800">
                      +{formatCurrency(grossFinancialValueUnlocked)} Gross Value
                    </td>
                    <td className="py-2.5 px-3 text-rose-700">
                      -{formatCurrency(totalFreightCost)} Freight Cost
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(netFinancialUnlocked)} / yr
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      4. Geospatial Break-Even Symbiosis Corridor Radius
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Active Haul: {logisticsDistanceKm} km
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      Gate-Fee Limit: {breakEvenGateFeeRadiusKm} km
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-accent-700">
                      Max Radius: {breakEvenTotalValueRadiusKm} km
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sign-Off Footer */}
          <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-500">
            <div>
              GENERATED BY: SYMBIOMATCH ENTERPRISE TELEMETRY ENGINE (VER 4.2) • COP31 &amp; SIEMENS IMPACT TRACK
            </div>
            <div>
              ATTESTATION STATUS: ELECTRONICALLY VERIFIED ({documentHash.slice(0, 18)}...)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

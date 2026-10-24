import React, { useRef, useState } from 'react';
import Header from './components/Header';
import InputSection, { getBundledDatabaseFiles } from './components/InputSection';
import ImpactCalculator from './components/ImpactCalculator';
import {
  REFERENCE_SCENARIOS,
  evaluateSymbiosisMatch,
  evaluateRegistryScan1ToN,
  parseAnnualTonnageFromLog
} from './services/geminiService';
import {
  Cpu,
  CheckCircle2,
  Trophy,
  Radar,
  ArrowRight,
  AlertTriangle,
  XCircle
} from 'lucide-react';

export default function App() {
  const initialWasteFiles = getBundledDatabaseFiles('waste');
  const initialResourceFiles = getBundledDatabaseFiles('resource');

  const defaultWaste =
    initialWasteFiles.find((f) => f.filename === 'tekirdag_thermal_coal_fly_ash.log') ||
    initialWasteFiles[0] || {
      filename: 'tekirdag_thermal_coal_fly_ash.log',
      path: 'database/waste/tekirdag_thermal_coal_fly_ash.log',
      content: REFERENCE_SCENARIOS[0].companyA
    };

  const defaultResource =
    initialResourceFiles.find((f) => f.filename === 'corlu_geopolymer_precast_binder.log') ||
    initialResourceFiles[0] || {
      filename: 'corlu_geopolymer_precast_binder.log',
      path: 'database/resource/corlu_geopolymer_precast_binder.log',
      content: REFERENCE_SCENARIOS[0].companyB
    };

  const [wasteDbFiles, setWasteDbFiles] = useState(initialWasteFiles);
  const [resourceDbFiles, setResourceDbFiles] = useState(initialResourceFiles);

  const [selectedWastePath, setSelectedWastePath] = useState(defaultWaste.path);
  const [selectedResourcePath, setSelectedResourcePath] = useState(defaultResource.path);

  const [companyAInput, setCompanyAInput] = useState(defaultWaste.content);
  const [companyBInput, setCompanyBInput] = useState(defaultResource.content);
  const [annualTonnage, setAnnualTonnage] = useState(() =>
    parseAnnualTonnageFromLog(defaultWaste.content, REFERENCE_SCENARIOS[0].defaultTonnage)
  );
  const [matchResult, setMatchResult] = useState(REFERENCE_SCENARIOS[0].result);

  // Ranked Leaderboard state from Autonomous Registry Scan (1-to-N)
  const [leaderboardResults, setLeaderboardResults] = useState([]);
  const [activeLeaderboardIndex, setActiveLeaderboardIndex] = useState(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanMode, setScanMode] = useState('1-to-1');
  const [loadingStepText, setLoadingStepText] = useState('');

  // Optional live Gemini API key state (hybrid mode)
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);

  // 1-to-1 Pairwise NLP Match
  const handleRunMatch = async () => {
    setScanMode('1-to-1');
    setIsAnalyzing(true);
    setLoadingStepText('Tokenizing report -> Extracting stoichiometry...');
    setAnnualTonnage((prev) => parseAnnualTonnageFromLog(companyAInput, prev));

    const stepTimer1 = setTimeout(() => {
      setLoadingStepText('Tokenizing report -> Extracting stoichiometry -> Computing valuation...');
    }, 750);

    try {
      const [evaluated] = await Promise.all([
        evaluateSymbiosisMatch({
          companyAInput,
          companyBInput,
          apiKey
        }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      setLeaderboardResults([]);
      setMatchResult(evaluated);
    } finally {
      clearTimeout(stepTimer1);
      setIsAnalyzing(false);
      setLoadingStepText('');
    }
  };

  // 1-to-N Autonomous Registry Scan across all /database/resource files
  const handleRunRegistryScan = async () => {
    setScanMode('1-to-N');
    setIsAnalyzing(true);
    setLoadingStepText(
      `Scanning ${resourceDbFiles.length} regional /database/resource facilities...`
    );
    setAnnualTonnage((prev) => parseAnnualTonnageFromLog(companyAInput, prev));

    const stepTimer1 = setTimeout(() => {
      setLoadingStepText(
        'Ranking stoichiometric compatibility -> Selecting #1 Regional OSB Off-Taker...'
      );
    }, 750);

    try {
      const [ranked] = await Promise.all([
        evaluateRegistryScan1ToN({
          companyAInput,
          resourceFiles: resourceDbFiles,
          apiKey
        }),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);

      setLeaderboardResults(ranked);
      setActiveLeaderboardIndex(0);

      // Automatically load SYS_LOG_B and detailed ImpactCalculator for the #1 ranked match
      if (ranked.length > 0) {
        const topCandidate = ranked[0];
        setCompanyBInput(topCandidate.resourceFile.content);
        setSelectedResourcePath(topCandidate.resourceFile.path);
        setMatchResult(topCandidate.matchResult);
      }
    } finally {
      clearTimeout(stepTimer1);
      setIsAnalyzing(false);
      setLoadingStepText('');
    }
  };

  const calculatorSectionRef = useRef(null);

  // Allow clicking any ranked row or "Loaded Below" / "Inspect" button in the 1-to-N Leaderboard to smoothly scroll to its full impact breakdown
  const handleSelectLeaderboardCandidate = (entry, idx) => {
    setActiveLeaderboardIndex(idx);
    setCompanyBInput(entry.resourceFile.content);
    setSelectedResourcePath(entry.resourceFile.path);
    setMatchResult(entry.matchResult);
    requestAnimationFrame(() => {
      calculatorSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  };

  const getRankScoreStyle = (score) => {
    if (score >= 75) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    }
    if (score >= 50) {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    return 'bg-rose-50 text-rose-800 border-rose-300';
  };

  const getRankIcon = (score) => {
    if (score >= 75) return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
    if (score >= 50) return <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
    return <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Enterprise Header */}
      <Header
        apiKey={apiKey}
        setApiKey={setApiKey}
        showApiModal={showApiModal}
        setShowApiModal={setShowApiModal}
      />

      {/* Main Enterprise Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Side-by-Side System Input Logs + Regional Registry Explorer */}
        <InputSection
          companyAInput={companyAInput}
          setCompanyAInput={setCompanyAInput}
          companyBInput={companyBInput}
          setCompanyBInput={setCompanyBInput}
          selectedWastePath={selectedWastePath}
          setSelectedWastePath={setSelectedWastePath}
          selectedResourcePath={selectedResourcePath}
          setSelectedResourcePath={setSelectedResourcePath}
          wasteDbFiles={wasteDbFiles}
          setWasteDbFiles={setWasteDbFiles}
          resourceDbFiles={resourceDbFiles}
          setResourceDbFiles={setResourceDbFiles}
          setAnnualTonnage={setAnnualTonnage}
          onRunMatch={handleRunMatch}
          onRunRegistryScan={handleRunRegistryScan}
          isAnalyzing={isAnalyzing}
          scanMode={scanMode}
          loadingStepText={loadingStepText}
        />

        {/* Realistic 1.5-Second Telemetry Processing State */}
        {isAnalyzing ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-900 text-accent-400 mb-4 shadow-sm animate-pulse">
              {scanMode === '1-to-N' ? <Radar className="w-6 h-6" /> : <Cpu className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-mono font-bold text-slate-900 mb-1">
              {loadingStepText || 'Tokenizing report -> Extracting stoichiometry...'}
            </h3>
            <p className="text-xs font-mono text-slate-500 max-w-xl mx-auto mb-5">
              {scanMode === '1-to-N'
                ? `AUTONOMOUS 1-TO-N SCAN: EVALUATING ${selectedWastePath.split('/').pop()} AGAINST ALL ${resourceDbFiles.length} /database/resource FACILITIES`
                : 'EXECUTING PIPELINE: XRF_OXIDE_NORMALIZATION -> EWC_HAZARD_AUDIT -> SCOPE_3_ABATEMENT_SOLVER'}
            </p>
            <div className="max-w-md mx-auto w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div className="bg-accent-600 h-full w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        ) : (
          <>
            {/* Ranked Regional Leaderboard when Autonomous Registry Scan (1-to-N) is executed */}
            {leaderboardResults.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-accent-50 text-accent-700 border border-accent-200 mb-1">
                      <Trophy className="w-3.5 h-3.5 text-accent-600" />
                      Autonomous 1-to-N Regional Registry Leaderboard
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Ranked Compatible Regional Off-Takers for{' '}
                      <code className="font-mono text-sm text-accent-700 bg-accent-50 px-2 py-0.5 rounded">
                        {selectedWastePath.split('/').pop()}
                      </code>
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    Click any facility row to inspect its impact breakdown
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {leaderboardResults.map((entry, idx) => {
                    const isSelected = idx === activeLeaderboardIndex;
                    const { overallScore, title, viabilityStatus, chemicalEntitiesExtracted } =
                      entry.matchResult;
                    return (
                      <div
                        key={entry.resourceFile.path}
                        onClick={() => handleSelectLeaderboardCandidate(entry, idx)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-navy-900/5 border-accent-500 ring-1 ring-accent-500 shadow-xs'
                            : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg font-mono font-extrabold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              idx === 0
                                ? 'bg-accent-600 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-navy-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                                {entry.resourceFile.filename}
                              </span>
                              {idx === 0 && (
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                                  #1 Optimal Regional Match
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${getRankScoreStyle(
                                  overallScore
                                )}`}
                              >
                                {viabilityStatus}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-1.5 truncate">
                              {title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {chemicalEntitiesExtracted.slice(0, 4).map((tok, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                                >
                                  {tok}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            {getRankIcon(overallScore)}
                            <div className="text-right">
                              <div className="text-[10px] font-mono uppercase text-slate-500">
                                Match Score
                              </div>
                              <div className="text-xl font-mono font-extrabold text-slate-900">
                                {overallScore}%
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectLeaderboardCandidate(entry, idx);
                            }}
                            className={`inline-flex items-center gap-1 text-xs font-mono font-semibold px-3 py-1.5 rounded-lg border transition hover:brightness-110 ${
                              isSelected
                                ? 'bg-navy-900 text-white border-navy-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <span>{isSelected ? 'Loaded Below' : 'Inspect'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Integrated NLP Match Score + Extracted Tokens + Quantitative Impact Calculator + Circular 10-K Manifest */}
            <div ref={calculatorSectionRef} className="scroll-mt-24">
              <ImpactCalculator
                matchData={matchResult}
                companyAInput={companyAInput}
                companyBInput={companyBInput}
                annualTonnage={annualTonnage}
                setAnnualTonnage={setAnnualTonnage}
              />
            </div>
          </>
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono font-medium text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-accent-600" />
            <span>SYMBIOMATCH ENTERPRISE // N-TO-M REGIONAL INDUSTRIAL REGISTRY</span>
          </div>
          <div className="font-mono text-[11px]">
            ENGINE: <code className="text-navy-900 font-semibold">@google/genai</code> • COP31 • SIEMENS IMPACT AREA • UN SDGs 9, 12, 13
          </div>
        </div>
      </footer>
    </div>
  );
}

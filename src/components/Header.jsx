import React from 'react';
import { Layers, Globe2, Cpu, Target, ShieldCheck, KeyRound, Activity } from 'lucide-react';

export default function Header({ apiKey, setApiKey, showApiModal, setShowApiModal }) {
  return (
    <header className="bg-navy-950 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Enterprise Brand & Telemetry Title */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-navy-900 border border-slate-700/80 shadow-inner flex-shrink-0">
              <Layers className="w-6 h-6 text-accent-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-accent-900/70 text-accent-200 border border-accent-700/60">
                  <Activity className="w-3 h-3 text-accent-400" />
                  SYS.VER 4.2 // ENTERPRISE TELEMETRY
                </span>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                  • INDUSTRIAL SYMBIOSIS EXCHANGE
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                SymbioMatch <span className="text-accent-400 font-semibold">Enterprise</span>
              </h1>
              <p className="text-xs text-slate-400">
                B2B Secondary Raw Material Stoichiometry &amp; Resource Valuation Platform
              </p>
            </div>
          </div>

          {/* Strategic Alignment Badges & Engine Connection Control */}
          <div className="flex flex-wrap items-center gap-2">
            {/* COP31 Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-200"
              title="Aligned with COP31 Industrial Decarbonization & Circularity Pledges"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span>COP31</span>
            </div>

            {/* Siemens Impact Area Badge */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-200"
              title="Siemens Resource Efficiency & Decarbonization Impact Track"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Siemens Impact Area</span>
            </div>

            {/* UN SDGs 9, 12, 13 */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-slate-200"
              title="UN Sustainable Development Goals: 9 (Industry & Innovation), 12 (Responsible Consumption), 13 (Climate Action)"
            >
              <Target className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>UN SDGs</span>
              <span className="inline-flex items-center gap-1 ml-0.5 font-mono">
                <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600 text-slate-100 font-bold text-[10px]">9</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600 text-slate-100 font-bold text-[10px]">12</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600 text-slate-100 font-bold text-[10px]">13</span>
              </span>
            </div>

            {/* Zero-Config / Live API Engine Status */}
            <button
              type="button"
              onClick={() => setShowApiModal(!showApiModal)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all border ${
                apiKey
                  ? 'bg-accent-900/60 border-accent-500/70 text-accent-100 hover:bg-accent-800/60'
                  : 'bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700'
              }`}
              title="Configure optional API Endpoint Key or run in Zero-Config Deterministic Mode"
            >
              {apiKey ? (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-accent-400" />
                  <span>API: LIVE_CONNECTED</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>MODE: ZERO_CONFIG</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible API Endpoint Configuration Bar */}
        {showApiModal && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-3 rounded-lg">
            <div className="text-xs text-slate-300">
              <span className="font-mono font-semibold text-accent-300">ENGINE_CONFIG:</span> Runs natively in{' '}
              <span className="underline decoration-slate-500">Zero-Config Deterministic Mode</span> for offline auditing, or connects to{' '}
              <code className="text-sky-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">@google/genai</code> (<code className="text-sky-300 font-mono">gemini-3.8-flash</code>) when an API key is supplied.
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional: Enter API Key..."
                className="px-3 py-1.5 text-xs font-mono rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500 w-full sm:w-64"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={() => setApiKey('')}
                  className="text-xs font-mono px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  RESET
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

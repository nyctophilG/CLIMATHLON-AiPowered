import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Play,
  Loader2,
  Terminal,
  FileText,
  Server,
  FolderOpen,
  HardDriveUpload,
  Radar,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { parseAnnualTonnageFromLog } from '../services/geminiService';

// Static fallback bundle for production preview builds where dev middleware is inactive
const rawWasteFiles = import.meta.glob('../../database/waste/*.{log,txt,md,csv}', {
  query: '?raw',
  import: 'default',
  eager: true
});

const rawResourceFiles = import.meta.glob('../../database/resource/*.{log,txt,md,csv}', {
  query: '?raw',
  import: 'default',
  eager: true
});

export function getBundledDatabaseFiles(folderName) {
  const globMap = folderName === 'waste' ? rawWasteFiles : rawResourceFiles;
  const items = Object.entries(globMap).map(([filePath, content]) => {
    const parts = filePath.split('/');
    const filename = parts[parts.length - 1];
    const strContent = typeof content === 'string' ? content : String(content);
    return {
      filename,
      path: `database/${folderName}/${filename}`,
      content: strContent,
      size: strContent.length,
      updatedAt: new Date().toISOString()
    };
  });

  items.sort((a, b) => {
    const aIsLog = a.filename.endsWith('.log') ? 0 : 1;
    const bIsLog = b.filename.endsWith('.log') ? 0 : 1;
    if (aIsLog !== bIsLog) return aIsLog - bIsLog;
    return a.filename.localeCompare(b.filename);
  });

  return items;
}

export default function InputSection({
  companyAInput,
  setCompanyAInput,
  companyBInput,
  setCompanyBInput,
  selectedWastePath,
  setSelectedWastePath,
  selectedResourcePath,
  setSelectedResourcePath,
  wasteDbFiles,
  setWasteDbFiles,
  resourceDbFiles,
  setResourceDbFiles,
  setAnnualTonnage,
  onRunMatch,
  onRunRegistryScan,
  isAnalyzing,
  scanMode,
  loadingStepText
}) {
  const fileInputARef = useRef(null);
  const fileInputBRef = useRef(null);

  const [saveStatusA, setSaveStatusA] = useState('');
  const [saveStatusB, setSaveStatusB] = useState('');
  const [isRefreshingRegistry, setIsRefreshingRegistry] = useState(false);

  // Fetch live directory contents from GET /api/database/list on mount
  const fetchDatabaseList = async () => {
    setIsRefreshingRegistry(true);
    try {
      const res = await fetch('/api/database/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.waste) && data.waste.length > 0) {
          setWasteDbFiles(data.waste);
        }
        if (Array.isArray(data.resource) && data.resource.length > 0) {
          setResourceDbFiles(data.resource);
        }
      }
    } catch {
      // Fallback uses bundled glob files already initialized in state
    } finally {
      setIsRefreshingRegistry(false);
    }
  };

  useEffect(() => {
    fetchDatabaseList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist file to /database/waste or /database/resource and refresh registry list
  const persistToDatabaseFolder = async (folder, filename, content) => {
    const entry = {
      filename,
      path: `database/${folder}/${filename}`,
      content,
      size: content.length,
      updatedAt: new Date().toISOString()
    };

    if (folder === 'waste') {
      setWasteDbFiles((prev) => [entry, ...prev.filter((item) => item.filename !== filename)]);
      setSaveStatusA(`Saved -> database/waste/${filename}`);
      setTimeout(() => setSaveStatusA(''), 3000);
    } else {
      setResourceDbFiles((prev) => [entry, ...prev.filter((item) => item.filename !== filename)]);
      setSaveStatusB(`Saved -> database/resource/${filename}`);
      setTimeout(() => setSaveStatusB(''), 3000);
    }

    try {
      const saveRes = await fetch('/api/database/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder, filename, content })
      });
      if (saveRes.ok) {
        await fetchDatabaseList();
      }
    } catch {
      // Static build fallback: state is already updated in memory
    }
  };

  // Standard JavaScript FileReader implementation for uploading files from computer
  const handleFileUpload = (event, targetCompany) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const textContent = typeof e.target?.result === 'string' ? e.target.result : '';
      if (targetCompany === 'A') {
        setCompanyAInput(textContent);
        setSelectedWastePath(`database/waste/${file.name}`);
        if (setAnnualTonnage) {
          setAnnualTonnage((prev) => parseAnnualTonnageFromLog(textContent, prev));
        }
        await persistToDatabaseFolder('waste', file.name, textContent);
      } else {
        setCompanyBInput(textContent);
        setSelectedResourcePath(`database/resource/${file.name}`);
        await persistToDatabaseFolder('resource', file.name, textContent);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // Select an existing file from the Regional Registry Explorer pill bar
  const handleSelectDbFile = (targetCompany, dbFile) => {
    if (targetCompany === 'A') {
      setCompanyAInput(dbFile.content);
      setSelectedWastePath(dbFile.path);
      if (setAnnualTonnage) {
        setAnnualTonnage((prev) => parseAnnualTonnageFromLog(dbFile.content, prev));
      }
    } else {
      setCompanyBInput(dbFile.content);
      setSelectedResourcePath(dbFile.path);
    }
  };

  // Save current editor content directly to /database/waste or /database/resource
  const handleSaveCurrentLogToDb = async (targetCompany) => {
    if (targetCompany === 'A') {
      const currentName = selectedWastePath
        ? selectedWastePath.split('/').pop()
        : `waste_stream_${Date.now()}.log`;
      await persistToDatabaseFolder('waste', currentName, companyAInput);
    } else {
      const currentName = selectedResourcePath
        ? selectedResourcePath.split('/').pop()
        : `resource_spec_${Date.now()}.log`;
      await persistToDatabaseFolder('resource', currentName, companyBInput);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
      {/* Side-by-Side Formal System Input Logs with Compact Regional Registry Explorer Pill Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* COLUMN A: Regional Registry Explorer (Waste) + SYS_LOG_A */}
        <div className="flex flex-col">
          {/* Compact Regional Registry Explorer Pill Bar above SYS_LOG_A */}
          <div className="bg-slate-100 border border-slate-200 rounded-t-lg px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">
                <FolderOpen className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                <span>Regional Registry Explorer // /database/waste ({wasteDbFiles.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputARef}
                  type="file"
                  accept=".log,.txt,.md,.csv"
                  onChange={(e) => handleFileUpload(e, 'A')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputARef.current?.click()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[11px] font-mono font-semibold shadow-2xs transition disabled:opacity-50"
                >
                  <Upload className="w-3 h-3 text-sky-600" />
                  <span>Upload to /waste</span>
                </button>
                <button
                  type="button"
                  onClick={fetchDatabaseList}
                  disabled={isRefreshingRegistry}
                  title="Sync with /api/database/list"
                  className="p-1 rounded bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingRegistry ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Clickable File Pills for /database/waste */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {wasteDbFiles.map((file) => {
                const isSelected = selectedWastePath === file.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => handleSelectDbFile('A', file)}
                    disabled={isAnalyzing}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition border ${
                      isSelected
                        ? 'bg-navy-900 text-sky-200 border-navy-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-sky-400 flex-shrink-0" />}
                    <span className="truncate max-w-[190px]">{file.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SYSTEM LOG A Terminal Box */}
          <div className="flex flex-col rounded-b-lg border border-t-0 border-slate-300 bg-slate-950 overflow-hidden shadow-inner">
            <div className="bg-slate-900 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Terminal className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-mono font-bold text-slate-100 block leading-none">
                    SYS_LOG_A // COMPANY A (WASTE OUTPUT)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                    {saveStatusA ? (
                      <span className="text-emerald-400 font-semibold">{saveStatusA}</span>
                    ) : (
                      <span>ACTIVE_FILE: {selectedWastePath}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-500">
                  {companyAInput.length} B
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveCurrentLogToDb('A')}
                  disabled={isAnalyzing || !companyAInput.trim()}
                  title="Persist edits to /database/waste on disk"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition disabled:opacity-50"
                >
                  <HardDriveUpload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>

            <textarea
              id="company-a-textarea"
              rows={8}
              value={companyAInput}
              onChange={(e) => setCompanyAInput(e.target.value)}
              disabled={isAnalyzing}
              placeholder="[SYSTEM READY] Select a regional waste stream above or upload a .log / .txt / .md / .csv file..."
              className="w-full bg-slate-950 p-3.5 text-xs sm:text-[13px] text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-500 resize-y selection:bg-accent-600 selection:text-white"
            />
          </div>
        </div>

        {/* COLUMN B: Regional Registry Explorer (Resource) + SYS_LOG_B */}
        <div className="flex flex-col">
          {/* Compact Regional Registry Explorer Pill Bar above SYS_LOG_B */}
          <div className="bg-slate-100 border border-slate-200 rounded-t-lg px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Regional Registry Explorer // /database/resource ({resourceDbFiles.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputBRef}
                  type="file"
                  accept=".log,.txt,.md,.csv"
                  onChange={(e) => handleFileUpload(e, 'B')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputBRef.current?.click()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-[11px] font-mono font-semibold shadow-2xs transition disabled:opacity-50"
                >
                  <Upload className="w-3 h-3 text-indigo-600" />
                  <span>Upload to /resource</span>
                </button>
                <button
                  type="button"
                  onClick={fetchDatabaseList}
                  disabled={isRefreshingRegistry}
                  title="Sync with /api/database/list"
                  className="p-1 rounded bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingRegistry ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Clickable File Pills for /database/resource */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {resourceDbFiles.map((file) => {
                const isSelected = selectedResourcePath === file.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => handleSelectDbFile('B', file)}
                    disabled={isAnalyzing}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition border ${
                      isSelected
                        ? 'bg-navy-900 text-indigo-200 border-navy-900 font-semibold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                    <span className="truncate max-w-[190px]">{file.filename}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SYSTEM LOG B Terminal Box */}
          <div className="flex flex-col rounded-b-lg border border-t-0 border-slate-300 bg-slate-950 overflow-hidden shadow-inner">
            <div className="bg-slate-900 border-b border-slate-800 px-3.5 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Server className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div className="truncate">
                  <span className="text-xs font-mono font-bold text-slate-100 block leading-none">
                    SYS_LOG_B // COMPANY B (RAW MATERIAL NEED)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                    {saveStatusB ? (
                      <span className="text-emerald-400 font-semibold">{saveStatusB}</span>
                    ) : (
                      <span>ACTIVE_FILE: {selectedResourcePath}</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-mono text-slate-500">
                  {companyBInput.length} B
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveCurrentLogToDb('B')}
                  disabled={isAnalyzing || !companyBInput.trim()}
                  title="Persist edits to /database/resource on disk"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition disabled:opacity-50"
                >
                  <HardDriveUpload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>

            <textarea
              id="company-b-textarea"
              rows={8}
              value={companyBInput}
              onChange={(e) => setCompanyBInput(e.target.value)}
              disabled={isAnalyzing}
              placeholder="[SYSTEM READY] Select a regional resource facility above or upload a .log / .txt / .md / .csv file..."
              className="w-full bg-slate-950 p-3.5 text-xs sm:text-[13px] text-slate-100 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-500 resize-y selection:bg-accent-600 selection:text-white"
            />
          </div>
        </div>
      </div>

      {/* Data-Processing Pipeline Execution Footer: 1-to-1 Match + 1-to-N Autonomous Registry Scan */}
      <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs font-mono text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <span>
            OSB_REGISTRY_INDEX: {wasteDbFiles.length} WASTE STREAMS &times; {resourceDbFiles.length} OFF-TAKER FACILITIES READY
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* 1-to-1 Pairwise Comparison Trigger */}
          <button
            type="button"
            onClick={onRunMatch}
            disabled={isAnalyzing || !companyAInput.trim() || !companyBInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-mono font-semibold text-xs uppercase tracking-wider shadow-xs border border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing && scanMode === '1-to-1' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>Running 1-to-1 Audit...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                <span>Run NLP Match</span>
              </>
            )}
          </button>

          {/* 1-to-N Autonomous Registry Scan Trigger */}
          <button
            type="button"
            onClick={onRunRegistryScan}
            disabled={isAnalyzing || !companyAInput.trim() || resourceDbFiles.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 active:bg-accent-800 text-white font-mono font-semibold text-xs uppercase tracking-wider shadow-sm border border-accent-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing && scanMode === '1-to-N' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{loadingStepText || 'Scanning Regional Registry...'}</span>
              </>
            ) : (
              <>
                <Radar className="w-4 h-4 text-indigo-100" />
                <span>Autonomous Registry Scan (1-to-N)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Download,
  FileDown,
  FileJson,
  FileText,
  History,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  analyzeResume,
  getBenchmarkLabel,
} from "@/core/application/analysis-engine";
import { jobRoles } from "@/core/data/roles";
import type { AnalysisFinding, ResumeAnalysis } from "@/core/domain/types";
import { historyRepository } from "@/core/infrastructure/history-store";
import { parseResumeFile } from "@/core/infrastructure/parsers";
import {
  downloadJsonReport,
  downloadPdfReport,
  downloadTextFile,
} from "@/core/infrastructure/reports";
import { cn } from "@/shared/cn";

const maxFileMb = Number(process.env.NEXT_PUBLIC_MAX_FILE_MB ?? 8);

export default function Home() {
  const [selectedRoleId, setSelectedRoleId] = useState(jobRoles[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<ResumeAnalysis[]>([]);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedRole = useMemo(
    () => jobRoles.find((role) => role.id === selectedRoleId) ?? jobRoles[0],
    [selectedRoleId],
  );

  const filteredHistory = history.filter((item) => {
    const search = query.trim().toLowerCase();
    if (!search) return true;
    return (
      item.roleLabel.toLowerCase().includes(search) ||
      item.fileMeta.name.toLowerCase().includes(search)
    );
  });

  useEffect(() => {
    void refreshHistory();
  }, []);

  async function refreshHistory() {
    setHistory(await historyRepository.list());
  }

  async function handleFile(file?: File) {
    if (!file) return;
    setError(null);
    setIsAnalyzing(true);
    setStatus("Reading file");

    try {
      const extracted = await parseResumeFile(file);
      setStatus("Checking resume");
      const result = await analyzeResume(extracted, selectedRole);
      setAnalysis(result);
      await historyRepository.save(result);
      await refreshHistory();
      setStatus("Analysis saved locally");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to analyze this resume.",
      );
      setStatus("Ready");
    } finally {
      setIsAnalyzing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleExportHistory() {
    const json = await historyRepository.exportJson();
    downloadTextFile(json, "resume-analyzer-history.json");
  }

  async function handleImportHistory(file?: File) {
    if (!file) return;
    setError(null);
    try {
      const count = await historyRepository.importJson(await file.text());
      await refreshHistory();
      setStatus(`Imported ${count} analyses`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not import history.",
      );
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await historyRepository.delete(id);
    if (analysis?.id === id) setAnalysis(null);
    await refreshHistory();
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700 text-white">
                <ClipboardCheck aria-hidden="true" size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
                  Resume Analyzer
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Free local ATS analysis for PDF and DOCX resumes.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusPill icon={ShieldCheck} label="No login" tone="teal" />
            <StatusPill icon={Database} label="Local history" tone="blue" />
            <StatusPill icon={Sparkles} label="Rule-based AI" tone="amber" />
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Analyze Resume
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    PDF or DOCX, up to {maxFileMb} MB.
                  </p>
                </div>
                <FileText className="text-teal-700" aria-hidden="true" />
              </div>

              <label
                className="mt-4 block text-sm font-medium text-slate-700"
                htmlFor="role"
              >
                Target role
              </label>
              <select
                id="role"
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm"
              >
                {jobRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {selectedRole.summary}
              </p>

              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFile(event.dataTransfer.files[0]);
                }}
                className="mt-4 flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-teal-400 bg-teal-50 px-4 py-6 text-center text-teal-950 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <RefreshCw className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                <span className="text-sm font-semibold">
                  {isAnalyzing ? status : "Upload resume"}
                </span>
                <span className="text-xs text-teal-800">
                  Files stay in this browser.
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                aria-label="Resume file input"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                onChange={(event) => void handleFile(event.target.files?.[0])}
              />

              {error ? (
                <div className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <AlertTriangle
                    className="mt-0.5 shrink-0"
                    size={18}
                    aria-hidden="true"
                  />
                  <span>{error}</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-950">
                  History
                </h2>
                <History className="text-slate-500" aria-hidden="true" />
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
                <Search
                  className="text-slate-400"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search history"
                  className="h-10 w-full border-0 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <IconButton
                  icon={Download}
                  label="Export"
                  onClick={() => void handleExportHistory()}
                />
                <IconButton
                  icon={Upload}
                  label="Import"
                  onClick={() => importRef.current?.click()}
                />
              </div>
              <input
                ref={importRef}
                type="file"
                aria-label="History import file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) =>
                  void handleImportHistory(event.target.files?.[0])
                }
              />
              <div className="mt-4 max-h-96 space-y-3 overflow-auto pr-1">
                {filteredHistory.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                    No saved analyses yet.
                  </p>
                ) : (
                  filteredHistory.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setAnalysis(item)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition hover:border-teal-500 hover:bg-teal-50",
                        analysis?.id === item.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="line-clamp-1 text-sm font-semibold text-slate-950">
                            {item.roleLabel}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                            {item.fileMeta.name}
                          </p>
                        </div>
                        <span className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                          {item.scores.overall}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col gap-5">
            {analysis ? (
              <AnalysisDashboard
                analysis={analysis}
                onDelete={() => void handleDelete(analysis.id)}
              />
            ) : (
              <EmptyState />
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <BarChart3 className="text-teal-700" size={42} aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-slate-950">
        Ready for analysis
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Select a role, upload a resume, and the dashboard will populate with
        score, gaps, writing checks, history, and downloadable reports.
      </p>
    </div>
  );
}

function AnalysisDashboard({
  analysis,
  onDelete,
}: {
  analysis: ResumeAnalysis;
  onDelete: () => void;
}) {
  const categories = Object.values(analysis.scores.categories);
  const topFindings = analysis.findings.filter(
    (finding) => finding.severity !== "success",
  );

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {analysis.roleLabel}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              {getBenchmarkLabel(analysis.scores.overall)}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {analysis.fileMeta.name} | {analysis.extracted.wordCount} words |{" "}
              {analysis.extracted.pageEstimate} page estimate
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton
              icon={FileDown}
              label="PDF"
              onClick={() => void downloadPdfReport(analysis)}
            />
            <IconButton
              icon={FileJson}
              label="JSON"
              onClick={() => downloadJsonReport(analysis)}
            />
            <IconButton
              icon={Trash2}
              label="Delete"
              tone="danger"
              onClick={onDelete}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <div className="flex aspect-square max-h-56 items-center justify-center rounded-lg bg-slate-950 text-white">
            <div className="text-center">
              <div className="text-6xl font-semibold">
                {analysis.scores.overall}
              </div>
              <div className="mt-2 text-sm text-slate-300">ATS score</div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <div
                key={category.key}
                className="rounded-lg border border-slate-200 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {category.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {category.score}/{category.maxScore}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{
                      width: `${(category.score / category.maxScore) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  {category.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Panel title="Missing Skills" icon={AlertTriangle}>
          {analysis.missingSkills.length === 0 ? (
            <SuccessLine text="No major role skill gaps detected." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill) => (
                <span
                  key={skill.id}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    skill.priority === "required"
                      ? "bg-red-50 text-red-700"
                      : "bg-amber-50 text-amber-800",
                  )}
                >
                  {skill.label}
                </span>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Detected Skills" icon={CheckCircle2}>
          {analysis.detectedSkills.length === 0 ? (
            <p className="text-sm text-slate-600">
              No configured role skills were detected.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {analysis.detectedSkills.map((skill) => (
                <span
                  key={`${skill.id}-${skill.priority}`}
                  className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                >
                  {skill.label}
                </span>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Actionable Suggestions" icon={Sparkles}>
          <ol className="space-y-3">
            {analysis.suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                className="flex gap-3 text-sm leading-6 text-slate-700"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-700 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel title="Section Coverage" icon={ClipboardCheck}>
          <div className="space-y-2">
            {Object.entries(analysis.sectionCoverage).map(
              ([section, isPresent]) => (
                <div
                  key={section}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="capitalize text-slate-700">{section}</span>
                  {isPresent ? (
                    <CheckCircle2
                      className="text-emerald-600"
                      size={18}
                      aria-label="Present"
                    />
                  ) : (
                    <AlertTriangle
                      className="text-amber-600"
                      size={18}
                      aria-label="Missing"
                    />
                  )}
                </div>
              ),
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Findings" icon={FileText}>
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            ...topFindings,
            ...analysis.findings.filter(
              (finding) => finding.severity === "success",
            ),
          ].map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </Panel>
    </>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-teal-700" size={20} aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function FindingCard({ finding }: { finding: AnalysisFinding }) {
  const tone = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    critical: "border-red-200 bg-red-50 text-red-800",
  }[finding.severity];

  return (
    <article className={cn("rounded-lg border p-3", tone)}>
      <div className="flex items-start gap-2">
        {finding.severity === "success" ? (
          <CheckCircle2
            className="mt-0.5 shrink-0"
            size={18}
            aria-hidden="true"
          />
        ) : (
          <AlertTriangle
            className="mt-0.5 shrink-0"
            size={18}
            aria-hidden="true"
          />
        )}
        <div>
          <h3 className="text-sm font-semibold">{finding.title}</h3>
          <p className="mt-1 text-sm leading-6">{finding.detail}</p>
          <p className="mt-2 text-sm font-medium">{finding.recommendation}</p>
        </div>
      </div>
    </article>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition",
        tone === "danger"
          ? "border-red-200 bg-white text-red-700 hover:bg-red-50"
          : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
      )}
    >
      <Icon size={17} aria-hidden="true" />
      {label}
    </button>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  tone: "teal" | "blue" | "amber";
}) {
  const classes = {
    teal: "bg-teal-50 text-teal-800 ring-teal-200",
    blue: "bg-blue-50 text-blue-800 ring-blue-200",
    amber: "bg-amber-50 text-amber-900 ring-amber-200",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ring-1",
        classes,
      )}
    >
      <Icon size={15} aria-hidden="true" />
      {label}
    </span>
  );
}

function SuccessLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
      <CheckCircle2 size={18} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

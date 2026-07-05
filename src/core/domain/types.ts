export type SupportedFileType = "pdf" | "docx";

export type ScoreCategoryKey =
  "skills" | "structure" | "impact" | "formatting" | "language" | "contact";

export type FindingSeverity = "success" | "info" | "warning" | "critical";

export type FindingCategory =
  | "skills"
  | "structure"
  | "impact"
  | "formatting"
  | "language"
  | "contact"
  | "privacy";

export interface ResumeFileMeta {
  name: string;
  type: SupportedFileType;
  size: number;
  lastModified: number;
}

export interface ExtractedResume {
  text: string;
  wordCount: number;
  pageEstimate: number;
  fileMeta: ResumeFileMeta;
  warnings: string[];
}

export interface SkillDefinition {
  id: string;
  label: string;
  aliases: string[];
  weight: number;
}

export interface JobRoleProfile {
  id: string;
  title: string;
  summary: string;
  requiredSkills: SkillDefinition[];
  preferredSkills: SkillDefinition[];
  expectedSections: string[];
}

export interface DetectedSkill {
  id: string;
  label: string;
  priority: "required" | "preferred";
  matchedAlias: string;
}

export interface MissingSkill {
  id: string;
  label: string;
  priority: "required" | "preferred";
  recommendation: string;
}

export interface ScoreCategory {
  key: ScoreCategoryKey;
  label: string;
  score: number;
  maxScore: number;
  summary: string;
}

export interface AtsScore {
  overall: number;
  categories: Record<ScoreCategoryKey, ScoreCategory>;
}

export interface AnalysisFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  detail: string;
  recommendation: string;
}

export interface LanguageIssue {
  id: string;
  ruleId: string;
  reason: string;
  severity: FindingSeverity;
}

export interface ResumeAnalysis {
  id: string;
  createdAt: string;
  roleId: string;
  roleLabel: string;
  fileMeta: ResumeFileMeta;
  textHash: string;
  extracted: {
    wordCount: number;
    pageEstimate: number;
  };
  scores: AtsScore;
  detectedSkills: DetectedSkill[];
  missingSkills: MissingSkill[];
  findings: AnalysisFinding[];
  languageIssues: LanguageIssue[];
  sectionCoverage: Record<string, boolean>;
  suggestions: string[];
}

export interface CustomRoleProfile {
  id: string;
  name: string;
  requiredSkills: SkillDefinition[];
  preferredSkills: SkillDefinition[];
  createdAt: string;
}

export interface AppSettings {
  id: "default";
  theme: "light";
  maxFileMb: number;
  historyRetentionDays: number;
  saveExtractedText: false;
}

export interface ImportPayload {
  version: 1;
  exportedAt: string;
  analyses: ResumeAnalysis[];
}

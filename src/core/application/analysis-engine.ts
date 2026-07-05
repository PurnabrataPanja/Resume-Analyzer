import { jobRoles } from "@/core/data/roles";
import type {
  AnalysisFinding,
  AtsScore,
  DetectedSkill,
  ExtractedResume,
  JobRoleProfile,
  LanguageIssue,
  MissingSkill,
  ResumeAnalysis,
  ScoreCategory,
  ScoreCategoryKey,
  SkillDefinition,
} from "@/core/domain/types";
import {
  clampScore,
  containsTerm,
  createTextHash,
} from "@/core/application/text-utils";

const categoryLabels: Record<ScoreCategoryKey, string> = {
  skills: "Role Match",
  structure: "Structure",
  impact: "Impact",
  formatting: "ATS Format",
  language: "Writing",
  contact: "Contact",
};

const sectionPatterns: Record<string, RegExp[]> = {
  contact: [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, /\+?\d[\d\s().-]{8,}/],
  summary: [/(^|\n)\s*(summary|profile|objective|about)\s*[:\n-]/i],
  skills: [
    /(^|\n)\s*(technical skills|skills|core competencies|tools)\s*[:\n-]/i,
  ],
  experience: [
    /(^|\n)\s*(experience|work experience|employment|professional experience)\s*[:\n-]/i,
  ],
  education: [
    /(^|\n)\s*(education|academic|degree|university|college)\s*[:\n-]/i,
  ],
  projects: [/(^|\n)\s*(projects|portfolio|selected work)\s*[:\n-]/i],
  certifications: [/(^|\n)\s*(certifications|licenses|credentials)\s*[:\n-]/i],
};

const actionVerbs = [
  "built",
  "created",
  "designed",
  "delivered",
  "improved",
  "increased",
  "reduced",
  "optimized",
  "automated",
  "launched",
  "led",
  "owned",
  "migrated",
  "implemented",
  "analyzed",
];

export async function analyzeResume(
  extracted: ExtractedResume,
  role: JobRoleProfile,
): Promise<ResumeAnalysis> {
  const text = extracted.text;
  const lowerText = text.toLowerCase();
  const detectedSkills = detectSkills(lowerText, role);
  const missingSkills = getMissingSkills(role, detectedSkills);
  const sectionCoverage = detectSections(text, role.expectedSections);
  const languageIssues = await runLanguageChecks(text);
  const scores = calculateScores(
    extracted,
    role,
    detectedSkills,
    sectionCoverage,
    languageIssues,
  );
  const findings = buildFindings(
    extracted,
    role,
    scores,
    missingSkills,
    sectionCoverage,
    languageIssues,
  );
  const suggestions = buildSuggestions(findings, missingSkills);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    roleId: role.id,
    roleLabel: role.title,
    fileMeta: extracted.fileMeta,
    textHash: createTextHash(text),
    extracted: {
      wordCount: extracted.wordCount,
      pageEstimate: extracted.pageEstimate,
    },
    scores,
    detectedSkills,
    missingSkills,
    findings,
    languageIssues,
    sectionCoverage,
    suggestions,
  };
}

export function detectSkills(
  text: string,
  role: JobRoleProfile,
): DetectedSkill[] {
  const detected: DetectedSkill[] = [];
  const scan = (
    skill: SkillDefinition,
    priority: DetectedSkill["priority"],
  ) => {
    const matchedAlias = skill.aliases.find((alias) =>
      containsTerm(text, alias.toLowerCase()),
    );
    if (matchedAlias) {
      detected.push({
        id: skill.id,
        label: skill.label,
        priority,
        matchedAlias,
      });
    }
  };

  role.requiredSkills.forEach((skill) => scan(skill, "required"));
  role.preferredSkills.forEach((skill) => scan(skill, "preferred"));
  return detected;
}

function getMissingSkills(
  role: JobRoleProfile,
  detectedSkills: DetectedSkill[],
): MissingSkill[] {
  const detectedIds = new Set(detectedSkills.map((skill) => skill.id));
  const required = role.requiredSkills
    .filter((skill) => !detectedIds.has(skill.id))
    .map((skill) => ({
      id: skill.id,
      label: skill.label,
      priority: "required" as const,
      recommendation: `Add relevant ${skill.label} experience, tools, or project evidence if you have it.`,
    }));
  const preferred = role.preferredSkills
    .filter((skill) => !detectedIds.has(skill.id))
    .slice(0, 4)
    .map((skill) => ({
      id: skill.id,
      label: skill.label,
      priority: "preferred" as const,
      recommendation: `Mention ${skill.label} where it honestly matches your background.`,
    }));

  return [...required, ...preferred];
}

function detectSections(text: string, expectedSections: string[]) {
  return expectedSections.reduce<Record<string, boolean>>(
    (coverage, section) => {
      const patterns = sectionPatterns[section] ?? [];
      coverage[section] = patterns.some((pattern) => pattern.test(text));
      return coverage;
    },
    {},
  );
}

async function runLanguageChecks(text: string): Promise<LanguageIssue[]> {
  const sample = text.slice(0, 12_000);
  const deterministicIssues = findDeterministicLanguageIssues(sample);

  try {
    const [
      { unified },
      { default: retextEnglish },
      { default: retextRepeatedWords },
      { default: retextIndefiniteArticle },
      { default: retextReadability },
      { VFile },
    ] = await Promise.all([
      import("unified"),
      import("retext-english"),
      import("retext-repeated-words"),
      import("retext-indefinite-article"),
      import("retext-readability"),
      import("vfile"),
    ]);

    const processor = unified()
      .use(retextEnglish)
      .use(retextRepeatedWords)
      .use(retextIndefiniteArticle)
      .use(retextReadability, { age: 18 });
    const file = new VFile({ value: sample });
    const tree = processor.parse(file);
    await processor.run(tree, file);

    const retextIssues: LanguageIssue[] = file.messages
      .slice(0, 12)
      .map((message, index) => ({
        id: `language-${index}`,
        ruleId: String(message.ruleId ?? message.source ?? "retext"),
        reason: message.reason,
        severity: message.fatal ? "critical" : "warning",
      }));

    return [...deterministicIssues, ...retextIssues].slice(0, 16);
  } catch {
    return deterministicIssues;
  }
}

function findDeterministicLanguageIssues(text: string): LanguageIssue[] {
  const issues: LanguageIssue[] = [];
  if (/\b(responsible for|worked on|helped with)\b/i.test(text)) {
    issues.push({
      id: "language-passive-impact",
      ruleId: "resume-impact",
      reason: "Some bullets use weak ownership phrases.",
      severity: "warning",
    });
  }
  if (/\b([a-z]+)\s+\1\b/i.test(text)) {
    issues.push({
      id: "language-repeated-word",
      ruleId: "repeated-word",
      reason: "Repeated words were detected.",
      severity: "warning",
    });
  }
  if (
    text
      .split(/[.!?]/)
      .some((sentence) => sentence.trim().split(/\s+/).length > 35)
  ) {
    issues.push({
      id: "language-long-sentence",
      ruleId: "readability",
      reason: "One or more sentences are long and may be hard to scan.",
      severity: "info",
    });
  }
  return issues;
}

function calculateScores(
  extracted: ExtractedResume,
  role: JobRoleProfile,
  detectedSkills: DetectedSkill[],
  sectionCoverage: Record<string, boolean>,
  languageIssues: LanguageIssue[],
): AtsScore {
  const requiredScore = weightedSkillScore(
    role.requiredSkills,
    detectedSkills,
    "required",
  );
  const preferredScore = weightedSkillScore(
    role.preferredSkills,
    detectedSkills,
    "preferred",
  );
  const skills = clampScore(requiredScore * 28 + preferredScore * 7, 35);

  const foundSections = Object.values(sectionCoverage).filter(Boolean).length;
  const structure = clampScore(
    (foundSections / role.expectedSections.length) * 15 +
      lengthScore(extracted) * 5,
    20,
  );

  const metrics = (
    extracted.text.match(
      /(\d+%|\$\d+|\b\d+x\b|\b\d+\+?\s+(users|clients|projects|tickets|hours|days)\b)/gi,
    ) ?? []
  ).length;
  const verbHits = actionVerbs.filter((verb) =>
    containsTerm(extracted.text.toLowerCase(), verb),
  ).length;
  const impact = clampScore(
    Math.min(metrics * 3, 9) + Math.min(verbHits, 6),
    15,
  );

  const formattingDeductions =
    (extracted.pageEstimate > 3 ? 3 : 0) +
    (/[^\S\r\n]{8,}/.test(extracted.text) ? 2 : 0) +
    ((extracted.text.match(/[•▪●]/g) ?? []).length > 35 ? 1 : 0) +
    (extracted.wordCount < 250 ? 4 : 0);
  const formatting = clampScore(15 - formattingDeductions, 15);

  const language = clampScore(
    10 -
      languageIssues.filter((issue) => issue.severity !== "info").length * 1.5,
    10,
  );
  const contact = clampScore(contactScore(extracted.text), 5);

  const categories: AtsScore["categories"] = {
    skills: makeCategory(
      "skills",
      skills,
      35,
      `${detectedSkills.length} role keywords detected.`,
    ),
    structure: makeCategory(
      "structure",
      structure,
      20,
      `${foundSections}/${role.expectedSections.length} expected sections found.`,
    ),
    impact: makeCategory(
      "impact",
      impact,
      15,
      `${metrics} measurable outcome signals found.`,
    ),
    formatting: makeCategory(
      "formatting",
      formatting,
      15,
      "Text is parseable and ATS-friendly.",
    ),
    language: makeCategory(
      "language",
      language,
      10,
      `${languageIssues.length} writing checks flagged.`,
    ),
    contact: makeCategory(
      "contact",
      contact,
      5,
      "Contact/profile signals checked.",
    ),
  };

  return {
    overall: Object.values(categories).reduce(
      (total, category) => total + category.score,
      0,
    ),
    categories,
  };
}

function weightedSkillScore(
  skills: SkillDefinition[],
  detectedSkills: DetectedSkill[],
  priority: DetectedSkill["priority"],
) {
  if (skills.length === 0) return 1;
  const detectedIds = new Set(
    detectedSkills
      .filter((skill) => skill.priority === priority)
      .map((skill) => skill.id),
  );
  const totalWeight = skills.reduce((total, skill) => total + skill.weight, 0);
  const matchedWeight = skills.reduce(
    (total, skill) => total + (detectedIds.has(skill.id) ? skill.weight : 0),
    0,
  );
  return matchedWeight / totalWeight;
}

function lengthScore(extracted: ExtractedResume) {
  if (extracted.wordCount >= 350 && extracted.wordCount <= 950) return 1;
  if (extracted.wordCount >= 250 && extracted.wordCount <= 1200) return 0.75;
  return 0.4;
}

function contactScore(text: string) {
  const checks = [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\+?\d[\d\s().-]{8,}/,
    /linkedin\.com\/in\//i,
    /(github\.com|portfolio|https?:\/\/)/i,
  ];
  return checks.filter((pattern) => pattern.test(text)).length * 1.25;
}

function makeCategory(
  key: ScoreCategoryKey,
  score: number,
  maxScore: number,
  summary: string,
): ScoreCategory {
  return {
    key,
    label: categoryLabels[key],
    score,
    maxScore,
    summary,
  };
}

function buildFindings(
  extracted: ExtractedResume,
  role: JobRoleProfile,
  scores: AtsScore,
  missingSkills: MissingSkill[],
  sectionCoverage: Record<string, boolean>,
  languageIssues: LanguageIssue[],
): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];

  if (missingSkills.some((skill) => skill.priority === "required")) {
    findings.push({
      id: "missing-required-skills",
      category: "skills",
      severity: "critical",
      title: "Required role skills are missing",
      detail: `${
        missingSkills.filter((skill) => skill.priority === "required").length
      } required ${role.title} skills were not detected.`,
      recommendation:
        "Add honest project, work, or certification evidence for the missing required skills.",
    });
  }

  const missingSections = Object.entries(sectionCoverage)
    .filter(([, isPresent]) => !isPresent)
    .map(([section]) => section);
  if (missingSections.length > 0) {
    findings.push({
      id: "missing-sections",
      category: "structure",
      severity: "warning",
      title: "Expected resume sections are incomplete",
      detail: `Missing or unclear sections: ${missingSections.join(", ")}.`,
      recommendation:
        "Use clear ATS-readable headings for the missing sections.",
    });
  }

  if (scores.categories.impact.score < 8) {
    findings.push({
      id: "low-impact",
      category: "impact",
      severity: "warning",
      title: "Impact evidence is light",
      detail: "Few measurable outcomes or strong action verbs were detected.",
      recommendation:
        "Rewrite bullets with action verb, scope, result, and metric where possible.",
    });
  }

  if (extracted.wordCount < 250 || extracted.wordCount > 1200) {
    findings.push({
      id: "resume-length",
      category: "formatting",
      severity: "info",
      title: "Resume length may need tuning",
      detail: `The extracted resume has about ${extracted.wordCount} words.`,
      recommendation:
        "Most ATS-friendly resumes are concise, targeted, and easy to scan.",
    });
  }

  if (languageIssues.length > 0) {
    findings.push({
      id: "language-issues",
      category: "language",
      severity: "warning",
      title: "Writing checks found issues",
      detail: `${languageIssues.length} grammar, readability, or style signals were flagged.`,
      recommendation:
        "Review the writing issues and tighten bullets before applying.",
    });
  }

  if (scores.categories.contact.score < 3) {
    findings.push({
      id: "contact-signals",
      category: "contact",
      severity: "warning",
      title: "Contact/profile details look incomplete",
      detail:
        "Email, phone, LinkedIn, or portfolio signals were not all detected.",
      recommendation:
        "Add professional contact links in plain text near the top of the resume.",
    });
  }

  findings.push({
    id: "local-privacy",
    category: "privacy",
    severity: "success",
    title: "Resume processed locally",
    detail:
      "The analysis ran in this browser without sending the resume to a server.",
    recommendation: "Export reports manually if you want a backup.",
  });

  return findings;
}

function buildSuggestions(
  findings: AnalysisFinding[],
  missingSkills: MissingSkill[],
) {
  const missingSkillSuggestions = missingSkills
    .slice(0, 6)
    .map((skill) => skill.recommendation);
  const findingSuggestions = findings
    .filter((finding) => finding.severity !== "success")
    .map((finding) => finding.recommendation);

  return Array.from(
    new Set([...missingSkillSuggestions, ...findingSuggestions]),
  ).slice(0, 10);
}

export function getBenchmarkLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Competitive";
  if (score >= 55) return "Needs targeting";
  return "Needs major revision";
}

export function getRoleOptions() {
  return jobRoles.map((role) => ({
    id: role.id,
    title: role.title,
    summary: role.summary,
  }));
}

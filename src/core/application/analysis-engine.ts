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
  summary: [
    /(^|\n)\s*(summary|profile|objective|about)\s*[:\n-]/i,
    /\b(summary|professional summary|profile|objective)\b/i,
  ],
  skills: [
    /(^|\n)\s*(technical skills|skills|core competencies|tools)\s*[:\n-]/i,
    /\b(technical skills|core competencies|skills)\b/i,
  ],
  experience: [
    /(^|\n)\s*(experience|work experience|employment|professional experience)\s*[:\n-]/i,
    /\b(work experience|professional experience|employment history|experience)\b/i,
  ],
  education: [
    /(^|\n)\s*(education|academic|degree|university|college)\s*[:\n-]/i,
    /\b(education|degree|university|college|bachelor|master)\b/i,
  ],
  projects: [
    /(^|\n)\s*(projects|portfolio|selected work)\s*[:\n-]/i,
    /\b(projects|portfolio|selected work|github)\b/i,
  ],
  certifications: [
    /(^|\n)\s*(certifications|licenses|credentials)\s*[:\n-]/i,
    /\b(certifications|certified|certificate|licenses|credentials)\b/i,
  ],
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

const weakPhrases = [
  "responsible for",
  "worked on",
  "helped with",
  "involved in",
  "participated in",
  "familiar with",
  "basic knowledge",
];

const buzzwords = [
  "hardworking",
  "self motivated",
  "self-motivated",
  "team player",
  "quick learner",
  "dynamic",
  "passionate",
  "results driven",
  "detail oriented",
];

const projectProofTerms = [
  "github.com",
  "gitlab.com",
  "portfolio",
  "live demo",
  "deployed",
  "production",
  "repository",
  "source code",
];

const testingTerms = [
  "test",
  "testing",
  "unit test",
  "integration test",
  "e2e",
  "jest",
  "vitest",
  "pytest",
  "junit",
  "mockito",
  "playwright",
  "cypress",
  "selenium",
];

const deploymentTerms = [
  "deployed",
  "vercel",
  "netlify",
  "render",
  "railway",
  "aws",
  "azure",
  "gcp",
  "docker",
  "ci/cd",
  "github actions",
];

const commonTypoPatterns = [
  /\bexperiance\b/i,
  /\bresponsiblity\b/i,
  /\bjavscript\b/i,
  /\bpyhton\b/i,
  /\bmangodb\b/i,
  /\bpostgress\b/i,
  /\brelevent\b/i,
  /\bacheivement\b/i,
];

interface EvidenceSignals {
  metricCount: number;
  actionVerbCount: number;
  weakPhraseCount: number;
  buzzwordCount: number;
  projectProofCount: number;
  testingProofCount: number;
  deploymentProofCount: number;
  certificationProofCount: number;
  personalPronounCount: number;
}

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
    detectedSkills,
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
  if (commonTypoPatterns.some((pattern) => pattern.test(text))) {
    issues.push({
      id: "language-common-typo",
      ruleId: "resume-typo",
      reason: "Common resume or technology spelling mistakes were detected.",
      severity: "warning",
    });
  }
  if (countTermMatches(text, /\b(i|me|my|we|our)\b/gi) > 3) {
    issues.push({
      id: "language-pronouns",
      ruleId: "resume-tone",
      reason:
        "Frequent personal pronouns can make resume bullets feel less direct.",
      severity: "info",
    });
  }
  if (buzzwords.some((phrase) => containsTerm(text.toLowerCase(), phrase))) {
    issues.push({
      id: "language-buzzwords",
      ruleId: "resume-specificity",
      reason:
        "Generic buzzwords were detected without necessarily proving impact.",
      severity: "info",
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
  const evidence = getEvidenceSignals(extracted.text);
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

  const impact = clampScore(
    Math.min(evidence.metricCount * 3, 9) +
      Math.min(evidence.actionVerbCount, 6),
    15,
  );

  const formattingDeductions =
    (extracted.pageEstimate > 3 ? 3 : 0) +
    (/[^\S\r\n]{8,}/.test(extracted.text) ? 2 : 0) +
    ((extracted.text.match(/[\u2022\u25aa\u25cf]/g) ?? []).length > 35
      ? 1
      : 0) +
    (hasTooManyDecorativeSeparators(extracted.text) ? 2 : 0) +
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
      `${evidence.metricCount} measurable outcome signals found.`,
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

function getEvidenceSignals(text: string): EvidenceSignals {
  const lowerText = text.toLowerCase();

  return {
    metricCount: countTermMatches(
      text,
      /(\d+%|\$\d+|\b\d+x\b|\b\d+\+?\s+(users|clients|projects|tickets|hours|days|features|apis|pages|reports)\b)/gi,
    ),
    actionVerbCount: actionVerbs.filter((verb) => containsTerm(lowerText, verb))
      .length,
    weakPhraseCount: weakPhrases.filter((phrase) =>
      containsTerm(lowerText, phrase),
    ).length,
    buzzwordCount: buzzwords.filter((phrase) => containsTerm(lowerText, phrase))
      .length,
    projectProofCount: projectProofTerms.filter((phrase) =>
      containsTerm(lowerText, phrase),
    ).length,
    testingProofCount: testingTerms.filter((phrase) =>
      containsTerm(lowerText, phrase),
    ).length,
    deploymentProofCount: deploymentTerms.filter((phrase) =>
      containsTerm(lowerText, phrase),
    ).length,
    certificationProofCount: countTermMatches(
      text,
      /\b(certification|certified|certificate|aws certified|oracle certified|azure fundamentals)\b/gi,
    ),
    personalPronounCount: countTermMatches(text, /\b(i|me|my|we|our)\b/gi),
  };
}

function countTermMatches(text: string, pattern: RegExp) {
  return (text.match(pattern) ?? []).length;
}

function hasTooManyDecorativeSeparators(text: string) {
  return (
    (text.match(/[|]{3,}/g) ?? []).length > 2 ||
    (text.match(/[-_=]{8,}/g) ?? []).length > 1
  );
}

function isDeveloperRole(role: JobRoleProfile) {
  return /developer|engineer|mern|node|python|java|spring|django|frontend|backend|full stack/i.test(
    role.title,
  );
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
  detectedSkills: DetectedSkill[],
  missingSkills: MissingSkill[],
  sectionCoverage: Record<string, boolean>,
  languageIssues: LanguageIssue[],
): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  const evidence = getEvidenceSignals(extracted.text);
  const requiredDetectedCount = detectedSkills.filter(
    (skill) => skill.priority === "required",
  ).length;
  const requiredCoverage =
    role.requiredSkills.length > 0
      ? requiredDetectedCount / role.requiredSkills.length
      : 1;

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

  if (requiredCoverage < 0.5) {
    findings.push({
      id: "low-role-coverage",
      category: "skills",
      severity: "warning",
      title: "Role keyword coverage is low",
      detail: `Only ${requiredDetectedCount}/${role.requiredSkills.length} required role skills were detected.`,
      recommendation:
        "Retarget the skills and project bullets toward the selected role before applying.",
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

  if (evidence.weakPhraseCount >= 2) {
    findings.push({
      id: "weak-phrasing",
      category: "impact",
      severity: "warning",
      title: "Weak ownership phrases reduce impact",
      detail: `${evidence.weakPhraseCount} weak phrases such as "responsible for" or "worked on" were detected.`,
      recommendation:
        "Start bullets with strong verbs and describe the result you produced.",
    });
  }

  if (evidence.buzzwordCount >= 2 && evidence.metricCount < 2) {
    findings.push({
      id: "buzzword-specificity",
      category: "language",
      severity: "info",
      title: "Generic buzzwords need proof",
      detail: `${evidence.buzzwordCount} generic phrases were detected with limited measurable evidence.`,
      recommendation:
        "Replace soft claims with specific tools, project scope, numbers, or outcomes.",
    });
  }

  if (isDeveloperRole(role) && evidence.projectProofCount === 0) {
    findings.push({
      id: "developer-project-proof",
      category: "skills",
      severity: "warning",
      title: "Developer project proof is missing",
      detail:
        "No GitHub, portfolio, live demo, repository, deployment, or production proof was detected.",
      recommendation:
        "Add project links or deployment evidence so recruiters can verify your developer work.",
    });
  }

  if (isDeveloperRole(role) && evidence.testingProofCount === 0) {
    findings.push({
      id: "developer-testing-proof",
      category: "skills",
      severity: "info",
      title: "Testing evidence is missing",
      detail: "No testing framework or test strategy signal was detected.",
      recommendation:
        "Mention real unit, integration, API, or E2E tests where you used them.",
    });
  }

  if (
    isDeveloperRole(role) &&
    evidence.deploymentProofCount === 0 &&
    scores.categories.skills.score >= 18
  ) {
    findings.push({
      id: "deployment-proof",
      category: "impact",
      severity: "info",
      title: "Deployment evidence would strengthen the resume",
      detail:
        "The resume shows technical skills, but no deployment, cloud, Docker, or CI/CD signal was detected.",
      recommendation:
        "Add where the app or service ran, how it was deployed, or what CI/CD tools were used.",
    });
  }

  if (
    /cloud|security|java|spring|devops|cybersecurity/i.test(role.title) &&
    evidence.certificationProofCount === 0
  ) {
    findings.push({
      id: "certification-proof",
      category: "skills",
      severity: "info",
      title: "Certifications may help this role",
      detail:
        "No certification signal was detected for a role where credentials can improve recruiter confidence.",
      recommendation:
        "Add relevant certifications if you have them; otherwise leave this out rather than inventing one.",
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

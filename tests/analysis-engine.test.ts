import { describe, expect, it } from "vitest";
import {
  analyzeResume,
  detectSkills,
} from "@/core/application/analysis-engine";
import { getRoleById, jobRoles } from "@/core/data/roles";
import type { ExtractedResume } from "@/core/domain/types";

const frontendRole = getRoleById("frontend");

const extracted: ExtractedResume = {
  text: `
    Jane Developer
    jane@example.com | +1 555 123 4567 | linkedin.com/in/jane | github.com/jane
    Summary
    Frontend developer focused on React, TypeScript, JavaScript, HTML, CSS and accessibility.
    Skills
    React, TypeScript, JavaScript, HTML5, CSS3, WCAG, Vitest, Testing Library, Next.js, Tailwind CSS.
    Experience
    Built an analytics dashboard used by 400 users and improved Lighthouse performance by 32%.
    Implemented automated tests and reduced release regressions by 25%.
    Projects
    Created accessible component systems with keyboard support.
    Education
    B.S. Computer Science
  `,
  wordCount: 83,
  pageEstimate: 1,
  fileMeta: {
    name: "frontend-resume.pdf",
    type: "pdf",
    size: 1024,
    lastModified: 1,
  },
  warnings: [],
};

describe("analysis engine", () => {
  it("includes specific developer target roles", () => {
    const roleIds = jobRoles.map((role) => role.id);

    expect(roleIds).toEqual(
      expect.arrayContaining([
        "mern-stack",
        "django-developer",
        "spring-boot-developer",
      ]),
    );
    expect(roleIds).not.toEqual(
      expect.arrayContaining([
        "python-developer",
        "java-developer",
        "node-express",
      ]),
    );
  });

  it("detects configured role skills using aliases", () => {
    const detected = detectSkills(extracted.text.toLowerCase(), frontendRole);
    expect(detected.map((skill) => skill.id)).toEqual(
      expect.arrayContaining([
        "react",
        "typescript",
        "accessibility",
        "nextjs",
      ]),
    );
  });

  it("produces a deterministic ATS score and actionable suggestions", async () => {
    const analysis = await analyzeResume(extracted, frontendRole);
    expect(analysis.scores.overall).toBeGreaterThan(55);
    expect(analysis.roleId).toBe("frontend");
    expect(analysis.suggestions.length).toBeGreaterThan(0);
    expect(JSON.stringify(analysis)).not.toContain(extracted.text);
  });

  it("flags developer resumes that lack proof, testing, and targeted role coverage", async () => {
    const weakResume: ExtractedResume = {
      ...extracted,
      text: `
        Alex Candidate
        alex@example.com
        Summary
        Hardworking quick learner and team player.
        Skills
        HTML, CSS, basic knowledge of JavaScript.
        Experience
        Responsible for websites. Worked on college pages.
        Education
        Bachelor of Computer Applications
      `,
      wordCount: 42,
    };

    const analysis = await analyzeResume(weakResume, getRoleById("mern-stack"));
    const findingIds = analysis.findings.map((finding) => finding.id);

    expect(findingIds).toEqual(
      expect.arrayContaining([
        "low-role-coverage",
        "developer-project-proof",
        "developer-testing-proof",
        "buzzword-specificity",
      ]),
    );
  });
});

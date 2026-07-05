import { beforeEach, describe, expect, it } from "vitest";
import type { ResumeAnalysis } from "@/core/domain/types";
import { historyRepository } from "@/core/infrastructure/history-store";

const analysis: ResumeAnalysis = {
  id: "analysis-1",
  createdAt: "2026-07-05T00:00:00.000Z",
  roleId: "frontend",
  roleLabel: "Frontend Developer",
  fileMeta: {
    name: "resume.pdf",
    type: "pdf",
    size: 1234,
    lastModified: 1,
  },
  textHash: "abc",
  extracted: {
    wordCount: 500,
    pageEstimate: 1,
  },
  scores: {
    overall: 80,
    categories: {
      skills: {
        key: "skills",
        label: "Role Match",
        score: 30,
        maxScore: 35,
        summary: "",
      },
      structure: {
        key: "structure",
        label: "Structure",
        score: 16,
        maxScore: 20,
        summary: "",
      },
      impact: {
        key: "impact",
        label: "Impact",
        score: 12,
        maxScore: 15,
        summary: "",
      },
      formatting: {
        key: "formatting",
        label: "ATS Format",
        score: 12,
        maxScore: 15,
        summary: "",
      },
      language: {
        key: "language",
        label: "Writing",
        score: 6,
        maxScore: 10,
        summary: "",
      },
      contact: {
        key: "contact",
        label: "Contact",
        score: 4,
        maxScore: 5,
        summary: "",
      },
    },
  },
  detectedSkills: [],
  missingSkills: [],
  findings: [],
  languageIssues: [],
  sectionCoverage: {},
  suggestions: [],
};

describe("historyRepository", () => {
  beforeEach(async () => {
    await historyRepository.clear();
  });

  it("stores, exports, imports, and deletes local analyses", async () => {
    await historyRepository.save(analysis);
    expect(await historyRepository.list()).toHaveLength(1);

    const json = await historyRepository.exportJson();
    await historyRepository.clear();
    expect(await historyRepository.list()).toHaveLength(0);

    await expect(historyRepository.importJson(json)).resolves.toBe(1);
    expect(await historyRepository.list()).toHaveLength(1);

    await historyRepository.delete(analysis.id);
    expect(await historyRepository.list()).toHaveLength(0);
  });
});

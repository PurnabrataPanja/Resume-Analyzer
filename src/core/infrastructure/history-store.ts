"use client";

import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  CustomRoleProfile,
  ImportPayload,
  ResumeAnalysis,
} from "@/core/domain/types";

class ResumeAnalyzerDatabase extends Dexie {
  analyses!: Table<ResumeAnalysis, string>;
  customRoles!: Table<CustomRoleProfile, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("resume-analyzer-local");
    this.version(1).stores({
      analyses: "id, createdAt, roleId, roleLabel, textHash",
      customRoles: "id, name, createdAt",
      settings: "id",
    });
  }
}

let database: ResumeAnalyzerDatabase | null = null;

function getDatabase() {
  if (typeof window === "undefined") {
    throw new Error("Local history is available only in the browser.");
  }

  database ??= new ResumeAnalyzerDatabase();
  return database;
}

export const historyRepository = {
  async save(analysis: ResumeAnalysis) {
    await getDatabase().analyses.put(analysis);
  },

  async list() {
    return getDatabase().analyses.orderBy("createdAt").reverse().toArray();
  },

  async delete(id: string) {
    await getDatabase().analyses.delete(id);
  },

  async clear() {
    await getDatabase().analyses.clear();
  },

  async exportJson() {
    const payload: ImportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      analyses: await this.list(),
    };
    return JSON.stringify(payload, null, 2);
  },

  async importJson(json: string) {
    const payload = JSON.parse(json) as ImportPayload;
    if (payload.version !== 1 || !Array.isArray(payload.analyses)) {
      throw new Error("Unsupported history export format.");
    }
    await getDatabase().analyses.bulkPut(payload.analyses);
    return payload.analyses.length;
  },
};

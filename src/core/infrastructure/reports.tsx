"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { getBenchmarkLabel } from "@/core/application/analysis-engine";
import type { ResumeAnalysis } from "@/core/domain/types";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#0f172a",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    borderBottom: "1 solid #cbd5e1",
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
  },
  subtitle: {
    color: "#475569",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  scoreBox: {
    width: "28%",
    padding: 12,
    backgroundColor: "#ecfeff",
    border: "1 solid #99f6e4",
  },
  score: {
    fontSize: 32,
    fontWeight: 700,
    color: "#0f766e",
  },
  details: {
    width: "72%",
    padding: 12,
    backgroundColor: "#f8fafc",
    border: "1 solid #e2e8f0",
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  row: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 5,
  },
  bullet: {
    marginBottom: 5,
    lineHeight: 1.4,
  },
  muted: {
    color: "#64748b",
  },
});

function ReportDocument({ analysis }: { analysis: ResumeAnalysis }) {
  const categories = Object.values(analysis.scores.categories);
  const requiredMissing = analysis.missingSkills.filter(
    (skill) => skill.priority === "required",
  );

  return (
    <Document title={`Resume Analysis - ${analysis.roleLabel}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Resume Analysis Report</Text>
          <Text style={styles.subtitle}>
            {analysis.roleLabel} |{" "}
            {new Date(analysis.createdAt).toLocaleString()} |{" "}
            {analysis.fileMeta.name}
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.scoreBox}>
            <Text style={styles.score}>{analysis.scores.overall}</Text>
            <Text>{getBenchmarkLabel(analysis.scores.overall)}</Text>
          </View>
          <View style={styles.details}>
            <Text>Word count: {analysis.extracted.wordCount}</Text>
            <Text>Estimated pages: {analysis.extracted.pageEstimate}</Text>
            <Text>Detected role skills: {analysis.detectedSkills.length}</Text>
            <Text>Missing required skills: {requiredMissing.length}</Text>
            <Text style={styles.muted}>
              Original resume file is not stored in this report.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          {categories.map((category) => (
            <View key={category.key} style={styles.row}>
              <Text>{category.label}</Text>
              <Text>
                {category.score}/{category.maxScore}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Missing Skills</Text>
          {analysis.missingSkills.slice(0, 10).map((skill) => (
            <Text key={skill.id} style={styles.bullet}>
              - {skill.label} ({skill.priority})
            </Text>
          ))}
          {analysis.missingSkills.length === 0 ? (
            <Text>No major role skill gaps detected.</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {analysis.suggestions.map((suggestion) => (
            <Text key={suggestion} style={styles.bullet}>
              - {suggestion}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function downloadPdfReport(analysis: ResumeAnalysis) {
  const blob = await pdf(<ReportDocument analysis={analysis} />).toBlob();
  downloadBlob(blob, `resume-analysis-${analysis.roleId}.pdf`);
}

export function downloadJsonReport(analysis: ResumeAnalysis) {
  const blob = new Blob([JSON.stringify(analysis, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, `resume-analysis-${analysis.roleId}.json`);
}

export function downloadTextFile(
  content: string,
  fileName: string,
  type = "application/json",
) {
  downloadBlob(new Blob([content], { type }), fileName);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

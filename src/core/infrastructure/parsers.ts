import {
  countWords,
  normalizeWhitespace,
  pageEstimateFromWords,
} from "@/core/application/text-utils";
import {
  toFileMeta,
  validateResumeFile,
} from "@/core/application/file-validation";
import type { ExtractedResume, ResumeFileMeta } from "@/core/domain/types";

export async function parseResumeFile(file: File): Promise<ExtractedResume> {
  const validation = await validateResumeFile(file);

  if (!validation.ok || !validation.fileType) {
    throw new Error(validation.error ?? "Unsupported resume file.");
  }

  const fileMeta = toFileMeta(file, validation.fileType);
  return validation.fileType === "pdf"
    ? parsePdf(file, fileMeta)
    : parseDocx(file, fileMeta);
}

async function parsePdf(
  file: File,
  fileMeta: ResumeFileMeta,
): Promise<ExtractedResume> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());
  const documentTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
  });
  const document = await documentTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  const text = normalizeWhitespace(pages.join("\n\n"));
  if (!text || countWords(text) < 20) {
    throw new Error(
      "This PDF has too little selectable text. Try exporting the resume as text-based PDF or DOCX.",
    );
  }

  const wordCount = countWords(text);
  return {
    text,
    wordCount,
    pageEstimate: Math.max(document.numPages, pageEstimateFromWords(wordCount)),
    fileMeta,
    warnings: [],
  };
}

async function parseDocx(
  file: File,
  fileMeta: ResumeFileMeta,
): Promise<ExtractedResume> {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  const text = normalizeWhitespace(result.value);

  if (!text || countWords(text) < 20) {
    throw new Error("This DOCX has too little readable text.");
  }

  const wordCount = countWords(text);
  return {
    text,
    wordCount,
    pageEstimate: pageEstimateFromWords(wordCount),
    fileMeta,
    warnings: result.messages.map((message) => message.message),
  };
}

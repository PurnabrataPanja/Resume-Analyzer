import type { ResumeFileMeta, SupportedFileType } from "@/core/domain/types";

export const DEFAULT_MAX_FILE_MB = Number(
  process.env.NEXT_PUBLIC_MAX_FILE_MB ?? 8,
);
export const DEFAULT_MAX_FILE_BYTES = DEFAULT_MAX_FILE_MB * 1024 * 1024;

const pdfMimeTypes = new Set(["application/pdf", ""]);
const docxMimeTypes = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "",
]);

export interface FileValidationResult {
  ok: boolean;
  fileType?: SupportedFileType;
  error?: string;
}

export function getFileTypeFromName(
  fileName: string,
): SupportedFileType | null {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) return "pdf";
  if (lowerName.endsWith(".docx")) return "docx";
  return null;
}

export async function validateResumeFile(
  file: File,
  maxBytes = DEFAULT_MAX_FILE_BYTES,
): Promise<FileValidationResult> {
  if (!file) {
    return { ok: false, error: "Choose a PDF or DOCX resume." };
  }

  if (file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `The file is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    };
  }

  const fileType = getFileTypeFromName(file.name);
  if (!fileType) {
    return { ok: false, error: "Only PDF and DOCX files are supported." };
  }

  if (fileType === "pdf" && !pdfMimeTypes.has(file.type)) {
    return {
      ok: false,
      error: "The file extension and MIME type do not match a PDF.",
    };
  }

  if (fileType === "docx" && !docxMimeTypes.has(file.type)) {
    return {
      ok: false,
      error: "The file extension and MIME type do not match a DOCX.",
    };
  }

  const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const looksLikePdf =
    signature[0] === 0x25 &&
    signature[1] === 0x50 &&
    signature[2] === 0x44 &&
    signature[3] === 0x46;
  const looksLikeZip = signature[0] === 0x50 && signature[1] === 0x4b;

  if (fileType === "pdf" && !looksLikePdf) {
    return {
      ok: false,
      error: "The file contents do not look like a valid PDF.",
    };
  }

  if (fileType === "docx" && !looksLikeZip) {
    return {
      ok: false,
      error: "The file contents do not look like a valid DOCX.",
    };
  }

  return { ok: true, fileType };
}

export function toFileMeta(
  file: File,
  type: SupportedFileType,
): ResumeFileMeta {
  return {
    name: file.name,
    type,
    size: file.size,
    lastModified: file.lastModified,
  };
}

import { describe, expect, it } from "vitest";
import { validateResumeFile } from "@/core/application/file-validation";

function makeFile(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type, lastModified: 1 });
}

describe("validateResumeFile", () => {
  it("accepts a PDF with matching extension, MIME type, and signature", async () => {
    const file = makeFile(
      "resume.pdf",
      "application/pdf",
      [0x25, 0x50, 0x44, 0x46, 0x2d],
    );

    await expect(validateResumeFile(file)).resolves.toMatchObject({
      ok: true,
      fileType: "pdf",
    });
  });

  it("accepts a DOCX zip signature", async () => {
    const file = makeFile(
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      [0x50, 0x4b, 0x03, 0x04],
    );

    await expect(validateResumeFile(file)).resolves.toMatchObject({
      ok: true,
      fileType: "docx",
    });
  });

  it("rejects unsupported extensions", async () => {
    const file = makeFile(
      "resume.exe",
      "application/octet-stream",
      [0x4d, 0x5a],
    );

    await expect(validateResumeFile(file)).resolves.toMatchObject({
      ok: false,
    });
  });
});

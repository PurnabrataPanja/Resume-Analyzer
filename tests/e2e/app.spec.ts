import { expect, test } from "@playwright/test";

test("loads the analyzer dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Resume Analyzer" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /upload resume/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Target role")).toBeVisible();
});

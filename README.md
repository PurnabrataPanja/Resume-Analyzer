# Resume Analyzer

A free, no-login AI Resume Analyzer that runs in the browser and deploys on Vercel without paid APIs, accounts, or backend services.

## What It Does

- Upload PDF or DOCX resumes.
- Extract text locally with open-source parsers.
- Score the resume against a selected role using deterministic ATS rules.
- Detect missing role skills, section gaps, weak impact signals, writing issues, and formatting risks.
- Analyze developer proof signals such as GitHub/portfolio links, testing, deployment, certifications, measurable outcomes, and weak phrasing.
- Store analysis history locally in IndexedDB.
- Export/import history as JSON.
- Download PDF or JSON reports.

No resume file is uploaded to a server, no original resume file is stored by default, and no login/signup is implemented.

## Tech Stack

- Next.js, React, TypeScript, Tailwind CSS
- PDF parsing: `pdfjs-dist`
- DOCX parsing: `mammoth`
- Local storage: Dexie over IndexedDB
- Grammar/readability checks: `unified` and `retext`
- Reports: `@react-pdf/renderer`
- Tests: Vitest, Testing Library, Playwright, axe

## Trade-Offs

This project intentionally avoids paid LLM APIs and cloud databases. The analysis is deterministic and private, but it cannot provide generative LLM-quality rewriting or cross-device account sync. Users can move data manually with JSON export/import.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Optional local config:

```bash
cp .env.example .env.local
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run test:a11y
npm run format:check
```

## Deployment On Vercel

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Keep the default Next.js build settings.
4. Add optional public environment variables from `.env.example` if desired.
5. Deploy on the Hobby/free plan.

The app has no required secrets and no required external services.

## Security And Privacy

- Allowed file types: `.pdf`, `.docx`.
- Default max file size: 8 MB.
- File extension, MIME type, and file signatures are validated.
- Resumes are parsed in the browser.
- Analysis history is stored only in the current browser/device.
- Security headers are configured in `next.config.ts`.
- Extracted HTML is not rendered; the app works from plain text.

## Scoring Model

- Role/skill match: 35 points
- Structure/completeness: 20 points
- Measurable impact: 15 points
- ATS formatting: 15 points
- Grammar/readability: 10 points
- Contact/profile completeness: 5 points

## Included Target Roles

The role selector includes broad profiles plus specific developer tracks such as MERN Stack Developer, Django Developer, and Spring Boot Developer. Each role has its own required and preferred skill taxonomy.

git commit -m "feat: add history dashboard and report exports"
git commit -m "test: cover validation scoring history and accessibility"
git commit -m "docs: add setup deployment and privacy guide"
```

# DocuPilot AI

A hackathon MVP for generating project documentation from a description and/or ZIP source code.

## Features

- Project information form with academic, hackathon, and technical documentation styles.
- ZIP upload with extension filtering, ignored build folders, file-count and size limits, and basic secret redaction.
- Lightweight source-code and dependency summary.
- Gemini-powered structured documentation generation with Zod validation.
- Editable sections, Mermaid architecture preview, Markdown download, and browser print-to-PDF.
- No database or login required.

## Requirements

- Node.js 20 or later recommended.
- A Gemini API key from https://aistudio.google.com/apikey.

## Run locally

1. Extract the project ZIP.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file:

   ```bash
   cp .env.example .env.local
   ```

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

5. Add your API key to `.env.local`:

   ```env
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=your_supported_model
   ```

   Choose a model available to your API key. If `GEMINI_MODEL` is omitted, the app defaults to `gemini-2.5-flash`; change this if that model is unavailable to your account.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open http://localhost:3000.

## Workflow

1. Enter a project title and description, or upload a ZIP archive.
2. If uploading a ZIP, click **Analyze source code**.
3. Click **Generate documentation**.
4. Navigate through sections and edit the draft.
5. Export to PDF using the browser print dialog, or download Markdown.

## Security notes

- Uploaded source is processed in the API request and is not saved to a database by this MVP.
- Selected source context is sent to the configured Gemini API when generating documentation. Do not upload confidential code unless you are authorized to share it with that provider.
- The ZIP processor has basic size, path, file-count, and file-type protections. This is a hackathon starter, not a security-audited file-processing service.
- Rate limiting, authentication, stronger secret scanning, background processing, and persistent project history should be added before exposing this publicly.
- Never commit `.env.local`; API credentials must remain server-side.

## Deployment

Deploy to Vercel or another compatible Node.js hosting provider. Add `GEMINI_API_KEY` and, optionally, `GEMINI_MODEL` in the hosting project's environment-variable settings. Test upload size and request-duration limits on the selected plan.

## Known MVP limitations

- Source analysis uses lightweight heuristics; it is not a full compiler or semantic analyzer.
- PDF export uses browser print-to-PDF. Choose “Save as PDF” in the print dialog.
- DOCX export, GitHub repository import, authentication, and saved history are not implemented.
- The section editor edits core text/list sections. Technology and module cards are currently read-only.
- Regenerate-section is not implemented in this first starter build.

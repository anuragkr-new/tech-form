import {
  buildExportColumns,
  buildSubmissionRow,
  buildSubmissionRows,
  type ExportQuestion,
  type ExportSubmission,
} from "@/lib/submission-export";

export function isGoogleSheetsEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() &&
      process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim(),
  );
}

async function postToSheetWebhook(payload: Record<string, unknown>): Promise<number> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl || !secret) {
    throw new Error("Google Sheets sync is not configured.");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, ...payload }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Google Sheets webhook failed (${response.status}): ${body}`);
  }

  let parsed: { error?: string; success?: boolean; synced?: number };
  try {
    parsed = JSON.parse(body) as { error?: string; success?: boolean; synced?: number };
  } catch {
    return 0;
  }

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  return parsed.synced ?? 0;
}

export async function appendSubmissionToSheet(
  submission: ExportSubmission,
  questions: ExportQuestion[],
): Promise<void> {
  const columns = buildExportColumns(questions);
  const row = buildSubmissionRow(submission, questions);

  await postToSheetWebhook({ columns, row });
}

export async function syncAllSubmissionsToSheet(
  submissions: ExportSubmission[],
  questions: ExportQuestion[],
): Promise<number> {
  const columns = buildExportColumns(questions);
  const rows = buildSubmissionRows(submissions, questions);

  const synced = await postToSheetWebhook({
    columns,
    rows,
    mode: "replace",
  });

  return synced || rows.length;
}

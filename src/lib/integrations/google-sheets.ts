import {
  buildExportColumns,
  buildSubmissionRow,
  buildSubmissionRows,
  type ExportQuestion,
  type ExportSubmission,
} from "@/lib/submission-export";

type SheetsWebhookResponse = {
  error?: string;
  success?: boolean;
  synced?: number;
  status?: string;
  message?: string;
};

export function isGoogleSheetsEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim() &&
      process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim(),
  );
}

/**
 * Google Apps Script web apps respond to POST with a 302 to a one-time
 * script.googleusercontent.com URL that must be fetched with GET.
 * Node fetch can mishandle that; follow the redirect manually.
 */
async function fetchAppsScriptWebhook(
  url: string,
  body: string,
): Promise<Response> {
  const initial = await fetch(url, {
    method: "POST",
    // text/plain avoids JSON preflight quirks with Apps Script web apps
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body,
    redirect: "manual",
  });

  if (initial.status >= 300 && initial.status < 400) {
    const location = initial.headers.get("Location");
    // Drain the body so the connection can close cleanly
    await initial.text().catch(() => undefined);

    if (!location) {
      throw new Error(
        `Google Sheets webhook redirected (${initial.status}) without a Location header.`,
      );
    }

    return fetch(location, {
      method: "GET",
      redirect: "follow",
    });
  }

  return initial;
}

async function postToSheetWebhook(payload: Record<string, unknown>): Promise<number> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET?.trim();

  if (!webhookUrl || !secret) {
    throw new Error("Google Sheets sync is not configured.");
  }

  const body = JSON.stringify({ secret, ...payload });
  const response = await fetchAppsScriptWebhook(webhookUrl, body);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Google Sheets webhook failed (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  let parsed: SheetsWebhookResponse;
  try {
    parsed = JSON.parse(text) as SheetsWebhookResponse;
  } catch {
    throw new Error(
      `Unexpected Google Sheets response (not JSON): ${text.slice(0, 300)}`,
    );
  }

  if (parsed.error) {
    throw new Error(parsed.error);
  }

  // doGet health-check responses look like { status: "ok" } — never treat as sync success
  if (parsed.success !== true) {
    throw new Error(
      `Google Sheets sync did not confirm success. Response: ${text.slice(0, 300)}`,
    );
  }

  return typeof parsed.synced === "number" ? parsed.synced : 0;
}

export async function appendSubmissionToSheet(
  submission: ExportSubmission,
  questions: ExportQuestion[],
): Promise<void> {
  const columns = buildExportColumns(questions);
  const row = buildSubmissionRow(submission, questions);

  await postToSheetWebhook({ columns, row, mode: "append" });
}

export async function syncAllSubmissionsToSheet(
  submissions: ExportSubmission[],
  questions: ExportQuestion[],
): Promise<number> {
  const columns = buildExportColumns(questions);
  const rows = buildSubmissionRows(submissions, questions);

  return postToSheetWebhook({
    columns,
    rows,
    mode: "replace",
  });
}

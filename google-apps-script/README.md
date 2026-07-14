# Google Sheets Webhook Setup

This folder contains the Google Apps Script that receives new form submissions from Tech Form and appends them to your spreadsheet.

## 1. Create the spreadsheet

1. Open [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like **JAS Targets Submissions**.

## 2. Add the Apps Script

1. In the spreadsheet, go to **Extensions → Apps Script**.
2. Delete any default code in `Code.gs`.
3. Copy the contents of `Code.gs` from this folder and paste it into the Apps Script editor.
4. Set a strong shared secret in the script:

```javascript
const WEBHOOK_SECRET = "paste-a-long-random-secret-here";
```

Generate one with:

```bash
openssl rand -base64 32
```

5. Optionally change `SHEET_NAME` if you want a different tab name (default: `Submissions`).
6. Click **Save**.

## 3. Deploy as a web app

1. Click **Deploy → New deployment**.
2. Click the gear icon next to **Select type** and choose **Web app**.
3. Use these settings:
   - **Description:** Tech Form webhook
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Authorize the app when prompted.
6. Copy the **Web app URL** — it looks like:

```
https://script.google.com/macros/s/AKfycb.../exec
```

## 4. Configure Tech Form

Add these environment variables to your `.env` (local) or Railway/hosting dashboard (production):

```bash
GOOGLE_SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
GOOGLE_SHEETS_WEBHOOK_SECRET=the-same-secret-from-code-gs
```

Restart the app after setting the variables.

## 5. Test it

1. Open the web app URL in your browser. You should see:

```json
{"status":"ok","message":"Tech Form Google Sheets webhook is running"}
```

2. Submit a test form entry in Tech Form.
3. Check the **Submissions** tab in your spreadsheet — a new row should appear.

## How it works

- On each successful form submission, Tech Form POSTs JSON to your Apps Script URL.
- The script verifies the shared secret, creates the `Submissions` sheet if needed, writes headers on the first row, then appends the submission.
- The admin **Sync to Sheet** button sends all submissions in one request and replaces the sheet contents to match the database.
- Column order matches the admin CSV export.
- If the Sheets sync fails, the form submission still succeeds — errors are logged server-side only.

## Updating the script

If you change `Code.gs`:

1. Save the script.
2. Go to **Deploy → Manage deployments**.
3. Click the pencil icon on the active deployment.
4. Change **Version** to **New version**.
5. Click **Deploy**.

The web app URL stays the same.

## Troubleshooting

**Sync says it worked but the sheet is empty**
- Look for a tab named **Submissions** (not just Sheet1). The script writes there by default.
- Or set `SHEET_NAME = ""` in `Code.gs` to write to the first sheet instead, then redeploy a **New version**.

**Admin shows Unauthorized**
- `WEBHOOK_SECRET` in `Code.gs` must exactly match `GOOGLE_SHEETS_WEBHOOK_SECRET` in the app env.
- After changing the secret, save and deploy a **New version**.

**Admin shows “did not confirm success” / Invalid payload**
- The live deployment is still on an old script version. Paste the latest `Code.gs`, then **Deploy → Manage deployments → Edit → Version: New version → Deploy**.

**Who has access**
- Deployment access must be **Anyone** (not only your Google account), or the server-side POST will not reach `doPost`.

## Security notes

- Keep `WEBHOOK_SECRET` and `GOOGLE_SHEETS_WEBHOOK_SECRET` identical and private.
- Do not commit secrets to git.
- The webhook only accepts POST requests with the correct secret.

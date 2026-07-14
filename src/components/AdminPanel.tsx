"use client";

import { useMemo, useState } from "react";
import type { AdminUserRecord, FormSettingsData, Question, Submission } from "@/types/form";

type AdminPanelProps = {
  initialQuestions: Question[];
  initialSubmissions: Submission[];
  initialSettings: FormSettingsData;
  initialAdmins: AdminUserRecord[];
  currentUserEmail: string;
  googleSheetsEnabled: boolean;
};

type EditableOption = {
  id?: string;
  label: string;
};

type EditableQuestion = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  isSystem: boolean;
  options: EditableOption[];
};

const PILL_ANSWER_KEYS = new Set(["team_name", "related_product", "when_needed"]);

function getAnswerByKey(submission: Submission, questionKey: string) {
  return submission.answers.find((answer) => answer.question.key === questionKey)?.value ?? "";
}

function SubmissionCell({
  value,
  questionKey,
}: {
  value: string;
  questionKey: string;
}) {
  if (!value) {
    return <span className="jas-admin-table-empty">—</span>;
  }

  if (PILL_ANSWER_KEYS.has(questionKey)) {
    return <span className="jas-admin-pill">{value}</span>;
  }

  return (
    <span className="jas-admin-table-cell-text" title={value}>
      {value}
    </span>
  );
}

export function AdminPanel({
  initialQuestions,
  initialSubmissions,
  initialSettings,
  initialAdmins,
  currentUserEmail,
  googleSheetsEnabled,
}: AdminPanelProps) {
  const [tab, setTab] = useState<"questions" | "submissions" | "admins">("questions");
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    initialQuestions.map((question) => ({
      id: question.id,
      key: question.key,
      label: question.label,
      type: question.type,
      required: question.required,
      isSystem: question.isSystem,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
      })),
    })),
  );
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [title, setTitle] = useState(initialSettings.title);
  const [subtitle, setSubtitle] = useState(initialSettings.subtitle);
  const [saving, setSaving] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [message, setMessage] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [admins, setAdmins] = useState(initialAdmins);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
  const [adminsMessage, setAdminsMessage] = useState("");
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [sheetsMessage, setSheetsMessage] = useState("");
  const [sheetsMessageTone, setSheetsMessageTone] = useState<"success" | "error" | "">("");

  const normalizedCurrentEmail = currentUserEmail.trim().toLowerCase();

  const tableColumns = useMemo(
    () =>
      initialQuestions
        .filter((question) => question.type !== "email")
        .sort((a, b) => a.order - b.order),
    [initialQuestions],
  );

  function updateQuestion(id: string, patch: Partial<EditableQuestion>) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  }

  function addOption(questionId: string) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: [...question.options, { label: "" }] }
          : question,
      ),
    );
  }

  function updateOption(questionId: string, index: number, label: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        const options = [...question.options];
        options[index] = { ...options[index], label };
        return { ...question, options };
      }),
    );
  }

  function removeOption(questionId: string, index: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question;
        return {
          ...question,
          options: question.options.filter((_, optionIndex) => optionIndex !== index),
        };
      }),
    );
  }

  async function saveSettings() {
    setSavingSettings(true);
    setSettingsMessage("");

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subtitle }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save form header.");
      }

      setTitle(data.settings.title);
      setSubtitle(data.settings.subtitle);
      setSettingsMessage("Form header saved successfully.");
    } catch (error) {
      setSettingsMessage(
        error instanceof Error ? error.message : "Failed to save form header.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveQuestions() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save questions.");
      }

      setQuestions(
        data.questions.map((question: Question) => ({
          id: question.id,
          key: question.key,
          label: question.label,
          type: question.type,
          required: question.required,
          isSystem: question.isSystem,
          options: question.options.map((option: { id: string; label: string }) => ({
            id: option.id,
            label: option.label,
          })),
        })),
      );
      setMessage("Questions saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save questions.");
    } finally {
      setSaving(false);
    }
  }

  async function refreshSubmissions() {
    const response = await fetch("/api/submissions");
    const data = await response.json();
    if (response.ok) {
      setSubmissions(data.submissions);
    }
  }

  async function refreshAdmins() {
    const response = await fetch("/api/admins");
    const data = await response.json();
    if (response.ok) {
      setAdmins(data.admins);
    }
  }

  async function addAdmin() {
    setAddingAdmin(true);
    setAdminsMessage("");

    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to add admin.");
      }

      setAdmins((current) => [...current, data.admin]);
      setNewAdminEmail("");
      setAdminsMessage(`${data.admin.email} added as admin.`);
    } catch (error) {
      setAdminsMessage(error instanceof Error ? error.message : "Failed to add admin.");
    } finally {
      setAddingAdmin(false);
    }
  }

  async function downloadSubmissionsCsv() {
    setDownloadingCsv(true);
    setSheetsMessage("");
    setSheetsMessageTone("");

    try {
      const response = await fetch("/api/submissions/export");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to download CSV.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "jas-targets-submissions.csv";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setSheetsMessageTone("error");
      setSheetsMessage(error instanceof Error ? error.message : "Failed to download CSV.");
    } finally {
      setDownloadingCsv(false);
    }
  }

  async function syncSubmissionsToSheet() {
    setSyncingSheets(true);
    setSheetsMessage("");
    setSheetsMessageTone("");

    try {
      const response = await fetch("/api/submissions/sync-sheets", {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to sync submissions to Google Sheets.");
      }

      const synced = typeof data.synced === "number" ? data.synced : 0;
      setSheetsMessageTone("success");
      setSheetsMessage(
        synced === 0
          ? "Synced 0 rows — sheet headers updated."
          : `Synced ${synced} row${synced === 1 ? "" : "s"} to Google Sheets.`,
      );
    } catch (error) {
      setSheetsMessageTone("error");
      setSheetsMessage(
        error instanceof Error ? error.message : "Failed to sync submissions to Google Sheets.",
      );
    } finally {
      setSyncingSheets(false);
    }
  }

  async function removeAdmin(admin: AdminUserRecord) {
    setRemovingAdminId(admin.id);
    setAdminsMessage("");

    try {
      const response = await fetch(`/api/admins?id=${encodeURIComponent(admin.id)}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove admin.");
      }

      setAdmins((current) => current.filter((item) => item.id !== admin.id));
      setAdminsMessage(`${admin.email} removed from admins.`);
    } catch (error) {
      setAdminsMessage(error instanceof Error ? error.message : "Failed to remove admin.");
    } finally {
      setRemovingAdminId(null);
    }
  }

  return (
    <div className="jas-card jas-admin-card">
      <div className="jas-admin-tabs">
        <TabButton active={tab === "questions"} onClick={() => setTab("questions")}>
          Edit questions
        </TabButton>
        <TabButton
          active={tab === "submissions"}
          onClick={() => {
            setTab("submissions");
            void refreshSubmissions();
          }}
        >
          View submissions ({submissions.length})
        </TabButton>
        <TabButton
          active={tab === "admins"}
          onClick={() => {
            setTab("admins");
            void refreshAdmins();
          }}
        >
          Manage admins ({admins.length})
        </TabButton>
      </div>

      {message && <p className="jas-admin-message">{message}</p>}
      {settingsMessage && <p className="jas-admin-message">{settingsMessage}</p>}
      {adminsMessage && <p className="jas-admin-message">{adminsMessage}</p>}

      {tab === "questions" && (
        <>
          <section className="jas-admin-block">
            <h2 className="jas-admin-block-title">Form header</h2>
            <p className="jas-admin-block-desc">
              Edit the title and subtitle shown at the top of the form. Use{" "}
              <code>{"{email}"}</code> in the subtitle to insert the signed-in
              user&apos;s email.
            </p>

            <div className="jas-admin-field">
              <label className="jas-label" htmlFor="admin-form-title">
                Title
              </label>
              <input
                id="admin-form-title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="jas-input"
              />
            </div>

            <div className="jas-admin-field">
              <label className="jas-label" htmlFor="admin-form-subtitle">
                Subtitle
              </label>
              <textarea
                id="admin-form-subtitle"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
                rows={3}
                className="jas-textarea"
                style={{ minHeight: "96px" }}
              />
            </div>

            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={savingSettings}
              className="jas-admin-btn-primary"
            >
              {savingSettings ? "Saving..." : "Save header"}
            </button>
          </section>

          {questions.map((question, index) => (
            <section key={question.id} className="jas-admin-block">
              <div className="jas-admin-meta">
                <div>
                  <p className="jas-admin-meta-label">Question {index + 1}</p>
                  <p className="jas-admin-meta-key">{question.key}</p>
                </div>
                <label className="jas-admin-checkbox">
                  <input
                    type="checkbox"
                    checked={question.required}
                    disabled={question.type === "email"}
                    onChange={(event) =>
                      updateQuestion(question.id, { required: event.target.checked })
                    }
                  />
                  Mandatory
                </label>
              </div>

              <div className="jas-admin-field">
                <label className="jas-label" htmlFor={`question-${question.id}`}>
                  Question text
                </label>
                <input
                  id={`question-${question.id}`}
                  type="text"
                  value={question.label}
                  disabled={question.type === "email"}
                  onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                  className="jas-input"
                />
              </div>

              {question.type === "select" && (
                <div className="jas-admin-field">
                  <div className="jas-admin-options-header">
                    <span className="jas-admin-options-title">Options</span>
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="jas-admin-btn-secondary"
                    >
                      Add option
                    </button>
                  </div>

                  {question.options.map((option, optionIndex) => (
                    <div key={option.id ?? `new-${optionIndex}`} className="jas-admin-option-row">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(event) =>
                          updateOption(question.id, optionIndex, event.target.value)
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                        className="jas-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optionIndex)}
                        className="jas-admin-btn-danger"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "email" && (
                <p className="jas-admin-hint">
                  Email is auto-filled from Google sign-in and is always mandatory.
                </p>
              )}
            </section>
          ))}

          <div className="jas-admin-actions">
            <button
              type="button"
              onClick={() => void saveQuestions()}
              disabled={saving}
              className="jas-submit"
              style={{ width: "auto", minWidth: "180px" }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </>
      )}

      {tab === "submissions" && (
        <>
          <div className="jas-admin-submissions-toolbar">
            <p className="jas-admin-block-desc" style={{ margin: 0 }}>
              Export all submission data or replace the Google Sheet with the latest
              submissions from the database.
            </p>
            <div className="jas-admin-submissions-actions">
              <button
                type="button"
                onClick={() => void syncSubmissionsToSheet()}
                disabled={!googleSheetsEnabled || syncingSheets || downloadingCsv}
                className="jas-admin-btn-secondary"
                title={
                  googleSheetsEnabled
                    ? "Replace the Google Sheet with all submissions"
                    : "Set GOOGLE_SHEETS_WEBHOOK_URL and GOOGLE_SHEETS_WEBHOOK_SECRET to enable"
                }
              >
                {syncingSheets ? "Syncing..." : "Sync to Sheet"}
              </button>
              <button
                type="button"
                onClick={() => void downloadSubmissionsCsv()}
                disabled={downloadingCsv || syncingSheets}
                className="jas-admin-btn-primary"
              >
                {downloadingCsv ? "Preparing CSV..." : "Download CSV"}
              </button>
            </div>
          </div>

          {sheetsMessage && (
            <p
              className={`jas-admin-sync-status jas-admin-sync-status--${sheetsMessageTone || "info"}`}
              role="status"
              aria-live="polite"
            >
              {sheetsMessage}
            </p>
          )}

          {submissions.length === 0 ? (
            <p className="jas-admin-empty">No submissions yet.</p>
          ) : (
            <div className="jas-admin-table-wrap">
              <table className="jas-admin-table">
                <thead>
                  <tr>
                    <th>Submitted</th>
                    <th>Email</th>
                    {tableColumns.map((question) => (
                      <th key={question.id}>{question.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id}>
                      <td className="jas-admin-table-date">
                        {new Date(submission.createdAt).toLocaleString()}
                      </td>
                      <td className="jas-admin-table-email">{submission.email}</td>
                      {tableColumns.map((question) => (
                        <td key={`${submission.id}-${question.id}`}>
                          <SubmissionCell
                            value={getAnswerByKey(submission, question.key)}
                            questionKey={question.key}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "admins" && (
        <>
          <section className="jas-admin-block">
            <h2 className="jas-admin-block-title">Add admin</h2>
            <p className="jas-admin-block-desc">
              Grant admin access to another email. New admins can edit the form,
              view submissions, and manage other admins.
            </p>

            <div className="jas-admin-add-admin">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(event) => setNewAdminEmail(event.target.value)}
                placeholder="colleague@company.com"
                className="jas-input"
              />
              <button
                type="button"
                onClick={() => void addAdmin()}
                disabled={addingAdmin || !newAdminEmail.trim()}
                className="jas-admin-btn-primary"
              >
                {addingAdmin ? "Adding..." : "Add admin"}
              </button>
            </div>
          </section>

          <section className="jas-admin-block">
            <h2 className="jas-admin-block-title">Current admins</h2>
            {admins.length === 0 ? (
              <p className="jas-admin-empty">No admins configured yet.</p>
            ) : (
              <div className="jas-admin-table-wrap">
                <table className="jas-admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Added</th>
                      <th>Added by</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => {
                      const isSelf = admin.email === normalizedCurrentEmail;
                      const canRemove = !admin.protected && !isSelf;

                      return (
                        <tr key={admin.id}>
                          <td className="jas-admin-table-email">
                            {admin.email}
                            {isSelf ? <span className="jas-admin-you-pill">You</span> : null}
                            {admin.protected ? (
                              <span className="jas-admin-protected-pill">Env protected</span>
                            ) : null}
                          </td>
                          <td className="jas-admin-table-date">
                            {new Date(admin.createdAt).toLocaleString()}
                          </td>
                          <td>{admin.createdBy ?? "—"}</td>
                          <td>
                            {canRemove ? (
                              <button
                                type="button"
                                onClick={() => void removeAdmin(admin)}
                                disabled={removingAdminId === admin.id}
                                className="jas-admin-btn-danger"
                              >
                                {removingAdminId === admin.id ? "Removing..." : "Remove"}
                              </button>
                            ) : (
                              <span className="jas-admin-table-empty">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`jas-admin-tab ${active ? "jas-admin-tab--active" : ""}`}
    >
      {children}
    </button>
  );
}

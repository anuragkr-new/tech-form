"use client";

import { useMemo, useState } from "react";
import type { FormSettingsData, Question, Submission } from "@/types/form";

type AdminPanelProps = {
  initialQuestions: Question[];
  initialSubmissions: Submission[];
  initialSettings: FormSettingsData;
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

export function AdminPanel({
  initialQuestions,
  initialSubmissions,
  initialSettings,
}: AdminPanelProps) {
  const [tab, setTab] = useState<"questions" | "submissions">("questions");
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

  const questionLabels = useMemo(
    () => new Map(questions.map((question) => [question.id, question.label])),
    [questions],
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
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
      </div>

      {message && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
          {message}
        </p>
      )}

      {settingsMessage && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
          {settingsMessage}
        </p>
      )}

      {tab === "questions" && (
        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Form header</h2>
            <p className="mt-2 text-sm text-muted">
              Edit the title and subtitle shown at the top of the form. Use{" "}
              <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs">
                {"{email}"}
              </code>{" "}
              in the subtitle to insert the signed-in user&apos;s email.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium">Title</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Subtitle</span>
                <textarea
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>

              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={savingSettings}
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
              >
                {savingSettings ? "Saving..." : "Save header"}
              </button>
            </div>
          </section>

          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">Question {index + 1}</p>
                  <p className="font-mono text-xs text-accent">{question.key}</p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={question.required}
                    disabled={question.type === "email"}
                    onChange={(event) =>
                      updateQuestion(question.id, { required: event.target.checked })
                    }
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  Mandatory
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">Question text</span>
                <input
                  type="text"
                  value={question.label}
                  disabled={question.type === "email"}
                  onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-70"
                />
              </label>

              {question.type === "select" && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Options</span>
                    <button
                      type="button"
                      onClick={() => addOption(question.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition hover:border-accent"
                    >
                      Add option
                    </button>
                  </div>

                  {question.options.map((option, optionIndex) => (
                    <div key={option.id ?? `new-${optionIndex}`} className="flex gap-2">
                      <input
                        type="text"
                        value={option.label}
                        onChange={(event) =>
                          updateOption(question.id, optionIndex, event.target.value)
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(question.id, optionIndex)}
                        className="rounded-lg border border-red-500/30 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "email" && (
                <p className="mt-3 text-xs text-muted">
                  Email is auto-filled from Google sign-in and is always mandatory.
                </p>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => void saveQuestions()}
            disabled={saving}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}

      {tab === "submissions" && (
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface p-8 text-center text-muted">
              No submissions yet.
            </p>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{submission.email}</p>
                    <p className="text-xs text-muted">
                      {new Date(submission.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3">
                  {submission.answers.map((answer) => (
                    <div key={answer.id}>
                      <dt className="text-xs uppercase tracking-wide text-muted">
                        {answer.question.label || questionLabels.get(answer.question.id)}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm">
                        {answer.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
        </div>
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
      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-accent text-white"
          : "border border-border bg-surface text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

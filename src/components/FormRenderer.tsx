"use client";

import { FormEvent, useState } from "react";
import type { Question } from "@/types/form";

const inputClassName =
  "w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-accent disabled:cursor-not-allowed disabled:opacity-70";

type FormRendererProps = {
  questions: Question[];
  userEmail: string;
  onSubmit: (answers: Array<{ questionId: string; value: string }>) => Promise<void>;
};

export function FormRenderer({ questions, userEmail, onSubmit }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateValue(questionId: string, value: string) {
    setValues((current) => ({ ...current, [questionId]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const answers = questions.map((question) => ({
        questionId: question.id,
        value: question.type === "email" ? userEmail : (values[question.id] ?? ""),
      }));

      await onSubmit(answers);
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-2xl text-accent">
          ✓
        </div>
        <h2 className="text-2xl font-semibold">Submission received</h2>
        <p className="mt-2 text-muted">
          Your JAS Targets request has been submitted. The team will review it shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setValues({});
          }}
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-hover"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
      {questions.map((question) => (
        <Field
          key={question.id}
          label={question.label}
          htmlFor={question.id}
          required={question.required}
        >
          {question.type === "email" && (
            <input
              id={question.id}
              type="email"
              value={userEmail}
              disabled
              className={inputClassName}
            />
          )}

          {question.type === "text" && (
            <input
              id={question.id}
              type="text"
              value={values[question.id] ?? ""}
              onChange={(event) => updateValue(question.id, event.target.value)}
              required={question.required}
              className={inputClassName}
            />
          )}

          {question.type === "textarea" && (
            <textarea
              id={question.id}
              rows={4}
              value={values[question.id] ?? ""}
              onChange={(event) => updateValue(question.id, event.target.value)}
              required={question.required}
              className={`${inputClassName} resize-y`}
            />
          )}

          {question.type === "select" && (
            <select
              id={question.id}
              value={values[question.id] ?? ""}
              onChange={(event) => updateValue(question.id, event.target.value)}
              required={question.required}
              className={inputClassName}
            >
              <option value="">Select an option</option>
              {question.options.map((option) => (
                <option key={option.id} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      ))}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit request"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  );
}

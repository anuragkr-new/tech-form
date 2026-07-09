"use client";

import { FormEvent, useState } from "react";
import { BubbleSelect } from "@/components/BubbleSelect";
import { CustomDropdown } from "@/components/CustomDropdown";
import type { Question } from "@/types/form";

const BUBBLE_KEYS = new Set(["team_name", "related_product"]);
const DROPDOWN_KEYS = new Set(["target_goal", "when_needed"]);

const FIELD_ERRORS: Record<string, string> = {
  team_name: "Please select a team",
  target_goal: "Please select a target goal",
  description: "Please describe the requirement",
  when_needed: "Please select a timeframe",
  email: "Email is required",
};

type FormRendererProps = {
  questions: Question[];
  userEmail: string;
  onSubmit: (answers: Array<{ questionId: string; value: string }>) => Promise<void>;
};

function usesBubbles(question: Question) {
  return BUBBLE_KEYS.has(question.key) || (question.type === "select" && question.options.length <= 4 && !DROPDOWN_KEYS.has(question.key));
}

function usesDropdown(question: Question) {
  return DROPDOWN_KEYS.has(question.key) || (question.type === "select" && !usesBubbles(question));
}

export function FormRenderer({ questions, userEmail, onSubmit }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  function updateValue(questionId: string, value: string) {
    setValues((current) => ({ ...current, [questionId]: value }));
    setFieldErrors((current) => {
      if (!current[questionId]) return current;
      const next = { ...current };
      delete next[questionId];
      return next;
    });
  }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const question of questions) {
      if (!question.required) continue;

      const value =
        question.type === "email" ? userEmail : (values[question.id] ?? "").trim();

      if (!value) {
        errors[question.id] =
          FIELD_ERRORS[question.key] ?? `Please complete "${question.label}"`;
      }
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const answers = questions.map((question) => ({
        questionId: question.id,
        value: question.type === "email" ? userEmail : (values[question.id] ?? ""),
      }));

      await onSubmit(answers);
      setSubmitted(true);
      setFieldErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSubmitted(false);
    setValues({});
    setFieldErrors({});
    setSubmitError("");
    setOpenDropdownId(null);
  }

  if (submitted) {
    return (
      <div className="rounded-[20px] border border-card-border bg-card-bg px-9 py-14 text-center shadow-[0_1px_3px_rgba(20,20,30,0.05)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 12.5L10 16.5L18 8.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-[20px] font-bold text-heading">Request submitted</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-body">
          Thanks — your requirement has been logged for the JAS Targets team.
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="mt-8 rounded-lg bg-accent px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-accent-hover"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const inputBase =
    "w-full rounded-2xl border bg-card-bg px-4 py-3.5 text-[15px] text-heading outline-none transition placeholder:text-placeholder focus:border-accent";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-7 rounded-[20px] border border-card-border bg-card-bg p-9 shadow-[0_1px_3px_rgba(20,20,30,0.05)]"
      noValidate
    >
      {questions.map((question) => {
        const hasError = !!fieldErrors[question.id];
        const optionLabels = question.options.map((option) => option.label);

        return (
          <Field
            key={question.id}
            label={question.label}
            htmlFor={question.id}
            required={question.required}
            error={fieldErrors[question.id]}
          >
            {question.type === "email" && (
              <input
                id={question.id}
                type="email"
                value={userEmail}
                readOnly
                className={`${inputBase} cursor-not-allowed border-field-border bg-readonly-bg text-body`}
              />
            )}

            {question.type === "text" && (
              <input
                id={question.id}
                type="text"
                value={values[question.id] ?? ""}
                onChange={(event) => updateValue(question.id, event.target.value)}
                className={`${inputBase} ${hasError ? "border-error" : "border-field-border"}`}
              />
            )}

            {question.type === "textarea" && (
              <textarea
                id={question.id}
                rows={7}
                value={values[question.id] ?? ""}
                onChange={(event) => updateValue(question.id, event.target.value)}
                className={`${inputBase} resize-y ${hasError ? "border-error" : "border-field-border"}`}
              />
            )}

            {question.type === "select" && usesBubbles(question) && (
              <BubbleSelect
                id={question.id}
                value={values[question.id] ?? ""}
                options={optionLabels}
                hasError={hasError}
                onChange={(value) => updateValue(question.id, value)}
              />
            )}

            {question.type === "select" && usesDropdown(question) && (
              <CustomDropdown
                id={question.id}
                value={values[question.id] ?? ""}
                options={optionLabels}
                hasError={hasError}
                onChange={(value) => updateValue(question.id, value)}
                isOpen={openDropdownId === question.id}
                onOpen={() => setOpenDropdownId(question.id)}
                onClose={() => setOpenDropdownId(null)}
              />
            )}
          </Field>
        );
      })}

      {submitError && (
        <p className="rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm font-semibold text-error">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-3.5 text-[15px] font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
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
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label htmlFor={htmlFor} className="block text-[15px] font-semibold text-heading">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs font-bold text-error">{error}</p>
      )}
    </div>
  );
}

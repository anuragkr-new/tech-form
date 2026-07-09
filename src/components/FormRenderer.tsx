"use client";

import { FormEvent, useState } from "react";
import { BubbleSelect } from "@/components/BubbleSelect";
import { CustomDropdown } from "@/components/CustomDropdown";
import type { Question } from "@/types/form";
import "@/styles/jas-form.css";

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
  return (
    BUBBLE_KEYS.has(question.key) ||
    (question.type === "select" && question.options.length <= 4 && !DROPDOWN_KEYS.has(question.key))
  );
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
      <div className="jas-success">
        <div className="jas-success-icon">
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
        <h2 className="jas-success-title">Request submitted</h2>
        <p className="jas-success-text">
          Thanks — your requirement has been logged for the JAS Targets team.
        </p>
        <button type="button" onClick={resetForm} className="jas-success-btn">
          Submit another request
        </button>
      </div>
    );
  }

  const lastQuestionId = questions[questions.length - 1]?.id;

  return (
    <form onSubmit={handleSubmit} className="jas-card" noValidate>
      {questions.map((question) => {
        const hasError = !!fieldErrors[question.id];
        const optionLabels = question.options.map((option) => option.label);
        const isBubble = question.type === "select" && usesBubbles(question);
        const isLast = question.id === lastQuestionId;

        return (
          <div
            key={question.id}
            className={`jas-field ${isLast ? "jas-field--last" : ""}`}
          >
            <label
              htmlFor={question.id}
              className={`jas-label ${isBubble ? "jas-label--bubble" : ""}`}
            >
              {question.label}
              {question.required && <span className="jas-required"> *</span>}
            </label>

            {question.type === "email" && (
              <input
                id={question.id}
                type="email"
                value={userEmail}
                readOnly
                className="jas-input-email"
              />
            )}

            {question.type === "text" && (
              <input
                id={question.id}
                type="text"
                value={values[question.id] ?? ""}
                onChange={(event) => updateValue(question.id, event.target.value)}
                className={`jas-input ${hasError ? "jas-input--error" : ""}`}
              />
            )}

            {question.type === "textarea" && (
              <textarea
                id={question.id}
                rows={7}
                value={values[question.id] ?? ""}
                onChange={(event) => updateValue(question.id, event.target.value)}
                className={`jas-textarea ${hasError ? "jas-textarea--error" : ""}`}
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

            {hasError && <p className="jas-error">{fieldErrors[question.id]}</p>}
          </div>
        );
      })}

      {submitError && <p className="jas-submit-error">{submitError}</p>}

      <button type="submit" disabled={submitting} className="jas-submit">
        {submitting ? "Submitting..." : "Submit request"}
      </button>
    </form>
  );
}

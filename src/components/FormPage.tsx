"use client";

import { FormRenderer } from "@/components/FormRenderer";
import type { Question } from "@/types/form";

type FormPageProps = {
  questions: Question[];
  userEmail: string;
};

export function FormPage({ questions, userEmail }: FormPageProps) {
  async function handleSubmit(answers: Array<{ questionId: string; value: string }>) {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error ?? "Failed to submit form.");
    }
  }

  return <FormRenderer questions={questions} userEmail={userEmail} onSubmit={handleSubmit} />;
}

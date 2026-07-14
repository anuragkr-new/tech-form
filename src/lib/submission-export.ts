export type ExportColumn = {
  key: string;
  label: string;
};

export type ExportQuestion = {
  key: string;
  label: string;
  type: string;
};

export type ExportSubmission = {
  id: string;
  email: string;
  createdAt: Date;
  answers: Array<{
    value: string;
    question: {
      key: string;
    };
  }>;
};

export function buildExportColumns(questions: ExportQuestion[]): ExportColumn[] {
  return [
    { key: "submission_id", label: "Submission ID" },
    { key: "submitted_at", label: "Submitted At" },
    { key: "email", label: "Email" },
    ...questions.map((question) => ({
      key: question.key,
      label: question.label,
    })),
  ];
}

export function buildSubmissionRow(
  submission: ExportSubmission,
  questions: ExportQuestion[],
): Record<string, string> {
  const answerByKey = new Map(
    submission.answers.map((answer) => [answer.question.key, answer.value]),
  );

  const row: Record<string, string> = {
    submission_id: submission.id,
    submitted_at: submission.createdAt.toISOString(),
    email: submission.email,
  };

  for (const question of questions) {
    if (question.type === "email") {
      row[question.key] = submission.email;
    } else {
      row[question.key] = answerByKey.get(question.key) ?? "";
    }
  }

  return row;
}

export function buildSubmissionRows(
  submissions: ExportSubmission[],
  questions: ExportQuestion[],
): Record<string, string>[] {
  return submissions.map((submission) => buildSubmissionRow(submission, questions));
}

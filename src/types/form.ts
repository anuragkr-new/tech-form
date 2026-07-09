export type QuestionOption = {
  id: string;
  label: string;
  order: number;
};

export type Question = {
  id: string;
  key: string;
  label: string;
  type: string;
  order: number;
  required: boolean;
  isSystem: boolean;
  options: QuestionOption[];
};

export type Submission = {
  id: string;
  email: string;
  createdAt: string;
  answers: Array<{
    id: string;
    value: string;
    question: {
      id: string;
      label: string;
      key: string;
    };
  }>;
};

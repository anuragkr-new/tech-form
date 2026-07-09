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

export type FormSettingsData = {
  title: string;
  subtitle: string;
};

export type AdminUserRecord = {
  id: string;
  email: string;
  createdAt: string;
  createdBy: string | null;
  protected: boolean;
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

"use client";

type BubbleSelectProps = {
  id: string;
  value: string;
  options: string[];
  hasError?: boolean;
  onChange: (value: string) => void;
};

export function BubbleSelect({ id, value, options, hasError = false, onChange }: BubbleSelectProps) {
  return (
    <div
      id={id}
      className={`flex flex-wrap gap-2.5 rounded-2xl border p-1 ${
        hasError ? "border-error" : "border-transparent"
      }`}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`rounded-full border px-[18px] py-2.5 text-[15px] transition ${
              selected
                ? "border-accent bg-[#EEF3FE] font-semibold text-accent"
                : "border-field-border bg-card-bg font-medium text-body hover:border-[#D1D5DB]"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

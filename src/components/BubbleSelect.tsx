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
    <div id={id} className={`jas-bubbles ${hasError ? "jas-bubbles--error" : ""}`} role="radiogroup">
      {options.map((option) => {
        const selected = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`jas-bubble ${selected ? "jas-bubble--selected" : ""}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

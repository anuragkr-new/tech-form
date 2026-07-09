"use client";

import { useEffect, useRef } from "react";

type CustomDropdownProps = {
  id: string;
  value: string;
  options: string[];
  placeholder?: string;
  hasError?: boolean;
  onChange: (value: string) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function CustomDropdown({
  id,
  value,
  options,
  placeholder = "Select an option",
  hasError = false,
  onChange,
  isOpen,
  onOpen,
  onClose,
}: CustomDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40" aria-hidden="true" onClick={onClose} />
      )}
      <div
        ref={containerRef}
        id={id}
        className={`relative z-50 overflow-hidden rounded-2xl border bg-card-bg transition ${
          hasError
            ? "border-error"
            : isOpen
              ? "border-accent shadow-[0_4px_12px_rgba(59,111,240,0.12)]"
              : "border-field-border"
        }`}
      >
        <button
          type="button"
          onClick={() => (isOpen ? onClose() : onOpen())}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px]"
        >
          <span className={value ? "font-medium text-heading" : "text-placeholder"}>
            {value || placeholder}
          </span>
          <span
            className={`ml-3 text-placeholder transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ⌄
          </span>
        </button>

        {isOpen && (
          <>
            <div className="border-t-2 border-accent" />
            <ul className="py-1.5">
              {options.map((option) => {
                const selected = option === value;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(option);
                        onClose();
                      }}
                      className={`mx-2 my-1.5 block w-[calc(100%-16px)] rounded-[10px] px-4 py-3 text-left text-[15px] transition ${
                        selected
                          ? "bg-readonly-bg font-medium text-heading"
                          : "text-heading hover:bg-readonly-bg/70"
                      }`}
                    >
                      {option}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

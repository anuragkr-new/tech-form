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
      {isOpen && <div className="jas-dropdown-overlay" aria-hidden="true" onClick={onClose} />}
      <div
        ref={containerRef}
        id={id}
        className={`jas-dropdown ${isOpen ? "jas-dropdown--open" : ""} ${hasError ? "jas-dropdown--error" : ""}`}
      >
        <button
          type="button"
          className="jas-dropdown-trigger"
          onClick={() => (isOpen ? onClose() : onOpen())}
        >
          <span
            className={`jas-dropdown-value ${value ? "" : "jas-dropdown-value--placeholder"}`}
          >
            {value || placeholder}
          </span>
          <span className="jas-dropdown-chevron">⌄</span>
        </button>

        {isOpen && (
          <>
            <div className="jas-dropdown-divider" />
            <div className="jas-dropdown-options">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`jas-dropdown-option ${option === value ? "jas-dropdown-option--selected" : ""}`}
                  onClick={() => {
                    onChange(option);
                    onClose();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

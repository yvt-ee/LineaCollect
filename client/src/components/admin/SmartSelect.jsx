import { useState, useEffect } from "react";
import "./SmartSelect.css";

export default function SmartSelect({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Type to search…",
}) {
  const [input, setInput] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  // ⭐ 关键修复：确保每个 opt 是 string
  const safeOptions = options
    .filter((opt) => typeof opt === "string" && opt.trim() !== "");

  const filtered = safeOptions.filter((opt) =>
    opt.toLowerCase().includes((input || "").toLowerCase())
  );

  return (
    <div className="smart-select">
      <label>{label}</label>

      <input
        className="smart-input"
        value={input}
        placeholder={placeholder}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
      />

      {open && filtered.length > 0 && (
        <div className="smart-dropdown">
          {filtered.map((opt) => (
            <div
              key={opt}
              className="smart-option"
              onClick={() => {
                onChange(opt);
                setInput(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

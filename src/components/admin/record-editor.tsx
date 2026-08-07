import { useEffect, useState } from "react";

export type FieldSpec = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select";
  options?: readonly { value: string; label: string }[];
  placeholder?: string;
  full?: boolean;
};

export type RecordValues = Record<string, unknown>;

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";
const labelClass = "block text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground";

export function RecordEditor({
  fields,
  value,
  onChange,
}: {
  fields: readonly FieldSpec[];
  value: RecordValues;
  onChange: (next: RecordValues) => void;
}) {
  function set(key: string, next: unknown) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const raw = value[field.key];
        return (
          <div key={field.key} className={field.full ? "sm:col-span-2" : undefined}>
            {field.type === "boolean" ? (
              <label className="flex items-center gap-3 pt-5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(raw)}
                  onChange={(e) => set(field.key, e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                {field.label}
              </label>
            ) : (
              <>
                <label className={labelClass} htmlFor={`f-${field.key}`}>
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`f-${field.key}`}
                    rows={5}
                    value={(raw as string) ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => set(field.key, e.target.value)}
                    className={`mt-2 resize-y ${inputClass}`}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`f-${field.key}`}
                    value={(raw as string) ?? ""}
                    onChange={(e) => set(field.key, e.target.value)}
                    className={`mt-2 ${inputClass}`}
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value} className="bg-background">
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`f-${field.key}`}
                    type={field.type === "number" ? "number" : "text"}
                    value={raw === null || raw === undefined ? "" : String(raw)}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      set(
                        field.key,
                        field.type === "number"
                          ? e.target.value === ""
                            ? null
                            : Number(e.target.value)
                          : e.target.value,
                      )
                    }
                    className={`mt-2 ${inputClass}`}
                  />
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function useDraft(initial: RecordValues | null) {
  const [draft, setDraft] = useState<RecordValues | null>(initial);
  useEffect(() => setDraft(initial), [initial]);
  return [draft, setDraft] as const;
}

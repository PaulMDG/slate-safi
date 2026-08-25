import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { RecordEditor, type FieldSpec, type RecordValues } from "./record-editor";
import { saveHomepage } from "@/lib/admin.functions";
import type { AdminSnapshot } from "@/lib/admin.functions";

const HOMEPAGE_FIELDS: readonly FieldSpec[] = [
  { key: "hero_eyebrow", label: "Hero eyebrow", type: "text" },
  { key: "hero_cta_label", label: "Hero button label", type: "text" },
  {
    key: "hero_title",
    label: "Hero headline (blank = featured film title)",
    type: "text",
    full: true,
  },
  {
    key: "hero_logline",
    label: "Hero logline (blank = featured film logline)",
    type: "textarea",
    full: true,
  },
  {
    key: "hero_image_url",
    label: "Hero image (blank = featured film hero)",
    type: "image",
    full: true,
    folder: "homepage",
  },
  { key: "slate_eyebrow", label: "Slate eyebrow", type: "text" },
  { key: "slate_heading", label: "Slate heading", type: "text" },
  { key: "news_eyebrow", label: "News eyebrow", type: "text" },
  { key: "news_heading", label: "News heading", type: "text" },
  { key: "newsletter_heading", label: "Newsletter heading", type: "text", full: true },
  { key: "newsletter_body", label: "Newsletter body", type: "textarea", full: true },
  { key: "partner_heading", label: "Partner heading", type: "text", full: true },
  { key: "partner_body", label: "Partner body", type: "textarea", full: true },
  { key: "partner_cta_label", label: "Partner button label", type: "text" },
  { key: "show_laurels", label: "Show laurels strip", type: "boolean" },
  { key: "show_quotes", label: "Show press quotes", type: "boolean" },
  { key: "show_news", label: "Show latest news", type: "boolean" },
  { key: "show_newsletter", label: "Show newsletter block", type: "boolean" },
  { key: "show_partner", label: "Show partner block", type: "boolean" },
];

export function HomepagePanel({ data, onDone }: { data: AdminSnapshot; onDone: () => unknown }) {
  const save = useServerFn(saveHomepage);
  const [draft, setDraft] = useState<RecordValues>(
    () =>
      (data.homepage as RecordValues | null) ?? {
        show_laurels: true,
        show_quotes: true,
        show_news: true,
        show_newsletter: true,
        show_partner: true,
      },
  );
  const [pending, setPending] = useState(false);

  async function onSave() {
    setPending(true);
    try {
      const payload: RecordValues = {};
      for (const field of HOMEPAGE_FIELDS) {
        const raw = draft[field.key];
        payload[field.key] =
          field.type === "boolean" ? Boolean(raw) : ((raw as string) ?? "") === "" ? null : raw;
      }
      if (draft.id) payload["id"] = draft.id;
      await save({ data: payload as never });
      toast.success("Homepage updated.");
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h2 className="eyebrow">Homepage builder</h2>
      <p className="mt-4 text-sm text-muted-foreground">
        Edit every section of the homepage — hero copy, section headings, newsletter and partner
        blocks — and switch sections on or off.
      </p>
      <div className="frame mt-8 rounded-sm border border-border p-6">
        <RecordEditor fields={HOMEPAGE_FIELDS} value={draft} onChange={setDraft} />
        <div className="mt-8">
          <button
            onClick={onSave}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 font-display text-[0.65rem] font-bold uppercase tracking-[0.18em] text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save homepage
          </button>
        </div>
      </div>
    </div>
  );
}

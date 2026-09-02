import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "jpg";
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${Date.now()}-${base || "image"}.${ext.replace(/[^a-z0-9]/g, "") || "jpg"}`;
}

/** Upload picker + manual URL entry for any image column. */
export function ImageField({
  id,
  value,
  folder,
  onChange,
}: {
  id: string;
  value: string;
  folder: string;
  onChange: (next: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Images must be under 10MB.");
      return;
    }
    setBusy(true);
    const path = `${folder}/${safeName(file.name)}`;
    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("media").getPublicUrl(path);
    onChange(pub.publicUrl);
    toast.success("Image uploaded.");
  }

  return (
    <div>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-secondary">
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange("")}
              className="absolute right-0 top-0 bg-background/80 p-1 text-muted-foreground hover:text-primary"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}
        <div className="flex-1">
          <input
            id={id}
            type="text"
            value={value}
            placeholder="Paste a URL or upload"
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-2 inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {busy ? "Uploading" : "Upload image"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void upload(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}

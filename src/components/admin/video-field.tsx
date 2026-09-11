import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full rounded-sm border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const ext = dot > -1 ? name.slice(dot + 1).toLowerCase() : "mp4";
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${Date.now()}-${base || "video"}.${ext.replace(/[^a-z0-9]/g, "") || "mp4"}`;
}

/** Upload picker + manual URL entry for a video (file upload or YouTube/Vimeo link). */
export function VideoField({
  id,
  value,
  folder = "videos",
  onChange,
}: {
  id: string;
  value: string;
  folder?: string;
  onChange: (next: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
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
    toast.success("Video uploaded.");
  }

  return (
    <div>
      <input
        id={id}
        type="text"
        value={value}
        placeholder="Paste a YouTube/Vimeo link or upload a file"
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {busy ? "Uploading" : "Upload video"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
    </div>
  );
}

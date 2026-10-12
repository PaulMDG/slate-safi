import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer, toEmbedUrl } from "./video-player";
import type { Video } from "@/lib/content.types";

export function VideoWatchDialog({ video, onClose }: { video: Video | null; onClose: () => void }) {
  return (
    <Dialog.Root open={Boolean(video)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border bg-background p-4 shadow-[var(--shadow-lift)] outline-none sm:p-6">
          {video ? <>
            <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <Dialog.Title className="min-w-0 text-lg leading-snug [letter-spacing:0] sm:text-2xl">{video.title}</Dialog.Title>
              <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close video" title="Close video" className="shrink-0"><X /></Button></Dialog.Close>
            </div>
            <VideoPlayer key={video.id} url={video.video_url} title={video.title} poster={video.poster_url} />
            <Dialog.Description className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{video.description || video.category || "Slate Safi"}</Dialog.Description>
            {toEmbedUrl(video.video_url) ? <Button asChild variant="link" className="mt-3 px-0"><a href={video.video_url} target="_blank" rel="noopener noreferrer">Open original video <ExternalLink /></a></Button> : null}
          </> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
"use client";

interface VideoPlayerProps {
  videoId: string;
  provider?: string; // "youtube" | "vimeo"
  title?: string;
}

export function VideoPlayer({ videoId, provider = "youtube", title }: VideoPlayerProps) {
  const isVimeo = provider?.toLowerCase() === "vimeo";

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      {isVimeo ? (
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          className="h-full w-full"
          allowFullScreen
          title={title || "Lesson video"}
        />
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || "Lesson video"}
        />
      )}
    </div>
  );
}
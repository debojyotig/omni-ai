/**
 * Media Preview Card
 *
 * Displays image/video thumbnails with click-to-expand
 */

'use client';

import React from 'react';
import { Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DetectedMedia, getVideoThumbnail } from '@/lib/visualization/media-detector';
import { MediaViewer } from './media-viewer';

interface MediaPreviewCardProps {
  media: DetectedMedia;
}

export function MediaPreviewCard({ media }: MediaPreviewCardProps) {
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (media.type === 'video') {
      const thumb = getVideoThumbnail(media.url);
      if (thumb) {
        setThumbnailUrl(thumb);
      }
    }
  }, [media]);

  const isVideo = media.type === 'video';

  return (
    <>
      <Card
        className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:scale-105"
        onClick={() => setIsViewerOpen(true)}
      >
        <div className="relative w-full bg-black/5 aspect-video overflow-hidden">
          {isVideo && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover group-hover:brightness-90 transition"
              onError={(e) => {
                const div = document.createElement('div');
                div.className = 'w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center';
                const playIcon = document.createElement('div');
                playIcon.className = 'text-white opacity-70';
                playIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
                div.appendChild(playIcon);
                (e.target as HTMLElement).replaceWith(div);
              }}
            />
          ) : (
            <img
              src={media.url}
              alt={media.title || 'Preview'}
              className="w-full h-full object-cover group-hover:brightness-90 transition"
              onError={(e) => {
                const div = document.createElement('div');
                div.className =
                  'w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-500 text-sm';
                div.textContent = 'Failed to load';
                (e.target as HTMLElement).replaceWith(div);
              }}
            />
          )}

          {/* Play button overlay for videos */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
              <Play className="w-12 h-12 text-white fill-white" />
            </div>
          )}

          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* Title */}
        {media.title && (
          <div className="p-3 bg-card">
            <p className="text-sm font-medium text-foreground truncate">{media.title}</p>
            {media.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">{media.description}</p>
            )}
          </div>
        )}
      </Card>

      {/* Media Viewer Modal */}
      <MediaViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        media={media}
      />
    </>
  );
}

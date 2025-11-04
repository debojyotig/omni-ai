/**
 * Media Viewer Modal
 *
 * Displays images and videos in an expanded modal/dialog (using shadcn Dialog)
 */

'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    type: 'image' | 'video';
    url: string;
    source?: 'url' | 'youtube' | 'vimeo' | 'embedded';
    title?: string;
  };
}

export function MediaViewer({ isOpen, onClose, media }: MediaViewerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-lg font-semibold">
          {media.title || (media.type === 'image' ? 'Image Viewer' : 'Video Player')}
        </DialogTitle>

        <div className="flex-1 flex items-center justify-center bg-black/5 rounded-lg overflow-hidden min-h-[400px]">
          {media.type === 'image' ? (
            <img
              src={media.url}
              alt={media.title || 'Preview'}
              className="max-w-full max-h-[calc(90vh-120px)] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23999"%3EImage failed to load%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <iframe
              src={media.url}
              title={media.title || 'Video'}
              className="w-full h-full"
              frameBorder={0}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

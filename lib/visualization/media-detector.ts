/**
 * Media Detector
 *
 * Detects image and video URLs in text content
 * Supports: images (jpg, png, gif, webp, svg), videos (mp4, webm, mov, youtube, vimeo)
 */

export interface DetectedMedia {
  type: 'image' | 'video';
  url: string;
  title?: string;
  description?: string;
  source?: 'url' | 'youtube' | 'vimeo' | 'embedded';
}

/**
 * Common image extensions and MIME types
 */
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i;
const IMAGE_MIME_PATTERNS = /image\/(jpeg|png|gif|webp|svg|bmp)/i;

/**
 * Common video extensions and MIME types
 */
const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|avi|flv|mkv|m3u8)(\?.*)?$/i;
const VIDEO_MIME_PATTERNS = /video\/(mp4|webm|ogg|quicktime)/i;

/**
 * YouTube and Vimeo URL patterns
 */
const YOUTUBE_PATTERN = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
const VIMEO_PATTERN = /vimeo\.com\/(\d+)/;

/**
 * Detects image URLs in markdown links and plain URLs
 */
function extractImageUrls(content: string): string[] {
  const images: string[] = [];

  // Pattern 1: Markdown image syntax ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    const url = match[2].trim();
    if (IMAGE_EXTENSIONS.test(url) || url.includes('image')) {
      images.push(url);
    }
  }

  // Pattern 2: HTML img tags
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    const url = match[1].trim();
    images.push(url);
  }

  // Pattern 3: Plain URLs with image extensions
  const urlRegex = /https?:\/\/[^\s)]+/g;
  while ((match = urlRegex.exec(content)) !== null) {
    const url = match[0];
    if (IMAGE_EXTENSIONS.test(url)) {
      images.push(url);
    }
  }

  return Array.from(new Set(images)); // Remove duplicates
}

/**
 * Detects video URLs and embedded videos
 */
function extractVideoUrls(content: string): DetectedMedia[] {
  const videos: DetectedMedia[] = [];

  // Pattern 1: YouTube URLs and embeds
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/g;
  let match;
  while ((match = youtubeRegex.exec(content)) !== null) {
    videos.push({
      type: 'video',
      url: `https://www.youtube.com/embed/${match[1]}`,
      source: 'youtube',
    });
  }

  // Pattern 2: Vimeo URLs
  const vimeoRegex = /vimeo\.com\/(\d+)/g;
  while ((match = vimeoRegex.exec(content)) !== null) {
    videos.push({
      type: 'video',
      url: `https://player.vimeo.com/video/${match[1]}`,
      source: 'vimeo',
    });
  }

  // Pattern 3: HTML video tags
  const htmlVideoRegex = /<video[^>]*>[\s\S]*?<source[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlVideoRegex.exec(content)) !== null) {
    const url = match[1].trim();
    videos.push({
      type: 'video',
      url,
      source: 'embedded',
    });
  }

  // Pattern 4: Plain URLs with video extensions
  const videoUrlRegex = /https?:\/\/[^\s)]+/g;
  while ((match = videoUrlRegex.exec(content)) !== null) {
    const url = match[0];
    if (VIDEO_EXTENSIONS.test(url)) {
      videos.push({
        type: 'video',
        url,
        source: 'url',
      });
    }
  }

  return videos.filter((v, idx, arr) => arr.findIndex(x => x.url === v.url) === idx); // Remove duplicates
}

/**
 * Detects all media (images and videos) in content
 */
export function detectMedia(content: string): DetectedMedia[] {
  const media: DetectedMedia[] = [];

  // Extract images
  const imageUrls = extractImageUrls(content);
  media.push(
    ...imageUrls.map((url) => ({
      type: 'image' as const,
      url,
    }))
  );

  // Extract videos
  const videoData = extractVideoUrls(content);
  media.push(...videoData);

  // Return max 5 items per message to avoid clutter
  return media.slice(0, 5);
}

/**
 * Check if URL is a valid image
 */
export function isImageUrl(url: string): boolean {
  return IMAGE_EXTENSIONS.test(url);
}

/**
 * Check if URL is a valid video
 */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXTENSIONS.test(url) || YOUTUBE_PATTERN.test(url) || VIMEO_PATTERN.test(url);
}

/**
 * Get thumbnail URL for video (YouTube only)
 */
export function getVideoThumbnail(videoUrl: string): string | null {
  const youtubeMatch = videoUrl.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
  }

  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://vimeo.com/api/v2/video/${vimeoMatch[1]}.json`;
  }

  return null;
}

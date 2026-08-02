// Twitch's Helix API has no officially documented way to get a clip's raw video file — only a
// thumbnail image, an embed URL, and the clip's page URL. This derives the video URL from the
// thumbnail URL's naming pattern (e.g. ".../AT-cm%7C<id>-preview-480x272.jpg" -> ".../AT-cm%7C<id>.mp4"),
// a trick long used by community clip-downloader tools. It's unofficial and undocumented —
// Twitch could change their CDN's naming scheme at any time and silently break this.
export function deriveClipDownloadUrl(thumbnailUrl: string | null): string | null {
  if (!thumbnailUrl) return null;
  const match = thumbnailUrl.match(/^(.*)-preview-\d+x\d+\.jpg/);
  if (!match) return null;
  return `${match[1]}.mp4`;
}

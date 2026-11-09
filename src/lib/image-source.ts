export function isStoredImage(value: string) {
 return /^\/api\/images\/[a-f0-9]{24}$/.test(value);
}
export function isImageSource(value: string) {
 if (isStoredImage(value)) return true;
 if (!value.startsWith('https://') || value.length > 2048) return false;
 try {
  const url = new URL(value);
  return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
 } catch { return false; }
}

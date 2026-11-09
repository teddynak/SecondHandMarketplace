export async function api<T>(url: string, init: RequestInit = {}): Promise<T> {
 const headers = new Headers(init.headers);
 if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
 const res = await fetch(url, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
 let data: unknown;
 try { data = await res.json(); } catch { data = null; }
 if (!res.ok) {
  const message = typeof data === 'object' && data !== null && 'error' in data ? String(data.error) : `Request failed (${res.status}).`;
  throw new Error(message);
 }
 return data as T;
}
export function money(amount: number) { return `UGX ${new Intl.NumberFormat('en-UG').format(amount)}`; }
export function niceDate(value: string) { return new Intl.DateTimeFormat('en-UG', { year:'numeric', month:'short', day:'numeric' }).format(new Date(value)); }
export function initials(value: string) { return value.split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase(); }
export function whatsappLink(phone: string, title: string) {
 const digits = phone.replace(/\D/g, '');
 const intl = digits.startsWith('0') && digits.length === 10 ? `256${digits.slice(1)}` : digits;
 return `https://wa.me/${intl}?text=${encodeURIComponent(`Hello! I'm interested in your listing: ${title}. Is it still available?`)}`;
}

// Resolve redirects against a fixed origin to reject protocol-relative URLs and backslashes.
export function safeDestination(value: string | null) {
 if (!value || !value.startsWith('/') || /[\\\x00-\x20]/.test(value)) return '/dashboard';
 try {
  const base = 'https://reuse.invalid';
  const url = new URL(value, base);
  return url.origin === base ? `${url.pathname}${url.search}${url.hash}` : '/dashboard';
 } catch { return '/dashboard'; }
}

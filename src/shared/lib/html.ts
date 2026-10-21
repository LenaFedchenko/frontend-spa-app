import DOMPurify from 'dompurify';
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (node.nodeName !== 'A') data.keepAttr = false;
});
export function sanitizeHtml(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: ['i', 'strong', 'code', 'a'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:)/i,
  });
}
export function safeLink(value: string): string | undefined {
  try { const url = new URL(value); return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : undefined; }
  catch { return undefined; }
}
export function escapeAttribute(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

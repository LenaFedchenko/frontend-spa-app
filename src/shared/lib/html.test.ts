import { describe, expect, it } from 'vitest';
import { escapeAttribute, safeLink, sanitizeHtml } from './html';
describe('comment HTML boundary', () => {
  it('preserves supported formatting', () => {
    const html = '<i>Italic</i> <strong>Bold</strong> <code>code</code> <a href="https://example.com" title="Website">link</a>';
    expect(sanitizeHtml(html)).toBe(html);
  });
  it('removes active content and unsafe link schemes', () => {
    const html = '<img src=x onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)" onclick="alert(1)">link</a>';
    expect(sanitizeHtml(html)).toBe('<a>link</a>');
    expect(sanitizeHtml('<a href="data:text/html,danger">link</a>')).toBe('<a>link</a>');
  });
  it('removes attributes from formatting tags and disallows arbitrary tags', () => {
    expect(sanitizeHtml('<strong title="extra" href="https://example.com" style="color:red">Hello</strong><iframe src="https://example.com"></iframe>')).toBe('<strong>Hello</strong>');
  });
  it('supports only explicit safe schemes', () => {
    expect(safeLink('javascript:alert(1)')).toBeUndefined();
    expect(safeLink('//example.com')).toBeUndefined();
    expect(safeLink('mailto:hello@example.com')).toBe('mailto:hello@example.com');
  });
  it('escapes inserted link attributes', () => {
    expect(escapeAttribute('https://example.com/?a=1&b="<x>"')).toBe('https://example.com/?a=1&amp;b=&quot;&lt;x&gt;&quot;');
  });
});

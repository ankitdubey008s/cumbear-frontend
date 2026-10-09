// Global input sanitizer - prevents XSS attacks
window.sanitize = {
  html: function(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  url: function(url) {
    if (typeof url !== 'string') return '';
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '';
      return url;
    } catch {
      return '';
    }
  },
  id: function(id) {
    return /^[0-9a-fA-F]{24}$/.test(id) ? id : null;
  }
};

// Auto-sanitize all video titles before rendering
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tag) {
  const el = originalCreateElement(tag);
  if (tag === 'div' || tag === 'span' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3') {
    const originalSetter = Object.getOwnPropertyDescriptor(el.__proto__, 'innerHTML').set;
    Object.defineProperty(el, 'innerHTML', {
      set: function(value) {
        if (typeof value === 'string' && /<script|javascript:|on\w+=/i.test(value)) {
          console.warn('🛡️ Blocked potential XSS attempt');
          originalSetter.call(this, window.sanitize.html(value));
        } else {
          originalSetter.call(this, value);
        }
      }
    });
  }
  return el;
};

console.log('🛡️ XSS protection active');

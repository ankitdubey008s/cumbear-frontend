/**
 * ==========================================================================
 * CUMBEAR FOOTER UTILITIES & BEHAVIORS
 * ==========================================================================
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // Dynamic year auto-updater
    const copyrightEl = document.querySelector('.copyright');
    if (copyrightEl && !copyrightEl.innerHTML.includes('2026')) {
      const year = new Date().getFullYear();
      copyrightEl.innerHTML = `<a href="https://www.cumbear.in">cumbear.in</a> - all rights reserved © ${year}`;
    }

    // Ensure all legal links securely target support domain
    const legalLinks = document.querySelectorAll('.site-footer a');
    legalLinks.forEach(link => {
      if (link.getAttribute('href')?.includes('support.cumbear.in')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  });
})();

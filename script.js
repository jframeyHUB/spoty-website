// Waitlist sign-up: posts the email to /api/waitlist and shows the result inline.
document.querySelectorAll('[data-waitlist]').forEach((form) => {
  const status = form.querySelector('[data-status]');
  const button = form.querySelector('button');
  const input = form.querySelector('input[type="email"]');
  const original = status.innerHTML;

  const show = (html, cls) => {
    status.innerHTML = html;
    status.className = 'form-note' + (cls ? ' ' + cls : '');
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      show('Please enter a valid email address.', 'err');
      input.focus();
      return;
    }
    button.disabled = true;
    button.textContent = 'Joining…';
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company_site: form.company_site.value })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        form.reset();
        show(data.existing
          ? "You're already on the list. We've emailed you a reminder."
          : "You're on the list. Check your inbox for your welcome email.", 'ok');
      } else if (data.fallback) {
        show('Sign-ups open very soon. For now, email <a href="mailto:sales@spoty.club?subject=SPOTY%20early%20access">sales@spoty.club</a> and we\'ll add you.', 'err');
      } else {
        show(data.error || 'Something went wrong. Please try again.', 'err');
      }
    } catch {
      show('Something went wrong. Please try again.', 'err');
    } finally {
      button.disabled = false;
      button.textContent = 'Get early access';
      if (!status.textContent) status.innerHTML = original;
    }
  });
});

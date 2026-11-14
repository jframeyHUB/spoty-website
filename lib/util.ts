export const SITE = 'https://www.spoty.club';

export const fullName = (p: { first_name: string; last_name: string }) => `${p.first_name} ${p.last_name}`;
export const initials = (p: { first_name: string; last_name: string }) => `${p.first_name[0] || ''}${p.last_name[0] || ''}`.toUpperCase();

export const voteLink = (handle: string) => `${SITE}/v/${handle}`;

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function slugify(s: string) {
  return s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

// Votes per month since the member joined (at least one month).
export function perMonth(votes: number, joined: string) {
  const months = Math.max(1, (Date.now() - new Date(joined).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  return Math.round((votes / months) * 10) / 10;
}

export function ageFrom(dob: string) {
  const d = new Date(dob), now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a;
}

// Friendly text for errors raised by the database rules.
export function friendlyError(message: string | undefined) {
  const m = message || '';
  const map: Record<string, string> = {
    not_signed_in: 'Please sign in first.',
    voting_closed: 'Voting for SPOTY 2027 has closed.',
    no_profile: 'Finish setting up your profile first.',
    not_found: "We couldn't find that member.",
    self_vote: "You can't vote for yourself.",
    already_voted: "You've already voted for them this year.",
    payment_required: "You've used your free vote. Paid votes (£0.99) are coming soon.",
    message_too_long: 'Messages can be up to 300 characters.',
    self_request: "You can't ask yourself for a vote.",
    already_requested: "You've already asked them this year.",
    daily_limit: "You've used your 3 requests for today. More tomorrow.",
    country_locked: 'Your country is locked once you have votes.',
    too_young: 'You must be 18 or over to take part.',
    duplicate: 'That username is taken. Try another.'
  };
  for (const key of Object.keys(map)) if (m.includes(key)) return map[key];
  if (m.includes('profiles_handle_key') || m.includes('duplicate key')) return map.duplicate;
  return 'Something went wrong. Please try again.';
}

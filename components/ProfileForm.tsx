'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { COUNTRIES, countryName } from '@/lib/countries';
import { PROFESSIONS } from '@/lib/professions';
import { slugify, friendlyError, ageFrom, SITE } from '@/lib/util';
import Avatar from './Avatar';

export type ProfileDraft = {
  first_name: string; last_name: string; handle: string; pronouns: string; country: string; area: string; job_title: string;
  profession: string; company: string; bio: string; photo_url: string | null; show_age: boolean; date_of_birth: string;
};

const STEPS = ['Prospect', 'Qualify', 'Pitch', 'Close'];
const HEADS = [
  ['Who are you?', 'Your name and the link people will use to vote for you.'],
  ['Where do you sell?', 'This puts you on your national leaderboard.'],
  ['Make your pitch', 'A photo and a line about you. Profiles with a photo get more votes.'],
  ['Close the deal', 'Last step: your age, then you are on the leaderboard.']
];

export default function ProfileForm({ userId, initial, mode, next = '/leaderboard', countryLocked = false }:
  { userId: string; initial: ProfileDraft; mode: 'create' | 'edit'; next?: string; countryLocked?: boolean }) {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [d, setD] = useState<ProfileDraft>(initial);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [handleTouched, setHandleTouched] = useState(mode === 'edit');
  const [handleOk, setHandleOk] = useState<boolean | null>(null);
  const set = <K extends keyof ProfileDraft>(k: K, v: ProfileDraft[K]) => setD((x) => ({ ...x, [k]: v }));

  // Suggest a username from the name until they edit it themselves.
  useEffect(() => {
    if (!handleTouched) set('handle', slugify(`${d.first_name} ${d.last_name}`));
  }, [d.first_name, d.last_name, handleTouched]);

  useEffect(() => {
    if (d.handle.length < 3) { setHandleOk(null); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('handle_available', { p_handle: d.handle });
      setHandleOk(Boolean(data));
    }, 350);
    return () => clearTimeout(t);
  }, [d.handle, supabase]);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Please choose a JPG, PNG or WebP photo.');
    setUploading(true);
    try {
      const blob = await squareJpeg(file, 512);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      set('photo_url', supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl);
    } catch {
      setError("We couldn't upload that photo. Please try another.");
    }
    setUploading(false);
  }

  function check(s: number): string {
    if (s === 0) {
      if (!d.first_name.trim() || !d.last_name.trim()) return 'Please add your first and last name.';
      if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(d.handle)) return 'Your link can use lowercase letters, numbers and dashes (3–40 characters).';
      if (handleOk === false) return 'That link is taken. Try another.';
    }
    if (s === 1) {
      if (!d.country) return 'Please choose your country.';
      if (!d.job_title.trim()) return 'Please add your job title.';
      if (!d.profession) return 'Please choose what you sell.';
    }
    if (s === 2 && d.bio.length > 200) return 'Your bio can be up to 200 characters.';
    if (s === 3) {
      if (!d.date_of_birth) return 'Please add your date of birth.';
      if (ageFrom(d.date_of_birth) < 18) return 'You must be 18 or over to take part.';
      if (ageFrom(d.date_of_birth) > 110) return 'Please check your date of birth.';
    }
    return '';
  }

  function nextStep() {
    const err = check(step);
    if (err) return setError(err);
    setError('');
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0 });
  }

  async function save() {
    for (let s = 0; s < 4; s++) { const err = check(s); if (err) { setStep(mode === 'create' ? s : step); return setError(err); } }
    setBusy(true); setError('');
    const row = {
      id: userId, handle: d.handle, first_name: d.first_name.trim(), last_name: d.last_name.trim(), pronouns: d.pronouns.trim() || null,
      country: d.country, area: d.area.trim() || null, job_title: d.job_title.trim() || null, profession: d.profession || null,
      company: d.company.trim() || null, bio: d.bio.trim() || null, photo_url: d.photo_url, show_age: d.show_age
    };
    const res = mode === 'create'
      ? await supabase.from('profiles').insert(row)
      : await supabase.from('profiles').update(row).eq('id', userId);
    if (res.error) { setBusy(false); return setError(friendlyError(res.error.message)); }
    const priv = await supabase.from('profile_private').upsert({ id: userId, date_of_birth: d.date_of_birth });
    if (priv.error) { setBusy(false); return setError(friendlyError(priv.error.message)); }
    router.replace(mode === 'create' ? `${next}${next.includes('?') ? '&' : '?'}welcome=1` : '/profile');
    router.refresh();
  }

  const preview = (
    <div className="preview-card">
      <Avatar p={{ ...d, first_name: d.first_name || 'Your', last_name: d.last_name || 'Name' }} size={56} />
      <div style={{ minWidth: 0 }}>
        <div className="lb-name">{d.first_name || 'Your'} {d.last_name || 'name'}</div>
        <div className="lb-sub">{[d.job_title, d.profession].filter(Boolean).join(' · ') || 'Your job title'}</div>
        <div className="lb-sub">{SITE.replace('https://www.', '')}/v/{d.handle || 'your-name'}</div>
      </div>
    </div>
  );

  const fields = [
    // Prospect
    <div className="stack" key="0">
      <div className="row wrap-row" style={{ alignItems: 'stretch' }}>
        <label className="f" style={{ flex: 1, minWidth: 180 }}>First name<input className="input" autoComplete="given-name" value={d.first_name} maxLength={40} onChange={(e) => set('first_name', e.target.value)} /></label>
        <label className="f" style={{ flex: 1, minWidth: 180 }}>Last name<input className="input" autoComplete="family-name" value={d.last_name} maxLength={40} onChange={(e) => set('last_name', e.target.value)} /></label>
      </div>
      <label className="f">Your vote link
        <span className="hint">This is the link you'll share to get votes.</span>
        <div className="row" style={{ gap: 0 }}>
          <span className="input" style={{ width: 'auto', display: 'flex', alignItems: 'center', borderRadius: '10px 0 0 10px', background: 'var(--bg)', color: 'var(--soft)', borderRight: 0, whiteSpace: 'nowrap' }}>spoty.club/v/</span>
          <input className="input" style={{ borderRadius: '0 10px 10px 0' }} value={d.handle} maxLength={40}
            onChange={(e) => { setHandleTouched(true); set('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); }} />
        </div>
        {handleOk === false ? <span className="hint" style={{ color: 'var(--err)' }}>That link is taken. Try another.</span> : handleOk ? <span className="hint" style={{ color: 'var(--ok)' }}>Available</span> : null}
      </label>
      <label className="f">Pronouns <span className="hint">Optional, e.g. she/her</span><input className="input" value={d.pronouns} maxLength={20} onChange={(e) => set('pronouns', e.target.value)} /></label>
    </div>,
    // Qualify
    <div className="stack" key="1">
      <label className="f">Country
        {countryLocked ? <span className="hint">Locked: your country can't change once you have votes.</span> : <span className="hint">You compete for President of this country.</span>}
        <select className="input" value={d.country} disabled={countryLocked} onChange={(e) => set('country', e.target.value)}>
          <option value="">Choose your country</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
      </label>
      <label className="f">Town or city <span className="hint">Optional</span><input className="input" value={d.area} maxLength={60} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Manchester" /></label>
      <label className="f">Job title<input className="input" autoComplete="organization-title" value={d.job_title} maxLength={60} onChange={(e) => set('job_title', e.target.value)} placeholder="e.g. Account Executive" /></label>
      <label className="f">What do you sell?
        <select className="input" value={d.profession} onChange={(e) => set('profession', e.target.value)}>
          <option value="">Choose one</option>
          {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </label>
      <label className="f">Company <span className="hint">Optional</span><input className="input" autoComplete="organization" value={d.company} maxLength={80} onChange={(e) => set('company', e.target.value)} /></label>
    </div>,
    // Pitch
    <div className="stack" key="2">
      <div className="photo-pick">
        <Avatar p={{ ...d, first_name: d.first_name || '?', last_name: d.last_name || '' }} size={88} />
        <div className="stack" style={{ gap: 6 }}>
          <label className="btn btn-line btn-sm" style={{ width: 'fit-content' }}>
            {uploading ? 'Uploading…' : d.photo_url ? 'Change photo' : 'Add a photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </label>
          {d.photo_url ? <button type="button" className="btn btn-ghost btn-sm" style={{ width: 'fit-content', padding: 0 }} onClick={() => set('photo_url', null)}>Remove photo</button> : null}
          <span className="soft small">A clear headshot works best.</span>
        </div>
      </div>
      <label className="f">Bio <span className="hint">Optional. Why should people vote for you?</span>
        <textarea className="input" value={d.bio} maxLength={200} onChange={(e) => set('bio', e.target.value)} placeholder="e.g. 12 years in SaaS sales. I never miss a follow-up." />
        <span className="count">{d.bio.length}/200</span>
      </label>
    </div>,
    // Close
    <div className="stack" key="3">
      <label className="f">Date of birth <span className="hint">Private. We only ever show your age, and only if you choose to.</span>
        <input className="input" type="date" value={d.date_of_birth} max={new Date(Date.now() - 18 * 365.25 * 864e5).toISOString().slice(0, 10)} onChange={(e) => set('date_of_birth', e.target.value)} />
      </label>
      <label className="check card card-pad" style={{ borderColor: d.show_age ? 'var(--gold)' : undefined }}>
        <input type="checkbox" checked={d.show_age} onChange={(e) => set('show_age', e.target.checked)} />
        <span><b>Show my age and compete in the age awards</b><br /><span className="soft">Prime Closer (most votes for your age), Youngest and Oldest in the World. If you don't show your age, you can still win The Wolf and President.</span></span>
      </label>
      <div>
        <p className="eyebrow" style={{ marginBottom: 8 }}>Your leaderboard card</p>
        {preview}
      </div>
    </div>
  ];

  if (mode === 'edit') {
    return (
      <div className="stack">
        <div className="card card-pad stack">{fields[2]}</div>
        <div className="card card-pad stack"><h2>About you</h2>{fields[0]}</div>
        <div className="card card-pad stack"><h2>Where you sell</h2>{fields[1]}</div>
        <div className="card card-pad stack"><h2>Age</h2>{fields[3]}</div>
        {error ? <p className="alert alert-err" role="alert">{error}</p> : null}
        <div className="row"><button className="btn btn-gold" onClick={save} disabled={busy || uploading}>{busy ? 'Saving…' : 'Save changes'}</button><a className="btn btn-ghost" href="/profile">Cancel</a></div>
      </div>
    );
  }

  return (
    <div className="ob-wrap">
      <div className="ob-head">
        <div className="ob-head-in">
          <div className="steps">{STEPS.map((s, i) => <div key={s} className={i <= step ? 'done' : ''}>{s}</div>)}</div>
          <p className="eyebrow" style={{ color: 'var(--gold-light)' }}>Step {step + 1} of 4 · {STEPS[step]}</p>
          <h1>{HEADS[step][0]}</h1>
          <p>{HEADS[step][1]}</p>
        </div>
      </div>
      <div className="ob-body">
        <div className="card card-pad stack" style={{ marginTop: 20 }}>
          {fields[step]}
          {error ? <p className="alert alert-err" role="alert">{error}</p> : null}
          <div className="row spread">
            {step > 0 ? <button type="button" className="btn btn-ghost" onClick={() => { setError(''); setStep(step - 1); }}>Back</button> : <span />}
            {step < 3
              ? <button type="button" className="btn btn-navy" onClick={nextStep} disabled={uploading}>Continue</button>
              : <button type="button" className="btn btn-gold" onClick={save} disabled={busy || uploading}>{busy ? 'Creating…' : 'Create my profile'}</button>}
          </div>
        </div>
        {step < 3 ? <div style={{ marginTop: 16 }}>{preview}</div> : null}
        <p className="soft small" style={{ marginTop: 16, textAlign: 'center' }}>Competing from {d.country ? countryName(d.country) : 'your country'} · Voting closes 31 December 2027</p>
      </div>
    </div>
  );
}

// Centre-crop to a square and shrink, so uploads are small and consistent.
async function squareJpeg(file: File, size: number): Promise<Blob> {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.88));
}

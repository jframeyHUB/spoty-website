import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import LbRow, { type LbEntry } from '@/components/LbRow';
import { COUNTRIES, countryName, flagUrl } from '@/lib/countries';
import { ordinal } from '@/lib/util';

export const metadata = { title: 'Leaderboard' };
export const dynamic = 'force-dynamic';

type SP = { tab?: string; view?: string; country?: string; age?: string; welcome?: string };

export default async function Leaderboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, profile } = await getSession();
  const tab = ['global', 'national', 'age'].includes(sp.tab || '') ? sp.tab! : 'global';
  const view = ['most', 'youngest', 'oldest'].includes(sp.view || '') ? sp.view! : 'most';

  // My own age (only if I've chosen to show it), used as the default age group.
  let myAge: number | null = null;
  if (profile?.show_age) {
    const { data } = await supabase.from('profile_private').select('date_of_birth').eq('id', profile.id).maybeSingle();
    if (data?.date_of_birth) {
      const d = new Date(data.date_of_birth), n = new Date();
      myAge = n.getFullYear() - d.getFullYear() - (n < new Date(n.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
    }
  }
  const country = (sp.country || (tab === 'national' ? profile?.country : '') || '').toUpperCase() || null;
  const age = Number(sp.age) || myAge || 30;

  const scope = tab === 'national' ? 'national' : tab === 'age' ? (view === 'most' ? 'age' : view) : 'global';
  const { data, error } = await supabase.rpc('leaderboard', {
    p_scope: scope, p_country: tab === 'age' ? null : country, p_age: tab === 'age' && view === 'most' ? age : null, p_limit: 10
  });
  const rows = (data || []) as LbEntry[];
  const top = rows.filter((r) => Number(r.rank) <= 10 || !r.is_me).slice(0, 10);
  const me = rows.find((r) => r.is_me);
  const meOutside = me && !top.some((r) => r.is_me) ? me : null;

  const q = (o: Partial<SP>) => {
    const p = new URLSearchParams();
    const m = { tab, view: tab === 'age' ? view : undefined, country: tab === 'global' ? sp.country : tab === 'national' ? country || undefined : undefined, age: tab === 'age' && view === 'most' ? String(age) : undefined, ...o };
    Object.entries(m).forEach(([k, v]) => v && p.set(k, String(v)));
    return `/leaderboard?${p.toString()}`;
  };

  const title = tab === 'national'
    ? `${country ? countryName(country) : 'Your country'}: race for President`
    : tab === 'age'
      ? view === 'youngest' ? 'Youngest in the World' : view === 'oldest' ? 'Oldest in the World' : `Age ${age}: race for Prime Closer`
      : country ? `${countryName(country)} on the world stage` : 'The world: race for The Wolf';

  return (
    <Shell profile={profile}>
      {sp.welcome ? (
        <div className="alert alert-ok" style={{ marginBottom: 16 }}>
          <b>You're on the leaderboard.</b> Now share your vote link to start climbing. <Link href="/get-votes"><b>Get votes</b></Link>
        </div>
      ) : null}
      <div className="grid-2">
        <section className="card" aria-labelledby="lb-title">
          <nav className="tabs" aria-label="Leaderboards">
            <Link href="/leaderboard?tab=global" className={tab === 'global' ? 'on' : ''}>Global</Link>
            <Link href={`/leaderboard?tab=national${profile ? '' : '&country=GB'}`} className={tab === 'national' ? 'on' : ''}>National</Link>
            <Link href="/leaderboard?tab=age" className={tab === 'age' ? 'on' : ''}>Age</Link>
          </nav>
          {tab === 'age' ? (
            <div className="chips">
              <Link className={`chip${view === 'most' ? ' on' : ''}`} href={q({ view: 'most' })}>Most votes</Link>
              <Link className={`chip${view === 'youngest' ? ' on' : ''}`} href={q({ view: 'youngest', age: undefined })}>Youngest</Link>
              <Link className={`chip${view === 'oldest' ? ' on' : ''}`} href={q({ view: 'oldest', age: undefined })}>Oldest</Link>
              {view === 'most' ? (
                <form action="/leaderboard" className="row" style={{ marginLeft: 'auto', gap: 6 }}>
                  <input type="hidden" name="tab" value="age" /><input type="hidden" name="view" value="most" />
                  <label className="soft small" htmlFor="age">Age</label>
                  <select id="age" name="age" className="input" style={{ height: 34, width: 84 }} defaultValue={age}>
                    {Array.from({ length: 83 }, (_, i) => i + 18).map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button className="btn btn-line btn-sm">Go</button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="chips">
              <form action="/leaderboard" className="row" style={{ gap: 6, width: '100%' }}>
                <input type="hidden" name="tab" value={tab} />
                {country ? <img src={flagUrl(country)} alt="" width={24} height={18} style={{ borderRadius: 3 }} /> : null}
                <select name="country" className="input" style={{ height: 34, maxWidth: 260 }} defaultValue={country || ''} aria-label="Country">
                  {tab === 'global' ? <option value="">Whole world</option> : null}
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
                <button className="btn btn-line btn-sm">Show</button>
              </form>
            </div>
          )}
          <div className="card-head" style={{ borderBottom: '1px solid var(--line)' }}>
            <h1 id="lb-title" style={{ fontSize: 18 }}>{title}</h1>
            <span className="soft small">Top 10</span>
          </div>
          {error ? <p className="empty">The leaderboard couldn't load. Please refresh.</p>
            : top.length === 0 ? (
              <div className="empty">
                <p><b>No one here yet.</b></p>
                <p className="soft" style={{ marginTop: 4 }}>{tab === 'age' ? 'Members appear here once they choose to show their age.' : 'Be the first: create your profile and share your vote link.'}</p>
              </div>
            ) : (
              <div>
                {top.map((e) => <LbRow key={e.id} e={e} metric={tab === 'age' && view !== 'most' ? 'age' : 'votes'} />)}
                {meOutside ? (<><div className="lb-gap">···</div><LbRow e={meOutside} metric={tab === 'age' && view !== 'most' ? 'age' : 'votes'} /></>) : null}
              </div>
            )}
          {!profile ? (
            <div className="card-pad" style={{ borderTop: '1px solid var(--line)' }}>
              <div className="row spread wrap-row"><span className="muted">Where would you rank?</span><Link href="/login" className="btn btn-gold btn-sm">Join free</Link></div>
            </div>
          ) : null}
        </section>

        <aside className="stack">
          {profile && me ? (
            <div className="card card-pad stack" style={{ gap: 8 }}>
              <p className="eyebrow">Your place</p>
              <div className="big-number">{ordinal(Number(me.rank))}</div>
              <p className="muted small">{Number(me.votes)} vote{Number(me.votes) === 1 ? '' : 's'} · {title.split(':')[0]}</p>
              <Link href="/get-votes" className="btn btn-gold btn-block" style={{ marginTop: 6 }}>Get more votes</Link>
            </div>
          ) : null}
          <div className="card card-pad stack" style={{ gap: 10 }}>
            <p className="eyebrow">The awards</p>
            {[['The Wolf', 'Most votes in the world'], ['Youngest & Oldest in the World', 'Trophy and framed A4 certificate'], ['President', 'Most votes in your country'], ['Prime Closer', 'Most votes for your age'], ['Mover of the Month', 'Most votes that month']].map(([a, b]) => (
              <div key={a}><div className="display" style={{ fontSize: 17, color: 'var(--navy)' }}>{a}</div><div className="soft small">{b}</div></div>
            ))}
            <p className="soft small" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>Voting closes at midnight (UK time) on 31 December 2027.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

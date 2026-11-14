import Link from 'next/link';
import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';
import ShareLink from '@/components/ShareLink';
import Icon from '@/components/Icon';
import { countryName } from '@/lib/countries';
import { ordinal, voteLink } from '@/lib/util';

export const metadata = { title: 'Your profile' };
export const dynamic = 'force-dynamic';

type Received = { id: number; message: string | null; created_at: string; voter: { handle: string; first_name: string; last_name: string; photo_url: string | null; country: string } | null };

export default async function MyProfile() {
  const { supabase, profile } = await requireProfile('/profile');
  const [{ data: card }, { data: votes }, { data: freeUsed }] = await Promise.all([
    supabase.rpc('profile_card', { p_handle: profile.handle }),
    supabase.from('votes').select('id, message, created_at, voter:profiles!votes_voter_id_fkey(handle, first_name, last_name, photo_url, country)')
      .eq('candidate_id', profile.id).order('created_at', { ascending: false }).limit(100),
    supabase.rpc('free_vote_used')
  ]);
  const c = card?.[0];
  const received = (votes || []) as unknown as Received[];
  const name = `${profile.first_name} ${profile.last_name}`;

  return (
    <Shell profile={profile}>
      <div className="grid-2">
        <div className="stack">
          <section className="card">
            <div className="prof-hero" />
            <div className="prof-body">
              <div className="row spread" style={{ alignItems: 'flex-end' }}>
                <span className="prof-av"><Avatar p={profile} size={104} /></span>
                <div className="row" style={{ gap: 8 }}>
                  <Link href="/profile/edit" className="btn btn-line btn-sm">Edit profile</Link>
                  <Link href="/settings" className="btn btn-ghost btn-sm" aria-label="Settings"><Icon name="settings" size={18} /></Link>
                </div>
              </div>
              <h1 style={{ fontSize: 26, marginTop: 10 }}>{name}</h1>
              <p className="muted">{[profile.job_title, profile.company].filter(Boolean).join(' at ')}</p>
              <p className="soft">{[profile.profession, profile.area, countryName(profile.country)].filter(Boolean).join(' · ')}</p>
              {profile.bio ? <p style={{ marginTop: 12 }}>{profile.bio}</p> : null}
              {!profile.photo_url ? <p className="alert alert-info small" style={{ marginTop: 12 }}>Add a photo. Profiles with a photo get more votes. <Link href="/profile/edit"><b>Add photo</b></Link></p> : null}
            </div>
            {c ? (
              <div className="stats">
                <div><b>{Number(c.votes)}</b><span>Votes</span></div>
                <div><b>{ordinal(Number(c.global_rank))}</b><span>In the world</span></div>
                <div><b>{ordinal(Number(c.national_rank))}</b><span>In {profile.country === 'GB' ? 'the UK' : countryName(profile.country)}</span></div>
              </div>
            ) : null}
          </section>

          <section className="card">
            <div className="card-head"><h2>Who voted for you</h2><span className="soft small">{received.length}</span></div>
            {received.length === 0 ? <p className="empty">No votes yet. Share your link to get your first one.</p> : received.map((v) => (
              <div key={v.id} className="note">
                {v.voter ? <Avatar p={v.voter} size={40} /> : <span className="av" style={{ width: 40, height: 40 }}>★</span>}
                <div style={{ flex: 1 }}>
                  {v.voter ? <Link href={`/v/${v.voter.handle}`}><b>{v.voter.first_name} {v.voter.last_name}</b></Link> : <b>A supporter</b>}
                  {v.message ? <p className="muted small" style={{ fontStyle: 'italic', marginTop: 2 }}>“{v.message}”</p> : null}
                </div>
                <span className="soft small">{new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </section>
        </div>

        <aside className="stack">
          <div className="card card-pad stack">
            <p className="eyebrow">Your vote link</p>
            <ShareLink url={voteLink(profile.handle)} name={name} />
          </div>
          <div className="card card-pad stack" style={{ gap: 6 }}>
            <p className="eyebrow">Your free vote</p>
            <p className="muted small">{freeUsed ? "You've used your free vote for 2027." : 'You have one free vote to give another member. Find someone who deserves it on the leaderboard.'}</p>
            {!freeUsed ? <Link href="/leaderboard" className="btn btn-line btn-sm" style={{ width: 'fit-content' }}>Browse the leaderboard</Link> : null}
          </div>
        </aside>
      </div>
    </Shell>
  );
}

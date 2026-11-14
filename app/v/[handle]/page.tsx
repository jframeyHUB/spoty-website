import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getSession, supabaseServer } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import Avatar from '@/components/Avatar';
import VoteBox from './VoteBox';
import ReportButton from './ReportButton';
import ShareLink from '@/components/ShareLink';
import { countryName } from '@/lib/countries';
import { ordinal, voteLink } from '@/lib/util';

export const dynamic = 'force-dynamic';

type Card = {
  id: string; handle: string; first_name: string; last_name: string; photo_url: string | null; country: string; area: string | null;
  job_title: string | null; profession: string | null; company: string | null; pronouns: string | null; bio: string | null; age: number | null;
  votes: number; global_rank: number; national_rank: number; joined: string; i_voted: boolean; is_me: boolean;
};

async function load(handle: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc('profile_card', { p_handle: handle });
  return (data?.[0] as Card) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const c = await load((await params).handle);
  if (!c) return { title: 'Not found' };
  const name = `${c.first_name} ${c.last_name}`;
  return {
    title: `Vote for ${name}`,
    description: `${name} is going for Sales Person of the Year 2027. ${c.job_title || ''}${c.profession ? ` · ${c.profession}` : ''}. Vote at spoty.club.`,
    openGraph: { title: `Vote for ${name} · SPOTY 2027`, description: 'Sell me this vote. The global awards for salespeople.' }
  };
}

export default async function VotePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [card, session] = await Promise.all([load(handle), getSession()]);
  if (!card) notFound();
  const { supabase, user, profile } = session;
  let freeUsed = false;
  if (profile && !card.is_me) {
    const { data } = await supabase.rpc('free_vote_used');
    freeUsed = Boolean(data);
  }
  const name = `${card.first_name} ${card.last_name}`;

  return (
    <Shell profile={profile}>
      <div className="grid-2">
        <section className="card">
          <div className="prof-hero" />
          <div className="prof-body">
            <div className="row spread" style={{ alignItems: 'flex-end' }}>
              <span className="prof-av"><Avatar p={card} size={104} /></span>
              <div className="row" style={{ gap: 8 }}>
                {card.is_me ? <Link href="/profile/edit" className="btn btn-line btn-sm">Edit profile</Link> : null}
                {profile && !card.is_me ? <ReportButton profileId={card.id} name={name} /> : null}
              </div>
            </div>
            <h1 style={{ fontSize: 26, marginTop: 10 }}>{name}{card.pronouns ? <span className="soft" style={{ fontSize: 15, fontWeight: 400 }}> ({card.pronouns})</span> : null}</h1>
            <p className="muted">{[card.job_title, card.company].filter(Boolean).join(' at ')}</p>
            <p className="soft">{[card.profession, card.area, countryName(card.country), card.age ? `${card.age} years old` : null].filter(Boolean).join(' · ')}</p>
            {card.bio ? <p style={{ marginTop: 12 }}>{card.bio}</p> : null}
          </div>
          <div className="stats">
            <div><b>{Number(card.votes).toLocaleString('en-GB')}</b><span>Votes</span></div>
            <div><b>{ordinal(Number(card.global_rank))}</b><span>In the world</span></div>
            <div><b>{ordinal(Number(card.national_rank))}</b><span>In {card.country === 'GB' ? 'the UK' : countryName(card.country)}</span></div>
          </div>
        </section>

        <aside className="stack">
          {card.is_me ? (
            <div className="card card-pad stack">
              <p className="eyebrow">This is your vote page</p>
              <p className="muted small">Share this link. Anyone who opens it can vote for you.</p>
              <ShareLink url={voteLink(card.handle)} name={name} />
            </div>
          ) : (
            <VoteBox
              candidateId={card.id} firstName={card.first_name} handle={card.handle}
              signedIn={Boolean(user)} hasProfile={Boolean(profile)} alreadyVoted={card.i_voted} freeUsed={freeUsed}
            />
          )}
          <div className="card card-pad small soft">
            <b style={{ color: 'var(--ink)' }}>How SPOTY voting works</b>
            <p style={{ marginTop: 6 }}>Everyone can vote for each salesperson once a year. Members get one free vote to give; after that each vote is £0.99. Voting closes at midnight (UK time) on 31 December 2027.</p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

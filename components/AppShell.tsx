import Link from 'next/link';
import NavLinks from './NavLinks';
import Icon from './Icon';
import type { Profile } from '@/lib/supabase/server';

// Navy top bar (desktop nav) + white bottom bar on phones: Leaderboard · Get votes · Profile.
export default function AppShell({ profile, unread = 0, children }: { profile: Profile | null; unread?: number; children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <Link href="/leaderboard" className="brand" aria-label="SPOTY leaderboard">
            <img src="/assets/spoty-logo-horizontal.svg" alt="SPOTY, Sales Person of the Year" width={120} height={34} />
          </Link>
          {profile ? (
            <>
              <NavLinks variant="top" handle={profile.handle} unread={unread} isAdmin={profile.is_admin} />
              <Link href="/notifications" className="bell-mobile" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                <Icon name="bell" size={22} />
                {unread ? <span className="dot">{unread > 9 ? '9+' : unread}</span> : null}
              </Link>
            </>
          ) : (
            <div style={{ marginLeft: 'auto' }}>
              <Link href="/login" className="btn btn-gold btn-sm">Join free</Link>
            </div>
          )}
        </div>
      </header>
      <main className="page">{children}</main>
      {profile ? <NavLinks variant="bottom" handle={profile.handle} unread={unread} isAdmin={profile.is_admin} /> : null}
    </>
  );
}

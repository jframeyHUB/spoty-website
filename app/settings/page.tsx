import Link from 'next/link';
import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import SettingsActions from './SettingsActions';

export const metadata = { title: 'Settings' };
export const dynamic = 'force-dynamic';

export default async function Settings() {
  const { user, profile } = await requireProfile('/settings');
  return (
    <Shell profile={profile}>
      <div className="narrow stack" style={{ margin: '0 auto' }}>
        <h1 style={{ fontSize: 24 }}>Settings</h1>
        <section className="card card-pad stack" style={{ gap: 6 }}>
          <p className="eyebrow">Signed in as</p>
          <p><b>{user.email}</b></p>
          <p className="soft small">You sign in with a code sent to this email.</p>
        </section>
        <section className="card card-pad stack" style={{ gap: 8 }}>
          <Link href="/profile/edit">Edit profile</Link>
          <Link href="/rules">SPOTY rules</Link>
          <Link href="/privacy">Privacy policy</Link>
          <a href="mailto:sales@spoty.club">Contact us</a>
        </section>
        <SettingsActions />
      </div>
    </Shell>
  );
}

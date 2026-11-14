import AppShell from './AppShell';
import { supabaseServer, type Profile } from '@/lib/supabase/server';

// App frame with the unread-notification count filled in.
export default async function Shell({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  let unread = 0;
  if (profile) {
    const supabase = await supabaseServer();
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null);
    unread = count || 0;
  }
  return <AppShell profile={profile} unread={unread}>{children}</AppShell>;
}

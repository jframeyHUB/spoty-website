import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import ProfileForm from '@/components/ProfileForm';

export const metadata = { title: 'Create your profile' };

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { user, profile } = await getSession();
  if (!user) redirect('/login?next=/onboarding');
  if (profile) redirect(next || '/leaderboard');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/leaderboard';
  return (
    <ProfileForm userId={user.id} mode="create" next={safeNext} initial={{
      first_name: '', last_name: '', handle: '', pronouns: '', country: '', area: '', job_title: '', profession: '', company: '',
      bio: '', photo_url: null, show_age: true, date_of_birth: ''
    }} />
  );
}

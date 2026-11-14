import { requireProfile } from '@/lib/supabase/server';
import Shell from '@/components/Shell';
import ProfileForm from '@/components/ProfileForm';

export const metadata = { title: 'Edit profile' };
export const dynamic = 'force-dynamic';

export default async function EditProfile() {
  const { supabase, profile } = await requireProfile('/profile/edit');
  const [{ data: priv }, { count }] = await Promise.all([
    supabase.from('profile_private').select('date_of_birth').eq('id', profile.id).maybeSingle(),
    supabase.from('votes').select('id', { count: 'exact', head: true }).eq('candidate_id', profile.id)
  ]);
  return (
    <Shell profile={profile}>
      <div className="narrow" style={{ margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>Edit profile</h1>
        <ProfileForm userId={profile.id} mode="edit" countryLocked={(count || 0) > 0} initial={{
          first_name: profile.first_name, last_name: profile.last_name, handle: profile.handle, pronouns: profile.pronouns || '',
          country: profile.country, area: profile.area || '', job_title: profile.job_title || '', profession: profile.profession || '',
          company: profile.company || '', bio: profile.bio || '', photo_url: profile.photo_url, show_age: profile.show_age,
          date_of_birth: priv?.date_of_birth || ''
        }} />
      </div>
    </Shell>
  );
}

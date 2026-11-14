import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a Server Component: middleware refreshes the session instead */ }
      }
    }
  });
}

export type Profile = {
  id: string; handle: string; first_name: string; last_name: string; photo_url: string | null; country: string;
  area: string | null; job_title: string | null; profession: string | null; company: string | null; pronouns: string | null;
  bio: string | null; show_age: boolean; is_admin: boolean; status: string; created_at: string;
};

// Signed-in user plus their profile (null if they haven't finished setting one up).
export async function getSession() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { supabase, user, profile: (profile as Profile) ?? null };
}

// For pages that need a finished profile.
export async function requireProfile(next: string) {
  const s = await getSession();
  if (!s.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!s.profile) redirect('/onboarding');
  return s as typeof s & { profile: Profile };
}

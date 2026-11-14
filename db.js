/* CLOVYN <-> Supabase. The publishable (anon) key is safe in frontend code. NEVER paste the secret/service_role key here. */
const SB_URL = 'https://xgidnxrgvgfbxxcxuyws.supabase.co';
const SB_KEY = 'sb_publishable_EGlEMgLwgep89PMTiuWNsA_Ep3uaKsv';
const sb = supabase.createClient(SB_URL, SB_KEY);

let syncT;
function syncProfile() { // saves profile, saved looks and planner (debounced)
  clearTimeout(syncT);
  syncT = setTimeout(async () => {
    if (!S.user || !S.user.id) return;
    const { error } = await sb.from('profiles').update({ name: S.user.name, gender: S.user.gender, age_range: S.user.age, size: S.user.size, styles: S.user.styles, colors: S.user.colors, saved: S.saved, plan: S.plan }).eq('id', S.user.id);
    if (error) console.log('sync error', error.message);
  }, 600);
}
async function loadClothes() {
  const { data } = await sb.from('clothes').select('*').order('created_at');
  S.wardrobe = (data || []).map(r => ({ id: r.id, name: r.name, cat: r.cat, color: r.color, pattern: r.pattern, style: r.style, season: r.season, img: r.image_url || '' }));
}
async function loadUser() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { if (!(S.user && S.user.demo)) { S.user = null; S.wardrobe = []; S.saved = []; S.plan = {} } return }
  const id = session.user.id, p = (await sb.from('profiles').select('*').eq('id', id).single()).data || {};
  S.user = { id, email: session.user.email, name: p.name, gender: p.gender, age: p.age_range, size: p.size, styles: p.styles || [], colors: p.colors || [], admin: !!p.is_admin };
  S.saved = p.saved || []; S.plan = p.plan || {};
  await loadClothes();
}
async function myProfile() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  return (await sb.from('profiles').select('*').eq('id', user.id).single()).data;
}

/* CLOVYN app: data (LocalStorage), recommendation engine, pages. */
const $ = s => document.querySelector(s), K = 'clovyn_v1';
let S = { user: null, wardrobe: [], saved: [], plan: {}, flags: {} };
try { S = Object.assign(S, JSON.parse(localStorage.getItem(K) || '{}')) } catch (e) {}
const save = () => { try { localStorage.setItem(K, JSON.stringify(S.user && S.user.demo ? S : { flags: S.flags })) } catch (e) { toast('Storage full – use smaller photos') } syncProfile() };
let AUTH_UP = true;
const toast = m => { const t = $('#toast'); t.textContent = m; t.className = 'on'; setTimeout(() => t.className = '', 2200) };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');

const CATS = ['T-shirts', 'Shirts', 'Jeans', 'Trousers', 'Jackets', 'Hoodies', 'Dresses', 'Ethnic wear', 'Shoes', 'Watches', 'Bags', 'Accessories'];
const SLOT = { 'T-shirts': 'top', Shirts: 'top', Hoodies: 'top', Jackets: 'layer', Jeans: 'bottom', Trousers: 'bottom', Dresses: 'full', 'Ethnic wear': 'full', Shoes: 'shoe', Watches: 'acc', Bags: 'acc', Accessories: 'acc' };
const EMO = { 'T-shirts': '👕', Shirts: '👔', Jeans: '👖', Trousers: '👖', Jackets: '🧥', Hoodies: '🧥', Dresses: '👗', 'Ethnic wear': '🥻', Shoes: '👟', Watches: '⌚', Bags: '👜', Accessories: '🕶️' };
const HEX = { Black: '#111', White: '#f3f3f3', Grey: '#9a9aa5', Navy: '#1f2a52', Blue: '#3b6fd4', Beige: '#d9c7a6', Brown: '#7a5030', Olive: '#69702f', Green: '#2f8f5b', Red: '#c62d3c', Pink: '#e88aa8', Purple: '#7c3aed', Yellow: '#e8c53a', Maroon: '#6d1a2a' };
const NEU = ['Black', 'White', 'Grey', 'Navy', 'Beige'], STY = ['Casual', 'Smart Casual', 'Formal', 'Party', 'Ethnic', 'Sporty'], SEA = ['All seasons', 'Summer', 'Winter', 'Monsoon'], PAT = ['Solid', 'Striped', 'Checked', 'Printed', 'Textured'];
const OCC = { College: ['Casual', 'Smart Casual', 'Sporty'], Wedding: ['Ethnic', 'Formal'], Casual: ['Casual', 'Sporty'], Party: ['Party', 'Formal', 'Smart Casual'], Office: ['Formal', 'Smart Casual'], Date: ['Smart Casual', 'Party'] };
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SAMPLE = [['Black Shirt', 'Shirts', 'Black', 'Solid', 'Formal', 'All seasons'], ['White Tee', 'T-shirts', 'White', 'Solid', 'Casual', 'Summer'], ['Navy Hoodie', 'Hoodies', 'Navy', 'Solid', 'Casual', 'Winter'], ['Blue Jeans', 'Jeans', 'Blue', 'Solid', 'Casual', 'All seasons'], ['Black Trousers', 'Trousers', 'Black', 'Solid', 'Formal', 'All seasons'], ['Beige Chinos', 'Trousers', 'Beige', 'Solid', 'Smart Casual', 'All seasons'], ['White Sneakers', 'Shoes', 'White', 'Solid', 'Casual', 'All seasons'], ['Black Loafers', 'Shoes', 'Black', 'Solid', 'Formal', 'All seasons'], ['Silver Watch', 'Watches', 'Grey', 'Solid', 'Smart Casual', 'All seasons'], ['Olive Jacket', 'Jackets', 'Olive', 'Solid', 'Smart Casual', 'Winter'], ['Red Party Dress', 'Dresses', 'Red', 'Solid', 'Party', 'All seasons'], ['Cream Kurta Set', 'Ethnic wear', 'Beige', 'Textured', 'Ethnic', 'All seasons'], ['Brown Mojari', 'Shoes', 'Brown', 'Textured', 'Ethnic', 'All seasons'], ['Grey Striped Shirt', 'Shirts', 'Grey', 'Striped', 'Smart Casual', 'All seasons']];
const PRIV = ['onboard', 'dash', 'wardrobe', 'add', 'stylist', 'saved', 'planner', 'profile'];
const uid = () => Math.random().toString(36).slice(2, 9), item = id => S.wardrobe.find(i => i.id == id);
const opt = (a, v) => a.map(x => `<option ${x == v ? 'selected' : ''}>${x}</option>`).join('');
const mk = a => ({ id: 'd', name: a[0], cat: a[1], color: a[2], pattern: a[3], style: a[4], season: a[5] });
const tile = (i, sm) => `<div class="tile ${sm ? 'sm' : ''}"><div class="sw" style="background-color:${HEX[i.color] || '#ccc'};${i.img ? `background-image:url(${i.img})` : ''}">${i.img ? '' : EMO[i.cat]}</div><div class="t"><b>${esc(i.name)}</b>${i.cat}${sm ? '' : `<br><span class="tag">${i.color}</span><span class="tag">${i.style}</span>`}</div></div>`;

/* ===== Recommendation engine (rule-based on tags; no AI model) ===== */
function gen(occ, anchorId) {
  const W = S.wardrobe, by = s => W.filter(i => SLOT[i.cat] == s), fav = (S.user && S.user.colors) || [];
  const sc = i => (OCC[occ].includes(i.style) ? 3 : 0) + (fav.includes(i.color) ? 1 : 0);
  const cc = (a, b) => NEU.includes(a.color) || NEU.includes(b.color) ? (a.color == b.color ? 0 : 2) : (a.color == b.color ? 0 : .5);
  const bases = by('full').map(f => [f]);
  by('top').forEach(t => by('bottom').forEach(b => bases.push([t, b])));
  const list = bases.map(p => {
    let s = p.reduce((a, i) => a + sc(i), 0) + (p.length > 1 ? cc(p[0], p[1]) : 1), parts = [...p];
    const sh = by('shoe').map(i => ({ i, s: sc(i) + cc(i, p[p.length - 1]) })).sort((a, b) => b.s - a.s)[0];
    if (sh) { parts.push(sh.i); s += sh.s }
    const ly = by('layer').map(i => ({ i, s: sc(i) + cc(i, p[0]) })).sort((a, b) => b.s - a.s)[0];
    if (ly && ly.s >= 3) { parts.push(ly.i); s += ly.s }
    const ac = by('acc').sort((a, b) => sc(b) - sc(a))[0];
    if (ac) { parts.push(ac); s += sc(ac) }
    return { parts, s, missing: sh ? '' : 'shoes' };
  }).filter(o => !anchorId || o.parts.some(i => i.id == anchorId)).sort((a, b) => b.s - a.s);
  const seen = new Set(), res = [], nm = ['Edit', 'Uniform', 'Mood'];
  for (const o of list) {
    const k = o.parts.slice(0, 2).map(i => i.id).join();
    if (seen.has(k)) continue; seen.add(k); res.push(o); if (res.length == 3) break;
  }
  return res.map((o, n) => ({
    name: `${occ} ${nm[n]}`, occ, ids: o.parts.map(i => i.id), parts: o.parts, missing: o.missing,
    note: `${o.parts.slice(0, 2).map(i => i.name).join(' + ')}: ${o.parts.slice(0, 2).some(i => NEU.includes(i.color)) ? 'neutral-friendly colours' : 'a bold colour pairing'} with ${o.parts[0].style} styling for ${occ}.${o.missing ? ' Add shoes to complete this look.' : ''}`
  }));
}
const REG = [], reg = o => REG.push(o) - 1;
const outCard = (o, btn) => { const i = reg(o); return `<div class="card fade"><h3>${esc(o.name)}</h3><span class="tag">${esc(o.occ)}</span><div class="out">${o.parts.map(p => tile(p, 1)).join('')}</div><p class="mut" style="font-size:.85rem">${esc(o.note)}</p>${btn ? `<button class="btn p s" onclick="saveLook(${i})">♡ Save outfit</button>` : ''}</div>` };
function saveLook(i) { const o = REG[i]; S.saved.push({ id: uid(), name: o.name, occ: o.occ, ids: o.ids, note: o.note }); save(); toast('Saved! Find it in Saved Looks') }

/* ===== Pages ===== */
const nav = p => {
  const L = S.user ? [['dash', 'Home', '🏠'], ['wardrobe', 'Wardrobe', '👕'], ['stylist', 'AI Stylist', '✨'], ['saved', 'Saved', '❤️'], ['planner', 'Planner', '📅'], ['profile', 'Profile', '👤']] : [['about', 'About', 'ℹ️']];
  return `<nav><div class="w"><a class="logo" href="#/${S.user ? 'dash' : ''}">CLO<b>V</b>YN</a>${L.map(([k, t]) => `<a class="l ${p == k ? 'on' : ''}" href="#/${k}">${t}</a>`).join('')}${S.user ? (S.user.admin ? '<a class="l" href="admin.html">Admin</a>' : '') + '<a class="l" href="#/" onclick="logout()">Log out</a>' : '<a class="btn p s" href="#/auth">Sign up</a>'}</div></nav>${S.user ? `<div class="tabs">${L.map(([k, t, e]) => `<a class="${p == k ? 'on' : ''}" href="#/${k}"><span>${e}</span>${t}</a>`).join('')}</div>` : ''}`;
};
const demo = (n, ix) => `<div class="card"><h3>${n}</h3><div class="out">${ix.map(k => tile(mk(SAMPLE[k]), 1)).join('')}</div></div>`;
const empty = (e, t, b) => `<div class="card" style="text-align:center;padding:36px"><div style="font-size:2.6rem">${e}</div><p>${t}</p>${b}</div>`;

const V = {
  '': () => `<div class="w"><div class="hero"><div class="fade"><span class="tag">STYLE THAT GETS YOU.</span><h1>YOUR WARDROBE.<br><span class="pu">REIMAGINED.</span></h1><p class="mut" style="font-size:1.1rem">Meet your personal AI stylist. Organize what you own, discover new combinations, and look your best every day.</p><div class="row"><a class="btn p" href="#/auth">Build My Wardrobe</a><a class="btn o" href="#/" onclick="event.preventDefault();$('#how').scrollIntoView({behavior:'smooth'})">Explore CLOVYN</a></div></div><div class="logoBox"><img src="logo.png" alt="CLOVYN logo"></div></div>
<div class="sec" id="how"><h2>How CLOVYN works</h2><div class="grid g3">${[['1', 'Add what you own', 'Upload photos of your clothes and tag colour, style and season.'], ['2', 'Chat with your stylist', 'Say "What should I wear to a wedding?" and get looks.'], ['3', 'Save and plan', 'Save favourites and plan your week in minutes.']].map(a => `<div class="card"><div class="stat">${a[0]}</div><h3>${a[1]}</h3><p class="mut">${a[2]}</p></div>`).join('')}</div></div>
<div class="sec"><h2>Sample looks</h2><div class="grid g3">${demo('College Edit', [0, 3, 6]) + demo('Office Uniform', [13, 4, 7]) + demo('Party Mood', [10, 6, 8])}</div><div class="note">Sample clothing shown. Outfit suggestions use your own clothing tags.</div></div>
<div class="sec"><h2>Loved by early users <span class="tag">SAMPLE CONTENT</span></h2><div class="grid g3">${['"Finally I stop repeating the same two outfits." – Sample User A', '"Planned my whole week in five minutes." – Sample User B', '"Wedding look sorted from my own closet." – Sample User C'].map(t => `<div class="card">${t}</div>`).join('')}</div></div>
<div class="sec" style="text-align:center"><h2>Don't buy more clothes. <span class="pu">Style what you own.</span></h2><a class="btn p" href="#/auth">Create my free account</a></div></div><footer>© CLOVYN – prototype MVP</footer>`,

  about: () => `<div class="w sec"><h2>About CLOVYN</h2><p class="mut">CLOVYN is a digital fashion companion for men and women. It knows what clothes you own and helps you decide what to wear – a personal stylist, not a shopping site.</p><a class="btn p" href="#/auth">Get started</a></div>`,

  auth: () => `<div class="w sec" style="max-width:420px"><h2>${AUTH_UP ? 'Create your account' : 'Welcome back'}</h2><form onsubmit="return authSubmit(event)">${AUTH_UP ? '<label>Your name</label><input id="un" required placeholder="e.g. Aman">' : ''}<label>Email</label><input type="email" id="ue" required><label>Password (min 6 characters)</label><input type="password" id="up" required minlength="6"><br><br><button class="btn p" style="width:100%">${AUTH_UP ? 'Sign up' : 'Log in'}</button></form><p style="text-align:center" class="mut">${AUTH_UP ? 'Already have an account? <a href="#/auth" onclick="authMode(false)"><b>Log in</b></a>' : 'New here? <a href="#/auth" onclick="authMode(true)"><b>Create account</b></a>'}</p><button class="btn o" style="width:100%" onclick="tryDemo()">Try the demo (sample wardrobe, not saved online)</button></div>`,

  onboard: () => `<div class="w sec" style="max-width:560px"><h2>Tell us your style</h2><p class="mut">Takes 30 seconds. It helps the stylist pick things you like.</p>${pform('Save & enter CLOVYN')}</div>`,

  profile: () => `<div class="w sec" style="max-width:560px"><h2>My Profile</h2>${pform('Save profile')}<br><button class="btn d s" onclick="resetAll()">Clear wardrobe, saved looks &amp; planner</button></div>`,

  dash: () => {
    const r = [...S.wardrobe].reverse().slice(0, 4), today = gen('Casual')[0];
    const st = [['Add 5 or more clothes', S.wardrobe.length >= 5, '#/add'], ['Ask the AI Stylist', S.flags.chat, '#/stylist'], ['Save a look', S.saved.length > 0, '#/stylist'], ['Plan a day', Object.keys(S.plan).length > 0, '#/planner']], done = st.filter(x => x[1]).length;
    return `<div class="w sec"><h2>Hi ${esc(S.user.name)} 👋</h2>
${done < 4 ? `<div class="card"><b>Getting started: ${done}/4</b><div class="bar"><i style="width:${done * 25}%"></i></div>${st.map(x => `<a class="chk" href="${x[2]}"><span>${x[1] ? '✅' : '⬜'} ${x[0]}</span><span class="mut">${x[1] ? '' : 'Go →'}</span></a>`).join('')}</div><br>` : ''}
<div class="grid g3"><div class="card"><div class="stat">${S.wardrobe.length}</div>clothing items</div><div class="card"><div class="stat">${S.saved.length}</div>saved looks</div><div class="card"><div class="stat">${Object.keys(S.plan).length}/7</div>days planned</div></div>
<div class="row" style="margin:20px 0"><a class="btn p" href="#/stylist">✨ Ask the AI Stylist</a><a class="btn o" href="#/add">+ Add clothing</a></div>
<h3>Recently added</h3>${r.length ? `<div class="grid">${r.map(i => tile(i)).join('')}</div>` : empty('👕', 'Your wardrobe is empty.', '<a class="btn p s" href="#/add">Add clothes</a> <button class="btn o s" onclick="sample()">Load sample wardrobe</button>')}
<h3 style="margin-top:28px">Today's outfit inspiration</h3>${today ? outCard(today, 1) : '<div class="card mut">Add a top and a bottom (or a dress) to get inspiration.</div>'}
<h3 style="margin-top:28px">This week</h3><div class="card">${DAYS.map(d => `<div class="row" style="justify-content:space-between;border-bottom:1px solid var(--line);padding:4px 0"><span>${d}</span><span class="mut">${(S.saved.find(s => s.id == S.plan[d]) || {}).name || '—'}</span></div>`).join('')}</div></div>`;
  },

  wardrobe: () => `<div class="w sec"><div class="row" style="justify-content:space-between"><h2>My Wardrobe (${S.wardrobe.length})</h2><div class="row"><a class="btn p s" href="#/add">+ Add clothing</a>${S.wardrobe.length ? '' : '<button class="btn o s" onclick="sample()">Load sample wardrobe</button>'}</div></div><div style="margin:14px 0"><select id="fc" onchange="wf()" style="max-width:220px"><option value="">All categories</option>${opt(CATS)}</select></div><div id="wg" class="grid"></div></div>`,

  add: id => {
    const i = id ? item(id) : {};
    return `<div class="w sec" style="max-width:520px"><h2>${id ? 'Edit' : 'Add'} clothing</h2><form onsubmit="return saveItem(event,'${id || ''}')"><label>Photo (optional – a colour tile is used if empty)</label><input type="file" id="ph" accept="image/*"><label>Name</label><input name="name" required value="${esc(i.name)}" placeholder="e.g. Black Shirt"><label>Category</label><select name="cat">${opt(CATS, i.cat)}</select><label>Colour</label><select name="color">${opt(Object.keys(HEX), i.color)}</select><label>Pattern</label><select name="pattern">${opt(PAT, i.pattern)}</select><label>Style</label><select name="style">${opt(STY, i.style)}</select><label>Season</label><select name="season">${opt(SEA, i.season)}</select><br><br><button class="btn p">Save item</button></form><div class="note">You choose the tags yourself. Automatic photo recognition is a future feature.</div></div>`;
  },

  stylist: () => `<div class="w sec"><h2>✨ AI Stylist</h2><div class="note">${AI_ENDPOINT ? 'Connected to the AI server.' : 'Built-in stylist (rule-based on your clothing tags – not a live AI model). Connect an AI server in ai.js.'} It only uses clothes you have added.</div><div id="msgs"></div><div class="row" style="margin-bottom:12px">${QUICK.map(q => `<button class="btn o s" onclick="ask(this.textContent)">${q}</button>`).join('')}</div><form onsubmit="return send(event)" class="row" style="flex-wrap:nowrap"><input id="q" placeholder="Ask e.g. What should I wear to a party?" autocomplete="off"><button class="btn p">Send</button></form></div>`,

  saved: () => `<div class="w sec"><h2>My Saved Looks</h2>${S.saved.length ? `<div class="grid g3">${S.saved.map(s => `<div class="card"><h3>${esc(s.name)}</h3><span class="tag">${esc(s.occ)}</span><div class="out">${s.ids.map(item).filter(Boolean).map(p => tile(p, 1)).join('')}</div><p class="mut" style="font-size:.85rem">${esc(s.note)}</p><div class="row"><select style="max-width:150px" onchange="planFrom('${s.id}',this.value)"><option value="">Plan for…</option>${DAYS.map(d => `<option>${d}</option>`).join('')}</select><button class="btn d s" onclick="delLook('${s.id}')">Delete</button></div></div>`).join('')}</div>` : empty('❤️', 'No saved looks yet.', '<a class="btn p s" href="#/stylist">Ask the AI Stylist</a>')}</div>`,

  planner: () => `<div class="w sec"><h2>Outfit Planner</h2>${S.saved.length ? '' : '<div class="note">Save some looks first, then plan your week here.</div>'}<div class="card">${DAYS.map(d => `<div class="row" style="justify-content:space-between;padding:6px 0"><b>${d}</b><select style="max-width:260px" onchange="plan('${d}',this.value)"><option value="">— none —</option>${S.saved.map(s => `<option value="${s.id}" ${S.plan[d] == s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>`).join('')}</div></div>`
};

function pform(btn) {
  const u = S.user, c = u.colors || [], st = u.styles || [];
  return `<form onsubmit="return saveProfile(event)"><label>Name</label><input name="name" value="${esc(u.name)}" required><label>Clothing category</label><select name="gender">${opt(['Menswear', 'Womenswear', 'Both'], u.gender)}</select><label>Age range</label><select name="age">${opt(['Under 18', '18–22', '23–30', '31–40', '40+'], u.age)}</select><label>Preferred styles</label><div class="chips">${STY.map(s => `<label><input type="checkbox" name="styles" value="${s}" ${st.includes(s) ? 'checked' : ''}>${s}</label>`).join('')}</div><label>Favourite colours</label><div class="chips">${Object.keys(HEX).map(s => `<label><input type="checkbox" name="colors" value="${s}" ${c.includes(s) ? 'checked' : ''}>${s}</label>`).join('')}</div><label>Size (optional)</label><input name="size" value="${esc(u.size)}" placeholder="e.g. M / 32"><br><br><button class="btn p">${btn}</button></form>`;
}

/* ===== Actions ===== */
function authMode(b) { AUTH_UP = b; route() }
async function authSubmit(e) {
  e.preventDefault(); const em = $('#ue').value.trim(), pw = $('#up').value, nm = $('#un') ? $('#un').value.trim() : '', btn = e.target.querySelector('button'); let er; btn.disabled = true;
  if (AUTH_UP) { const r = await sb.auth.signUp({ email: em, password: pw, options: { data: { name: nm } } }); er = r.error; if (!er && !r.data.session) { toast('Check your email to confirm, then log in'); btn.disabled = false; return false } }
  else { const r = await sb.auth.signInWithPassword({ email: em, password: pw }); er = r.error }
  if (er) { toast(er.message); btn.disabled = false; return false }
  await sb.rpc('record_login'); await loadUser(); location.hash = S.user.gender ? '#/dash' : '#/onboard'; route(); return false;
}
function tryDemo() { S.user = { name: 'Guest', demo: true, gender: 'Both', styles: [], colors: [] }; S.wardrobe = SAMPLE.map(a => ({ ...mk(a), id: uid() })); save(); location.hash = '#/dash' }
function saveProfile(e) { e.preventDefault(); const f = new FormData(e.target), first = !S.user.gender; Object.assign(S.user, { name: f.get('name'), gender: f.get('gender'), age: f.get('age'), size: f.get('size'), styles: f.getAll('styles'), colors: f.getAll('colors') }); save(); toast('Profile saved'); location.hash = first ? '#/dash' : '#/profile'; return false }
function logout() { const real = S.user && S.user.id; S = { user: null, wardrobe: [], saved: [], plan: {}, flags: {} }; localStorage.removeItem(K); if (real) sb.auth.signOut() }
async function sample() {
  if (S.user.id) { const { error } = await sb.from('clothes').insert(SAMPLE.map(a => ({ name: a[0], cat: a[1], color: a[2], pattern: a[3], style: a[4], season: a[5] }))); if (error) return toast(error.message); await loadClothes() }
  else S.wardrobe = SAMPLE.map(a => ({ ...mk(a), id: uid() }));
  save(); toast('Sample wardrobe loaded'); route();
}
async function resetAll() {
  if (!confirm('Delete your wardrobe, saved looks and planner?')) return;
  if (S.user.id) await sb.from('clothes').delete().eq('user_id', S.user.id);
  S.wardrobe = []; S.saved = []; S.plan = {}; save(); toast('Cleared'); route();
}
function wf() { const c = $('#fc').value, l = S.wardrobe.filter(i => !c || i.cat == c); $('#wg').innerHTML = l.length ? l.map(i => `<div>${tile(i)}<div class="row" style="margin-top:6px"><a class="btn o s" href="#/add/${i.id}">Edit</a><button class="btn d s" onclick="delItem('${i.id}')">Delete</button></div></div>`).join('') : '<p class="mut">Nothing here yet.</p>' }
async function delItem(id) { if (!confirm('Delete this item?')) return; if (S.user.id) { const { error } = await sb.from('clothes').delete().eq('id', id); if (error) return toast(error.message); await loadClothes() } else S.wardrobe = S.wardrobe.filter(i => i.id != id); save(); wf() }
function delLook(id) { S.saved = S.saved.filter(s => s.id != id); for (const d in S.plan) if (S.plan[d] == id) delete S.plan[d]; save(); route() }
function plan(d, v) { v ? S.plan[d] = v : delete S.plan[d]; save(); toast('Planner updated') }
function planFrom(id, d) { if (d) { S.plan[d] = id; save(); toast('Planned for ' + d) } }
async function saveItem(e, id) {
  e.preventDefault(); const f = new FormData(e.target), o = {}; f.forEach((v, k) => o[k] = v);
  let img = id ? item(id).img : '', file = $('#ph').files[0];
  if (file) img = await new Promise(r => { const im = new Image; im.onload = () => { const c = document.createElement('canvas'), k = Math.min(1, 320 / Math.max(im.width, im.height)); c.width = im.width * k; c.height = im.height * k; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); r(c.toDataURL('image/jpeg', .7)) }; im.src = URL.createObjectURL(file) });
  if (S.user.id) {
    const row = { name: o.name, cat: o.cat, color: o.color, pattern: o.pattern, style: o.style, season: o.season, image_url: img };
    const { error } = id ? await sb.from('clothes').update(row).eq('id', id) : await sb.from('clothes').insert(row);
    if (error) { toast(error.message); return false }
    await loadClothes();
  } else if (id) Object.assign(item(id), o, { img }); else S.wardrobe.push({ id: uid(), ...o, img });
  save(); toast('Item saved'); location.hash = '#/wardrobe'; return false;
}

/* ===== AI chat ===== */
let CHAT = [];
function showMsgs() {
  if (!CHAT.length) CHAT.push({ r: 'b', t: `Hi ${S.user.name}! Tell me where you are going and I will build outfits from your wardrobe.`, o: [] });
  const m = $('#msgs'); if (!m) return;
  m.innerHTML = CHAT.map(c => `<div class="m ${c.r}"><div class="bub">${esc(c.t)}</div>${(c.o || []).map(o => outCard(o, 1)).join('')}</div>`).join('');
  m.lastElementChild.scrollIntoView({ block: 'nearest' });
}
function send(e) { e.preventDefault(); const q = $('#q'), t = q.value.trim(); q.value = ''; ask(t); return false }
async function ask(t) {
  if (!t) return; S.flags.chat = 1; save();
  CHAT.push({ r: 'u', t }, { r: 'b', t: 'Thinking…', o: [] }); showMsgs();
  const res = await askStylist(t); CHAT.pop(); CHAT.push({ r: 'b', t: res.reply, o: res.looks }); showMsgs();
}

/* ===== Router ===== */
function route() {
  const h = location.hash.slice(2).split('/'), p = h[0] || '';
  if (!V[p]) return location.hash = '#/';
  if (!S.user && PRIV.includes(p)) return location.hash = '#/auth';
  if (S.user && p == 'auth') return location.hash = '#/dash';
  $('#app').innerHTML = nav(p) + V[p](h[1]);
  if (p == 'wardrobe') wf(); if (p == 'stylist') showMsgs();
  window.scrollTo(0, 0);
}
addEventListener('hashchange', route); loadUser().then(route);

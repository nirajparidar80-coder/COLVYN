/* ===== CLOVYN AI STYLIST =====
   AI_ENDPOINT = ''  -> built-in stylist (rules on your clothing tags, works offline, NOT a real AI model)
   AI_ENDPOINT = 'http://localhost:3000/api/stylist' -> real AI via server.js (needs your API key on the server)
   NEVER put an API key in this file – anyone can read frontend code. */
const AI_ENDPOINT = '';

const QUICK = ['What should I wear to college?', 'What should I wear to a wedding?', 'Suggest a casual outfit for today', 'Create a premium party look', 'Style my black trousers'];

function localStylist(m) {
  const t = m.toLowerCase(), W = S.wardrobe;
  if (!W.length) return { reply: "Your wardrobe is empty. Add a few clothes (or load the sample wardrobe) and I'll style them.", looks: [] };
  const KEY = {
    College: /college|class|campus|university/, Wedding: /wedding|shaadi|sangeet|marriage/,
    Party: /party|club|night out|birthday/, Office: /office|work|interview|meeting/,
    Date: /date|dinner/, Casual: /casual|today|everyday|chill|outing/
  };
  const occ = Object.keys(KEY).find(k => KEY[k].test(t));
  const a = W.find(i => t.includes(i.name.toLowerCase()) || t.includes((i.color + ' ' + i.cat).toLowerCase()) || t.includes((i.color + ' ' + i.cat.replace(/s$/, '')).toLowerCase()));
  if (!occ && !a) return { reply: 'Tell me the occasion – college, wedding, party, office, date or casual – or name an item, like "style my black trousers".', looks: [] };
  const o = occ || 'Casual', looks = gen(o, a && a.id);
  return {
    reply: looks.length ? `Here ${looks.length > 1 ? 'are ' + looks.length + ' looks' : 'is a look'} for ${a ? 'your ' + a.name + ' – ' : ''}${o.toLowerCase()}. They only use clothes you have added.` : "I couldn't build a full outfit yet. Add a top + bottom (or a dress) and shoes.",
    looks
  };
}

async function askStylist(msg) {
  if (!AI_ENDPOINT) return localStylist(msg);
  try {
    const r = await fetch(AI_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, profile: { gender: S.user.gender, styles: S.user.styles, colors: S.user.colors }, wardrobe: S.wardrobe.map(({ img, ...i }) => i) })
    });
    if (!r.ok) throw 0;
    const d = await r.json();
    // Only keep items that really exist in the wardrobe
    const looks = (d.looks || []).map(l => {
      const parts = (l.itemIds || []).map(item).filter(Boolean);
      return { name: l.name || 'AI look', occ: l.occasion || '', ids: parts.map(p => p.id), parts, note: l.note || '', missing: '' };
    }).filter(l => l.parts.length);
    return { reply: d.reply || 'Here you go:', looks };
  } catch (e) {
    const l = localStylist(msg);
    l.reply = '(AI server not reachable – using the built-in stylist) ' + l.reply;
    return l;
  }
}

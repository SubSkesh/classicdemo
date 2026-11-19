// Cloudflare Pages: private client preview.
// The client signs in with the ID and password sent by OC Software, either on the OC Software site
// ("Anteprima clienti" posts to /login) or on the login page served here. A signed cookie then
// unlocks every page. Credentials come from BASIC_AUTH_USER / BASIC_AUTH_PASS; the cookie is signed
// with AUTH_SECRET when set, otherwise with the password, so changing it logs everyone out.
// Every response carries X-Robots-Tag: noindex.

const COOKIE = 'csw_preview_classic';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
// shown on the login page before signing in
const PUBLIC = [/^\/favicon\.svg$/];

const enc = new TextEncoder();

// constant-time comparison, so the response time does not leak how much matched
function safeEqual(a, b) {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(user, secret) {
  const payload = `${Math.floor(Date.now() / 1000) + MAX_AGE}.${user}`;
  return `${payload}.${await sign(payload, secret)}`;
}

async function validToken(token, user, secret) {
  if (!token) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const dot = payload.indexOf('.');
  const exp = payload.slice(0, dot);
  const who = payload.slice(dot + 1);
  if (!safeEqual(who || '', user) || !(Number(exp) > Date.now() / 1000)) return false;
  return safeEqual(token.slice(i + 1), await sign(payload, secret));
}

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

// values pasted into the Cloudflare dashboard often carry a stray space or newline
const clean = (v) => String(v || '').trim();

function checkCredentials(user, pass, env) {
  // evaluate both comparisons so a wrong ID and a wrong password take the same time
  const u = safeEqual(clean(user).toLowerCase(), clean(env.BASIC_AUTH_USER).toLowerCase());
  const p = safeEqual(clean(pass), clean(env.BASIC_AUTH_PASS));
  return u && p;
}

// only same-site paths, so /login cannot be used to bounce visitors elsewhere
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function noindex(response) {
  const out = new Response(response.body, response);
  out.headers.set('X-Robots-Tag', 'noindex');
  return out;
}

function redirect(location, cookie) {
  const headers = { Location: location, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(null, { status: 303, headers });
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function loginPage(next, error, status = 200) {
  const html = `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Anteprima riservata · Classic Club</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px 16px;background:radial-gradient(90% 70% at 50% 30%,rgba(255,45,111,.14),transparent 60%),#0A0A0A;color:#9A978F;font:400 17px/1.5 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
main{width:100%;max-width:400px}
svg{width:84px;color:#F2F0EB;margin:0 0 28px;display:block}
h1{margin:0 0 8px;font:800 44px/.92 "Arial Narrow",Impact,sans-serif;text-transform:uppercase;color:#F2F0EB;letter-spacing:-.01em}
p{margin:0 0 28px}
label{display:block;font-size:14px;font-weight:600;color:#F2F0EB;margin:0 0 6px}
input{width:100%;margin:0 0 18px;padding:12px 2px;font:400 17px system-ui,Arial,sans-serif;color:#F2F0EB;background:transparent;border:0;border-bottom:1px solid #4a4843;border-radius:0}
input:focus{outline:none;border-bottom-color:#FF2D6F;box-shadow:0 1px 0 #FF2D6F}
button{min-height:48px;padding:0 28px;border:0;border-radius:999px;cursor:pointer;background:#F2F0EB;color:#0A0A0A;font:600 17px system-ui,Arial,sans-serif}
button:focus-visible{outline:2px solid #FF2D6F;outline-offset:4px}
.err{margin:0 0 20px;padding:10px 12px;border-left:2px solid #FF2D6F;background:#121211;color:#F2F0EB;font-size:15px}
small{display:block;margin-top:28px;font-size:13px}
</style></head><body><main>
<svg viewBox="0 0 225 139" fill="currentColor" aria-hidden="true"><path d="M90 10H0v119h90v-27H27V37h63z"/><rect x="99" width="27" height="139"/><path d="M135 10h90v119h-90v-27h63V37h-63z"/></svg>
<h1>Anteprima riservata</h1>
<p>Inserisci l’ID e la password che ti abbiamo inviato.</p>
${error ? '<p class="err" role="alert">ID o password non corretti. Controlla e riprova.</p>' : ''}
<form method="post" action="/login">
<input type="hidden" name="next" value="${esc(next)}">
<label for="user">ID</label><input id="user" name="user" autocomplete="username" required autofocus>
<label for="pass">Password</label><input id="pass" name="pass" type="password" autocomplete="current-password" required>
<button type="submit">Entra</button>
</form>
<small>Bozza riservata, realizzata da OC Software.</small>
</main></body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

// Login failures coming from the "Anteprima clienti" page of ocsw.it go back there with the error,
// so the client stays on the OC Software site. Only these fixed addresses are ever used.
const OCSW_ORIGINS = ['https://ocsw.it', 'https://www.ocsw.it'];
const OCSW_ERROR = { it: 'https://ocsw.it/anteprima-clienti', en: 'https://ocsw.it/en/client-preview' };

// returns 'it' / 'en' when the request comes from ocsw.it, otherwise null
function fromOcsw(request, form) {
  const origin = request.headers.get('Origin');
  let referer = null;
  try { referer = new URL(request.headers.get('Referer') || ''); } catch {}
  const ok = OCSW_ORIGINS.includes(origin) || (referer && OCSW_ORIGINS.includes(referer.origin));
  if (!ok) return null;
  // browsers often strip the path from cross-site referers, so the form may also say lang=en
  const en = (referer && OCSW_ORIGINS.includes(referer.origin) && referer.pathname.startsWith('/en/')) || form.get('lang') === 'en';
  return en ? 'en' : 'it';
}

// the draft lives on the OC Software subdomain; the default pages.dev address forwards there.
// Preview deployments (<hash>.classic-demo-cpm.pages.dev) stay reachable for testing.
const CANONICAL = 'classic.ocsw.it';
const LEGACY = 'classic-demo-cpm.pages.dev';

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (url.hostname === LEGACY) {
    url.hostname = env.CANONICAL_HOST || CANONICAL;
    // 308 keeps the method, so a login form still posting to pages.dev keeps working
    return new Response(null, { status: 308, headers: { Location: url.toString(), 'X-Robots-Tag': 'noindex' } });
  }
  const configured = clean(env.BASIC_AUTH_USER) && clean(env.BASIC_AUTH_PASS);
  const secret = clean(env.AUTH_SECRET) || clean(env.BASIC_AUTH_PASS);
  const userId = clean(env.BASIC_AUTH_USER).toLowerCase();

  if (url.pathname === '/login') {
    if (request.method === 'POST') {
      let form;
      try { form = await request.formData(); } catch { form = new FormData(); }
      const target = safeNext(form.get('next'));
      // fail closed: without configured credentials nobody gets in
      if (configured && checkCredentials(form.get('user'), form.get('pass'), env)) {
        const token = await makeToken(userId, secret);
        return redirect(target, `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`);
      }
      // e=1 wrong ID or password; e=0 credentials not configured on this deployment
      const code = configured ? 1 : 0;
      const lang = fromOcsw(request, form);
      if (lang) return redirect(`${OCSW_ERROR[lang]}?errore=${code}`);
      return redirect(`/login?e=${code}&next=${encodeURIComponent(target)}`);
    }
    return loginPage(safeNext(url.searchParams.get('next')), url.searchParams.has('e'));
  }

  if (url.pathname === '/logout') {
    return redirect('/login', `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
  }

  if (PUBLIC.some((re) => re.test(url.pathname))) return noindex(await next());

  if (configured && (await validToken(readCookie(request, COOKIE), userId, secret))) {
    return noindex(await next());
  }

  // pages send the visitor to the login page; files (CSS, JS, images, 3D) just get 401
  const wantsPage = request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
  if (wantsPage) return redirect(`/login?next=${encodeURIComponent(url.pathname + url.search)}`);
  return new Response('Accesso riservato.', {
    status: 401,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  });
}

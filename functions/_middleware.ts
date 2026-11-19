/**
 * Cloudflare Pages Function: tutta la demo sta dietro password (HTTP Basic Auth).
 * La password è il secret DEMO_PASSWORD del progetto Pages. Se manca, l'accesso è negato (fail closed).
 * Ogni risposta porta anche X-Robots-Tag: noindex.
 */
interface Env {
  DEMO_PASSWORD?: string;
  DEMO_USER?: string;
}

const NOINDEX = 'noindex, nofollow, noarchive';

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized(msg = 'Accesso riservato') {
  return new Response(msg, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Classic Club demo", charset="UTF-8"',
      'X-Robots-Tag': NOINDEX,
      'Cache-Control': 'no-store',
    },
  });
}

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const password = env.DEMO_PASSWORD;
  if (!password) return unauthorized('Demo non ancora configurata');

  const header = request.headers.get('Authorization') ?? '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();

  let user = '';
  let pass = '';
  try {
    const decoded = atob(encoded);
    const i = decoded.indexOf(':');
    user = decoded.slice(0, i);
    pass = decoded.slice(i + 1);
  } catch {
    return unauthorized();
  }
  const expectedUser = env.DEMO_USER ?? 'classic';
  if (!safeEqual(user, expectedUser) || !safeEqual(pass, password)) return unauthorized();

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', NOINDEX);
  return out;
};

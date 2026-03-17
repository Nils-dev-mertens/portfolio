export const prerender = false;

export async function POST({ request }: { request: Request }) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.message) {
    return Response.json({ ok: false, error: 'Missing email or message' }, { status: 400 });
  }

  // TODO: wire up email delivery (e.g. Resend, Nodemailer)
  console.log('[contact] Received from:', body.email);

  return Response.json({ ok: true });
}

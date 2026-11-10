/**
 * Gate for the facilitator-only endpoints (session list and data export).
 *
 * This is a deliberately simple shared-token check. It is a second line of
 * defence, not the primary one: the study deployment should also sit behind
 * Vercel's password protection, as the protocol's handling of access states.
 * Without STUDY_ADMIN_TOKEN set, the endpoints refuse rather than open up.
 */
export function isAdminRequest(req: Request): boolean {
  const expected = process.env.STUDY_ADMIN_TOKEN;
  if (!expected) return false;

  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(req.url).searchParams.get("token") ?? "";
  const supplied = bearer || query;

  // Length-independent comparison without leaking which part differed.
  if (supplied.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export function adminDenied(): Response {
  return Response.json(
    { error: "Not authorised. Supply the facilitator token, and set STUDY_ADMIN_TOKEN on the deployment." },
    { status: 401 },
  );
}

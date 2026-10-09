import crypto from "node:crypto";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const cookieHeader = req.headers.cookie || "";
  const stateCookie = cookieHeader.split(";").map(x => x.trim()).find(x => x.startsWith("blog_oauth_state="));
  const savedState = stateCookie ? stateCookie.slice("blog_oauth_state=".length) : "";
  res.setHeader("Set-Cookie", "blog_oauth_state=; HttpOnly; SameSite=Lax; Path=/api; Max-Age=0; Secure");
  if (!code || !state || !savedState || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(savedState))) {
    return res.status(400).send("OAuth verification failed. Close this window and try signing in again.");
  }
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(500).send("GitHub OAuth is not configured in Vercel.");
  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json", "User-Agent": "MH-Online-Quran-Blog-Admin" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error("GitHub did not return an access token.");
    const payload = JSON.stringify({ token: data.access_token, provider: "github" });
    const safePayload = escapeHtml(payload);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>GitHub sign-in</title></head><body><p>Connected. You can close this window.</p><script>if(window.opener){window.opener.postMessage("authorization:github:success:"+JSON.stringify({token:${JSON.stringify(data.access_token)},provider:"github"}), "https://mh-online-quran.vercel.app");window.close();}</script></body></html>`);
  } catch (error) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(502).send("<!doctype html><html><body><p>GitHub sign-in failed. Close this window and try again.</p></body></html>");
  }
}

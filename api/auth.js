import crypto from "node:crypto";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).send("Blog admin is not configured yet. Add OAUTH_GITHUB_CLIENT_ID in Vercel.");
  const state = crypto.randomBytes(24).toString("hex");
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `blog_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=600${secure}`);
  const callback = "https://mh-online-quran.vercel.app/api/callback";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callback,
    scope: "repo",
    state
  });
  return res.redirect(302, "https://github.com/login/oauth/authorize?" + params.toString());
}

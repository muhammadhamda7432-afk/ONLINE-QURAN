# Blog Admin — one-time setup

The admin page is at https://mh-online-quran.vercel.app/admin/ and the publishing dashboard is at https://mh-online-quran.vercel.app/admin/cms.html.

## 1. Create a GitHub OAuth App
1. Sign in to GitHub using the account that can push to `muhammadhamda7432-afk/ONLINE-QURAN`.
2. Open GitHub Settings → Developer settings → OAuth Apps → New OAuth App.
3. Homepage URL: `https://mh-online-quran.vercel.app`
4. Authorization callback URL: `https://mh-online-quran.vercel.app/api/callback`
5. Create the app and copy its Client ID. Generate a Client Secret.

## 2. Add Vercel environment variables
In Vercel → the project for this website → Settings → Environment Variables, add:
- `OAUTH_GITHUB_CLIENT_ID` = your OAuth App Client ID
- `OAUTH_GITHUB_CLIENT_SECRET` = your OAuth App Client Secret

Apply them to Production, then redeploy. Never put the Client Secret in a public file or send it in chat.

## 3. Publish
Open `/admin/cms.html`, sign in with GitHub, and create a Blog Post. Publishing commits the Markdown article to the repository. Vercel runs the build, creates a separate HTML page for the article, adds it to Blog & Articles, and updates the generated sitemap.

Only give repository write access to people who should be allowed to publish website content.
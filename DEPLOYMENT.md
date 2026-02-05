# Deploying to Netlify

## Run locally before deploying

**Option 1 – Static preview (same as Netlify)**  
Build and serve the static site on your machine:

```bash
npm install
npm run preview
```

Then open **http://localhost:4173** (or the URL Vite prints). This is the same output Netlify will serve. The waitlist form will submit to Netlify only after you deploy; locally you’ll see a 404 on submit unless you use a Netlify dev CLI or test after deploy.

**Option 2 – Full dev server (with backend)**  
Run the Express server + Vite dev server (needs DB and env for auth):

```bash
npm install
npm run dev
```

Then open **http://localhost:5000** (or the port in `PORT`).

---

## Deploy steps

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In [Netlify](https://app.netlify.com), click **Add new site** → **Import an existing project** and connect the repo.
3. Netlify will use the settings in `netlify.toml`:
   - **Build command:** `npm run build:netlify`
   - **Publish directory:** `dist/public`
4. Click **Deploy site**. The site will be a static landing page with the mobile app waitlist form.

## Where signup emails are stored

- **Netlify Forms** stores every submission from the “Join the waitlist” form.
- View submissions: Netlify dashboard → your site → **Forms** → **mobile-app-signup**.
- Export: **Forms** → **mobile-app-signup** → **Export submissions** (CSV).
- Optional: use [Netlify Forms API](https://docs.netlify.com/api/get-started/#forms) to read submissions in your mobile app or scripts.

No database or env vars are required; Netlify provides form storage and spam filtering (including the honeypot field) on the free tier.

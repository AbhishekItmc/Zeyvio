# Zeyvio landing page

- `index.html` — light theme (main page)
- `dark.html` — dark theme variant, same content
- `vercel.json` — clean URLs + basic security headers

## Deploy: drag and drop (fastest, no CLI)

1. Go to https://vercel.com/new
2. Scroll to the bottom and find the drag-and-drop upload area
3. Drop this whole folder (or the .zip) in
4. Vercel gives you a live URL in ~20 seconds — that's the client link

## Deploy: CLI

    npm i -g vercel
    cd zeyvio-site
    vercel          # preview URL
    vercel --prod   # production URL

## Deploy: GitHub (best if the client will request changes)

1. Push this folder to a new GitHub repo
2. vercel.com/new -> Import Git Repository -> pick the repo
3. Framework preset: Other. No build command, no output directory.
4. Every push to main redeploys automatically.

## Notes

- Both pages are fully self-contained: no build step, no npm install.
- External requests: Google Fonts (Inter Tight, JetBrains Mono) and the
  three.js r128 bundle from cdnjs. Both are CDN-hosted, nothing to install.
- To make the dark theme the main page, swap the two filenames.

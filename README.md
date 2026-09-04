# Zeyvio website

Multi-page static site plus one serverless function for the AI assistant.

```
index.html         Home
solutions.html     10 capability areas
industries.html    6 industries
approach.html      6 phases + idea-to-product
trust.html         Responsible AI + the Zeyvio advantage
talk.html          Full-page AI assistant
privacy.html       PLACEHOLDER - needs real legal text
terms.html         PLACEHOLDER - needs real legal text
assets/styles.css  All page styling
assets/chat.css    Chat widget styling
assets/site.js     Code background, 3D robot, mobile menu
assets/chat.js     Chat front end
api/chat.js        Serverless function -> Anthropic API
vercel.json        Clean URLs + security headers
```

No build step. No npm install. Vercel detects `api/chat.js` automatically.

---

## 1. Deploy

Push this folder to GitHub, then on Vercel: **Import Git Repository** ->
Framework Preset **Other** -> leave Build Command and Output Directory empty -> Deploy.

## 2. Make the chatbot work

The chat needs an Anthropic API key. **Without it the site still works** - the chat
just tells visitors to email instead.

1. Get a key at <https://console.anthropic.com> -> API Keys. This is a **paid**
   product, separate from a Claude.ai subscription. Add credit to the account.
2. In Vercel: Project -> **Settings** -> **Environment Variables**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key (starts with `sk-ant-`)
   - Environments: tick Production, Preview and Development
3. **Redeploy.** Env vars only apply to new deployments - Deployments tab ->
   latest -> ... -> Redeploy.
4. Open `/talk` and send a message.

### Optional: change the model

Add env var `ZEYVIO_MODEL`. Default is `claude-haiku-4-5-20251001` (fast, cheap).
For better answers use `claude-sonnet-5` - costs more per conversation.

### Cost warning - read this

The endpoint is public. Anyone can send messages and every message costs money.
Before promoting the site widely:

- Set a **monthly spend limit** in the Anthropic console. Do this first.
- Turn on **Vercel Firewall** (Project -> Firewall) and add a rate limit on `/api/chat`.
- Watch usage for the first week.

The function already caps input at 2,000 characters, history at 12 turns and
replies at 700 tokens, which limits the damage per request but not the volume.

---

## 3. Before the client launches

- [ ] Replace `hello@zeyvio.com` - it appears in `assets/chat.js` (top of file),
      `talk.html`, and the footer of every page.
- [ ] Write real Privacy and Terms text. If the chat is live, the privacy policy
      **must** disclose that conversations are processed by a third-party AI provider.
- [ ] Add real case studies. There is no proof or client evidence anywhere on the site.
- [ ] Check the system prompt in `api/chat.js` (the `SYSTEM` constant) - it is the
      assistant's entire knowledge of Zeyvio. Anything not written there, it does not know.
- [ ] Custom domain: Project -> Settings -> Domains.

## 4. Editing the assistant's behaviour

Everything the bot knows and every rule it follows lives in the `SYSTEM` string in
`api/chat.js`. It is currently instructed to never invent prices, dates, case
studies, client names or compliance guarantees. Keep those limits - they are what
stops the bot promising something the team then has to honour.

The opening message and the four suggested questions are at the top of
`assets/chat.js` (`GREETING` and `CHIPS`).

## 5. Local development

```
npm i -g vercel
vercel dev            # serves the pages AND the api function on localhost:3000
```

Plain `python3 -m http.server` serves the pages but not `/api/chat`, so the chat
will show its offline message.

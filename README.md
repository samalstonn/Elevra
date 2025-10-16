## Getting Started

Run the development server:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)

## Email Unsubscribe (Candidate Outreach)
- Candidate outreach emails now include one-click List-Unsubscribe headers and a visible footer.
- Set `EMAIL_UNSUBSCRIBE_SECRET` to a strong secret to sign unsubscribe tokens.
- Ensure `NEXT_PUBLIC_APP_URL` is set to your public base URL; links use this origin.
- Endpoint: `GET/POST /api/unsubscribe?email=...&scope=candidate-outreach&token=...`.
- Scope is limited to `candidate-outreach`. Tokens do not expire.

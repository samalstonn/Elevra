## Getting Started

Run the development server:

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 

## Universities example

This project includes a simple integration with the public Universities (Hipolabs) API:

- API route: `GET /api/universities?name=<string>&country=<string>`
- UI page: `/universities` renders a search input and a list of results (name + location + web link)

Implementation files:

- `lib/universities.ts` – typed fetcher for the external API
- `app/api/universities/route.ts` – Next.js route handler that proxies requests and applies caching
- `components/UniversitySearch.tsx` – client component with a debounced search UI
- `app/(footer-pages)/universities/page.tsx` – page to host the search

Notes:

- The route caches responses for 24 hours (revalidate=86400).
- In locked-down environments without outbound internet, the external API won’t be reachable; the UI will show an error in that case.


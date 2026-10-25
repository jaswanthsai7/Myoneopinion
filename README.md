# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Running MyOneOpinion

- `PAYMENTS_MODE=test npm run dev` runs locally on an in-memory store with labeled sample opinions. Test mode lets you post and hype end to end without a charge.
- In production, opinions, hypes, and orders live in the Cloudflare D1 database bound as `DB` in `wrangler.json`. The tables are created on first request, and the same schema is in `migrations/0001_spot.sql`.
- Settings and secrets are listed in `.env.example`: `PAYMENTS_MODE`, `PADDLE_WEBHOOK_SECRET`, `ADMIN_TOKEN`. Leave `PAYMENTS_MODE` unset in production until Paddle checkout is connected.
- To hide an abusive opinion: `curl -X POST https://myoneopinion.com/api/spot/admin/opinions/<id>/hide -H "Authorization: Bearer $ADMIN_TOKEN" -H "content-type: application/json" -d '{"hidden":true}'`. Send `{"hidden":false}` to restore it.

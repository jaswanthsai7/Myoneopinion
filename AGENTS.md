<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the public MyOneOpinion experience at the index route, with shared visual roles in the global design system, so the feed remains the first screen.
- There are no accounts: people post and hype with a name and optional photo. Nothing is published or hyped until the server marks its order paid. Until Paddle is connected, production leaves PAYMENTS_MODE unset so checkout stays a clearly labeled preview; PAYMENTS_MODE=test (no charge) is for local dev and staging only. Never simulate a successful real payment. Sample opinions exist only in the local in-memory store and are labeled.

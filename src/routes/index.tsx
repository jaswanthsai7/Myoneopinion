import { createFileRoute } from "@tanstack/react-router";
import { ComingSoonSection } from '@/components/coming-soon-banner';

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'MyOneOpinion — Everyone gets one opinion (Coming Soon)' },
      { name: 'description', content: 'What’s the one opinion you want to leave behind? A place for words that matter. One opinion. Forever. Coming soon.' },
      { property: 'og:title', content: 'MyOneOpinion — Everyone gets one opinion' },
      { property: 'og:description', content: 'Say it. Leave it. Forever. Discover the opinions that connect us.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://myoneopinion.com/' },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: 'https://myoneopinion.com/' }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="botanica-viewport-root">
      <main className="botanica-main-container">
        <ComingSoonSection />
      </main>
    </div>
  );
}

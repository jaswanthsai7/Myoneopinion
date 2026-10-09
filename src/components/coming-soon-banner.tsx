import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Check, Bell, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HoverImg, type ProjectItem } from '@/components/ui/hover-img';
import { useVisitCount } from '@/hooks/use-visit-count';

import cardManifesto from '@/assets/card-manifesto.svg';
import cardResonance from '@/assets/card-resonance.svg';
import cardBoost from '@/assets/card-boost.svg';
import cardVoice from '@/assets/card-voice.svg';
import cardLegacy from '@/assets/card-legacy.svg';

const COMING_SOON_PROJECTS: ProjectItem[] = [
  {
    title: 'The One Opinion Manifesto',
    label: '280 characters. Say it once. Yours forever.',
    imageSrc: cardManifesto,
    tag: 'Core Concept',
  },
  {
    title: 'The Resonance Engine',
    label: 'Ranked purely by depth of human connection.',
    imageSrc: cardResonance,
    tag: 'Feed',
  },
  {
    title: 'Hype Points & Boost Economy',
    label: 'Community lift for genuine perspectives.',
    imageSrc: cardBoost,
    tag: 'Empowerment',
  },
  {
    title: 'A Human Sanctuary',
    label: 'Zero followers. Zero noise. Zero algorithmic rage.',
    imageSrc: cardVoice,
    tag: 'Philosophy',
  },
  {
    title: 'Permanent Canonical Link',
    label: 'Your timeless digital artifact to share.',
    imageSrc: cardLegacy,
    tag: 'Identity',
  },
];

export function ComingSoonSection({
  showFeed = false,
  onToggleFeed,
}: {
  showFeed?: boolean;
  onToggleFeed?: () => void;
}) {
  const { visits, formattedVisits } = useVisitCount();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Dynamic real countdown to launch date (July 1, 2026)
  const [timeLeft, setTimeLeft] = useState(() => {
    const target = new Date('2026-07-01T00:00:00Z').getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  });

  useEffect(() => {
    const target = new Date('2026-07-01T00:00:00Z').getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    try {
      const waitlist = JSON.parse(localStorage.getItem('myoneopinion_waitlist') || '[]');
      waitlist.push({ email, date: new Date().toISOString() });
      localStorage.setItem('myoneopinion_waitlist', JSON.stringify(waitlist));
    } catch {
      // ignore
    }
    setSubscribed(true);
  };

  return (
    <section className="coming-soon-hero" aria-label="Coming Soon Information">
      {/* Background ambient lighting */}
      <div className="coming-soon-ambient" aria-hidden="true" />

      <div className="coming-soon-container">
        {/* ObsidianUI Pill Badges Bar */}
        <div className="coming-soon-badges">
          <div className="obsidian-pill obsidian-pill-launch">
            <span className="obsidian-pill-icon">📁</span>
            <span>Coming Soon • Public Launch Q2 2026</span>
          </div>

          <div className="obsidian-pill obsidian-pill-visits" title="Real unique visits recorded for MyOneOpinion">
            <span className="live-pulse-dot" aria-hidden="true">
              <span className="pulse-ring" />
              <span className="pulse-core" />
            </span>
            <span className="font-semibold text-foreground">{formattedVisits}</span>
            <span className="text-muted-foreground">{visits === 1 ? 'Visit' : 'Visits'}</span>
          </div>

          <div className="obsidian-pill obsidian-pill-tag">
            <span>React • TypeScript • Tailwind</span>
          </div>
        </div>

        {/* Big Bold Obsidian & Apple Typography */}
        <div className="coming-soon-headings">
          <h1 className="coming-soon-title">
            Say less. <br />
            <span className="coming-soon-highlight">Mean more.</span>
          </h1>
          <p className="coming-soon-subtitle">
            What’s the one opinion you want to leave behind? A quiet sanctuary for words that matter.
            One life. One opinion. Forever. The public platform is launching soon.
          </p>
        </div>

        {/* Countdown & Early Access Bar */}
        <div className="coming-soon-action-bar">
          <div className="countdown-group" aria-label="Launch Countdown">
            <div className="countdown-item">
              <span className="countdown-number">{timeLeft.days}</span>
              <span className="countdown-label">Days</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="countdown-label">Hours</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="countdown-label">Mins</span>
            </div>
            <span className="countdown-sep">:</span>
            <div className="countdown-item">
              <span className="countdown-number">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="countdown-label">Secs</span>
            </div>
          </div>

          {/* ObsidianUI Capsule Form */}
          {subscribed ? (
            <div className="early-access-success">
              <Check className="text-emerald-500" size={16} />
              <span>You’re on the early access list. We’ll invite you on launch day!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="obsidian-capsule-input">
              <Bell size={15} className="text-muted-foreground ml-3 shrink-0" />
              <input
                type="email"
                required
                placeholder="Enter email to get notified on launch..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="obsidian-input-field"
                aria-label="Early access email address"
              />
              <button type="submit" className="obsidian-cta-btn">
                <span>Notify Me</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

        {/* ObsidianUI Hover Image Showcase Header */}
        <div className="hover-showcase-header">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-boost" />
            <span className="hover-showcase-eyebrow">WHAT WE’RE BUILDING</span>
          </div>
          <p className="hover-showcase-hint">
            Hover over any pillar below to inspect preview cards
          </p>
        </div>

        {/* ObsidianUI HoverImg Integration */}
        <div className="hover-img-wrapper-card">
          <HoverImg projects={COMING_SOON_PROJECTS} />
        </div>

        {/* Bottom Navigation & Preview Anchor */}
        <div className="coming-soon-footer-bar">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={14} />
            <span>Site currently in pre-launch mode</span>
          </div>

          {onToggleFeed && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleFeed}
              className="rounded-full px-5 text-xs font-medium"
            >
              <span>{showFeed ? 'Hide Prototype Feed' : 'Preview Prototype Feed'}</span>
              <ArrowRight
                size={13}
                className={`ml-2 transition-transform duration-200 ${
                  showFeed ? 'rotate-90' : ''
                }`}
              />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export default ComingSoonSection;

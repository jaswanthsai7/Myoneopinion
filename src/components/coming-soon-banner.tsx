import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Check, Bell, X, Sparkles } from 'lucide-react';
import { useVisitCount } from '@/hooks/use-visit-count';

import flowerManifesto from '@/assets/flower-manifesto.png';
import flowerResonance from '@/assets/flower-resonance.png';
import flowerBoost from '@/assets/flower-boost.png';
import flowerCanonical from '@/assets/flower-canonical.png';

const FLOWERS = [flowerManifesto, flowerResonance, flowerBoost, flowerCanonical];

interface PillarItem {
  id: string;
  name: string;
  label: string;
  tag: string;
}

const PILLARS: PillarItem[] = [
  {
    id: 'philosophy',
    name: 'the philosophy',
    label: '280 characters. Say it once. Keep it forever.',
    tag: 'Immutable Artifact',
  },
  {
    id: 'discovery',
    name: 'the discovery',
    label: 'Ranked purely by depth of human connection.',
    tag: 'Pure Connection',
  },
  {
    id: 'spotlight',
    name: 'the spotlight',
    label: 'Community lift for genuine perspectives.',
    tag: 'Empowerment',
  },
  {
    id: 'permanent-page',
    name: 'your permanent page',
    label: 'Your permanent canonical web address.',
    tag: 'Digital Identity',
  },
];

interface PillarAtmosphere {
  name: string;
  bg: string;
  cardBg: string;
  border: string;
}

const PILLAR_ATMOSPHERES: PillarAtmosphere[] = [
  {
    // The Philosophy (Golden Yellow Lilies & 50% Mid-Thick Warm Earthy Taupe)
    name: 'philosophy',
    bg: 'linear-gradient(145deg, #6c5e4d 0%, #574a3a 50%, #433728 100%)',
    cardBg: '#d3c7b5',
    border: 'rgba(0, 0, 0, 0.14)',
  },
  {
    // The Discovery (Crimson & Dusty Rose Peonies & Deep Romantic Rose Taupe)
    name: 'discovery',
    bg: 'linear-gradient(145deg, #78525b 0%, #623d46 50%, #4c2931 100%)',
    cardBg: '#d5bfc4',
    border: 'rgba(225, 29, 72, 0.18)',
  },
  {
    // The Spotlight (Radiant Amber Orchids & Sunlit Deep Bronze)
    name: 'spotlight',
    bg: 'linear-gradient(145deg, #7f603c 0%, #6b4d29 50%, #543a18 100%)',
    cardBg: '#d8c4a7',
    border: 'rgba(217, 119, 6, 0.2)',
  },
  {
    // Your Permanent Page (Pure White Calla Lilies & Deep Celadon Forest)
    name: 'permanent-page',
    bg: 'linear-gradient(145deg, #53675a 0%, #3f5246 50%, #2b3e32 100%)',
    cardBg: '#c3cec5',
    border: 'rgba(5, 150, 105, 0.2)',
  },
];

export function ComingSoonSection() {
  const { visits, formattedVisits } = useVisitCount();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [activePillar, setActivePillar] = useState<number>(0);

  const cardRef = useRef<HTMLElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const flowerRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const xToRef = useRef<gsap.QuickToFunc | null>(null);
  const yToRef = useRef<gsap.QuickToFunc | null>(null);

  // 1. Apple-Grade Page Load Choreography & Botanical Flower Bloom Entrance
  useEffect(() => {
    const card = cardRef.current;
    const flower = flowerRef.current;
    if (!card || !flower) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // Card container smooth scale-in & breath
      tl.fromTo(
        card,
        { opacity: 0, scale: 0.97, y: 22 },
        { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power3.out' }
      );

      // Header elements glide down softly
      tl.fromTo(
        card.querySelectorAll('.botanica-header > *'),
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power2.out' },
        '-=0.7'
      );

      // Giant Title emerges with subtle deblur
      tl.fromTo(
        card.querySelector('.botanica-giant-title'),
        { opacity: 0, y: 40, filter: 'blur(8px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.25, ease: 'power3.out' },
        '-=0.7'
      );

      // THE FLOWER BLOOMING ENTRANCE:
      // Glides and blossoms up from below into full view
      tl.fromTo(
        flower,
        { opacity: 0, y: 110, scale: 0.88, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.6,
          ease: 'power3.out',
          onComplete: () => {
            // Calm living ambient float after entrance
            gsap.to(flower, {
              y: '-=10',
              duration: 4.2,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            });
          },
        },
        '-=1.0'
      );

      // Flanking editorial quotes reveal from sides
      tl.fromTo(
        card.querySelectorAll('.botanica-flank'),
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: 'power2.out' },
        '-=0.9'
      );

      // COMING SOON faded text ascends
      tl.fromTo(
        card.querySelector('.botanica-faded-bottom'),
        { opacity: 0, y: 30 },
        { opacity: 0.14, y: 0, duration: 1.1, ease: 'power2.out' },
        '-=0.8'
      );

      // Dock items glide up with stagger
      tl.fromTo(
        card.querySelectorAll('.botanica-dock-item'),
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.65, stagger: 0.07, ease: 'power2.out' },
        '-=0.7'
      );
    }, cardRef);

    return () => ctx.revert();
  }, []);

  // 2. Interactive Spatial Mouse Parallax for Lilies
  useEffect(() => {
    const stage = heroStageRef.current;
    const flower = flowerRef.current;
    if (!stage || !flower) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const xFlower = gsap.quickTo(flower, 'x', { duration: 0.6, ease: 'power2.out' });
    const yFlower = gsap.quickTo(flower, 'y', { duration: 0.6, ease: 'power2.out' });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      xFlower(relX * 24);
      yFlower(relY * 16);
    };

    const handleMouseLeave = () => {
      xFlower(0);
      yFlower(0);
    };

    stage.addEventListener('mousemove', handleMouseMove);
    stage.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      stage.removeEventListener('mousemove', handleMouseMove);
      stage.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // GSAP 60fps cursor follower for the Obsidian floating cards on hover
  useEffect(() => {
    const thumb = thumbnailRef.current;
    const dock = dockRef.current;
    if (!thumb || !dock) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set(thumb, {
      scale: 0,
      xPercent: -50,
      yPercent: -108,
      autoAlpha: 0,
    });

    if (!prefersReducedMotion) {
      xToRef.current = gsap.quickTo(thumb, 'x', { duration: 0.32, ease: 'power3.out' });
      yToRef.current = gsap.quickTo(thumb, 'y', { duration: 0.32, ease: 'power3.out' });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const cardWidth = 440;
      const margin = 20;
      const clampedX = Math.max(cardWidth / 2 + margin, Math.min(window.innerWidth - cardWidth / 2 - margin, e.clientX));
      xToRef.current?.(clampedX);
      yToRef.current?.(e.clientY - 16);
    };

    const handleMouseLeave = () => {
      gsap.to(thumb, {
        scale: 0,
        autoAlpha: 0,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      const defaultAtmosphere = PILLAR_ATMOSPHERES[0];
      const root = document.querySelector<HTMLElement>('.botanica-viewport-root');
      if (root) {
        gsap.to(root, {
          background: defaultAtmosphere.bg,
          duration: 0.7,
          ease: 'power2.out',
        });
      }
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          backgroundColor: defaultAtmosphere.cardBg,
          borderColor: defaultAtmosphere.border,
          duration: 0.7,
          ease: 'power2.out',
        });
      }
      setActivePillar(0);
    };

    dock.addEventListener('mousemove', handleMouseMove);
    dock.addEventListener('mouseleave', handleMouseLeave);

    const items = dock.querySelectorAll('.botanica-dock-item');
    const thumbImages = thumb.querySelectorAll('.hover-img-thumbnail');

    const cleanups: Array<() => void> = [];

    items.forEach((item, index) => {
      const enter = () => {
        setActivePillar(index);
        const atmosphere = PILLAR_ATMOSPHERES[index];
        const root = document.querySelector<HTMLElement>('.botanica-viewport-root');
        if (root) {
          gsap.to(root, {
            background: atmosphere.bg,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
        if (cardRef.current) {
          gsap.to(cardRef.current, {
            backgroundColor: atmosphere.cardBg,
            borderColor: atmosphere.border,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
        gsap.to(thumb, {
          scale: 1,
          autoAlpha: 1,
          duration: prefersReducedMotion ? 0 : 0.3,
          ease: 'back.out(1.4)',
          overwrite: 'auto',
        });
        gsap.to(thumbImages, {
          yPercent: -100 * index,
          duration: prefersReducedMotion ? 0 : 0.35,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      };
      item.addEventListener('mouseenter', enter);
      cleanups.push(() => item.removeEventListener('mouseenter', enter));
    });

    return () => {
      dock.removeEventListener('mousemove', handleMouseMove);
      dock.removeEventListener('mouseleave', handleMouseLeave);
      cleanups.forEach(c => c());
    };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return;
    setIsSubmitting(true);
    try {
      // Store locally (matching Nadhebe subscriber persistence)
      localStorage.setItem('nadhebe_subscriber_email', cleanEmail);
      localStorage.setItem('myoneopinion_subscriber_email', cleanEmail);
      const waitlist = JSON.parse(localStorage.getItem('myoneopinion_waitlist') || '[]');
      waitlist.push({ email: cleanEmail, date: new Date().toISOString() });
      localStorage.setItem('myoneopinion_waitlist', JSON.stringify(waitlist));

      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
    } catch {
      // fallback handled gracefully
    } finally {
      setIsSubmitting(false);
      setSubscribed(true);
    }
  };

  return (
    <div className="botanica-page-wrapper">
      {/* Main Luxury Botanica-Inspired Frame - Contained height */}
      <section className="botanica-card" ref={cardRef} aria-label="MyOneOpinion Editorial Coming Soon">
        {/* 1. Minimal Top Header Bar */}
        <header className="botanica-header">
          <div className="botanica-header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/favicon-32x32.png" alt="" width={20} height={20} style={{ borderRadius: '5px', display: 'block' }} aria-hidden="true" />
            <span className="botanica-tagline">opinion</span>
          </div>

          <div className="botanica-header-center">
            <span className="botanica-wordmark-top">M Y O N E O P I N I O N</span>
          </div>

          <div className="botanica-header-right">
            {/* Live Visit Badge */}
            <div className="botanica-visit-pill" title="Real unique visits recorded">
              <span className="live-pulse-dot" aria-hidden="true">
                <span className="pulse-ring" />
                <span className="pulse-core" />
              </span>
              <span>{formattedVisits} {visits === 1 ? 'visit' : 'visits'}</span>
            </div>

            <button
              type="button"
              onClick={() => setWaitlistOpen(true)}
              className="botanica-waitlist-btn"
              aria-label="Open early access waitlist"
            >
               <Sparkles size={13} className="shrink-0 text-amber-300" />
              <span className="botanica-btn-text">join</span>
              <span className="botanica-btn-flowers" aria-hidden="true">✿ ❀ ❁</span>
            </button>
          </div>
        </header>

        {/* 2. Center Stage with Overlapping Typography & Floral Centerpiece */}
        <div className="botanica-hero-stage" ref={heroStageRef}>
          {/* Top Giant Typography (Background Layer) */}
          <h1 className="botanica-giant-title" aria-label="MyOneOpinion">
            MYONEOPINION
          </h1>

          {/* Foreground Botanical Centerpiece (Swaps dynamically between 4 flower species on theme hover) */}
          <div className="botanica-floral-container" ref={flowerRef} aria-hidden="true">
            {FLOWERS.map((flowerSrc, idx) => (
              <img
                key={idx}
                src={flowerSrc}
                alt={PILLARS[idx].name}
                className={`botanica-floral-img botanica-flower-${idx}`}
                style={{
                  position: idx === 0 ? 'relative' : 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: activePillar === idx ? 1 : 0,
                  transform: activePillar === idx ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(10px)',
                  transition: 'opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: 'none',
                }}
                loading="eager"
                draggable={false}
              />
            ))}
          </div>

          {/* Left Flanking Editorial Text */}
          <div className="botanica-flank botanica-flank-left">
            <p className="botanica-flank-title">
              One message.<br />
              Yours forever.
            </p>
            <span className="botanica-flank-sub">280 characters · immutable</span>
          </div>

          {/* Right Flanking Editorial Text */}
          <div className="botanica-flank botanica-flank-right">
            <p className="botanica-flank-title">
              Say it once.<br />
              Keep it forever.
            </p>
            <span className="botanica-flank-sub">a quiet sanctuary · 2026</span>
          </div>

          {/* Bottom Giant Faded Typography */}
          <div className="botanica-faded-bottom" aria-hidden="true">
            COMING SOON
          </div>
        </div>

        {/* Core Pillars Editorial Tagline */}
        <div className="botanica-tagline-bar" aria-label="Site Pillars">
          <span>The philosophy</span>
          <span className="tagline-dot">·</span>
          <span>The discovery</span>
          <span className="tagline-dot">·</span>
          <span>The spotlight</span>
          <span className="tagline-dot">·</span>
          <span>Your permanent page</span>
        </div>

        {/* 3. Bottom Interactive Split Dock with ObsidianUI Hover Triggers */}
        <nav className="botanica-dock" ref={dockRef} aria-label="Core Pillars Showcase">
          {PILLARS.map((pillar, idx) => (
            <div
              key={pillar.id}
              className="botanica-dock-item"
              role="button"
              tabIndex={0}
              aria-label={`${pillar.name}: ${pillar.label}`}
              onClick={() => setWaitlistOpen(true)}
            >
              <div className="botanica-dock-content">
                <span className="botanica-dock-name">{pillar.name}</span>
                <span className="botanica-dock-tag">{pillar.tag}</span>
              </div>
              <span className="botanica-dock-arrow" aria-hidden="true">→</span>
            </div>
          ))}
        </nav>

        {/* Floating Apple Liquid Glass Preview Card Window */}
        <div className="hover-img-thumbnail-wrapper" ref={thumbnailRef} aria-hidden="true">
          {/* 1. Philosophy */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  THE PHILOSOPHY
                </span>
                <span className="hover-glass-meta">280 Characters · Immutable</span>
              </div>
              <p className="hover-glass-quote">
                “Say it once. Keep it forever. One opinion. Chosen carefully.”
              </p>
              <div className="hover-glass-footer">
                <div className="hover-glass-author">
                  <div className="hover-glass-avatar">M</div>
                  <div>
                    <div className="hover-glass-handle">@marcus</div>
                    <div className="hover-glass-tag">Permanent Canonical Record</div>
                  </div>
                </div>
                <span className="hover-glass-badge">Entry #01</span>
              </div>
            </div>
          </div>

          {/* 2. The Discovery */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  THE DISCOVERY
                </span>
                <span className="hover-glass-meta">Ranked by Human Depth</span>
              </div>
              <div className="hover-glass-list">
                <div className="hover-glass-list-item">
                  <span><strong>#1</strong> “Be curious, not judgmental.”</span>
                  <span>♥ 1,429</span>
                </div>
                <div className="hover-glass-list-item">
                  <span><strong>#2</strong> “Simplicity is the ultimate sophistication.”</span>
                  <span>♥ 980</span>
                </div>
                <div className="hover-glass-list-item">
                  <span><strong>#3</strong> “Stay hungry. Stay foolish.”</span>
                  <span>♥ 854</span>
                </div>
              </div>
              <div className="hover-glass-footer">
                <span className="hover-glass-tag">Zero noise algorithms · Depth over virality</span>
                <span className="hover-glass-badge">Top Ranked</span>
              </div>
            </div>
          </div>

          {/* 3. The Spotlight */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  THE SPOTLIGHT
                </span>
                <span className="hover-glass-meta">Community Spotlight &amp; Lift</span>
              </div>
              <div className="hover-glass-stat-row">
                <div className="hover-glass-stat-number">50,000</div>
                <div>
                  <div className="hover-glass-handle">✦ Hype Points</div>
                  <div className="hover-glass-stat-label">Community lift elevating honest voices</div>
                </div>
              </div>
              <div className="hover-glass-chips">
                <span className="hover-glass-chip">$5 Lift</span>
                <span className="hover-glass-chip">$10 Lift</span>
                <span className="hover-glass-chip">$25 Lift</span>
                <span className="hover-glass-chip">Crown Tier</span>
              </div>
              <div className="hover-glass-footer">
                <span className="hover-glass-tag">Empower perspectives that deserve permanence</span>
                <span className="hover-glass-badge">Community Lift</span>
              </div>
            </div>
          </div>

          {/* 4. Your Permanent Page */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  YOUR PERMANENT PAGE
                </span>
                <span className="hover-glass-meta">One URL · Timeless Artifact</span>
              </div>
              <div className="hover-glass-id-card">
                <div className="hover-glass-id-url">myoneopinion.com/@you</div>
                <div className="hover-glass-id-sub">
                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                  <span>Reserved for Early Access Member</span>
                </div>
              </div>
              <div className="hover-glass-footer">
                <span className="hover-glass-tag">Your permanent canonical home on the web</span>
                <span className="hover-glass-badge">Immutable Link</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle Caption Footer */}
      <footer className="botanica-subtle-footer">
        <span>© 2026 MyOneOpinion</span>
        <span>•</span>
        <span>One opinion. Forever.</span>
      </footer>

      {/* Early Access Modal */}
      <Dialog.Root open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="botanica-modal-overlay" />
          <Dialog.Content className="botanica-modal-content">
            <Dialog.Close asChild>
              <button className="botanica-modal-close" aria-label="Close dialog">
                <X size={18} />
              </button>
            </Dialog.Close>

            <div className="botanica-modal-badge">
              <Sparkles size={13} className="text-[#1a1918]" />
              <span>EARLY ACCESS INVITATION</span>
            </div>

            <Dialog.Title className="botanica-modal-title">
              Reserve your permanent voice.
            </Dialog.Title>

            <Dialog.Description className="botanica-modal-desc">
              Everyone gets one opinion. Join our official Beehiiv waitlist to secure your canonical handle and permanent space before launch.
            </Dialog.Description>

            {subscribed ? (
              <div className="botanica-modal-success">
                <Check className="text-emerald-700 shrink-0" size={17} />
                <span>You’re registered with our Beehiiv early access list. We’ll send your invitation upon launch!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="botanica-modal-form">
                <div className="botanica-modal-input-wrap">
                  <Bell size={15} className="text-[#1a1918]/60 shrink-0 ml-3" />
                  <input
                    type="email"
                    required
                    placeholder="enter your email address..."
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="botanica-modal-input"
                    aria-label="Early access email address"
                    autoFocus
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="botanica-modal-submit">
                  <span>{isSubmitting ? 'Registering with Beehiiv...' : 'Request Invitation'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default ComingSoonSection;

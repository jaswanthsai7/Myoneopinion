import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Check, Bell, X, Sparkles } from 'lucide-react';
import { useVisitCount } from '@/hooks/use-visit-count';

import botanicalLily from '@/assets/botanical-lily-transparent.png';

interface PillarItem {
  id: string;
  name: string;
  label: string;
  tag: string;
}

const PILLARS: PillarItem[] = [
  {
    id: 'manifesto',
    name: 'the manifesto',
    label: '280 characters. Say it once. Yours forever.',
    tag: 'Immutable Artifact',
  },
  {
    id: 'resonance',
    name: 'resonance engine',
    label: 'Ranked purely by depth of human connection.',
    tag: 'Pure Connection',
  },
  {
    id: 'boost',
    name: 'boost economy',
    label: 'Community lift for genuine perspectives.',
    tag: 'Empowerment',
  },
  {
    id: 'canonical',
    name: 'canonical link',
    label: 'Your permanent canonical web address.',
    tag: 'Digital Identity',
  },
];

export function ComingSoonSection() {
  const { visits, formattedVisits } = useVisitCount();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
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
      yPercent: -50,
      autoAlpha: 0,
    });

    if (!prefersReducedMotion) {
      xToRef.current = gsap.quickTo(thumb, 'x', { duration: 0.32, ease: 'power3.out' });
      yToRef.current = gsap.quickTo(thumb, 'y', { duration: 0.32, ease: 'power3.out' });
    }

    const handleMouseMove = (e: MouseEvent) => {
      xToRef.current?.(e.clientX);
      yToRef.current?.(e.clientY);
    };

    const handleMouseLeave = () => {
      gsap.to(thumb, {
        scale: 0,
        autoAlpha: 0,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    dock.addEventListener('mousemove', handleMouseMove);
    dock.addEventListener('mouseleave', handleMouseLeave);

    const items = dock.querySelectorAll('.botanica-dock-item');
    const thumbImages = thumb.querySelectorAll('.hover-img-thumbnail');

    const cleanups: Array<() => void> = [];

    items.forEach((item, index) => {
      const enter = () => {
        setActivePillar(index);
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
    <div className="botanica-page-wrapper">
      {/* Main Luxury Botanica-Inspired Frame - Contained height */}
      <section className="botanica-card" ref={cardRef} aria-label="MyOneOpinion Editorial Coming Soon">
        {/* 1. Minimal Top Header Bar */}
        <header className="botanica-header">
          <div className="botanica-header-left">
            <span className="botanica-tagline">sanctuary</span>
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
              className="botanica-header-link"
              aria-label="Open early access waitlist"
            >
              access (0)
            </button>
          </div>
        </header>

        {/* 2. Center Stage with Overlapping Typography & Floral Centerpiece */}
        <div className="botanica-hero-stage" ref={heroStageRef}>
          {/* Top Giant Typography (Background Layer) */}
          <h1 className="botanica-giant-title" aria-label="MyOneOpinion">
            MYONEOPINION
          </h1>

          {/* Foreground Botanical Lily Centerpiece (Intertwines over text) */}
          <div className="botanica-floral-container" ref={flowerRef} aria-hidden="true">
            <img
              src={botanicalLily}
              alt="Botanical Yellow Lily floral arrangement"
              className="botanica-floral-img"
              loading="eager"
              draggable={false}
            />
          </div>

          {/* Left Flanking Editorial Text */}
          <div className="botanica-flank botanica-flank-left">
            <p className="botanica-flank-title">
              one opinion &amp;<br />
              eternal artifact
            </p>
            <span className="botanica-flank-sub">280 characters · immutable</span>
          </div>

          {/* Right Flanking Editorial Text */}
          <div className="botanica-flank botanica-flank-right">
            <p className="botanica-flank-title">
              say it once,<br />
              yours forever
            </p>
            <span className="botanica-flank-sub">a quiet sanctuary · 2026</span>
          </div>

          {/* Bottom Giant Faded Typography */}
          <div className="botanica-faded-bottom" aria-hidden="true">
            COMING SOON
          </div>
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
          {/* 1. Manifesto */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  MANIFESTO
                </span>
                <span className="hover-glass-meta">280 Characters · Immutable</span>
              </div>
              <p className="hover-glass-quote">
                “Words that outlast the noise. One opinion. Chosen carefully. Forever.”
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

          {/* 2. Resonance Engine */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  RESONANCE ENGINE
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

          {/* 3. Boost Economy */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  BOOST ECONOMY
                </span>
                <span className="hover-glass-meta">100 Points per $1 Lift</span>
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

          {/* 4. Canonical Link */}
          <div className="hover-img-thumbnail">
            <div className="hover-glass-card">
              <div className="hover-glass-top">
                <span className="hover-glass-pill">
                  <span className="hover-glass-dot" />
                  CANONICAL IDENTITY
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
              Claim your canonical voice.
            </Dialog.Title>

            <Dialog.Description className="botanica-modal-desc">
              Everyone gets one opinion. Reserve your canonical handle and immutable space before the public launch in 2026.
            </Dialog.Description>

            {subscribed ? (
              <div className="botanica-modal-success">
                <Check className="text-emerald-700 shrink-0" size={17} />
                <span>You’re registered. We’ll send your invitation upon launch!</span>
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
                <button type="submit" className="botanica-modal-submit">
                  <span>Request Invitation</span>
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

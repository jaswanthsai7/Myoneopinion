import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, ArrowUp, Check, Crown, Heart, Link2, Plus, Search, Share2, UserRound, X, Feather, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sampleMessages, type Message } from '@/lib/messages';
import sunrise from '@/assets/myoneopinion-sunrise.jpg';
import { ComingSoonSection } from '@/components/coming-soon-banner';
import { useVisitCount } from '@/hooks/use-visit-count';

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: 'MyOneOpinion — Everyone gets one opinion (Coming Soon)' },
    { name: 'description', content: 'What’s the one opinion you want to leave behind? A place for words that matter. One opinion. Forever. Coming soon.' },
    { property: 'og:title', content: 'MyOneOpinion — Everyone gets one opinion' },
    { property: 'og:description', content: 'Say it. Leave it. Forever. Discover the opinions that connect us.' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://myoneopinion.com/' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ], links: [{ rel: 'canonical', href: 'https://myoneopinion.com/' }] }),
  component: Index,
});

function Index() {
  const { visits, formattedVisits } = useVisitCount();
  const [showFeed, setShowFeed] = useState(false);
  const [tab, setTab] = useState('Top');
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'compose' | 'signin' | 'boost' | 'message' | null>(null);
  const [selected, setSelected] = useState<Message | null>(null);
  const [draft, setDraft] = useState('');
  const [review, setReview] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [amount, setAmount] = useState('5');
  const [notice, setNotice] = useState('');
  const feedRef = useRef<HTMLElement>(null);

  const toggleFeed = () => {
    setShowFeed(prev => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          feedRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      return next;
    });
  };

  useEffect(() => {
    const messageId = new URLSearchParams(window.location.search).get('message');
    const message = sampleMessages.find(item => item.id === messageId);
    if (message) {
      setSelected(message);
      setModal('message');
      setShowFeed(true);
    }
  }, []);
  const messages = useMemo(() => {
    const filtered = sampleMessages.filter(m => `${m.text} ${m.author}`.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'New') return filtered.sort((a, b) => a.days - b.days);
    if (tab === 'Most Loved') return filtered.sort((a, b) => b.votes - a.votes);
    return filtered;
  }, [tab, search]);
  function open(kind: typeof modal, message?: Message) { setSelected(message ?? null); setNotice(''); setReview(false); setModal(kind); }
  async function share(message: Message) {
    const url = `${window.location.origin}/?message=${message.id}`;
    try { await navigator.clipboard.writeText(url); setCopied(message.id); setTimeout(() => setCopied(null), 2200); }
    catch { setSelected(message); setModal('message'); setNotice(url); }
  }
  const tabs = (mobile = false) => <nav className={mobile ? 'mobile-tabs' : 'nav-tabs'} aria-label={mobile ? 'Message order' : 'Main navigation'}>{['Top', 'New', 'Most Loved'].map(t => <Button key={t} variant="ghost" className={`nav-tab ${tab === t ? 'active' : ''}`} aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</Button>)}</nav>;

  return (
    <div>
      <header className="site-header"><div className="header-inner">
        <div className="flex items-center gap-4">
          <a href="/" className="wordmark" aria-label="MyOneOpinion home">MyOneOpinion<span className="text-boost">.</span></a>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-foreground">{formattedVisits}</span>
            <span className="text-muted-foreground text-[11px]">{visits === 1 ? 'visit' : 'visits'}</span>
          </div>
        </div>

        {showFeed ? tabs() : null}

        <div className="flex items-center gap-3">
          {showFeed ? (
            <>
              <Button variant="ghost" size="icon" aria-label="Search messages" title="Search messages" onClick={() => setSearchOpen(!searchOpen)}><Search /></Button>
              <Button variant="outline" size="sm" onClick={() => open('signin')}>Sign in</Button>
              <Button className="header-post" size="sm" onClick={() => open('compose')}>Say Something <ArrowRight /></Button>
              <Button variant="ghost" size="sm" onClick={toggleFeed} className="text-xs text-muted-foreground">Hide Feed</Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={toggleFeed} className="rounded-full text-xs">Preview Feed Prototype</Button>
            </>
          )}
        </div>
      </div></header>

      {/* ObsidianUI Inspired Coming Soon Showcase with Hover-Img */}
      <ComingSoonSection showFeed={showFeed} onToggleFeed={toggleFeed} />

      {/* Public Feed & Preview Layout (Hidden by default, shown when toggled) */}
      {showFeed && (
        <main className="content-layout" ref={feedRef}><section aria-label="Messages">
          {tabs(true)}
          <div className="feed-heading">
            <h2 className="eyebrow">{tab === 'Top' ? 'WORDS THAT RESONATE' : tab === 'New' ? 'JUST SAID' : 'MOST LOVED WORDS'}</h2>
            <span className="text-[10px] text-muted-foreground">Pre-Launch Sample Feed Preview</span>
          </div>
          {searchOpen && <div className="flex items-start gap-2"><input autoFocus className="search-input" aria-label="Search words or authors" placeholder="Find a word, a feeling, a person…" value={search} onChange={e => setSearch(e.target.value)} /><Button variant="ghost" size="icon" aria-label="Close search" onClick={() => { setSearchOpen(false); setSearch(''); }}><X /></Button></div>}
          <div className="message-list">
            {messages.map((message, index) => <article key={message.id} className={`message-card ${tab === 'Top' && !search && index < 3 ? `medal-${['gold', 'silver', 'bronze'][index]}` : ''} ${index === 0 && tab === 'Top' && !search ? 'first' : ''}`}>
              <div className="rank">{index === 0 && tab === 'Top' && !search && <Crown size={23} fill="currentColor" strokeWidth={1} />}<span>#{sampleMessages.indexOf(message) + 1}</span></div>
              <div><Button variant="ghost" className="quote-link" onClick={() => open('message', message)}>“{message.text}”</Button><p className="byline">@{message.author}<span className="mx-2">·</span>{message.days} {message.days === 1 ? 'day' : 'days'} ago<span className="top-booster" title={`Sample top booster: @${message.topBooster}`}><span className="booster-avatar"><span className="booster-crown"><Crown size={9} fill="currentColor" strokeWidth={1.5} /></span>{message.topBooster.charAt(0).toUpperCase()}</span><span className="booster-name">@{message.topBooster}</span></span></p></div>
              <div className="engagement-column"><Button variant="heart" className="vote-button" aria-label={`Love message by ${message.author}`} title="Sign in to love this message" onClick={() => { open('signin'); setNotice('Sign in to give these words a little love.'); }}><Heart fill="currentColor" />{message.votes.toLocaleString()}</Button><span className="hype-points" title="Sample Hype Points based on boosts"><Sparkles /><span><strong>{(message.boost * 100).toLocaleString()}</strong><small>Hype Points</small></span></span></div>
              <div className="boost-column"><Button size="sm" variant={index === 0 && tab === 'Top' && !search ? 'gold' : 'outline'} onClick={() => open('boost', message)}><ArrowUp /> Boost</Button><small>${message.boost.toLocaleString()} boosted</small></div>
              <Button variant="ghost" size="icon" className="share-button" aria-label={`Share message by ${message.author}`} title={copied === message.id ? 'Link copied' : 'Copy message link'} onClick={() => share(message)}>{copied === message.id ? <Check className="text-boost" /> : <Share2 />}</Button>
            </article>)}
            {messages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No words found. Try a different search.</p>}
          </div>
          <p className="mt-6 text-center text-[10px] text-muted-foreground">Sample messages & engagement · Every voice starts with one opinion.</p>
        </section>
        <aside className="sidebar">
          <section className="side-section"><div className="flex items-center gap-2"><Feather size={18} className="text-boost" /><h2>Your words matter.</h2></div><div className="side-invitation">Some things deserve<br />to be said.</div><p>You only get one opinion.<br />Choose your words. Leave your mark.</p><Button className="mt-5 w-full" onClick={() => open('compose')}>Say Something <ArrowRight /></Button><p className="mt-3 text-center">One opinion. A little piece of you.</p></section>
          <section className="side-section"><h2>How it works</h2>{[
            { icon: UserRound, title: '1. Find your place', text: 'Create an account. Be yourself.' },
            { icon: Feather, title: '2. Say your one opinion', text: '280 characters. Yours, forever.' },
            { icon: Heart, title: '3. Let it resonate', text: 'People can love your message.' },
            { icon: BarChart3, title: '4. Give it a little lift', text: 'Boost your words, if you want to.' },
            { icon: Link2, title: '5. Take it with you', text: 'One permanent link to share.' },
          ].map(step => <div className="how-step" key={step.title}><step.icon /><div><strong>{step.title}</strong><p>{step.text}</p></div></div>)}</section>
          <section className="side-section"><div className="flex items-center gap-2"><Heart size={16} className="text-heart" /><h2>A little more human.</h2></div><p className="mt-3">No followers. No noise. No second take.<br />Just something you needed to say.</p></section>
        </aside></main>
      )}
      <footer className="footer"><span className="font-display text-lg text-foreground">MyOneOpinion.</span><span>One opinion. Countless ways to feel less alone.</span><span>Made for the words that matter.</span></footer>

      <Dialog.Root open={modal !== null} onOpenChange={isOpen => { if (!isOpen) setModal(null); }}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal-content">
        <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3" aria-label="Close dialog"><X /></Button></Dialog.Close>
        <Dialog.Title className="modal-title">{modal === 'compose' ? review ? 'These are your words.' : 'What’s your one opinion?' : modal === 'signin' ? 'A place for your voice.' : modal === 'boost' ? 'Give your words a lift.' : 'One opinion. Forever.'}</Dialog.Title>
        <Dialog.Description className="mb-5 text-sm leading-relaxed text-muted-foreground">{modal === 'compose' ? 'You only get one opinion. Take your time.' : modal === 'signin' ? notice || 'One account. One opinion. A little piece of you.' : modal === 'boost' ? 'Boosts add visibility, not likes. Your voice is always yours.' : `@${selected?.author} · ${selected?.days} days ago`}</Dialog.Description>
        {modal === 'compose' && <>{review ? <><p className="mb-6 font-display text-2xl">“{draft.trim()}”</p><p className="mb-5 text-sm text-muted-foreground">Once published, your message cannot be edited or replaced.</p><div className="flex gap-3"><Button variant="outline" onClick={() => setReview(false)}>Keep thinking</Button><Button onClick={() => { setModal('signin'); setNotice('Your draft is ready. Live publishing requires accounts to be connected.'); }}>Continue <ArrowRight /></Button></div></> : <><textarea className="composer" aria-label="Your one opinion" placeholder="The one opinion I want to say is…" maxLength={280} value={draft} onChange={e => setDraft(e.target.value)} /><div className="my-3 flex justify-between text-xs text-muted-foreground"><span>Your words. No second take.</span><span>{draft.length} / 280</span></div><Button className="mt-3 w-full" disabled={!draft.trim()} onClick={() => setReview(true)}>Read it once more <ArrowRight /></Button><p className="mt-4 text-center text-xs text-muted-foreground">Composer preview · Nothing is published yet.</p></>}</>}
        {modal === 'signin' && <><div className="border-t border-border pt-5"><p className="text-sm leading-relaxed text-muted-foreground">Accounts aren’t connected yet. You can explore the messages and prepare your words; posting and voting will be available when sign-in is connected.</p></div><Button className="mt-6 w-full" onClick={() => open('compose')}>Prepare my message <Feather /></Button></>}
        {modal === 'boost' && <><p className="mb-5 font-display text-xl">“{selected?.text}”</p><p className="mb-2 text-xs font-medium text-muted-foreground">Choose a boost amount</p><div className="mb-5 grid grid-cols-4 gap-2">{[1, 5, 10, 25].map(value => <Button className="boost-option h-16 flex-1 flex-col gap-1 px-2" variant={amount === String(value) ? 'gold' : 'outline'} key={value} aria-pressed={amount === String(value)} onClick={() => setAmount(String(value))}><span>${value}</span><small>{(value * 100).toLocaleString()} pts</small></Button>)}</div><label className="boost-custom-label" htmlFor="custom-boost-amount">Or enter a custom amount</label><div className="boost-custom-field"><span aria-hidden="true">$</span><input id="custom-boost-amount" className="boost-custom-input" type="number" min="1" max="10000" step="1" aria-label="Custom boost amount in dollars" value={amount} onChange={event => setAmount(event.target.value)} /></div><p className="hype-preview"><Sparkles /> <span>{Number(amount) >= 1 ? (Math.floor(Number(amount) * 100)).toLocaleString() : '0'} Hype Points</span><small>100 points per $1</small></p><p className="text-xs leading-relaxed text-muted-foreground">Boost preview only. Hype Points reflect boost value, not likes. Only the author can boost their message; payments aren’t connected, and no payment will be taken.</p><Button className="mt-5 w-full" variant="gold" disabled={!Number.isFinite(Number(amount)) || Number(amount) < 1 || Number(amount) > 10000} onClick={() => { setModal('signin'); setNotice('Sign in will be needed to boost your own message. Payments are not connected yet.'); }}>Continue <ArrowRight /></Button></>}
        {modal === 'message' && selected && <><blockquote className="my-7 font-display text-3xl leading-tight">“{selected.text}”</blockquote><div className="flex items-center justify-between border-t border-border pt-5"><span className="flex items-center gap-2 text-sm text-heart"><Heart fill="currentColor" size={17} />{selected.votes.toLocaleString()}</span><Button variant="outline" onClick={() => share(selected)}>{copied === selected.id ? <Check /> : <Link2 />}{copied === selected.id ? 'Copied' : 'Copy link'}</Button></div>{notice && <p className="mt-4 break-all text-xs text-muted-foreground">{notice}</p>}<p className="mt-5 text-xs text-muted-foreground">Sample message</p></>}
      </Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}

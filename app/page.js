'use client';

import { useEffect, useRef, useState } from 'react';
import ThreeScene from '../components/ThreeScene';
import './globals.css';

export default function Home() {
  const [content, setContent] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [replySent, setReplySent] = useState(false);
  
  const revealRefs = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    // Autoplay fallback: start music on first screen interaction if native autoplay is blocked
    const playAudio = () => {
       if (audioRef.current) {
           audioRef.current.play()
             .then(() => setMusicPlaying(true))
             .catch((e) => console.log("Autoplay prevented, waiting for interaction..."));
           window.removeEventListener('click', playAudio);
           window.removeEventListener('touchstart', playAudio);
           window.removeEventListener('mousedown', playAudio);
       }
    };
    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);
    window.addEventListener('mousedown', playAudio);

    // HTTP Polling Fallback for Burst Particles
    let lastKnownBurst = 0;
    const pollInterval = setInterval(async () => {
        try {
            const res = await fetch('/api/burst');
            if (res.ok) {
                const data = await res.json();
                if (data.time > lastKnownBurst && lastKnownBurst !== 0) {
                    window.dispatchEvent(new CustomEvent('burstParticles'));
                }
                if (data.time > 0) lastKnownBurst = data.time;
            }
        } catch(e) {}
    }, 3000);

    // Fetch letter content and memories
    Promise.all([
      fetch('/api/letter').then(res => res.json()),
      fetch('/api/memories').then(res => res.json())
    ])
    .then(([letterData, memoriesData]) => {
      setContent(letterData);
      setMemories(memoriesData);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Failed to fetch data:', err);
      setLoading(false);
    });

    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Trigger Constellation formation when they reach the bottom section
                if (entry.target.classList.contains('always-text')) {
                    window.dispatchEvent(new CustomEvent('drawConstellation'));
                }
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealRefs.current.forEach(el => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [loading, content]);

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) {
      revealRefs.current.push(el);
    }
  };

  const handleReply = async (answer) => {
    setReplySent(true);
    // Dispatch massive burst
    window.dispatchEvent(new CustomEvent('burstParticles', { detail: { massive: true } }));
    
    // Redirect to WhatsApp
    const message = encodeURIComponent(`I choose ${answer} 💖`);
    window.open(`https://wa.me/919488944410?text=${message}`, '_blank');
    
    // Save to backend
    try {
      await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
    } catch (e) { console.error("Could not send reply."); }
  };

  const triggerThinkingOfYou = async () => {
    try {
        await fetch('/api/burst', { method: 'POST' });
        window.dispatchEvent(new CustomEvent('burstParticles'));
    } catch(e) {}
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play();
      setMusicPlaying(true);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cream)', color: 'var(--rose)', fontFamily: 'Lato' }}>Loading Magic...</div>;
  }
  if (!content) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cream)', color: 'var(--deep-rose)', fontFamily: 'Lato' }}>Failed to load from backend.</div>;

  return (
    <>
      <ThreeScene />
      
      {/* Ambient Audio */}
      <audio ref={audioRef} loop src="/my_new_song.mp3.mp3" autoPlay />

      {/* Music Toggle Control */}
      <button 
        className={`music-toggle ${musicPlaying ? 'playing' : ''}`} 
        onClick={toggleMusic}
        aria-label="Toggle Music"
      >
        {musicPlaying ? '🔊' : '🔇'}
      </button>

      {/* Secret Thinking of You trigger */}
      <div className="secret-trigger" onClick={triggerThinkingOfYou}></div>

      <div className="content">
        <section className="hero">
          <div className="label fadeUp d-1">{content.hero.label}</div>
          <div className="heading fadeUp d-2">{content.hero.heading}</div>
          <div className="subtitle fadeUp d-3">{content.hero.subtitle}</div>
          <div className="scroll-hint fadeUp d-4">Scroll Down &darr;</div>
        </section>

        <section className="letter-section">
          <div className="card reveal" ref={addToRefs}>
            <div className="quote-mark">&ldquo;</div>
            <div className="letter-text">
              {content.letter.paragraphs.map((p, index) => (
                <p key={index}>{p}</p>
              ))}
              <div className="signature">{content.letter.signature}</div>
            </div>
          </div>
        </section>

        {/* TIMELINE SECTION */}
        <section className="timeline-section">
          <h2 className="timeline-title reveal" ref={addToRefs}>Our Memories</h2>
          <div className="timeline-container">
             {memories.map((mem, index) => (
                 <div className={`timeline-item reveal delay-${index}`} key={mem.id} ref={addToRefs}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content card">
                       <span className="timeline-date">{mem.date}</span>
                       <h3 className="timeline-heading">{mem.title}</h3>
                       <p className="timeline-text">{mem.text}</p>
                    </div>
                 </div>
             ))}
          </div>
        </section>

        <section className="always-section">
          <div className="always-text reveal" ref={addToRefs}>{content.always.text}</div>
          <div className="always-sub reveal" ref={addToRefs}>{content.always.subText}</div>
          
          {/* REPLY BUTTONS */}
          {!replySent ? (
              <div className="reply-container reveal" ref={addToRefs}>
                  <button className="reply-btn always-btn" onClick={() => handleReply('Always')}>Always</button>
                  <button className="reply-btn forever-btn" onClick={() => handleReply('Forever')}>Forever</button>
              </div>
          ) : (
              <div className="reply-sent reveal" ref={addToRefs}>
                  Your answer has been forever etched in the stars. ✨
              </div>
          )}
        </section>

        <section className="footer">
          {content.footer.textLine1}<br /><br />{content.footer.textLine2}
        </section>
      </div>
    </>
  );
}

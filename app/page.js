'use client';

import { useEffect, useRef, useState } from 'react';
import ThreeScene from '../components/ThreeScene';
import './globals.css';

export default function Home() {
  const [content, setContent] = useState(null);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replySent, setReplySent] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    letter: { paragraphs: [], signature: '' },
    contact: { phoneNumber: '' },
    audio: { songUrl: '' }
  });
  
  const revealRefs = useRef([]);
  const audioRef = useRef(null);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/letter');
      const data = await res.json();
      setContent(data);
      setEditForm({
        letter: { paragraphs: data.letter.paragraphs, signature: data.letter.signature },
        contact: { phoneNumber: data.contact.phoneNumber },
        audio: { songUrl: data.audio.songUrl }
      });
    } catch (err) {
      console.error('Failed to fetch content:', err);
    }
  };

  useEffect(() => {
    // Autoplay fallback: start music on first screen interaction if native autoplay is blocked
    const events = ['click', 'touchstart', 'mousedown', 'keydown', 'scroll', 'wheel'];
    const playAudio = () => {
       if (audioRef.current) {
           audioRef.current.play()
             .catch((e) => console.log("Autoplay prevented, waiting for interaction..."));
           events.forEach(e => window.removeEventListener(e, playAudio));
       }
    };
    events.forEach(e => window.addEventListener(e, playAudio, { passive: true }));

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
      fetchContent(),
      fetch('/api/memories').then(res => res.json())
    ])
    .then(([_, memoriesData]) => {
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
    if (loading || !audioRef.current) return;

    audioRef.current.play()
      .catch((e) => console.log("Autoplay prevented, waiting for interaction..."));
  }, [loading]);

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
    const phoneNumber = content?.contact?.phoneNumber ?? '919488944410';
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/update-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (response.ok) {
        await fetchContent(); // Refetch content
        setShowEditModal(false);
        alert('Content updated successfully!');
      } else {
        alert('Failed to update content');
      }
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Error updating content');
    }
  };

  const handleParagraphChange = (index, value) => {
    const newParagraphs = [...editForm.letter.paragraphs];
    newParagraphs[index] = value;
    setEditForm({ ...editForm, letter: { ...editForm.letter, paragraphs: newParagraphs } });
  };

  const addParagraph = () => {
    setEditForm({ ...editForm, letter: { ...editForm.letter, paragraphs: [...editForm.letter.paragraphs, ''] } });
  };

  const removeParagraph = (index) => {
    const newParagraphs = editForm.letter.paragraphs.filter((_, i) => i !== index);
    setEditForm({ ...editForm, letter: { ...editForm.letter, paragraphs: newParagraphs } });
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cream)', color: 'var(--rose)', fontFamily: 'Lato' }}>Loading Magic...</div>;
  }
  if (!content) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--cream)', color: 'var(--deep-rose)', fontFamily: 'Lato' }}>Failed to load from backend.</div>;

  return (
    <>
      <ThreeScene />
      
      {/* Edit Button */}
      <button 
        className="edit-btn" 
        onClick={() => setShowEditModal(true)}
        title="Edit Content"
      >
        ✏️
      </button>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Content</h2>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Letter Paragraphs:</label>
                {editForm.letter.paragraphs.map((para, index) => (
                  <div key={index} className="paragraph-group">
                    <textarea
                      value={para}
                      onChange={(e) => handleParagraphChange(index, e.target.value)}
                      placeholder={`Paragraph ${index + 1}`}
                      rows={3}
                    />
                    <button type="button" onClick={() => removeParagraph(index)} className="remove-btn">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={addParagraph} className="add-btn">Add Paragraph</button>
              </div>
              
              <div className="form-group">
                <label>Letter Signature:</label>
                <input
                  type="text"
                  value={editForm.letter.signature}
                  onChange={(e) => setEditForm({ ...editForm, letter: { ...editForm.letter, signature: e.target.value } })}
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="text"
                  value={editForm.contact.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, contact: { phoneNumber: e.target.value } })}
                />
              </div>
              
              <div className="form-group">
                <label>Background Song URL:</label>
                <input
                  type="text"
                  value={editForm.audio.songUrl}
                  onChange={(e) => setEditForm({ ...editForm, audio: { songUrl: e.target.value } })}
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ambient Audio */}
      <audio 
        ref={audioRef} 
        loop 
        src={content.audio.songUrl} 
        autoPlay 
        playsInline 
        preload="auto"
        onError={() => console.log('Audio failed to load')}
      />

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

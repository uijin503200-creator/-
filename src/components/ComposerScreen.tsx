import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Send } from 'lucide-react';
import { User } from '../types.ts';
import { LiveFix, requestLiveLocation } from '../lib/live-location.ts';

interface ComposerProps {
  user: User;
  token: string;
  onClose: () => void;
  onDropped: () => void;
}

export default function ComposerScreen({ user, token, onClose, onDropped }: ComposerProps) {
  const [content, setContent] = useState('');
  const [isDropping, setIsDropping] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<LiveFix | null>(null);
  const droppingRef = useRef(false);

  useEffect(() => {
    return requestLiveLocation({
      onFix: (fix) => {
        setLocation(fix);
        setError('');
      },
      onError: () => setError("Location required to drop a note."),
    });
  }, []);

  const handleDrop = async () => {
    if (!content.trim() || !location || isDropping || droppingRef.current) return;
    droppingRef.current = true;
    setIsDropping(true);
    
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          content: content.trim()
        })
      });

      if (res.ok) {
        onDropped();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to drop note.');
        droppingRef.current = false;
        setIsDropping(false);
      }
    } catch (err) {
      setError('Network error.');
      droppingRef.current = false;
      setIsDropping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 bg-zinc-950/95 backdrop-blur-xl flex flex-col p-6 z-50"
    >
      <div className="flex justify-between items-center py-4">
        <div className="text-[10px] text-zinc-500 tracking-widest uppercase">
          {user.pagesLeft} Pages Remaining
        </div>
        <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300">
          <X size={20} strokeWidth={1} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        {error && (
          <div className="text-zinc-500 text-xs mb-8 text-center">{error}</div>
        )}
        
        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Leave a piece of yourself here..."
          className="w-full bg-transparent text-zinc-200 font-serif text-2xl md:text-3xl leading-relaxed resize-none focus:outline-none placeholder:text-zinc-800 h-64 selection:bg-zinc-800"
          maxLength={150}
        />
        
        <div className="flex justify-between items-center mt-12 border-t border-zinc-900 pt-8">
          <span className="text-zinc-700 text-xs tracking-widest font-mono">
            {content.length}/150
          </span>
          
          <button 
            onClick={handleDrop}
            disabled={!content.trim() || !location || isDropping}
            className="flex items-center space-x-3 text-zinc-400 hover:text-zinc-200 transition-all disabled:opacity-20 disabled:pointer-events-none group"
          >
            <span className="text-xs tracking-widest uppercase">{isDropping ? 'Dropping' : 'Submit'}</span>
            <Send size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

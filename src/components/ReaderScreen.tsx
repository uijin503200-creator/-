import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { Note, User } from '../types.ts';

interface ReaderProps {
  note: Note;
  token: string;
  onClose: () => void;
  currentUser: User;
}

export default function ReaderScreen({ note, token, onClose, currentUser }: ReaderProps) {
  const [readState, setReadState] = useState<Note | null>(null);
  const [echoed, setEchoed] = useState(false);
  const [localEchoCount, setLocalEchoCount] = useState(note.echoCount);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    // Mark as read immediately when opened
    const markRead = async () => {
      try {
        const res = await fetch(`/api/notes/${note.id}/read`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const updated = await res.json();
          setReadState(updated);
        }
      } catch (err) {
        console.error(err);
      }
    };
    markRead();
  }, [note.id, token]);

  const handleEcho = async () => {
    if (echoed) return;
    
    // Light impact haptic feedback (approximate via web API)
    if ('vibrate' in navigator) navigator.vibrate(10);
    
    setEchoed(true);
    setLocalEchoCount(prev => prev + 1);
    
    // Trigger visual pulse
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 800);
    
    try {
      await fetch(`/api/notes/${note.id}/echo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const displayNote = readState || note;
  const isAuthor = note.userId === currentUser.id;

  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 overflow-hidden"
    >
      {/* Background Overlay mapped to physics */}
      <motion.div style={{ opacity }} className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md pointer-events-none" />

      {/* Physics-based draggable paper */}
      <motion.div 
        style={{ y, opacity }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.8 }}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100 || info.velocity.y > 400) {
            onClose();
          }
        }}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full relative flex flex-col items-center cursor-grab active:cursor-grabbing pb-16 pt-8 z-10"
      >
        {/* Visual Grab Handle */}
        <div className="w-12 h-1 rounded-full bg-zinc-700/40 mb-12" />

        <div className="w-full space-y-16 relative">
          {/* Subtle Author Indicator */}
          {isAuthor && (
            <div className="absolute -top-12 left-0 text-[10px] text-zinc-700 tracking-widest uppercase">
              Your Note
            </div>
          )}
          
          {/* Note Content */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 2.5, delay: 0.5, ease: "easeOut" }}
            className="font-serif text-2xl md:text-3xl leading-relaxed font-normal text-center"
          >
            <motion.div
              animate={isPulsing ? { 
                scale: [1, 1.05, 1], 
                color: ["#e4e4e7", "#ffffff", "#e4e4e7"],
                textShadow: ["0px 0px 0px rgba(255,255,255,0)", "0px 0px 20px rgba(255,255,255,0.4)", "0px 0px 0px rgba(255,255,255,0)"]
              } : { scale: 1, color: "#e4e4e7" }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            >
              "{displayNote.content}"
            </motion.div>
          </motion.div>

          {/* Footer Actions */}
          <div className="flex justify-center items-center pt-12 border-t border-zinc-900 mt-12 w-full">
            <div className="flex items-center space-x-4">
              <span className="text-[10px] text-zinc-700 tracking-widest">{localEchoCount}</span>
              <button 
                onClick={handleEcho}
                disabled={echoed || isAuthor}
                className={`text-xs tracking-[0.2em] uppercase font-light transition-all ${echoed ? 'text-zinc-300' : 'text-zinc-600 hover:text-zinc-400'} disabled:cursor-default cursor-pointer`}
              >
                Echo
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Explicit Walk Away Button */}
      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        onClick={onClose}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-zinc-500 hover:text-zinc-300 uppercase font-light transition-colors z-20"
      >
        Walk Away
      </motion.button>

    </motion.div>
  );
}

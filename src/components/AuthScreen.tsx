import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { motion } from 'motion/react';
import { Hexagon } from 'lucide-react';
import { unlockWeatherAudio } from '../lib/weather-audio.ts';

export default function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const handleLogin = async () => {
    try {
      if (import.meta.env.VITE_DEV_AUTH_BYPASS === 'true') {
        unlockWeatherAudio();
        onLogin('dev:local-user');
        return;
      }
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      onLogin(token);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.5 } }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      <div className="relative flex items-center justify-center mb-12 w-16 h-16">
        {[0, 2].map((delay) => (
          <motion.div
            key={delay}
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeOut", 
              delay 
            }}
            className="absolute inset-0 rounded-full border border-[rgba(255,255,255,0.1)] pointer-events-none"
          />
        ))}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 opacity-80 flex items-center justify-center bg-zinc-950 rounded-full"
        >
          <Hexagon size={64} className="text-zinc-400 font-thin stroke-1" />
        </motion.div>
      </div>
      
      <h1 className="text-4xl font-serif tracking-widest text-zinc-100 mb-4 opacity-90">DRIFT</h1>
      <p className="text-zinc-500 text-sm tracking-wide mb-16 text-center max-w-xs font-light">
        Leave pieces of yourself in physical spaces. Find pieces of others.
      </p>

      <button 
        onClick={handleLogin}
        className="px-8 py-3 rounded-full border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 transition-all text-sm tracking-widest uppercase text-zinc-400"
      >
        Enter
      </button>
    </motion.div>
  );
}

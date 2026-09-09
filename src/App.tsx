/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import AuthScreen from './components/AuthScreen.tsx';
import RadarScreen from './components/RadarScreen.tsx';
import ReaderScreen from './components/ReaderScreen.tsx';
import ComposerScreen from './components/ComposerScreen.tsx';
import { User, Note } from './types.ts';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [currentView, setCurrentView] = useState<'radar' | 'composer' | 'reader'>('radar');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const handleLogin = async (authToken: string) => {
    setToken(authToken);
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadNote = (note: Note) => {
    setActiveNote(note);
    setCurrentView('reader');
  };

  const closeReader = () => {
    setActiveNote(null);
    setCurrentView('radar');
  };

  const closeComposer = () => {
    setCurrentView('radar');
  };

  const handleNoteDropped = async () => {
    // Refresh user to get updated pagesLeft
    if (token) {
      try {
        const res = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        console.error(err);
      }
    }
    setCurrentView('radar');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800">
      <AnimatePresence mode="wait">
        {!token || !user ? (
          <AuthScreen key="auth" onLogin={handleLogin} />
        ) : (
          <>
            {currentView === 'radar' && (
              <RadarScreen 
                key="radar" 
                user={user} 
                token={token} 
                onCompose={() => setCurrentView('composer')}
                onRead={handleReadNote}
              />
            )}
            {currentView === 'composer' && (
              <ComposerScreen 
                key="composer" 
                user={user} 
                token={token}
                onClose={closeComposer}
                onDropped={handleNoteDropped}
              />
            )}
            {currentView === 'reader' && activeNote && (
              <ReaderScreen 
                key="reader" 
                note={activeNote} 
                token={token}
                currentUser={user}
                onClose={closeReader}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


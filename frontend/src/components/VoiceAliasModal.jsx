import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceAliasModal = ({ isOpen, onClose, onSuccess }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [slugified, setSlugified] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initializing Web Speech recognition ref
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
        setTranscript('');
        setSlugified('');
      };

      rec.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        
        // Clean up spoken aliases and format SEO-friendly slug
        const cleaned = spokenText
          .toLowerCase()
          .replace(/[^\w\s-]/g, '') // remove special chars
          .split(/\s+/)
          .filter(word => !['a', 'an', 'the', 'my', 'of', 'and', 'or', 'for', 'to', 'in'].includes(word)) // remove stop words
          .join('-');
        
        setSlugified(cleaned);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access blocked. Please enable browser permissions.');
        } else {
          setErrorMsg('Could not detect your voice. Please try speaking again.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setErrorMsg('Web Speech API is not supported by your current browser. Try Google Chrome.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.abort();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleApply = () => {
    if (slugified) {
      onSuccess(slugified);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
        {/* Style block for soundwave bar animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes wave-grow {
            0%, 100% { height: 12px; }
            50% { height: 48px; }
          }
          .wave-bar {
            animation: wave-grow 1.2s ease-in-out infinite;
          }
          .wave-bar:nth-child(2) { animation-delay: 0.15s; }
          .wave-bar:nth-child(3) { animation-delay: 0.3s; }
          .wave-bar:nth-child(4) { animation-delay: 0.45s; }
          .wave-bar:nth-child(5) { animation-delay: 0.6s; }
          .wave-bar:nth-child(6) { animation-delay: 0.75s; }
          .wave-bar:nth-child(7) { animation-delay: 0.3s; }
          .wave-bar:nth-child(8) { animation-delay: 0.15s; }
        `}} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {/* Neon back glow */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl -z-10"></div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Mic className="w-5 h-5" />
              </div>
              <h3 className="text-md font-bold tracking-tight text-white font-outfit">Voice Alias Input</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-6">
            {/* Listening Soundwave Animation */}
            <div className="h-16 flex items-center justify-center gap-1.5 w-full">
              {isListening ? (
                Array(8).fill(null).map((_, idx) => (
                  <span
                    key={idx}
                    className="wave-bar w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500"
                  />
                ))
              ) : (
                <div className="h-1 bg-white/10 w-2/3 rounded-full"></div>
              )}
            </div>

            {/* Pulsing Glow Microphone Circle */}
            <div className="relative">
              {isListening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse scale-150"></span>
                  <span className="absolute inset-0 rounded-full border-2 border-indigo-500/50 animate-ping"></span>
                </>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 relative border ${
                  isListening
                    ? 'bg-gradient-to-tr from-rose-500 to-pink-600 border-rose-400/30 text-white shadow-lg shadow-rose-500/40 hover:scale-95'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-700 border-indigo-500/20 text-white shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Instruction Status Text */}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                {isListening ? 'Listening to your voice...' : 'Tap microphone to speak alias'}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                e.g., "My YouTube gaming campaign"
              </p>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-[11px] font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Speech results */}
            {transcript && (
              <div className="w-full p-4 rounded-2xl border border-white/5 bg-white/[0.02] space-y-3 text-left">
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Voice Transcript</p>
                  <p className="text-xs text-slate-350 italic mt-0.5">"{transcript}"</p>
                </div>
                {slugified && (
                  <div className="pt-3 border-t border-white/5">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Cleaned SEO Alias
                    </p>
                    <p className="text-sm font-mono font-bold text-emerald-400 mt-1 truncate bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg select-all">
                      {slugified}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="w-full pt-4 border-t border-white/5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-white/5 hover:bg-white/5 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!slugified}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply Alias
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VoiceAliasModal;

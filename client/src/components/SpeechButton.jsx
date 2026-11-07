import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function SpeechButton({ onTranscript, className = 'speech-btn' }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  const toggleListen = (e) => {
    e.preventDefault();
    if (!isSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={toggleListen}
      title={isListening ? 'Listening... click to stop' : 'Click to dictate complaint via microphone'}
      style={{
        background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-secondary)',
        color: isListening ? '#ef4444' : 'var(--text-muted)',
        border: `1px solid ${isListening ? '#ef4444' : 'var(--card-border)'}`,
        padding: '0.45rem',
        borderRadius: '8px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease'
      }}
    >
      {isListening ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600 }}>
          <MicOff size={15} className="pulse-red" /> Listening...
        </span>
      ) : (
        <Mic size={16} />
      )}
    </button>
  );
}


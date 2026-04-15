import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranscriptStore } from '../stores/transcriptStore';

export default function useSpeechRecognition(sessionId, socket, role) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const { addTranscript, setInterimText } = useTranscriptStore();

  const initRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Indian English for localization/better parsing
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
        // We can emit interim if we want live sync, but it's noisy
      }

      if (finalTranscript) {
        setInterimText('');
        const record = {
          text: finalTranscript.trim(),
          isFinal: true,
          timestamp: new Date().toISOString(),
          speaker: role
        };
        addTranscript(record);
        
        if (socket) {
          socket.emit('transcript-update', { ...record, sessionId });
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we are supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch(e) {
             // already started
        }
      }
    };

    recognitionRef.current = recognition;
  }, [addTranscript, setInterimText, socket, sessionId, role, isListening]);

  useEffect(() => {
    initRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initRecognition]);

  useEffect(() => {
    if (recognitionRef.current) {
      if (isListening) {
        try { recognitionRef.current.start(); } catch(e) {}
      } else {
        recognitionRef.current.stop();
      }
    }
  }, [isListening]);

  const toggleListening = () => setIsListening(prev => !prev);
  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return { isListening, toggleListening, startListening, stopListening };
}

import { useState, useEffect, useRef } from 'react';
import { useTranscriptStore } from '../stores/transcriptStore';

export default function useSpeechRecognition(sessionId, socketRef, role) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const { addTranscript, setInterimText } = useTranscriptStore();

  // Keep ref in sync with state so onend closure always has current value
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

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

      if (interimTranscript) setInterimText(interimTranscript);

      if (finalTranscript) {
        setInterimText('');
        const record = {
          text: finalTranscript.trim(),
          isFinal: true,
          timestamp: new Date().toISOString(),
          speaker: role
        };
        addTranscript(record);
        if (socketRef?.current) {
          socketRef.current.emit('transcript-update', { ...record, sessionId });
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech recognition error', event.error);
      }
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        setTimeout(() => {
          try { recognition.start(); } catch (e) { /* already started */ }
        }, 300);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onend = null;
      recognition.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      try { recognition.start(); } catch (e) { /* already started */ }
    } else {
      recognition.stop();
    }
  }, [isListening]);

  const toggleListening = () => setIsListening(prev => !prev);
  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return { isListening, toggleListening, startListening, stopListening };
}

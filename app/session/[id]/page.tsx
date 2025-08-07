// app/session/[id]/page.tsx - Simplified with browser speech APIs
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  difficulty: string;
  role: string;
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
  confidence?: number;
}

export default function SimplifiedSessionPage({ params }: { params: { id: string } }) {
  // Core state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Speech state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState('');
  
  // Natural ending state
  const [aiSuggestedEnd, setAiSuggestedEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const router = useRouter();

  // Initialize session
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      // Check authentication
      const email = localStorage.getItem('userEmail');
      if (!email) {
        router.push('/');
        return;
      }

      // Load scenario
      const storedScenario = localStorage.getItem('currentScenario');
      if (!storedScenario) {
        router.push('/dashboard');
        return;
      }

      const scenarioData = JSON.parse(storedScenario);
      setScenario(scenarioData);
      
      // Create session
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioData.id,
          user_email: email
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const sessionData = await sessionResponse.json();
      if (sessionData.success) {
        setSessionId(sessionData.data.id);
        setIsActive(true);
      }
      
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('Failed to initialize session. Please try again.');
    }
  };

  const cleanup = useCallback(() => {
    // Stop all speech activities
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
  }, []);

  const startConversation = async () => {
    if (!scenario || !sessionId) return;

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setError('');
      
      // Generate greeting
      const greeting = `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. How can I help you today?`;
      
      const aiMessage: ConversationMessage = {
        speaker: 'ai',
        message: greeting,
        timestamp: Date.now()
      };
      
      const initialConversation = [aiMessage];
      setConversation(initialConversation);
      
      // Save to database
      await saveConversation(initialConversation);
      
      // Speak greeting
      await speakMessage(greeting);
      
      // Start listening
      setTimeout(() => {
        if (isActive && !isEnding) {
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('Microphone permission error:', err);
      setError('Microphone access required. Please allow access and refresh.');
    }
  };

  const speakMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      
      setIsSpeaking(true);
      
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const startListening = useCallback(() => {
    if (!isActive || isSpeaking || isProcessing || isEnding) {
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition requires Chrome browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognitionRef.current = recognition;
    setIsListening(true);
    setCurrentTranscript('');

    let finalTranscript = '';
    let isProcessingFinal = false;

    recognition.onresult = async (event: any) => {
      if (!isActive || isSpeaking || isProcessingFinal || isEnding) return;

      let interimTranscript = '';
      let confidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence = result[0].confidence;
        
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setCurrentTranscript(interimTranscript);

      if (finalTranscript.trim() && !isProcessingFinal) {
        isProcessingFinal = true;
        await processUserSpeech(finalTranscript.trim(), confidence);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please refresh and allow access.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        // Restart listening after error
        setTimeout(() => {
          if (isActive && !isSpeaking && !isProcessing && !isEnding) {
            startListening();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      
      // Restart listening if still active
      if (isActive && !isSpeaking && !isProcessing && !isEnding) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    recognition.start();
  }, [isActive, isSpeaking, isProcessing, isEnding]);

  const processUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || !scenario || !sessionId || !isActive || isEnding) return;
    
    setIsListening(false);
    setIsProcessing(true);
    setCurrentTranscript('');
    
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now(),
      confidence
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    await saveConversation(updatedConversation);

    try {
      // Get AI response
      const aiResponse = await getAIResponse(scenario, userMessage, updatedConversation);
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await saveConversation(finalConversation);
      
      // Check for natural ending
      if (aiResponse.shouldEndConversation && !aiSuggestedEnd) {
        setAiSuggestedEnd(true);
      }
      
      // Speak response
      await speakMessage(aiResponse.response);
      
      setIsProcessing(false);
      
      // Continue listening
      setTimeout(() => {
        if (is

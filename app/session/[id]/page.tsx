'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types
interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  character_personality?: string;
  difficulty: string;
  category: string;
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
  confidence?: number;
  emotion?: string;
}

interface SessionState {
  status: 'initializing' | 'ready' | 'listening' | 'processing' | 'ai-speaking' | 'ended';
  isActive: boolean;
  sessionId: string | null;
  startTime: number;
}

interface AudioState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  hasPermission: boolean;
  permissionDenied: boolean;
}

interface AIGuide {
  goal: string;
  objectives: string[];
  tips: string[];
  insights: string[];
}

export default function SessionPage({ params }: { params: { id: string } }) {
  // Core state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>({
    status: 'initializing',
    isActive: false,
    sessionId: null,
    startTime: Date.now()
  });
  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentTranscript: '',
    hasPermission: false,
    permissionDenied: false
  });
  
  // AI Guide state
  const [aiGuide, setAiGuide] = useState<AIGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideSource, setGuideSource] = useState<'ai-generated' | 'fallback' | null>(null);
  
  // UI state
  const [error, setError] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showScenarioDetails, setShowScenarioDetails] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  
  const router = useRouter();

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize speech synthesis and load voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        availableVoicesRef.current = voices;
        console.log('🔊 Loaded voices:', voices.length);
      };
      
      loadVoices();
      if (speechSynthesisRef.current?.onvoiceschanged !== undefined) {
        speechSynthesisRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Initialize session
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  // Generate AI guide when scenario is loaded
  useEffect(() => {
    if (scenario && !aiGuide && !isGeneratingGuide) {
      generateAIGuide(scenario);
    }
  }, [scenario]);

  // Generate AI-powered scenario guide
  const generateAIGuide = async (scenarioData: Scenario) => {
    setIsGeneratingGuide(true);
    console.log('🧠 Generating AI guide for scenario:', scenarioData.title);
    
    try {
      const response = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioData })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setAiGuide(result.data);
        setGuideSource(result.source);
        console.log('✅ AI guide generated:', result.source);
      } else {
        console.error('❌ Failed to generate AI guide');
        setGuideSource('fallback');
      }
    } catch (error) {
      console.error('❌ Error generating AI guide:', error);
      setGuideSource('fallback');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // Initialize session data
  const initializeSession = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        console.error('❌ No user email found');
        router.push('/');
        return;
      }
      setUserEmail(email);

      const storedScenario = localStorage.getItem('currentScenario');
      if (!storedScenario) {
        console.error('❌ No scenario found');
        router.push('/dashboard');
        return;
      }

      const scenarioData = JSON.parse(storedScenario);
      setScenario(scenarioData);
      
      // Create session
      const sessionId = await createDatabaseSession(scenarioData.id, email);
      
      setSessionState(prev => ({
        ...prev,
        sessionId,
        status: 'ready',
        isActive: true,
        startTime: Date.now()
      }));
      
      console.log('✅ Session initialized:', sessionId);
      
    } catch (err) {
      console.error('❌ Session initialization failed:', err);
      setError('Unable to start your practice session. Please check your internet connection and try again.');
    }
  };

  // Create database session
  const createDatabaseSession = async (scenarioId: string, email: string): Promise<string> => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenarioId,
          user_email: email
        })
      });

      const data = await response.json();
      if (data.success) {
        return data.data.id;
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (err) {
      console.error('❌ Database session creation failed:', err);
      throw err;
    }
  };

  // Start conversation with microphone permission
  const startConversation = async () => {
    if (!scenario || !sessionState.sessionId) {
      setError('Session not ready. Please wait or refresh the page.');
      return;
    }

    try {
      console.log('🎤 Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setAudioState(prev => ({
        ...prev,
        hasPermission: true,
        permissionDenied: false
      }));
      
      setError('');
      
      // AI greets first
      const greeting = getCharacterGreeting(scenario);
      const aiMessage: ConversationMessage = {
        speaker: 'ai',
        message: greeting,
        timestamp: Date.now(),
        emotion: 'professional'
      };
      
      const initialConversation = [aiMessage];
      setConversation(initialConversation);
      
      // Save to database
      await saveConversationToDatabase(initialConversation);
      
      // Speak the greeting
      await speakWithCharacterVoice(greeting, scenario, 'professional');
      
      // Start listening after AI finishes speaking
      setTimeout(() => {
        if (sessionState.isActive) {
          startListening();
        }
      }, 1000);
      
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setAudioState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      setError('We need microphone access for voice conversations. Please allow microphone access in your browser settings and refresh the page.');
    }
  };

  // Generate character greeting
  const getCharacterGreeting = (scenario: Scenario): string => {
    const greetings: Record<string, string[]> = {
      'sales': [
        `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss our business needs?`,
        `Hello! ${scenario.character_name} here. I have about 15 minutes to chat about what you're offering.`,
        `Good morning! I'm ${scenario.character_name}. I've been looking at solutions like yours - what makes yours different?`
      ],
      'healthcare': [
        `Hello, I'm ${scenario.character_name}. Thank you for seeing me today. I've been having some concerns...`,
        `Hi Doctor, I'm ${scenario.character_name}. I scheduled this appointment because I wanted to discuss my health.`
      ],
      'support': [
        `Hi, this is ${scenario.character_name}. I'm calling because I'm having issues with your service.`,
        `Hello, ${scenario.character_name} here. I need help with my account - I've been trying to resolve this for days.`
      ],
      'leadership': [
        `Good morning! I'm ${scenario.character_name}. I wanted to discuss my recent projects and get your feedback.`,
        `Hi, ${scenario.character_name} here. I understand you wanted to have a conversation about my performance?`
      ],
      'legal': [
        `Hello, I'm ${scenario.character_name}. Thank you for meeting with me. I need some legal advice about my situation.`,
        `Good afternoon! ${scenario.character_name} here. I'm facing some legal challenges and need professional guidance.`
      ]
    };
    
    const categoryGreetings = greetings[scenario.category] || greetings['sales'];
    return categoryGreetings[Math.floor(Math.random() * categoryGreetings.length)];
  };

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!sessionState.isActive || !sessionState.sessionId || audioState.isSpeaking || audioState.isProcessing) {
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice recognition requires Chrome browser. Please switch to Chrome for the best experience.');
      return;
    }

    console.log('🎤 Starting speech recognition...');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognitionRef.current = recognition;
    
    setAudioState(prev => ({
      ...prev,
      isListening: true,
      currentTranscript: ''
    }));

    setSessionState(prev => ({
      ...prev,
      status: 'listening'
    }));

    let finalTranscript = '';
    let isProcessingFinal = false;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setError('');
    };

    recognition.onresult = (event: any) => {
      if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal) {
        return;
      }

      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      setAudioState(prev => ({
        ...prev,
        currentTranscript: interimTranscript
      }));

      if (finalTranscript.trim() && !isProcessingFinal && sessionState.isActive) {
        isProcessingFinal = true;
        clearTimeout(silenceTimerRef.current!);
        processUserSpeech(finalTranscript.trim());
        return;
      }

      if (interimTranscript.trim().length > 2 && sessionState.isActive) {
        clearTimeout(silenceTimerRef.current!);
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim() && !isProcessingFinal && sessionState.isActive && !audioState.isSpeaking) {
            isProcessingFinal = true;
            console.log('⏰ Auto-finalizing after silence');
            processUserSpeech(interimTranscript.trim());
          }
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error);
      
      setAudioState(prev => ({
        ...prev,
        isListening: false
      }));
      
      if (event.error === 'not-allowed') {
        setAudioState(prev => ({
          ...prev,
          permissionDenied: true
        }));
        setError('Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('Having trouble with voice recognition? Try speaking clearly or check your microphone.');
        
        setTimeout(() => {
          if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing) {
            startListening();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      setAudioState(prev => ({
        ...prev,
        isListening: false
      }));
      
      if (sessionState.isActive && !audioState.isSpeaking && !isProcessingFinal && !isEndingSession) {
        setTimeout(() => {
          if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
            startListening();
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setError('Unable to start voice recognition. Please try again.');
    }
  }, [sessionState.isActive, sessionState.sessionId, audioState.isSpeaking, audioState.isProcessing, isEndingSession]);

  // Process user speech
  const processUserSpeech = async (userMessage: string) => {
    if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive) {
      return;
    }
    
    console.log('💬 Processing user speech:', userMessage);
    
    stopListening();
    
    setAudioState(prev => ({
      ...prev,
      isProcessing: true,
      currentTranscript: ''
    }));
    
    setSessionState(prev => ({
      ...prev,
      status: 'processing'
    }));
    
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now(),
      confidence: 0.95
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    await saveConversationToDatabase(updatedConversation);

    try {
      const aiResponse = await getAIResponse(scenario, userMessage, updatedConversation);
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now(),
        emotion: aiResponse.emotion || 'professional'
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await saveConversationToDatabase(finalConversation);
      
      if (!sessionState.isActive) return;
      
      await speakWithCharacterVoice(aiResponse.response, scenario, aiResponse.emotion);
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      setError('Having trouble processing your message. Please try speaking again.');
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      if (sessionState.isActive && !isEndingSession) {
        setTimeout(() => {
          startListening();
        }, 3000);
      }
    }
  };

  // Get AI response
  const getAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        userMessage,
        conversationHistory,
        messageCount: Math.floor(conversationHistory.length / 2),
        enhancedMode: true
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'AI response failed');
    }
    
    return {
      response: data.data.response,
      emotion: data.data.emotion || 'professional',
      character: data.data.character
    };
  };

  // Text-to-speech
  const speakWithCharacterVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise((resolve) => {
      if (!speechSynthesisRef.current) {
        console.warn('Speech synthesis not available');
        resolve();
        return;
      }

      console.log('🔊 AI starting to speak');
      
      setAudioState(prev => ({
        ...prev,
        isSpeaking: true
      }));
      
      setSessionState(prev => ({
        ...prev,
        status: 'ai-speaking'
      }));
      
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voice = selectCharacterVoice(scenario.character_name);
      if (voice) {
        utterance.voice = voice;
      }
      
      const params = getEmotionalVoiceParams(emotion);
      utterance.rate = params.rate;
      utterance.pitch = params.pitch;
      utterance.volume = params.volume;

      utterance.onend = () => {
        console.log('🔊 AI speech completed');
        setAudioState(prev => ({
          ...prev,
          isSpeaking: false
        }));
        setSessionState(prev => ({
          ...prev,
          status: 'ready'
        }));
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event);
        setAudioState(prev => ({
          ...prev,
          isSpeaking: false
        }));
        setSessionState(prev => ({
          ...prev,
          status: 'ready'
        }));
        resolve();
      };

      speechSynthesisRef.current.speak(utterance);
    });
  };

  // Select character voice
  const selectCharacterVoice = (characterName: string): SpeechSynthesisVoice | null => {
    const voices = availableVoicesRef.current;
    if (voices.length === 0) return null;
    
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    if (englishVoices.length === 0) return null;
    
    const firstName = characterName.toLowerCase().split(' ')[0];
    const femaleNames = ['sarah', 'jennifer', 'lisa', 'maria', 'emily', 'susan', 'karen', 'nancy'];
    const isFemale = femaleNames.includes(firstName);
    
    const genderVoices = englishVoices.filter(voice => {
      const name = voice.name.toLowerCase();
      if (isFemale) {
        return name.includes('female') || name.includes('woman') || 
               ['karen', 'susan', 'samantha', 'victoria', 'zira'].some(n => name.includes(n));
      } else {
        return name.includes('male') || name.includes('man') ||
               ['david', 'mark', 'james', 'george'].some(n => name.includes(n));
      }
    });
    
    return genderVoices[0] || englishVoices[0] || null;
  };

  // Get emotional voice parameters
  const getEmotionalVoiceParams = (emotion: string) => {
    const params: Record<string, { rate: number; pitch: number; volume: number }> = {
      'professional': { rate: 0.9, pitch: 1.0, volume: 0.9 },
      'curious': { rate: 1.0, pitch: 1.1, volume: 0.95 },
      'interested': { rate: 0.95, pitch: 1.05, volume: 0.95 },
      'concerned': { rate: 0.8, pitch: 0.95, volume: 0.85 },
      'skeptical': { rate: 0.85, pitch: 0.9, volume: 0.9 },
      'enthusiastic': { rate: 1.1, pitch: 1.15, volume: 1.0 },
      'frustrated': { rate: 1.05, pitch: 1.1, volume: 0.95 }
    };
    
    return params[emotion] || params['professional'];
  };

  // Save conversation to database
  const saveConversationToDatabase = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionState.sessionId) return;
    
    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionState.sessionId,
          conversation: updatedConversation
        })
      });
    } catch (err) {
      console.error('❌ Error saving conversation:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('🛑 Stopping speech recognition');
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setAudioState(prev => ({
      ...prev,
      isListening: false,
      currentTranscript: ''
    }));
  };

  // Complete cleanup
  const cleanup = () => {
    console.log('🧹 Complete session cleanup');
    
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      status: 'ended'
    }));
    
    stopListening();
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    setAudioState(prev => ({
      ...prev,
      isSpeaking: false,
      isProcessing: false
    }));
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Recognition already aborted');
      }
      recognitionRef.current = null;
    }
    
    console.log('✅ Session cleanup completed');
  };

  // End session
  const endSession = async () => {
    if (isEndingSession) return;
    
    console.log('🛑 Ending session...');
    setIsEndingSession(true);
    
    cleanup();
    
    if (sessionState.sessionId && conversation.length > 0) {
      const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        let score = 2.0 + (exchanges >= 2 ? 0.5 : 0) + (exchanges >= 4 ? 0.5 : 0) + (exchanges >= 6 ? 0.5 : 0) + (duration >= 3 ? 0.5 : 0);
        score = Math.min(5.0, score);
        
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionState.sessionId,
            session_status: 'completed',
            duration_minutes: duration,
            overall_score: score
          })
        });
      } catch (err) {
        console.error('❌ Error ending session:', err);
      }
    }
    
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - sessionState.startTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail,
      sessionId: sessionState.sessionId
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // Get status display info
  const getStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
    
    switch (sessionState.status) {
      case 'initializing':
        return { 
          icon: '⏳', 
          title: 'Setting up your practice session...', 
          message: 'Preparing AI conversation partner', 
          color: 'bg-yellow-500',
          progress: true
        };
      case 'ready':
        return { 
          icon: '🎤', 
          title: 'Ready to start!', 
          message: `Click "Start Conversation" to begin practicing with ${scenario?.character_name}`, 
          color: 'bg-blue-500',
          showStats: false
        };
      case 'listening':
        return { 
          icon: '🎤', 
          title: 'Your turn - Speak now', 
          message: isMobile ? 'Tap and speak clearly' : 'Speak clearly into your microphone', 
          color: 'bg-green-500',
          pulse: true,
          showStats: true,
          exchanges,
          duration
        };
      case 'processing':
        return { 
          icon: '🧠', 
          title: 'Processing your message...', 
          message: 'AI is thinking about the best response', 
          color: 'bg-orange-500',
          progress: true,
          showStats: true,
          exchanges,
          duration
        };
      case 'ai-speaking':
        return { 
          icon: '🔊', 
          title: `${scenario?.character_name} is responding...`, 
          message: 'Listen carefully and prepare your next response', 
          color: 'bg-purple-500',
          showStats: true,
          exchanges,
          duration
        };
      case 'ended':
        return { 
          icon: '✅', 
          title: 'Session completed', 
          message: 'Analyzing your performance...', 
          color: 'bg-gray-500'
        };
      default:
        return { 
          icon: '⏳', 
          title: 'Loading...', 
          message: 'Please wait', 
          color: 'bg-gray-500'
        };
    }
  };

  // Loading state
  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Practice Session</h2>
          <p className="text-gray-600">Setting up your AI conversation partner...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-700 mb-6 leading-relaxed">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setError('');
                setSessionState(prev => ({ ...prev, status: 'ready' }));
                if (sessionState.sessionId) {
                  startConversation();
                }
              }}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          
          {audioState.permissionDenied && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Need help?</strong> Make sure to allow microphone access when prompted, or check your browser settings to enable microphone for this site.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🎭
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
                <p className="text-sm text-gray-600">
                  {scenario.character_name} • {scenario.difficulty} level • {scenario.category}
                </p>
              </div>
            </div>
            
            <button
              onClick={endSession}
              disabled={isEndingSession}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isEndingSession 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isEndingSession ? 'Ending...' : 'End Session'}
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className={`${statusInfo.color} text-white px-6 py-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`text-2xl ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                {statusInfo.icon}
              </span>
              <div>
                <div className="font-semibold text-lg">{statusInfo.title}</div>
                <div className="text-sm opacity-90">{statusInfo.message}</div>
              </div>
              {statusInfo.progress && (
                <div className="ml-4">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {statusInfo.showStats && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-bold">{statusInfo.exchanges}</div>
                  <div className="opacity-75">Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="font-bold">{statusInfo.duration}m</div>
                  <div className="opacity-75">Duration</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* AI-Enhanced Scenario Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 sticky top-24">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowScenarioDetails(!showScenarioDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="text-xl mr-2">
                      {isGeneratingGuide ? '🧠' : guideSource === 'ai-generated' ? '🤖' : '🎯'}
                    </span>
                    {isGeneratingGuide ? 'Generating AI Guide...' : 'Practice Guide'}
                  </h3>
                  <span className="text-gray-400">
                    {showScenarioDetails ? '−' : '+'}
                  </span>
                </button>
                
                {/* Guide source indicator */}
                {!isGeneratingGuide && guideSource && (
                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      guideSource === 'ai-generated' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guideSource === 'ai-generated' ? '✨ AI-Enhanced' : '📋 Standard'}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              {showScenarioDetails && (
                <div className="p-4 space-y-4">
                  
                  {isGeneratingGuide ? (
                    /* Loading State */
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">
                        AI is creating a personalized guide for your conversation with {scenario.character_name}...
                      </p>
                    </div>
                  ) : aiGuide ? (
                    /* AI-Generated Guide */
                    <>
                      {/* Goal */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">🚀</span>
                          Your Goal
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {aiGuide.goal}
                        </p>
                      </div>

                      {/* Objectives */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">📋</span>
                          Practice Objectives
                        </h4>
                        <ul className="space-y-1">
                          {aiGuide.objectives.map((objective, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2 mt-0.5 text-xs">•</span>
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Tips */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">💡</span>
                          Success Tips
                        </h4>
                        <ul className="space-y-1">
                          {aiGuide.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-green-500 mr-2 mt-0.5 text-xs">→</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Character Insights */}
                      {aiGuide.insights && aiGuide.insights.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                            <span className="text-sm mr-2">🎭</span>
                            Character Insights
                          </h4>
                          <ul className="space-y-1">
                            {aiGuide.insights.map((insight, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-purple-500 mr-2 mt-0.5 text-xs">★</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback Content */
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Guide temporarily unavailable. The conversation will still work perfectly!
                      </p>
                    </div>
                  )}

                  {/* Character Profile */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <span className="text-sm mr-2">👤</span>
                      Character Profile
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Name:</strong> {scenario.character_name}</div>
                      <div><strong>Role:</strong> {scenario.character_role}</div>
                      {scenario.character_personality && (
                        <div><strong>Personality:</strong> {scenario.character_personality}</div>
                      )}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {conversation.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="text-sm mr-2">📊</span>
                        Session Progress
                      </h4>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between mb-1">
                          <span>Exchanges</span>
                          <span>{Math.floor(conversation.length / 2)}/8 (target)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (Math.floor(conversation.length / 2) / 8) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.length < 6 ? 'Keep going! More practice = better feedback' : 
                           conversation.length < 12 ? 'Great depth! You\'re building strong skills' :
                           'Excellent session length! Ready to wrap up when you are'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Conversation Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
              
              {/* Conversation Messages */}
              <div className="p-6">
                
                {conversation.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">🎭</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Ready to Start Practicing?
                    </h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                      You&apos;re about to have a conversation with <strong>{scenario.character_name}</strong>, 
                      a {scenario.character_role}. They&apos;ll respond naturally to help you practice your skills.
                    </p>
                    
                    {sessionState.status === 'ready' && !isEndingSession && (
                      <div>
                        {audioState.permissionDenied ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
                            <h4 className="text-red-800 font-medium mb-2">Microphone Access Needed</h4>
                            <p className="text-red-700 text-sm mb-4">
                              Please allow microphone access in your browser and refresh the page to continue.
                            </p>
                            <button
                              onClick={() => window.location.reload()}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                            >
                              Refresh Page
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={startConversation}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg transform hover:scale-105"
                          >
                            <span className="mr-2">🎤</span>
                            Start Conversation
                          </button>
                        )}
                      </div>
                    )}
                    
                    {sessionState.status === 'initializing' && (
                      <div className="text-yellow-600">
                        <div className="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Setting up your session...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-3 ${
                          message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                          message.speaker === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-600'
                        }`}>
                          {message.speaker === 'user' ? '👤' : '🎭'}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={`flex-1 max-w-md p-4 rounded-2xl ${
                          message.speaker === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className={`text-xs mb-2 font-medium ${
                            message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.speaker === 'user' ? 'You' : scenario.character_name}
                            {message.emotion && message.speaker === 'ai' && (
                              <span className="ml-2 text-purple-600">({message.emotion})</span>
                            )}
                          </div>
                          <div className="leading-relaxed">
                            {message.message}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Current transcript display */}
                    {audioState.currentTranscript && sessionState.status === 'listening' && (
                      <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          👤
                        </div>
                        <div className="flex-1 max-w-md p-4 rounded-2xl bg-yellow-50 border-2 border-dashed border-yellow-300 text-yellow-800">
                          <div className="text-xs mb-2 font-medium text-yellow-600">
                            You (speaking...)
                          </div>
                          <div className="leading-relaxed">
                            {audioState.currentTranscript}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Thinking Indicator */}
                    {sessionState.status === 'processing' && (
                      <div className="flex items-center space-x-3 justify-center py-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                          🎭
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-purple-600 text-sm ml-2">
                            {scenario.character_name} is thinking...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-specific help */}
        {isMobile && sessionState.status === 'listening' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Mobile Tip:</strong> Speak clearly and hold your device close to your mouth for best results. 
              The microphone icon will pulse while listening.
            </p>
          </div>
        )}

        {/* Session encouragement */}
        {conversation.length >= 8 && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              🎉 Excellent conversation depth! You can continue practicing or end the session for detailed feedback.
            </p>
          </div>
        )}

        {/* AI Guide Indicator */}
        {guideSource === 'ai-generated' && !isGeneratingGuide && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-purple-800 font-medium text-sm">
              ✨ <strong>Enhanced with AI:</strong> Your practice guide was specially created for this scenario with {scenario.character_name}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

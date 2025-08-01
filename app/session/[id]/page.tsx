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
  
  // UI state
  const [error, setError] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Refs
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  
  const router = useRouter();

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
      setError('Failed to initialize session. Please try again.');
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
      setError('Microphone access is required for voice conversations. Please allow microphone access and refresh the page.');
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
    // Comprehensive checks before starting
    if (!sessionState.isActive || !sessionState.sessionId) {
      console.log('🔇 Not starting listening - session not active');
      return;
    }
    
    if (audioState.isSpeaking || audioState.isProcessing) {
      console.log('🔇 Not starting listening - AI is speaking or processing');
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    console.log('🎤 Starting speech recognition...');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition
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
      // Check state during processing
      if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal) {
        console.log('🔇 Ignoring speech - invalid state');
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

      // Update current transcript for display
      setAudioState(prev => ({
        ...prev,
        currentTranscript: interimTranscript
      }));

      // Process final transcript
      if (finalTranscript.trim() && !isProcessingFinal && sessionState.isActive) {
        isProcessingFinal = true;
        clearTimeout(silenceTimerRef.current!);
        processUserSpeech(finalTranscript.trim());
        return;
      }

      // Auto-finalize after silence
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
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}. Please try speaking again.`);
        
        // Retry after error
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
      
      // Auto-restart if session is still active
      if (sessionState.isActive && !audioState.isSpeaking && !isProcessingFinal && !isEndingSession) {
        setTimeout(() => {
          if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
            console.log('🔄 Auto-restarting listening...');
            startListening();
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('❌ Failed to start speech recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
    }
  }, [sessionState.isActive, sessionState.sessionId, audioState.isSpeaking, audioState.isProcessing, isEndingSession]);

  // Process user speech
  const processUserSpeech = async (userMessage: string) => {
    if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive) {
      return;
    }
    
    console.log('💬 Processing user speech:', userMessage);
    
    // Stop listening and update states
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
    
    // Add user message to conversation
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
      // Get AI response
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
      
      // AI speaks
      await speakWithCharacterVoice(aiResponse.response, scenario, aiResponse.emotion);
      
      // Clear processing state
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      // Resume listening after AI finishes
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
          console.log('🔄 Resuming listening after AI response...');
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      setError('Failed to process your message. Please try speaking again.');
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      // Resume listening even after error
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

      console.log('🔊 AI starting to speak - microphone OFF');
      
      setAudioState(prev => ({
        ...prev,
        isSpeaking: true
      }));
      
      setSessionState(prev => ({
        ...prev,
        status: 'ai-speaking'
      }));
      
      // Stop any ongoing speech
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select voice and apply parameters
      const voice = selectCharacterVoice(scenario.character_name);
      if (voice) {
        utterance.voice = voice;
      }
      
      const params = getEmotionalVoiceParams(emotion);
      utterance.rate = params.rate;
      utterance.pitch = params.pitch;
      utterance.volume = params.volume;

      utterance.onstart = () => {
        console.log('🔊 AI speech started');
      };

      utterance.onend = () => {
        console.log('🔊 AI speech completed - microphone can restart');
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
    
    // Find gender-appropriate voice
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

  // Stop speaking
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      console.log('🛑 Stopping speech synthesis');
      speechSynthesisRef.current.cancel();
      setAudioState(prev => ({
        ...prev,
        isSpeaking: false
      }));
    }
  };

  // Force stop all audio
  const forceStopAll = () => {
    console.log('🛑 Force stopping all audio systems');
    stopListening();
    stopSpeaking();
    setAudioState(prev => ({
      ...prev,
      isProcessing: false
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
    
    // Stop all audio
    forceStopAll();
    
    // Clear all timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    
    // Force abort recognition
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
    
    // Immediate cleanup
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
    
    // Store session data and redirect
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
    switch (sessionState.status) {
      case 'initializing':
        return { icon: '⏳', title: 'Initializing...', message: 'Setting up your conversation session', color: 'text-yellow-600' };
      case 'ready':
        return { icon: '🎤', title: 'Ready to Start', message: `Click "Start Talking" to begin your conversation with ${scenario?.character_name}`, color: 'text-blue-600' };
      case 'listening':
        return { icon: '🎤', title: 'Your turn to speak', message: 'Speak clearly into your microphone', color: 'text-green-600' };
      case 'processing':
        return { icon: '🧠', title: 'Processing...', message: 'AI is thinking about how to respond', color: 'text-orange-600' };
      case 'ai-speaking':
        return { icon: '🔊', title: `${scenario?.character_name} is speaking...`, message: 'Listen carefully and prepare your response', color: 'text-purple-600' };
      case 'ended':
        return { icon: '✅', title: 'Session ended', message: 'Thank you for practicing!', color: 'text-gray-600' };
      default:
        return { icon: '⏳', title: 'Loading...', message: 'Please wait', color: 'text-gray-600' };
    }
  };

  // Loading state
  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🎭
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
                <p className="text-sm text-gray-600">
                  Conversation with {scenario.character_name} • {scenario.difficulty} level
                </p>
                {sessionState.sessionId && sessionState.isActive && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Session active</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {sessionState.isActive && (
                <button
                  onClick={forceStopAll}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors text-sm"
                >
                  Stop Audio
                </button>
              )}
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
        </div>
      </header>

      {/* Status Bar */}
      <div className={`${statusInfo.color === 'text-green-600' ? 'bg-green-500' : 
                        statusInfo.color === 'text-orange-600' ? 'bg-orange-500' :
                        statusInfo.color === 'text-purple-600' ? 'bg-purple-500' :
                        statusInfo.color === 'text-blue-600' ? 'bg-blue-500' :
                        statusInfo.color === 'text-yellow-600' ? 'bg-yellow-500' : 'bg-gray-500'
                      } text-white px-6 py-3 text-center font-medium`}>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg">{statusInfo.icon}</span>
          <span>{statusInfo.title}</span>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Status Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-6 text-center shadow-lg border border-white/20">
          <div className={`text-6xl mb-4 ${audioState.isListening ? 'animate-pulse' : ''}`}>
            {statusInfo.icon}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
            {statusInfo.title}
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            {statusInfo.message}
          </p>
          
          {/* Current transcript display */}
          {audioState.currentTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 italic">
                "{audioState.currentTranscript}"
              </p>
              <p className="text-blue-600 text-sm mt-1">Speaking...</p>
            </div>
          )}
          
          {/* Controls */}
          {sessionState.status === 'ready' && !isEndingSession && (
            <div>
              {audioState.permissionDenied && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">Microphone access required</p>
                  <p className="text-red-600 text-sm">Please allow microphone access and refresh the page</p>
                </div>
              )}
              
              {sessionState.sessionId && !audioState.permissionDenied ? (
                <button
                  onClick={startConversation}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg transform hover:scale-105"
                >
                  🎤 Start Voice Conversation
                </button>
              ) : (
                <div className="text-yellow-600">
                  <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Setting up your session...</p>
                </div>
              )}
            </div>
          )}
          
          {isEndingSession && (
            <div className="text-blue-600">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-lg">Ending session and preparing feedback...</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">Audio Error</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setError('')}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Display */}
        {conversation.length > 0 && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Conversation ({conversation.length} messages)
              </h3>
              {conversation.length >= 8 && (
                <div className="flex items-center space-x-2 text-green-600">
                  <span className="text-xl">🎯</span>
                  <span className="font-medium">Great conversation depth!</span>
                </div>
              )}
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 ${
                    message.speaker === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
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
                    <div className={`text-xs mb-1 font-medium ${
                      message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                      {message.emotion && message.speaker === 'ai' && (
                        <span className="ml-2 text-purple-600">({message.emotion})</span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Conversation Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-center space-x-8 text-sm text-gray-600">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{conversation.length}</div>
                  <div>Messages</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {Math.floor((Date.now() - sessionState.startTime) / 60000)}m
                  </div>
                  <div>Duration</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {Math.floor(conversation.length / 2)}
                  </div>
                  <div>Exchanges</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

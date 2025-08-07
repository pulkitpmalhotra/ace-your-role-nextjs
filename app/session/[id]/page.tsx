// app/session/[id]/page.tsx - Fixed with Better Cleanup & Error Handling
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types (keeping existing ones)
interface Scenario {
  id: string;
  title: string;
  description?: string;
  character_name: string;
  character_role: string;
  character_personality?: string;
  difficulty: string;
  role: string;
}

interface ConversationMessage {
  speaker: 'user' | 'ai';
  message: string;
  timestamp: number;
  confidence?: number;
  emotion?: string;
  context?: any;
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
  speechConfidence: number;
}

export default function FixedSessionPage({ params }: { params: { id: string } }) {
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
    permissionDenied: false,
    speechConfidence: 0
  });
  
  // UI state
  const [error, setError] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [aiShouldEnd, setAiShouldEnd] = useState(false);
  
  // Refs for cleanup
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCleaningUpRef = useRef(false);
  
  const router = useRouter();

  // ENHANCED: Force cleanup all audio immediately
  const forceStopAllAudio = useCallback(() => {
    console.log('🛑 FORCE STOPPING ALL AUDIO IMMEDIATELY');
    
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;
    
    // 1. STOP SPEECH RECOGNITION IMMEDIATELY
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    // 2. CANCEL SPEECH SYNTHESIS IMMEDIATELY
    if (speechSynthesisRef.current) {
      try {
        speechSynthesisRef.current.cancel();
      } catch (e) {
        console.log('Speech synthesis already stopped');
      }
    }
    
    // 3. CLEAR CURRENT UTTERANCE
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }
    
    // 4. STOP ALL MEDIA STREAMS
    try {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('🎤 Media track stopped');
          });
        })
        .catch(() => {
          console.log('No active media streams to stop');
        });
    } catch (e) {
      console.log('Could not access media streams');
    }
    
    // 5. CLEAR ALL TIMERS
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    
    // 6. UPDATE AUDIO STATE IMMEDIATELY
    setAudioState({
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      currentTranscript: '',
      hasPermission: false,
      permissionDenied: false,
      speechConfidence: 0
    });
    
    console.log('✅ ALL AUDIO FORCEFULLY STOPPED');
    isCleaningUpRef.current = false;
  }, []);

  // Initialize speech synthesis safely
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize session
  useEffect(() => {
    initializeSession();
    
    // Cleanup function
    return () => {
      console.log('🧹 Component unmounting - force cleanup');
      forceStopAllAudio();
    };
  }, [forceStopAllAudio]);

  // Window beforeunload handler with immediate cleanup
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('🚪 Page unloading - immediate audio cleanup');
      forceStopAllAudio();
      
      if (sessionState.isActive) {
        const message = 'You have an active session. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      forceStopAllAudio();
    };
  }, [sessionState.isActive, forceStopAllAudio]);

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
      
      console.log('🎯 Creating session for scenario:', scenarioData.id);
      
      // Create database session with better error handling
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
      setError('Unable to start session. Please try again or go back to dashboard.');
    }
  };

  // FIXED: Create database session with proper error handling
  const createDatabaseSession = async (scenarioId: string, email: string): Promise<string> => {
    try {
      console.log('📡 Creating session via API...');
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          scenario_id: scenarioId,
          user_email: email
        })
      });

      // FIXED: Better response handling
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Session creation failed:', response.status, errorText);
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Session creation failed');
      }

      return data.data.id;
    } catch (err) {
      console.error('❌ Database session creation failed:', err);
      throw new Error('Failed to create session. Please try again.');
    }
  };

  // Start conversation with better error handling
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
      
      // Generate simple greeting
      const greeting = `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. How can I help you today?`;
      
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
      
      // FIXED: Speak with better error handling
      await speakWithVoice(greeting, scenario, 'professional');
      
      // Start listening after a delay
      setTimeout(() => {
        if (sessionState.isActive && !isEndingSession) {
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setAudioState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      setError('Microphone access is required for voice conversations. Please allow microphone access and refresh the page.');
    }
  };

  // FIXED: Speech synthesis with proper error handling
  const speakWithVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise((resolve) => {
      console.log('🔊 Starting speech synthesis...');
      
      setAudioState(prev => ({
        ...prev,
        isSpeaking: true
      }));

      if (!speechSynthesisRef.current) {
        console.warn('Speech synthesis not available');
        setAudioState(prev => ({ ...prev, isSpeaking: false }));
        resolve();
        return;
      }
      
      // Cancel any existing speech
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;
      
      // Set voice parameters
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      let resolved = false;

      const handleEnd = () => {
        if (!resolved) {
          resolved = true;
          console.log('🔊 Speech synthesis completed');
          setAudioState(prev => ({ ...prev, isSpeaking: false }));
          currentUtteranceRef.current = null;
          resolve();
        }
      };

      const handleError = (error: any) => {
        if (!resolved) {
          resolved = true;
          console.error('🚨 Speech synthesis error:', error);
          setAudioState(prev => ({ ...prev, isSpeaking: false }));
          currentUtteranceRef.current = null;
          resolve(); // Still resolve to continue flow
        }
      };

      utterance.onend = handleEnd;
      utterance.onerror = handleError;

      // Safety timeout
      setTimeout(() => {
        if (!resolved) {
          console.warn('🕐 Speech synthesis timeout');
          handleEnd();
        }
      }, 10000);

      try {
        speechSynthesisRef.current.speak(utterance);
      } catch (error) {
        console.error('❌ Speech synthesis failed:', error);
        handleError(error);
      }
    });
  };

  // Start listening function
  const startListening = useCallback(() => {
    if (!sessionState.isActive || !sessionState.sessionId || audioState.isSpeaking || audioState.isProcessing || isEndingSession) {
      console.log('🚫 Cannot start listening - conditions not met');
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice recognition requires Chrome browser. Please switch to Chrome.');
      return;
    }

    console.log('🎤 Starting speech recognition...');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognitionRef.current = recognition;
    
    setAudioState(prev => ({
      ...prev,
      isListening: true,
      currentTranscript: ''
    }));

    let finalTranscript = '';
    let isProcessingFinal = false;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
    };

    recognition.onresult = async (event: any) => {
      if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal || isEndingSession) {
        return;
      }

      let interimTranscript = '';
      let confidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence = result[0].confidence;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      setAudioState(prev => ({
        ...prev,
        currentTranscript: interimTranscript,
        speechConfidence: confidence
      }));

      if (finalTranscript.trim() && !isProcessingFinal && sessionState.isActive && !isEndingSession) {
        isProcessingFinal = true;
        clearTimeout(silenceTimerRef.current!);
        processUserSpeech(finalTranscript.trim(), confidence);
        return;
      }

      if (interimTranscript.trim().length > 2 && sessionState.isActive && !isEndingSession) {
        clearTimeout(silenceTimerRef.current!);
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim() && !isProcessingFinal && sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
            isProcessingFinal = true;
            console.log('⏰ Auto-finalizing after silence');
            processUserSpeech(interimTranscript.trim(), confidence);
          }
        }, 3000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error);
      setAudioState(prev => ({ ...prev, isListening: false }));
      
      if (event.error === 'not-allowed') {
        setAudioState(prev => ({ ...prev, permissionDenied: true }));
        setError('Microphone access denied. Please allow microphone access and refresh.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(() => {
          if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
            startListening();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      setAudioState(prev => ({ ...prev, isListening: false }));
      
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
  const processUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive || isEndingSession) {
      return;
    }
    
    console.log('💬 Processing user speech:', userMessage);
    
    stopListening();
    
    setAudioState(prev => ({
      ...prev,
      isProcessing: true,
      currentTranscript: ''
    }));
    
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now(),
      confidence: confidence
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    await saveConversationToDatabase(updatedConversation);

    try {
      if (!sessionState.isActive || isEndingSession) return;
      
      // FIXED: Get AI response with better API handling
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
      
      // Check for natural ending
      if (aiResponse.shouldEndConversation && !aiShouldEnd) {
        console.log('🎯 AI suggests natural ending');
        setAiShouldEnd(true);
        setTimeout(() => {
          if (sessionState.isActive && !isEndingSession) {
            setError('The conversation has reached a natural conclusion. Click "End Session" to get feedback.');
          }
        }, 2000);
      }
      
      if (!sessionState.isActive || isEndingSession) return;
      
      // Speak response
      await speakWithVoice(aiResponse.response, scenario, aiResponse.emotion || 'professional');
      
      setAudioState(prev => ({ ...prev, isProcessing: false }));
      
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      
      if (sessionState.isActive && !isEndingSession) {
        setError('Having trouble processing your message. Please try again.');
        setAudioState(prev => ({ ...prev, isProcessing: false }));
        
        setTimeout(() => {
          if (sessionState.isActive && !isEndingSession) {
            startListening();
          }
        }, 3000);
      }
    }
  };

  // FIXED: Get AI response with better error handling
  const getAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    try {
      console.log('🤖 Getting AI response...');

      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          scenario,
          userMessage,
          conversationHistory,
          sessionState: {
            duration: Math.floor((Date.now() - sessionState.startTime) / 1000),
            exchanges: Math.floor(conversationHistory.length / 2)
          },
          sessionId: sessionState.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI response failed');
      }
      
      return {
        response: data.data.response,
        emotion: data.data.emotion || 'professional',
        shouldEndConversation: data.data.shouldEndConversation || false
      };
    } catch (error) {
      console.error('❌ Error getting AI response:', error);
      
      // Enhanced fallback
      const exchanges = Math.floor(conversationHistory.length / 2);
      const shouldSuggestEnding = exchanges >= 6;
      
      if (shouldSuggestEnding && !aiShouldEnd) {
        setAiShouldEnd(true);
      }
      
      return {
        response: shouldSuggestEnding 
          ? `Thank you for this great discussion. I feel we've covered the key points well. This has been very helpful.`
          : `That's interesting. Could you tell me more about that?`,
        emotion: shouldSuggestEnding ? 'satisfied' : 'curious',
        shouldEndConversation: shouldSuggestEnding
      };
    }
  };

  // Save conversation to database
  const saveConversationToDatabase = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionState.sessionId) return;
    
    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
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
    console.log('🛑 Stopping speech recognition...');
    
    if (recognitionRef.current) {
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

  // ENHANCED: End session with immediate cleanup
  const endSession = async () => {
    if (isEndingSession) return;
    
    console.log('🛑 ENDING SESSION - IMMEDIATE CLEANUP');
    setIsEndingSession(true);
    
    // IMMEDIATELY force stop all audio
    forceStopAllAudio();
    
    // IMMEDIATELY disable session
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      status: 'ended'
    }));
    
    console.log('✅ Audio stopped, saving session...');
    
    // Save session data
    if (sessionState.sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - sessionState.startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        let score = 2.0;
        score += (exchanges >= 2 ? 0.5 : 0);
        score += (exchanges >= 4 ? 0.5 : 0);
        score += (exchanges >= 6 ? 0.5 : 0);
        score += (exchanges >= 8 ? 0.5 : 0);
        score += (duration >= 3 ? 0.5 : 0);
        score += (aiShouldEnd ? 0.5 : 0);
        score = Math.min(5.0, score);
        
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionState.sessionId,
            session_status: 'completed',
            duration_minutes: duration,
            overall_score: score,
            conversation_metadata: {
              natural_ending: aiShouldEnd,
              session_quality: exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : 'basic'
            }
          })
        });

      } catch (err) {
        console.error('❌ Error saving session data:', err);
      }
    }
    
    // Prepare session data for feedback
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - sessionState.startTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail,
      sessionId: sessionState.sessionId,
      sessionContext: {
        startTime: sessionState.startTime,
        naturalEnding: aiShouldEnd,
        sessionQuality: conversation.length >= 12 ? 'excellent' : conversation.length >= 8 ? 'good' : 'basic'
      }
    };
    
    console.log('📊 Session data prepared for feedback');
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    
    // Navigate to feedback page
    router.push('/feedback');
  };

  // Get status info
  const getStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
    
    switch (sessionState.status) {
      case 'initializing':
        return { 
          icon: '⏳', 
          title: 'Initializing Session...', 
          message: 'Setting up your practice session', 
          color: 'bg-yellow-500'
        };
      case 'ready':
        return { 
          icon: '🎯', 
          title: 'Session Ready!', 
          message: `Ready to practice with ${scenario?.character_name}`, 
          color: 'bg-blue-500'
        };
      case 'listening':
        return { 
          icon: '🎤', 
          title: aiShouldEnd ? 'Natural Conclusion Available' : 'Listening...', 
          message: aiShouldEnd 
            ? 'Conversation completed - ready for feedback' 
            : `Having conversation with ${scenario?.character_name}`, 
          color: aiShouldEnd ? 'bg-green-600' : 'bg-green-500'
        };
      case 'processing':
        return { 
          icon: '🤖', 
          title: 'AI Processing...', 
          message: `${scenario?.character_name} is thinking...`, 
          color: 'bg-orange-500'
        };
      case 'ai-speaking':
        return { 
          icon: '🔊', 
          title: `${scenario?.character_name} Speaking`, 
          message: 'AI is responding to your message', 
          color: 'bg-purple-500'
        };
      case 'ended':
        return { 
          icon: '✅', 
          title: 'Session Complete', 
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Session</h2>
          <p className="text-gray-600">Setting up your practice session...</p>
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">Session Error</h2>
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
              Retry Session
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🎯
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
                <p className="text-sm text-gray-600">
                  {scenario.character_name} • {scenario.difficulty} level
                </p>
              </div>
            </div>
            
            <button
              onClick={endSession}
              disabled={isEndingSession}
              className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                isEndingSession 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : aiShouldEnd
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg animate-pulse'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg'
              }`}
            >
              {isEndingSession ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Ending Session...
                </>
              ) : aiShouldEnd ? (
                <>🎉 Get Feedback</>
              ) : (
                <>🛑 End Session</>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      <div className={`${statusInfo.color} text-white px-6 py-4`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{statusInfo.icon}</span>
              <div>
                <div className="font-semibold text-lg">{statusInfo.title}</div>
                <div className="text-sm opacity-90">{statusInfo.message}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold">{Math.floor(conversation.length / 2)}</div>
                <div className="opacity-75">Exchanges</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{Math.floor((Date.now() - sessionState.startTime) / 60000)}m</div>
                <div className="opacity-75">Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Main Conversation Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
          <div className="p-6">
            
            {conversation.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Practice!
                </h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  You're about to practice with <strong>{scenario.character_name}</strong>, 
                  a {scenario.character_role}. This is a {scenario.difficulty} level scenario.
                </p>
                
                {sessionState.status === 'ready' && !isEndingSession && (
                  <div>
                    {audioState.permissionDenied ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
                        <h4 className="text-red-800 font-medium mb-2">Microphone Required</h4>
                        <p className="text-red-700 text-sm mb-4">
                          Voice conversations require microphone access.
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                        >
                          Refresh & Enable
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={startConversation}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                      >
                        🎤 Start Conversation
                      </button>
                    )}
                  </div>
                )}
                
                {sessionState.status === 'initializing' && (
                  <div className="text-blue-600">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
                      {message.speaker === 'user' ? '👤' : '🤖'}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className={`flex-1 max-w-md p-4 rounded-2xl ${
                      message.speaker === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900 border border-gray-200'
                    }`}>
                      <div className={`text-xs mb-2 font-medium ${
                        message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span>
                          {message.speaker === 'user' ? 'You' : scenario.character_name}
                          {message.emotion && message.speaker === 'ai' && (
                            <span className="ml-2 text-purple-600">({message.emotion})</span>
                          )}
                        </span>
                        {message.confidence && message.speaker === 'user' && (
                          <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded-full">
                            {Math.round(message.confidence * 100)}%
                          </span>
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
                      <div className="text-xs mb-2 font-medium text-yellow-600 flex items-center justify-between">
                        <span>You (speaking...)</span>
                        <span className="bg-yellow-200 px-2 py-1 rounded-full text-xs">
                          {Math.round(audioState.speechConfidence * 100)}%
                        </span>
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
                      🤖
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

        {/* Natural Ending Detection */}
        {aiShouldEnd && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Perfect! Natural Conversation Conclusion Reached
            </h3>
            <p className="text-green-700 mb-4">
              Your conversation with {scenario.character_name} has reached a natural, professional conclusion. 
              This is ideal for getting comprehensive feedback on your {Math.floor(conversation.length / 2)}-exchange conversation!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={endSession}
                disabled={isEndingSession}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
              >
                🎉 Get Complete Feedback
              </button>
              <button
                onClick={() => setAiShouldEnd(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Continue Conversation
              </button>
            </div>
          </div>
        )}

        {/* Encouragement for good sessions */}
        {conversation.length >= 8 && !aiShouldEnd && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-purple-800 font-medium">
              🌟 Excellent conversation depth! You've had {Math.floor(conversation.length / 2)} exchanges 
              - perfect for comprehensive feedback.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

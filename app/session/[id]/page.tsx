'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  recognition: any;
  synthesis: SpeechSynthesis | null;
}

export default function EnhancedSessionPage({ params }: { params: { id: string } }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionStartTime] = useState(Date.now());
  
  // Enhanced voice states
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentTranscript: '',
    recognition: null,
    synthesis: typeof window !== 'undefined' ? window.speechSynthesis : null
  });
  
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [audioPermission, setAudioPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const router = useRouter();
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize component
  useEffect(() => {
    initializeSession();
    checkBrowserSupport();
    loadVoices();
    
    return () => {
      cleanup();
    };
  }, []);

  // Load user and scenario data
  const initializeSession = async () => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      console.log('❌ No user email found, redirecting to login');
      router.push('/');
      return;
    }
    setUserEmail(email);

    const storedScenario = localStorage.getItem('currentScenario');
    if (storedScenario) {
      const scenarioData = JSON.parse(storedScenario);
      setScenario(scenarioData);
      console.log('🎭 Scenario loaded:', scenarioData.title);
    } else {
      console.log('❌ No scenario found, redirecting to dashboard');
      router.push('/dashboard');
    }
  };

  // Check browser support for speech APIs
  const checkBrowserSupport = () => {
    const hasRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSynthesis = 'speechSynthesis' in window;
    
    console.log('🔊 Browser support check:', {
      recognition: hasRecognition,
      synthesis: hasSynthesis,
      userAgent: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'
    });

    if (!hasRecognition) {
      setError('Speech recognition not supported. Please use Chrome browser for the best experience.');
    }
  };

  // Load available voices
  const loadVoices = () => {
    if (!voiceState.synthesis) return;
    
    const updateVoices = () => {
      const voices = voiceState.synthesis!.getVoices();
      setAvailableVoices(voices);
      console.log('🔊 Voices loaded:', voices.length);
    };

    updateVoices();
    if (voiceState.synthesis.onvoiceschanged !== undefined) {
      voiceState.synthesis.onvoiceschanged = updateVoices;
    }
  };

  // Create database session when ready
  useEffect(() => {
    if (scenario && userEmail && !sessionId) {
      createDatabaseSession();
    }
  }, [scenario, userEmail]);

  // Request microphone permission and create session
  const startConversation = async () => {
    if (!scenario || !sessionId) {
      setError('Session not ready. Please wait or refresh the page.');
      return;
    }

    try {
      console.log('🎤 Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission('granted');
      
      setSessionActive(true);
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
        startAdvancedListening();
      }, 1000);
      
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setAudioPermission('denied');
      setError('Microphone access is required for voice conversations. Please allow microphone access and refresh the page.');
    }
  };

  // Generate character-appropriate greeting
  const getCharacterGreeting = (scenario: Scenario): string => {
    const greetings: Record<string, string[]> = {
      'sales': [
        `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss our ${scenario.category} needs?`,
        `Hello! ${scenario.character_name} here. I have about 15 minutes to chat about what you're offering.`,
        `Good morning! I'm ${scenario.character_name}. I've been looking at solutions like yours - what makes yours different?`
      ],
      'healthcare': [
        `Hello, I'm ${scenario.character_name}. Thank you for seeing me today. I've been having some concerns...`,
        `Hi Doctor, I'm ${scenario.character_name}. I scheduled this appointment because I wanted to discuss my health.`,
        `Good afternoon! I'm ${scenario.character_name}. I have some questions about my treatment options.`
      ],
      'support': [
        `Hi, this is ${scenario.character_name}. I'm calling because I'm having issues with your service.`,
        `Hello, ${scenario.character_name} here. I need help with my account - I've been trying to resolve this for days.`,
        `Hi there! I'm ${scenario.character_name}. I'm frustrated because your product isn't working as promised.`
      ],
      'leadership': [
        `Good morning! I'm ${scenario.character_name}. I wanted to discuss my recent projects and get your feedback.`,
        `Hi, ${scenario.character_name} here. I understand you wanted to have a conversation about my performance?`,
        `Hello! I'm ${scenario.character_name}. I've been with the company for a while and wanted to discuss my role.`
      ],
      'legal': [
        `Hello, I'm ${scenario.character_name}. Thank you for meeting with me. I need some legal advice about my situation.`,
        `Good afternoon! ${scenario.character_name} here. I'm facing some legal challenges and need professional guidance.`,
        `Hi, I'm ${scenario.character_name}. I scheduled this consultation because I have some complex legal questions.`
      ]
    };
    
    const categoryGreetings = greetings[scenario.category] || greetings['sales'];
    return categoryGreetings[Math.floor(Math.random() * categoryGreetings.length)];
  };

  // Advanced speech recognition with better configuration
  const startAdvancedListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    if (voiceState.isSpeaking || voiceState.isProcessing) {
      console.log('🔇 Skipping listening - AI is speaking or processing');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    
    recognitionRef.current = recognition;
    
    setVoiceState(prev => ({
      ...prev,
      isListening: true,
      currentTranscript: '',
      recognition
    }));

    let finalTranscript = '';
    let isProcessingFinal = false;

    recognition.onstart = () => {
      console.log('🎤 Advanced listening started');
      setError('');
    };

    recognition.onresult = (event: any) => {
      if (voiceState.isSpeaking || isProcessingFinal) {
        console.log('🔇 Ignoring speech - AI is speaking or processing');
        return;
      }

      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        if (result.isFinal) {
          finalTranscript += transcript;
          console.log('✅ Final transcript:', transcript, 'Confidence:', confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      // Update current transcript for real-time display
      setVoiceState(prev => ({
        ...prev,
        currentTranscript: interimTranscript
      }));

      // Process final results
      if (finalTranscript.trim() && !isProcessingFinal) {
        isProcessingFinal = true;
        clearTimeout(silenceTimerRef.current!);
        processUserSpeech(finalTranscript.trim());
      } else if (interimTranscript.trim().length > 2) {
        // Auto-finalize after silence
        clearTimeout(silenceTimerRef.current!);
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim() && !isProcessingFinal && !voiceState.isSpeaking) {
            isProcessingFinal = true;
            console.log('⏰ Auto-finalizing speech after silence');
            processUserSpeech(interimTranscript.trim());
          }
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Speech recognition error:', event.error);
      
      setVoiceState(prev => ({
        ...prev,
        isListening: false
      }));
      
      if (event.error === 'not-allowed') {
        setAudioPermission('denied');
        setError('Microphone access denied. Please allow microphone access and refresh the page.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}. Please try speaking again.`);
      }
    };

    recognition.onend = () => {
      console.log('🏁 Speech recognition ended');
      setVoiceState(prev => ({
        ...prev,
        isListening: false
      }));
      
      // Restart listening if session is still active and AI isn't speaking
      if (sessionActive && !voiceState.isSpeaking && !isProcessingFinal) {
        setTimeout(() => {
          if (sessionActive && !voiceState.isSpeaking) {
            startAdvancedListening();
          }
        }, 1000);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
    }
  };

  // Process user speech with enhanced AI integration
  const processUserSpeech = async (userMessage: string) => {
    if (!userMessage || !scenario || !sessionId) return;
    
    console.log('💬 Processing user speech:', userMessage);
    
    // Stop listening and update states
    stopListening();
    setVoiceState(prev => ({
      ...prev,
      isProcessing: true,
      currentTranscript: ''
    }));
    
    // Add user message to conversation
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now(),
      confidence: 0.95 // We could get this from speech recognition
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    await saveConversationToDatabase(updatedConversation);

    try {
      // Get enhanced AI response
      const aiResponse = await getEnhancedAIResponse(scenario, userMessage, updatedConversation);
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now(),
        emotion: aiResponse.emotion || 'professional'
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await saveConversationToDatabase(finalConversation);
      
      // AI speaks with character voice
      await speakWithCharacterVoice(aiResponse.response, scenario, aiResponse.emotion);
      
      // Resume listening after AI finishes
      setTimeout(() => {
        if (sessionActive) {
          startAdvancedListening();
        }
      }, 1000);
      
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      setError('Failed to process your message. Please try speaking again.');
      
      // Resume listening even after error
      setTimeout(() => {
        if (sessionActive) {
          startAdvancedListening();
        }
      }, 2000);
    } finally {
      setVoiceState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

  // Enhanced AI response with better prompting
  const getEnhancedAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        userMessage,
        conversationHistory,
        messageCount: Math.floor(conversationHistory.length / 2),
        enhancedMode: true // Flag for better prompting
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

  // Character-specific text-to-speech
  const speakWithCharacterVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise((resolve) => {
      if (!voiceState.synthesis) {
        console.warn('Speech synthesis not available');
        resolve();
        return;
      }

      setVoiceState(prev => ({
        ...prev,
        isSpeaking: true
      }));
      
      // Stop any ongoing speech
      voiceState.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select character-appropriate voice
      const selectedVoice = selectCharacterVoice(scenario.character_name, availableVoices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Apply emotional parameters
      const voiceParams = getEmotionalVoiceParams(emotion);
      utterance.rate = voiceParams.rate;
      utterance.pitch = voiceParams.pitch;
      utterance.volume = voiceParams.volume;
      
      console.log('🔊 Speaking with character voice:', {
        character: scenario.character_name,
        emotion,
        voice: selectedVoice?.name || 'default',
        params: voiceParams
      });

      utterance.onstart = () => {
        console.log('🔊 Character speech started');
      };

      utterance.onend = () => {
        console.log('🔊 Character speech completed');
        setVoiceState(prev => ({
          ...prev,
          isSpeaking: false
        }));
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event);
        setVoiceState(prev => ({
          ...prev,
          isSpeaking: false
        }));
        resolve();
      };

      voiceState.synthesis.speak(utterance);
    });
  };

  // Smart voice selection based on character
  const selectCharacterVoice = (characterName: string, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;
    
    const firstName = characterName.toLowerCase().split(' ')[0];
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
    
    // Gender detection
    const femaleNames = ['sarah', 'jennifer', 'lisa', 'maria', 'emily', 'susan', 'karen', 'nancy'];
    const isFemale = femaleNames.includes(firstName);
    
    // Find appropriate voice
    let selectedVoice = null;
    
    if (isFemale) {
      selectedVoice = englishVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('woman') ||
        ['karen', 'susan', 'samantha', 'victoria', 'zira'].some(name => 
          voice.name.toLowerCase().includes(name)
        )
      );
    } else {
      selectedVoice = englishVoices.find(voice => 
        voice.name.toLowerCase().includes('male') || 
        voice.name.toLowerCase().includes('man') ||
        ['david', 'mark', 'james', 'george'].some(name => 
          voice.name.toLowerCase().includes(name)
        )
      );
    }
    
    // Fallback to best available English voice
    return selectedVoice || englishVoices.find(voice => voice.default) || englishVoices[0] || null;
  };

  // Emotional voice parameters
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

  // Database operations
  const createDatabaseSession = async () => {
    try {
      console.log('💾 Creating database session...');
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: scenario?.id,
          user_email: userEmail
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSessionId(data.data.id);
        console.log('✅ Database session created:', data.data.id);
      } else if (data.error?.includes('User not found')) {
        await createUserAndRetrySession();
      } else {
        setError('Failed to start session. Please try again.');
      }
    } catch (err) {
      console.error('❌ Error creating session:', err);
      setError('Connection error. Please try again.');
    }
  };

  const createUserAndRetrySession = async () => {
    try {
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userEmail.split('@')[0]
        })
      });

      if (userResponse.ok) {
        await createDatabaseSession();
      } else {
        setError('Failed to create account. Please refresh and try again.');
      }
    } catch (err) {
      setError('Connection error. Please refresh and try again.');
    }
  };

  const saveConversationToDatabase = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionId) return;
    
    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          conversation: updatedConversation
        })
      });
    } catch (err) {
      console.error('❌ Error saving conversation:', err);
    }
  };

  // Control functions
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setVoiceState(prev => ({
      ...prev,
      isListening: false,
      currentTranscript: ''
    }));
  };

  const stopSpeaking = () => {
    if (voiceState.synthesis) {
      voiceState.synthesis.cancel();
      setVoiceState(prev => ({
        ...prev,
        isSpeaking: false
      }));
    }
  };

  const forceStopAll = () => {
    stopListening();
    stopSpeaking();
    setVoiceState(prev => ({
      ...prev,
      isProcessing: false
    }));
  };

  const cleanup = () => {
    forceStopAll();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  // End session
  const endSession = async () => {
    if (isEndingSession) return;
    
    setIsEndingSession(true);
    setSessionActive(false);
    cleanup();
    
    if (sessionId && conversation.length > 0) {
      const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        let score = 2.0 + (exchanges >= 2 ? 0.5 : 0) + (exchanges >= 4 ? 0.5 : 0) + (exchanges >= 6 ? 0.5 : 0) + (duration >= 3 ? 0.5 : 0);
        score = Math.min(5.0, score);
        
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            session_status: 'completed',
            duration_minutes: duration,
            overall_score: score
          })
        });
      } catch (err) {
        console.error('❌ Error ending session:', err);
      }
    }
    
    // Store session data and redirect to feedback
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - sessionStartTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail,
      sessionId
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // Render functions
  const getStatusInfo = () => {
    if (!sessionActive) {
      return {
        icon: '🎤',
        title: 'Ready to Start',
        message: `Click "Start Talking" to begin your conversation with ${scenario?.character_name}`,
        color: 'text-blue-600'
      };
    }
    
    if (voiceState.isSpeaking) {
      return {
        icon: '🔊',
        title: `${scenario?.character_name} is speaking...`,
        message: 'Listen carefully and prepare your response',
        color: 'text-purple-600'
      };
    }
    
    if (voiceState.isProcessing) {
      return {
        icon: '🧠',
        title: 'Processing your message...',
        message: 'AI is thinking about how to respond',
        color: 'text-orange-600'
      };
    }
    
    if (voiceState.isListening) {
      return {
        icon: '🎤',
        title: 'Your turn to speak',
        message: 'Speak clearly into your microphone',
        color: 'text-green-600'
      };
    }
    
    return {
      icon: '⏳',
      title: 'Preparing...',
      message: 'Getting ready for next interaction',
      color: 'text-gray-600'
    };
  };

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
                {sessionId && (
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Session active</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {sessionActive && (
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

      <main className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Status Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-6 text-center shadow-lg border border-white/20">
          <div className={`text-6xl mb-4 ${voiceState.isListening ? 'animate-pulse' : ''}`}>
            {statusInfo.icon}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${statusInfo.color}`}>
            {statusInfo.title}
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            {statusInfo.message}
          </p>
          
          {/* Current transcript display */}
          {voiceState.currentTranscript && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 italic">
                "{voiceState.currentTranscript}"
              </p>
              <p className="text-blue-600 text-sm mt-1">Speaking...</p>
            </div>
          )}
          
          {/* Permission and controls */}
          {!sessionActive && !isEndingSession && (
            <div>
              {audioPermission === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 font-medium">Microphone access required</p>
                  <p className="text-red-600 text-sm">Please allow microphone access and refresh the page</p>
                </div>
              )}
              
              {sessionId && audioPermission !== 'denied' ? (
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
                    {Math.floor((Date.now() - sessionStartTime) / 60000)}m
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

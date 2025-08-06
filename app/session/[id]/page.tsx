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

interface AIGuide {
  goal: string;
  objectives: string[];
  tips: string[];
  insights: string[];
}

interface ConversationProgress {
  objectivesProgress: number;
  conversationDepth: number;
  naturalEndingAvailable: boolean;
  stagesCompleted: string[];
  aiContextActive: boolean;
}

export default function EnhancedSessionPage({ params }: { params: { id: string } }) {
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
  
  // Enhanced features state
  const [aiGuide, setAiGuide] = useState<AIGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideSource, setGuideSource] = useState<'ai-generated' | 'fallback' | null>(null);
  
  // NEW: Enhanced contextual state
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [conversationObjectives, setConversationObjectives] = useState<string[]>([]);
  const [aiShouldEnd, setAiShouldEnd] = useState<boolean>(false);
  const [conversationProgress, setConversationProgress] = useState<ConversationProgress>({
    objectivesProgress: 0,
    conversationDepth: 0,
    naturalEndingAvailable: false,
    stagesCompleted: [],
    aiContextActive: false
  });
  
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

  // Initialize session
  useEffect(() => {
    initializeEnhancedSession();
    
    // Cleanup function for component unmount
    return () => {
      console.log('🧹 Component unmounting - cleaning up enhanced session');
      cleanup();
    };
  }, [router]);

  // Window beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (sessionState.isActive) {
        forceStopMicrophone();
        if (speechSynthesisRef.current) {
          speechSynthesisRef.current.cancel();
        }
        
        const message = 'You have an active practice session. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sessionState.isActive]);

  // Generate AI guide when scenario is loaded
  useEffect(() => {
    if (scenario && !aiGuide && !isGeneratingGuide) {
      generateAIGuide(scenario);
    }
  }, [scenario]);

  // Initialize speech synthesis
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

  // Enhanced conversation progress tracking
  useEffect(() => {
    if (conversation.length > 0) {
      updateConversationProgress();
    }
  }, [conversation, aiShouldEnd]);

  // ENHANCED: Force stop microphone function
  const forceStopMicrophone = () => {
    console.log('🎤 FORCE STOPPING microphone...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Recognition already stopped');
      }
      recognitionRef.current = null;
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    try {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(e => console.log('Could not stop media stream'));
    } catch (e) {
      console.log('Could not access media stream');
    }
    
    console.log('✅ Microphone FORCE STOPPED');
  };

  // Clear all timers function
  const clearAllTimers = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
  };

  // ENHANCED: Generate AI guide with contextual awareness
  const generateAIGuide = async (scenarioData: Scenario) => {
    setIsGeneratingGuide(true);
    console.log('🧠 Generating contextual AI guide for:', scenarioData.title);
    
    try {
      const response = await fetch('/api/generate-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario: scenarioData,
          contextualMode: true // Enable enhanced guide generation
        })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        setAiGuide(result.data);
        setGuideSource(result.source);
        console.log('✅ Contextual AI guide generated:', result.source);
      } else {
        console.error('❌ Failed to generate contextual guide');
        setGuideSource('fallback');
      }
    } catch (error) {
      console.error('❌ Error generating contextual guide:', error);
      setGuideSource('fallback');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // ENHANCED: Initialize session with contextual data
  const initializeEnhancedSession = async () => {
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
      
      // ENHANCED: Set session start time and objectives
      const startTime = Date.now();
      setSessionStartTime(startTime);
      
      // Load scenario objectives for contextual tracking
      const objectives = getScenarioObjectives(scenarioData.role);
      setConversationObjectives(objectives);
      
      console.log('🎯 Enhanced session objectives loaded:', objectives);
      
      // Create database session
      const sessionId = await createDatabaseSession(scenarioData.id, email);
      
      setSessionState(prev => ({
        ...prev,
        sessionId,
        status: 'ready',
        isActive: true,
        startTime
      }));
      
      // Initialize progress tracking
      setConversationProgress(prev => ({
        ...prev,
        aiContextActive: true,
        stagesCompleted: []
      }));
      
      console.log('✅ Enhanced contextual session initialized:', {
        sessionId,
        objectives: objectives.length,
        startTime: new Date(startTime).toISOString()
      });
      
    } catch (err) {
      console.error('❌ Enhanced session initialization failed:', err);
      setError('Unable to start your enhanced practice session. Please check your internet connection and try again.');
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

  // ENHANCED: Start conversation with contextual setup
  const startConversation = async () => {
    if (!scenario || !sessionState.sessionId) {
      setError('Enhanced session not ready. Please wait or refresh the page.');
      return;
    }

    try {
      console.log('🎤 Requesting microphone permission for contextual conversation...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setAudioState(prev => ({
        ...prev,
        hasPermission: true,
        permissionDenied: false
      }));
      
      setError('');
      
      // ENHANCED: Generate contextual greeting with objectives awareness
      const greeting = await generateContextualGreeting(scenario);
      const aiMessage: ConversationMessage = {
        speaker: 'ai',
        message: greeting.content,
        timestamp: Date.now(),
        emotion: greeting.emotion,
        context: { 
          greeting: true, 
          character: scenario.character_name,
          objectives: conversationObjectives
        }
      };
      
      const initialConversation = [aiMessage];
      setConversation(initialConversation);
      
      // Save to database
      await saveConversationToDatabase(initialConversation);
      
      // Speak greeting
      await speakWithVoice(greeting.content, scenario, greeting.emotion);
      
      // Start listening
      setTimeout(() => {
        if (sessionState.isActive && !isEndingSession) {
          startListening();
        }
      }, 1000);
      
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setAudioState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      setError('We need microphone access for enhanced voice conversations. Please allow microphone access in your browser settings and refresh the page.');
    }
  };

  // ENHANCED: Generate contextual greeting
  const generateContextualGreeting = async (scenario: Scenario) => {
    const userRole = getUserRole(scenario.role);
    const greetings: Record<string, string[]> = {
      'sales': [
        `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss our business needs and how your solution might help us?`,
        `Hello! ${scenario.character_name} here. I have about 15 minutes to chat about what you're offering. What makes your approach different?`,
        `Good morning! I'm ${scenario.character_name}. I've been looking at solutions like yours - I'm curious to hear your perspective.`
      ],
      'project-manager': [
        `Hi, I'm ${scenario.character_name}. I wanted to discuss the project timeline and requirements with you today.`,
        `Good morning! ${scenario.character_name} here. Let's talk about resource allocation and project priorities for this initiative.`,
        `Hello! I'm ${scenario.character_name}. I need to understand the scope and deliverables for this project we're planning.`
      ],
      'product-manager': [
        `Hi, I'm ${scenario.character_name}. I'd like to review the product roadmap and feature priorities with you.`,
        `Good afternoon! ${scenario.character_name} here. Let's discuss user requirements and product strategy for this quarter.`,
        `Hello! I'm ${scenario.character_name}. I want to understand how this feature aligns with our product vision and user needs.`
      ],
      'leader': [
        `Good morning! I'm ${scenario.character_name}. I wanted to discuss our strategic direction and vision for the team.`,
        `Hi, ${scenario.character_name} here. Let's talk about how this initiative supports our organizational goals and priorities.`,
        `Hello! I'm ${scenario.character_name}. I need to understand the strategic impact and long-term implications of this proposal.`
      ],
      'manager': [
        `Good morning! I'm ${scenario.character_name}. I wanted to discuss your recent performance and development opportunities.`,
        `Hi, ${scenario.character_name} here. Let's have our regular check-in about your projects, goals, and how I can support you.`,
        `Hello! I'm ${scenario.character_name}. I'd like to provide some feedback and discuss your career growth and development path.`
      ],
      'strategy-lead': [
        `Hi, I'm ${scenario.character_name}. I wanted to review our market analysis and strategic initiatives with you today.`,
        `Good morning! ${scenario.character_name} here. Let's discuss the competitive landscape and our positioning in the market.`,
        `Hello! I'm ${scenario.character_name}. I need to understand how this fits into our strategic roadmap and objectives.`
      ],
      'support-agent': [
        `Hi, this is ${scenario.character_name}. I'm calling because I'm having issues with your service and need some assistance.`,
        `Hello, ${scenario.character_name} here. I need help with my account - I've been trying to resolve this for several days now.`,
        `Good afternoon! I'm ${scenario.character_name}. Your system isn't working properly and I really need this resolved today.`
      ],
      'data-analyst': [
        `Hi, I'm ${scenario.character_name}. I wanted to discuss the data analysis requirements for this important project.`,
        `Good morning! ${scenario.character_name} here. Let's review the metrics and insights from our recent analysis and next steps.`,
        `Hello! I'm ${scenario.character_name}. I need to understand what data questions we're trying to answer and the approach.`
      ],
      'engineer': [
        `Hi, I'm ${scenario.character_name}. I wanted to discuss the technical requirements and architecture for this project.`,
        `Good morning! ${scenario.character_name} here. Let's review the system design and implementation approach we're considering.`,
        `Hello! I'm ${scenario.character_name}. I have some questions about the technical specifications and feasibility.`
      ],
      'nurse': [
        `Hello, I'm ${scenario.character_name}. I wanted to discuss the patient care plan and coordination with you today.`,
        `Good morning! I'm ${scenario.character_name}. Let's review the patient's progress and next steps in their care.`,
        `Hi, ${scenario.character_name} here. I need to update you on the patient's condition and care requirements.`
      ],
      'doctor': [
        `Hello, I'm ${scenario.character_name}. Thank you for seeing me today. I've been having some health concerns I'd like to discuss.`,
        `Good morning! I'm ${scenario.character_name}. I scheduled this appointment to discuss my symptoms and possible treatment options.`,
        `Hi, I'm ${scenario.character_name}. I wanted to get your professional opinion on my diagnosis and treatment plan.`
      ]
    };
    
    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    const selectedGreeting = roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
    
    return {
      content: selectedGreeting,
      emotion: 'professional',
      context: { 
        greeting: true, 
        character: scenario.character_name,
        objectives: conversationObjectives,
        userRole: userRole
      }
    };
  };

  // ENHANCED: Speech recognition with contextual awareness
  const startListening = useCallback(() => {
    if (!sessionState.isActive || !sessionState.sessionId || audioState.isSpeaking || audioState.isProcessing || isEndingSession) {
      console.log('🚫 Cannot start listening - session inactive or ending');
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice recognition requires Chrome browser. Please switch to Chrome for the enhanced experience.');
      return;
    }

    console.log('🎤 Starting enhanced speech recognition with context awareness...');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    
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
      console.log('🎤 Enhanced speech recognition started with context');
      setError('');
    };

    recognition.onresult = async (event: any) => {
      if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal || isEndingSession) {
        console.log('🚫 Ignoring speech result - session inactive or ending');
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
          console.log('✅ Final transcript with context:', transcript, 'confidence:', confidence);
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
        processEnhancedUserSpeech(finalTranscript.trim(), confidence);
        return;
      }

      if (interimTranscript.trim().length > 2 && sessionState.isActive && !isEndingSession) {
        clearTimeout(silenceTimerRef.current!);
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim() && !isProcessingFinal && sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
            isProcessingFinal = true;
            console.log('⏰ Auto-finalizing after silence with context');
            processEnhancedUserSpeech(interimTranscript.trim(), confidence);
          }
        }, 2500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🚨 Enhanced speech recognition error:', event.error);
      
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
          if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
            startListening();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      console.log('🏁 Enhanced speech recognition ended');
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
      console.error('❌ Failed to start enhanced speech recognition:', error);
      setError('Unable to start voice recognition. Please try again.');
    }
  }, [sessionState.isActive, sessionState.sessionId, audioState.isSpeaking, audioState.isProcessing, isEndingSession, conversation]);

  // ENHANCED: Process user speech with full context
  const processEnhancedUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive || isEndingSession) {
      console.log('🚫 Cannot process speech - session inactive or ending');
      return;
    }
    
    console.log('💬 Processing enhanced user speech with context:', userMessage, 'confidence:', confidence);
    
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
      confidence: confidence
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);
    await saveConversationToDatabase(updatedConversation);

    try {
      if (!sessionState.isActive || isEndingSession) {
        console.log('🚫 Session ended during processing - stopping');
        return;
      }
      
      // ENHANCED: Get contextual AI response
      const aiResponse = await getEnhancedAIResponse(scenario, userMessage, updatedConversation);
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now(),
        emotion: aiResponse.emotion || 'professional',
        context: aiResponse.context
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await saveConversationToDatabase(finalConversation);
      
      // ENHANCED: Check for natural ending suggestion
      if (aiResponse.shouldEndConversation && !aiShouldEnd) {
        console.log('🎯 AI suggests natural conversation ending');
        setAiShouldEnd(true);
        
        setTimeout(() => {
          if (sessionState.isActive && !isEndingSession) {
            setError('The conversation has reached a natural conclusion. Click "End Session" to get your comprehensive feedback.');
          }
        }, 2000);
      }
      
      if (!sessionState.isActive || isEndingSession) {
        console.log('🚫 Session ended during AI response - stopping');
        return;
      }
      
      // Speak response
      await speakWithVoice(aiResponse.response, scenario, aiResponse.emotion || 'professional');
      
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
      console.error('❌ Error processing enhanced speech:', err);
      
      if (sessionState.isActive && !isEndingSession) {
        setError('Having trouble processing your message. Please try speaking again.');
        
        setAudioState(prev => ({
          ...prev,
          isProcessing: false
        }));
        
        setTimeout(() => {
          if (sessionState.isActive && !isEndingSession) {
            startListening();
          }
        }, 3000);
      }
    }
  };

  // ENHANCED: Get AI response with full contextual awareness
  const getEnhancedAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const sessionStateData = {
        duration: sessionDuration,
        exchanges: Math.floor(conversationHistory.length / 2),
        startTime: sessionStartTime,
        objectives: conversationObjectives
      };

      console.log('🧠 Calling contextual AI agent with enhanced session state:', sessionStateData);

      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage,
          conversationHistory,
          sessionState: sessionStateData,
          sessionId: sessionState.sessionId
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Enhanced AI response failed');
      }
      
      return {
        response: data.data.response,
        emotion: data.data.emotion || 'professional',
        character: data.data.character,
        context: data.data.progressionData || {},
        conversationStage: data.data.conversationStage,
        shouldEndConversation: data.data.shouldEndConversation || false
      };
    } catch (error) {
      console.error('❌ Error getting enhanced AI response:', error);
      
      // Enhanced fallback that considers conversation length and context
      const exchanges = Math.floor(conversationHistory.length / 2);
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const shouldSuggestEnding = exchanges >= 8 || sessionDuration >= 600;
      
      if (shouldSuggestEnding && !aiShouldEnd) {
        setAiShouldEnd(true);
      }
      
      return {
        response: shouldSuggestEnding 
          ? `Thank you for this comprehensive discussion about ${scenario.title}. I feel we've covered the key points thoroughly, and I really appreciate the time you've taken to walk through everything with me. This has been very helpful.`
          : `That's really interesting. I'd like to understand more about your perspective on this. Could you tell me more about that?`,
        emotion: shouldSuggestEnding ? 'satisfied' : 'curious',
        character: scenario.character_name,
        context: { fallback: true, contextual: true },
        shouldEndConversation: shouldSuggestEnding
      };
    }
  };

  // ENHANCED: Voice synthesis with contextual emotion
  const speakWithVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise((resolve) => {
      console.log('🔊 AI starting contextual speech with emotion:', emotion);
      
      setAudioState(prev => ({
        ...prev,
        isSpeaking: true
      }));
      
      setSessionState(prev => ({
        ...prev,
        status: 'ai-speaking'
      }));

      if (!speechSynthesisRef.current) {
        console.warn('Speech synthesis not available');
        resolve();
        return;
      }
      
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
        console.log('🔊 Enhanced AI speech completed');
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
        console.error('🚨 Enhanced speech synthesis error:', event);
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
      'frustrated': { rate: 1.05, pitch: 1.1, volume: 0.95 },
      'satisfied': { rate: 0.9, pitch: 1.0, volume: 0.9 }
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
      console.error('❌ Error saving enhanced conversation:', err);
    }
  };

  // Stop listening function
  const stopListening = () => {
    console.log('🛑 Stopping enhanced speech recognition...');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition already stopped or error stopping:', e);
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
    
    console.log('✅ Enhanced speech recognition stopped');
  };

  // Enhanced cleanup function
  const cleanup = () => {
    console.log('🧹 Enhanced session cleanup - DISABLING ALL AUDIO');
    
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      status: 'ended'
    }));
    
    forceStopMicrophone();
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    setAudioState(prev => ({
      ...prev,
      isSpeaking: false,
      isProcessing: false,
      isListening: false,
      currentTranscript: ''
    }));
    
    clearAllTimers();
    
    console.log('✅ Enhanced session cleanup completed - ALL AUDIO DISABLED');
  };

  // ENHANCED: End session with comprehensive contextual data
  const endSession = async () => {
    if (isEndingSession) return;
    
    console.log('🛑 ENDING ENHANCED SESSION - IMMEDIATE MICROPHONE SHUTDOWN');
    setIsEndingSession(true);
    
    // IMMEDIATELY disable all audio processing
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      status: 'ended'
    }));
    
    // FORCE STOP all speech recognition immediately
    forceStopMicrophone();
    
    // CANCEL any speech synthesis
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    // Update UI state immediately
    setAudioState(prev => ({
      ...prev,
      isListening: false,
      isSpeaking: false,
      isProcessing: false,
      currentTranscript: ''
    }));
    
    clearAllTimers();
    
    console.log('✅ Enhanced microphone and AI processing STOPPED');
    
    // Save enhanced session data
    if (sessionState.sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - sessionStartTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        // Enhanced scoring based on contextual factors
        let score = 2.0;
        score += (exchanges >= 2 ? 0.5 : 0);
        score += (exchanges >= 4 ? 0.5 : 0);
        score += (exchanges >= 6 ? 0.5 : 0);
        score += (exchanges >= 8 ? 0.5 : 0);
        score += (duration >= 3 ? 0.5 : 0);
        score += (duration >= 7 ? 0.5 : 0);
        score += (aiShouldEnd ? 0.5 : 0); // Bonus for natural ending
        score += (conversationProgress.objectivesProgress > 0.6 ? 0.3 : 0);
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
              objectives_attempted: conversationObjectives,
              session_quality: exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : exchanges >= 4 ? 'fair' : 'basic',
              ai_context_active: conversationProgress.aiContextActive,
              stages_completed: conversationProgress.stagesCompleted,
              objectives_progress: conversationProgress.objectivesProgress
            }
          })
        });

      } catch (err) {
        console.error('❌ Error saving enhanced session data:', err);
      }
    }
    
    // Prepare enhanced session data for feedback
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - sessionStartTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail,
      sessionId: sessionState.sessionId,
      // Enhanced context for analysis
      sessionContext: {
        startTime: sessionStartTime,
        objectives: conversationObjectives,
        naturalEnding: aiShouldEnd,
        sessionQuality: conversation.length >= 12 ? 'excellent' : conversation.length >= 8 ? 'good' : conversation.length >= 4 ? 'fair' : 'basic',
        aiContextActive: conversationProgress.aiContextActive,
        stagesCompleted: conversationProgress.stagesCompleted,
        objectivesProgress: conversationProgress.objectivesProgress,
        conversationDepth: conversationProgress.conversationDepth
      }
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // ENHANCED: Update conversation progress tracking
  const updateConversationProgress = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
    
    // Calculate objectives progress based on conversation content and length
    const objectivesProgress = Math.min((exchanges / 6) * 100, 100);
    
    // Calculate conversation depth based on exchange quality
    const userMessages = conversation.filter(msg => msg.speaker === 'user');
    const avgMessageLength = userMessages.length > 0 ? 
      userMessages.reduce((sum, msg) => sum + msg.message.length, 0) / userMessages.length : 0;
    const conversationDepth = Math.min(
      (exchanges * 1.2) + (avgMessageLength > 40 ? 2 : avgMessageLength > 20 ? 1 : 0), 
      10
    );
    
    // Determine stages completed
    const stagesCompleted = [];
    if (exchanges >= 1) stagesCompleted.push('opening');
    if (exchanges >= 2) stagesCompleted.push('rapport_building');
    if (exchanges >= 4) stagesCompleted.push('core_discussion');
    if (exchanges >= 6) stagesCompleted.push('deep_exploration');
    if (aiShouldEnd || duration >= 10) stagesCompleted.push('conclusion_ready');
    
    setConversationProgress({
      objectivesProgress: objectivesProgress / 100,
      conversationDepth,
      naturalEndingAvailable: aiShouldEnd,
      stagesCompleted,
      aiContextActive: true
    });
  };

  // Get scenario objectives helper
  const getScenarioObjectives = (role: string): string[] => {
    const objectiveMap: Record<string, string[]> = {
      'sales': [
        'understand_needs',
        'present_solution', 
        'handle_objections',
        'discuss_pricing',
        'establish_next_steps'
      ],
      'project-manager': [
        'define_scope',
        'set_timeline',
        'identify_resources',
        'discuss_risks',
        'align_stakeholders'
      ],
      'product-manager': [
        'gather_requirements',
        'prioritize_features',
        'discuss_roadmap',
        'validate_assumptions',
        'set_success_metrics'
      ],
      'leader': [
        'share_vision',
        'build_alignment',
        'address_concerns',
        'motivate_team',
        'set_direction'
      ],
      'manager': [
        'provide_feedback',
        'discuss_performance',
        'set_goals',
        'identify_development',
        'create_action_plan'
      ],
      'support-agent': [
        'understand_issue',
        'diagnose_problem',
        'provide_solution',
        'ensure_satisfaction',
        'prevent_recurrence'
      ],
      'data-analyst': [
        'understand_requirements',
        'discuss_data_sources',
        'explain_methodology',
        'present_insights',
        'recommend_actions'
      ],
      'engineer': [
        'understand_requirements',
        'discuss_architecture',
        'address_constraints',
        'plan_implementation',
        'ensure_quality'
      ],
      'nurse': [
        'assess_patient_needs',
        'coordinate_care',
        'provide_education',
        'ensure_safety',
        'document_care'
      ],
      'doctor': [
        'gather_symptoms',
        'perform_assessment',
        'explain_diagnosis',
        'discuss_treatment',
        'plan_followup'
      ]
    };

    return objectiveMap[role] || objectiveMap['sales'];
  };

  // ENHANCED: Get status info with contextual awareness
  const getEnhancedStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
    const objectivesProgress = Math.min((exchanges / 6) * 100, 100);
    
    switch (sessionState.status) {
      case 'initializing':
        return { 
          icon: '⏳', 
          title: 'Initializing Contextual AI System...', 
          message: 'Loading conversation context, objectives, and memory systems', 
          color: 'bg-yellow-500',
          progress: true
        };
      case 'ready':
        return { 
          icon: '🧠', 
          title: 'Enhanced AI Ready with Full Context!', 
          message: `${scenario?.character_name} will remember your complete conversation with ${conversationObjectives.length} objectives`, 
          color: 'bg-blue-500',
          showStats: false
        };
      case 'listening':
        return { 
          icon: '🎤', 
          title: aiShouldEnd ? 'Natural Conclusion Available' : 'Active Contextual Conversation', 
          message: aiShouldEnd 
            ? `Comprehensive conversation completed - ready for detailed feedback` 
            : `Contextual AI analyzing your ${getUserRole(scenario?.role || '')} approach with full memory`, 
          color: aiShouldEnd ? 'bg-green-600' : 'bg-green-500',
          pulse: !aiShouldEnd,
          showStats: true,
          exchanges,
          duration,
          objectivesProgress
        };
      case 'processing':
        return { 
          icon: '🧠', 
          title: 'AI Processing with Full Context...', 
          message: `${scenario?.character_name} considering complete conversation history and objectives`, 
          color: 'bg-orange-500',
          progress: true,
          showStats: true,
          exchanges,
          duration,
          objectivesProgress
        };
      case 'ai-speaking':
        return { 
          icon: '🔊', 
          title: `${scenario?.character_name} (Contextual Response)`, 
          message: aiShouldEnd 
            ? 'Providing professional conversation conclusion with full context'
            : 'Responding with complete conversation memory and objective awareness', 
          color: aiShouldEnd ? 'bg-green-600' : 'bg-purple-500',
          showStats: true,
          exchanges,
          duration,
          objectivesProgress
        };
      case 'ended':
        return { 
          icon: '✅', 
          title: 'Enhanced Contextual Analysis Complete', 
          message: 'Analyzing your comprehensive performance with full conversation context...', 
          color: 'bg-gray-500'
        };
      default:
        return { 
          icon: '⏳', 
          title: 'Loading Enhanced System...', 
          message: 'Please wait', 
          color: 'bg-gray-500'
        };
    }
  };

  // Helper function to get user role
  const getUserRole = (scenarioRole: string): string => {
    const roleMap: Record<string, string> = {
      'sales': 'salesperson',
      'project-manager': 'project manager',
      'product-manager': 'product manager',
      'leader': 'leader',
      'manager': 'manager',
      'strategy-lead': 'strategy lead',
      'support-agent': 'customer service representative',
      'data-analyst': 'data analyst',
      'engineer': 'engineer',
      'nurse': 'healthcare provider',
      'doctor': 'healthcare provider'
    };
    return roleMap[scenarioRole] || 'professional';
  };

  // Loading state
  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced AI System</h2>
          <p className="text-gray-600">Initializing contextual conversation features and memory systems...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getEnhancedStatusInfo();

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Enhanced System Error</h2>
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
              Retry Enhanced Session
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
                <strong>Microphone Required:</strong> Enhanced voice conversations require microphone access.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                🧠
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  {scenario.title}
                  <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    Enhanced AI
                  </span>
                </h1>
                <p className="text-sm text-gray-600">
                  {scenario.character_name} • {scenario.difficulty} level • Contextual Memory Active
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
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-105 animate-pulse'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg transform hover:scale-105'
              }`}
            >
              {isEndingSession ? (
                <>
                  <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Ending Session...
                </>
              ) : aiShouldEnd ? (
                <>
                  <span className="mr-2">🎉</span>
                  Get Complete Feedback
                </>
              ) : (
                <>
                  <span className="mr-2">🛑</span>
                  End Session & Get Feedback
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Status Bar */}
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
                
                {/* Enhanced session indicators */}
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    sessionState.isActive ? 'bg-green-300' : 'bg-red-300'
                  }`}></div>
                  <span className="text-xs opacity-75">
                    Session {sessionState.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className={`w-2 h-2 rounded-full ${
                    audioState.isListening ? 'bg-blue-300 animate-pulse' : 
                    audioState.permissionDenied ? 'bg-red-400' : 'bg-gray-400'
                  }`}></div>
                  <span className="text-xs opacity-75">
                    Mic {audioState.isListening ? 'Active' : audioState.permissionDenied ? 'Denied' : 'Off'}
                  </span>
                  
                  {/* Enhanced context indicators */}
                  <div className="w-2 h-2 rounded-full bg-purple-300"></div>
                  <span className="text-xs opacity-75">AI Context Active</span>
                  
                  <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                  <span className="text-xs opacity-75">Memory: {conversation.length} messages</span>
                  
                  {/* Natural ending indicator */}
                  {aiShouldEnd && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse"></div>
                      <span className="text-xs opacity-75">Natural Ending Available</span>
                    </>
                  )}
                </div>
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
                
                {/* Enhanced objectives progress */}
                <div className="text-center">
                  <div className="font-bold">{Math.round(statusInfo.objectivesProgress)}%</div>
                  <div className="opacity-75">Objectives</div>
                </div>
                
                {/* Conversation depth */}
                <div className="text-center">
                  <div className="font-bold">{conversationProgress.conversationDepth.toFixed(1)}</div>
                  <div className="opacity-75">Depth</div>
                </div>
                
                {/* Speech quality indicator */}
                {audioState.speechConfidence > 0 && (
                  <div className="text-center">
                    <div className="font-bold">{Math.round(audioState.speechConfidence * 100)}%</div>
                    <div className="opacity-75">Speech Quality</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Enhanced AI Guide Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 sticky top-24">
              
              {/* Enhanced Header */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => setShowScenarioDetails(!showScenarioDetails)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <span className="text-xl mr-2">
                      {isGeneratingGuide ? '🧠' : guideSource === 'ai-generated' ? '🤖' : '🎯'}
                    </span>
                    {isGeneratingGuide ? 'Generating Enhanced Guide...' : 'Enhanced AI Guide'}
                  </h3>
                  <span className="text-gray-400">
                    {showScenarioDetails ? '−' : '+'}
                  </span>
                </button>
                
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

              {/* Enhanced Content */}
              {showScenarioDetails && (
                <div className="p-4 space-y-4">
                  
                  {isGeneratingGuide ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">
                        Enhanced AI creating contextual guide for {scenario.character_name}...
                      </p>
                    </div>
                  ) : aiGuide ? (
                    <>
                      {/* Goal */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">🚀</span>
                          Contextual Goal
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {aiGuide.goal}
                        </p>
                      </div>

                      {/* Objectives */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">📋</span>
                          Smart Objectives
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
                          Contextual Tips
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
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">
                        Guide temporarily unavailable. Enhanced conversation features are active!
                      </p>
                    </div>
                  )}

                  {/* Enhanced Character Profile */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <span className="text-sm mr-2">🧠</span>
                      Enhanced Character Profile
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Name:</strong> {scenario.character_name}</div>
                      <div><strong>Role:</strong> {scenario.character_role}</div>
                      <div><strong>Type:</strong> {scenario.role.replace('-', ' ')}</div>
                      <div><strong>AI Memory:</strong> Full conversation context</div>
                      {scenario.character_personality && (
                        <div><strong>Personality:</strong> {scenario.character_personality}</div>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Progress Indicator */}
                  {conversation.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <span className="text-sm mr-2">📈</span>
                        Contextual Progress
                      </h4>
                      
                      <div className="space-y-3">
                        {/* Objective Progress */}
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Conversation Objectives</span>
                            <span>{Math.round(conversationProgress.objectivesProgress * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${conversationProgress.objectivesProgress * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Conversation Depth */}
                        <div>
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Conversation Depth</span>
                            <span>{conversationProgress.conversationDepth.toFixed(1)}/10</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (conversationProgress.conversationDepth / 10) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* AI Context Status */}
                        <div className="text-xs text-gray-600 bg-purple-50 rounded-lg p-2">
                          <div className="font-medium text-purple-800 mb-1">🧠 Enhanced AI Status</div>
                          <div>✓ Full conversation memory active</div>
                          <div>✓ Contextual objective tracking</div>
                          <div>✓ Natural progression monitoring</div>
                          {aiShouldEnd && <div className="text-green-700 font-medium">✓ Natural ending detected</div>}
                        </div>
                        
                        {/* Enhanced Conversation Status */}
                        <div className="text-xs">
                          {conversation.length < 6 ? (
                            <div className="text-orange-600 bg-orange-50 rounded p-2">
                              💡 Building conversation depth for comprehensive AI feedback
                            </div>
                          ) : conversation.length < 12 ? (
                            <div className="text-blue-600 bg-blue-50 rounded p-2">
                              🎯 Excellent depth! Enhanced AI building complete context
                            </div>
                          ) : aiShouldEnd ? (
                            <div className="text-green-600 bg-green-50 rounded p-2 animate-pulse">
                              ⭐ Perfect! Natural conclusion reached - comprehensive analysis ready
                            </div>
                          ) : (
                            <div className="text-purple-600 bg-purple-50 rounded p-2">
                              🚀 Outstanding session! Exceptional contextual conversation
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Main Conversation Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
              
              {/* Enhanced Conversation Messages */}
              <div className="p-6">
                
                {conversation.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-6">🧠</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Enhanced AI System Ready!
                    </h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                      You&apos;re about to practice with <strong>{scenario.character_name}</strong> using our 
                      advanced contextual AI that maintains complete conversation memory and tracks your objectives.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 max-w-lg mx-auto">
                      <h4 className="text-blue-900 font-medium mb-3">✨ Enhanced AI Features</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                        <div className="text-left">
                          <div className="font-medium mb-2">🧠 Memory & Context</div>
                          <ul className="space-y-1 text-xs">
                            <li>• Remembers full conversation</li>
                            <li>• Tracks {conversationObjectives.length} objectives</li>
                            <li>• Maintains character consistency</li>
                          </ul>
                        </div>
                        <div className="text-left">
                          <div className="font-medium mb-2">🎯 Smart Features</div>
                          <ul className="space-y-1 text-xs">
                            <li>• Natural progression tracking</li>
                            <li>• Automatic conclusion detection</li>
                            <li>• Contextual feedback analysis</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    {sessionState.status === 'ready' && !isEndingSession && (
                      <div>
                        {audioState.permissionDenied ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
                            <h4 className="text-red-800 font-medium mb-2">Microphone Required</h4>
                            <p className="text-red-700 text-sm mb-4">
                              Enhanced voice conversations require microphone access.
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
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg transform hover:scale-105"
                          >
                            <span className="mr-2">🧠</span>
                            Start Enhanced Conversation
                          </button>
                        )}
                      </div>
                    )}
                    
                    {sessionState.status === 'initializing' && (
                      <div className="text-purple-600">
                        <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Initializing Enhanced AI Systems...</p>
                        <p className="text-sm mt-2">Loading contextual memory and objective tracking...</p>
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
                        {/* Enhanced Avatar */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ${
                          message.speaker === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                            : 'bg-gradient-to-br from-purple-500 to-pink-600'
                        }`}>
                          {message.speaker === 'user' ? '👤' : '🧠'}
                        </div>
                        
                        {/* Enhanced Message Bubble */}
                        <div className={`flex-1 max-w-md p-4 rounded-2xl ${
                          message.speaker === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                            : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-900 border border-gray-200'
                        }`}>
                          <div className={`text-xs mb-2 font-medium flex items-center justify-between ${
                            message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span>
                              {message.speaker === 'user' ? 'You' : `${scenario.character_name} 🧠`}
                              {message.emotion && message.speaker === 'ai' && (
                                <span className="ml-2 text-purple-600">({message.emotion})</span>
                              )}
                            </span>
                            {message.confidence && message.speaker === 'user' && (
                              <span className="text-xs bg-blue-600 px-2 py-1 rounded-full">
                                {Math.round(message.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <div className="leading-relaxed">
                            {message.message}
                          </div>
                          
                          {/* Enhanced context indicator for AI messages */}
                          {message.speaker === 'ai' && index > 2 && (
                            <div className="text-xs mt-2 text-purple-600 bg-purple-50 rounded px-2 py-1 flex items-center">
                              <span className="mr-1">🧠</span>
                              Contextual response (full conversation memory)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Enhanced current transcript display */}
                    {audioState.currentTranscript && sessionState.status === 'listening' && (
                      <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          👤
                        </div>
                        <div className="flex-1 max-w-md p-4 rounded-2xl bg-yellow-50 border-2 border-dashed border-yellow-300 text-yellow-800">
                          <div className="text-xs mb-2 font-medium text-yellow-600 flex items-center justify-between">
                            <span>You (processing with AI context...)</span>
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

                    {/* Enhanced AI Thinking Indicator */}
                    {sessionState.status === 'processing' && (
                      <div className="flex items-center space-x-3 justify-center py-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold">
                          🧠
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-purple-600 text-sm ml-2">
                            Enhanced AI analyzing full conversation context...
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

        {/* Enhanced Natural Ending Detection */}
        {aiShouldEnd && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Natural Conversation Conclusion Reached!
            </h3>
            <p className="text-green-700 mb-4">
              The enhanced AI detected that your conversation with {scenario.character_name} has reached a natural, 
              professional conclusion with excellent depth and context. This is perfect for getting comprehensive feedback 
              based on your complete {Math.floor(conversation.length / 2)}-exchange conversation!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={endSession}
                disabled={isEndingSession}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
              >
                🎉 Get Complete Contextual Feedback
              </button>
              <button
                onClick={() => setAiShouldEnd(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Continue Enhanced Conversation
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Session Encouragement Updates */}
        {conversation.length >= 8 && !aiShouldEnd && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-purple-800 font-medium">
              🌟 Outstanding conversation depth! The enhanced AI is building comprehensive context 
              with {Math.floor(conversation.length / 2)} exchanges for detailed contextual feedback.
            </p>
          </div>
        )}

        {/* Mobile Help */}
        {isMobile && sessionState.status === 'listening' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>📱 Enhanced Mobile Experience:</strong> Speak clearly for {Math.round(audioState.speechConfidence * 100)}% accuracy. 
              The AI maintains full conversation context on mobile.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

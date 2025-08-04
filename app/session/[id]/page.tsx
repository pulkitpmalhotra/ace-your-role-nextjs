// app/session/[id]/page.tsx - Enhanced with Phase 1 Features
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdvancedSpeechProcessor } from '../../../utils/advanced-speech-processor';
import { AdvancedAIPromptingSystem } from '../../../utils/advanced-speech-processor';
import { EnhancedVoiceSynthesizer } from '../../../utils/advanced-speech-processor';
import { PerformanceOptimizer } from '../../../utils/advanced-speech-processor';
import { AdvancedAnalytics } from '../../../utils/advanced-speech-processor';
import { PerformanceMonitor } from '../../../utils/advanced-speech-processor';

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

interface PerformanceMetrics {
  speechAccuracy: number;
  responseTime: number;
  conversationFlow: number;
  characterInteraction: number;
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
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    speechAccuracy: 0,
    responseTime: 0,
    conversationFlow: 0,
    characterInteraction: 0
  });
  const [aiGuide, setAiGuide] = useState<AIGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [guideSource, setGuideSource] = useState<'ai-generated' | 'fallback' | null>(null);
  
  // UI state
  const [error, setError] = useState('');
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showScenarioDetails, setShowScenarioDetails] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Enhanced system refs
  const speechProcessorRef = useRef<AdvancedSpeechProcessor | null>(null);
  const aiPromptingRef = useRef<AdvancedAIPromptingSystem | null>(null);
  const voiceSynthesizerRef = useRef<EnhancedVoiceSynthesizer | null>(null);
  const performanceOptimizerRef = useRef<PerformanceOptimizer | null>(null);
  const analyticsRef = useRef<AdvancedAnalytics | null>(null);
  const performanceMonitorRef = useRef<PerformanceMonitor | null>(null);
  
  // Legacy refs for compatibility
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  
  const router = useRouter();

  // Initialize enhanced systems
  useEffect(() => {
    initializeEnhancedSystems();
    return () => {
      cleanup();
    };
  }, []);

  const initializeEnhancedSystems = async () => {
    try {
      console.log('🚀 Initializing Enhanced AI Roleplay System...');
      
      // Initialize advanced speech processor
      speechProcessorRef.current = new AdvancedSpeechProcessor({
        contextAware: true,
        pauseDetection: true,
        noiseReduction: true,
        confidenceThreshold: 0.7
      });

      // Initialize performance optimizer
      performanceOptimizerRef.current = new PerformanceOptimizer();

      // Initialize advanced analytics
      analyticsRef.current = new AdvancedAnalytics();
      
      // Initialize performance monitor
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.startMonitoring();

      // Initialize enhanced voice synthesizer
      voiceSynthesizerRef.current = new EnhancedVoiceSynthesizer();
      await voiceSynthesizerRef.current.initialize();

      // Legacy speech synthesis setup for fallback
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

      // Track initialization
      performanceMonitorRef.current?.trackMetric('system_initialization', Date.now() - sessionState.startTime);
      analyticsRef.current?.trackEvent('enhanced_session_initialized', {
        scenario_id: params.id,
        user_agent: navigator.userAgent,
        timestamp: Date.now()
      });

      console.log('✅ Enhanced systems initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize enhanced systems:', error);
      setError('Failed to initialize advanced features. Basic functionality will still work.');
    }
  };

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
    initializeSession();
  }, []);

  // Generate AI guide when scenario is loaded
  useEffect(() => {
    if (scenario && !aiGuide && !isGeneratingGuide) {
      generateAIGuide(scenario);
    }
  }, [scenario]);

  // Enhanced AI guide generation
  const generateAIGuide = async (scenarioData: Scenario) => {
    setIsGeneratingGuide(true);
    console.log('🧠 Generating enhanced AI guide for scenario:', scenarioData.title);
    
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
        console.log('✅ Enhanced AI guide generated:', result.source);
        
        // Track guide generation
        analyticsRef.current?.trackEvent('ai_guide_generated', {
          scenario_id: scenarioData.id,
          source: result.source,
          character: scenarioData.character_name
        });
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
      
      // Initialize AI prompting system with scenario context
      aiPromptingRef.current = new AdvancedAIPromptingSystem(scenarioData, []);
      
      // Create session
      const sessionId = await createDatabaseSession(scenarioData.id, email);
      
      setSessionState(prev => ({
        ...prev,
        sessionId,
        status: 'ready',
        isActive: true,
        startTime: Date.now()
      }));
      
      console.log('✅ Enhanced session initialized:', sessionId);
      
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
        // Track session creation
        analyticsRef.current?.trackEvent('enhanced_session_created', {
          session_id: data.data.id,
          scenario_id: scenarioId,
          user_email: email
        });
        return data.data.id;
      } else {
        throw new Error(data.error || 'Failed to create session');
      }
    } catch (err) {
      console.error('❌ Database session creation failed:', err);
      throw err;
    }
  };

  // Enhanced conversation start
  const startConversation = async () => {
    if (!scenario || !sessionState.sessionId) {
      setError('Session not ready. Please wait or refresh the page.');
      return;
    }

    try {
      console.log('🎤 Requesting enhanced microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setAudioState(prev => ({
        ...prev,
        hasPermission: true,
        permissionDenied: false
      }));
      
      setError('');
      
      // Generate enhanced AI greeting
      const greeting = await generateEnhancedGreeting(scenario);
      const aiMessage: ConversationMessage = {
        speaker: 'ai',
        message: greeting.content,
        timestamp: Date.now(),
        emotion: greeting.emotion,
        context: greeting.context
      };
      
      const initialConversation = [aiMessage];
      setConversation(initialConversation);
      
      // Save to database
      await saveConversationToDatabase(initialConversation);
      
      // Enhanced voice synthesis
      await speakWithEnhancedVoice(greeting.content, scenario, greeting.emotion);
      
      // Start enhanced listening
      setTimeout(() => {
        if (sessionState.isActive) {
          startEnhancedListening();
        }
      }, 1000);
      
      // Track conversation start
      analyticsRef.current?.trackEvent('enhanced_conversation_started', {
        session_id: sessionState.sessionId,
        character: scenario.character_name,
        greeting_emotion: greeting.emotion
      });
      
    } catch (err) {
      console.error('❌ Enhanced microphone permission denied:', err);
      setAudioState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      setError('We need microphone access for voice conversations. Please allow microphone access in your browser settings and refresh the page.');
    }
  };

  // Generate enhanced AI greeting
  const generateEnhancedGreeting = async (scenario: Scenario) => {
    if (aiPromptingRef.current) {
      return await aiPromptingRef.current.generateContextualResponse(
        "Generate an opening greeting",
        [],
        {
          character: scenario.character_name,
          scenario: scenario.title,
          emotionalContext: 'professional',
          conversationFlow: { turnCount: 0, averageLength: 0, lastSpeaker: 'none' }
        }
      );
    }
    
    // Fallback to original greeting generation
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
    
    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    const selectedGreeting = roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
    
    return {
      content: selectedGreeting,
      emotion: 'professional',
      context: { greeting: true, character: scenario.character_name }
    };
  };

  // Enhanced speech recognition
  const startEnhancedListening = useCallback(() => {
    if (!sessionState.isActive || !sessionState.sessionId || audioState.isSpeaking || audioState.isProcessing) {
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice recognition requires Chrome browser. Please switch to Chrome for the best experience.');
      return;
    }

    console.log('🎤 Starting enhanced speech recognition...');

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3; // Get multiple alternatives for better processing
    
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
      console.log('🎤 Enhanced speech recognition started');
      setError('');
      performanceMonitorRef.current?.trackMetric('speech_recognition_start', Date.now());
    };

    recognition.onresult = async (event: any) => {
      if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal) {
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
          console.log('✅ Enhanced final transcript:', transcript, 'confidence:', confidence);
          
          // Enhanced speech processing
          if (speechProcessorRef.current) {
            const processedSpeech = await speechProcessorRef.current.processWithContext(
              transcript,
              conversation,
              { confidence, timestamp: Date.now() }
            );
            finalTranscript = processedSpeech;
          }
        } else {
          interimTranscript += transcript;
        }
      }

      setAudioState(prev => ({
        ...prev,
        currentTranscript: interimTranscript,
        speechConfidence: confidence
      }));

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        speechAccuracy: confidence
      }));

      if (finalTranscript.trim() && !isProcessingFinal && sessionState.isActive) {
        isProcessingFinal = true;
        clearTimeout(silenceTimerRef.current!);
        processEnhancedUserSpeech(finalTranscript.trim(), confidence);
        return;
      }

      if (interimTranscript.trim().length > 2 && sessionState.isActive) {
        clearTimeout(silenceTimerRef.current!);
        silenceTimerRef.current = setTimeout(() => {
          if (interimTranscript.trim() && !isProcessingFinal && sessionState.isActive && !audioState.isSpeaking) {
            isProcessingFinal = true;
            console.log('⏰ Enhanced auto-finalizing after silence');
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
      
      // Track error
      analyticsRef.current?.trackEvent('speech_recognition_error', {
        error: event.error,
        session_id: sessionState.sessionId
      });
      
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
            startEnhancedListening();
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
            startEnhancedListening();
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

  // Enhanced user speech processing
  const processEnhancedUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive) {
      return;
    }
    
    const startTime = Date.now();
    console.log('💬 Processing enhanced user speech:', userMessage, 'confidence:', confidence);
    
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
      // Enhanced AI response generation
      const aiResponse = await getEnhancedAIResponse(scenario, userMessage, updatedConversation);
      
      // Performance optimization
      let optimizedResponse = aiResponse;
      if (performanceOptimizerRef.current) {
        optimizedResponse = await performanceOptimizerRef.current.optimizeResponse(aiResponse);
      }
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: optimizedResponse.content || optimizedResponse.response,
        timestamp: Date.now(),
        emotion: optimizedResponse.emotion || 'professional',
        context: optimizedResponse.context
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await saveConversationToDatabase(finalConversation);
      
      if (!sessionState.isActive) return;
      
      // Enhanced voice synthesis
      await speakWithEnhancedVoice(
        optimizedResponse.content || optimizedResponse.response, 
        scenario, 
        optimizedResponse.emotion || 'professional'
      );
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      // Update performance metrics
      const responseTime = Date.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        responseTime: (prev.responseTime + responseTime) / 2,
        conversationFlow: Math.min(100, (finalConversation.length / 2) * 12.5),
        characterInteraction: confidence * 100
      }));
      
      performanceMonitorRef.current?.trackMetric('enhanced_response_time', responseTime);
      analyticsRef.current?.trackEvent('enhanced_message_processed', {
        session_id: sessionState.sessionId,
        character: scenario.character_name,
        response_time: responseTime,
        confidence: confidence,
        message_length: userMessage.length,
        optimization_applied: !!performanceOptimizerRef.current
      });
      
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
          startEnhancedListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('❌ Error processing enhanced speech:', err);
      setError('Having trouble processing your message. Please try speaking again.');
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      analyticsRef.current?.trackEvent('enhanced_processing_error', {
        session_id: sessionState.sessionId,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      
      if (sessionState.isActive && !isEndingSession) {
        setTimeout(() => {
          startEnhancedListening();
        }, 3000);
      }
    }
  };

  // Enhanced AI response generation
  const getEnhancedAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        userMessage,
        conversationHistory,
        messageCount: Math.floor(conversationHistory.length / 2),
        enhancedMode: true, // Enable enhanced prompting
        contextAwareness: true, // Enable context awareness
        performanceOptimization: true // Enable performance optimization
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Enhanced AI response failed');
    }
    
    return {
      response: data.data.response,
      content: data.data.response,
      emotion: data.data.emotion || 'professional',
      character: data.data.character,
      context: data.data.context || {},
      conversationStage: data.data.conversationStage,
      enhanced: data.data.enhanced || false
    };
  };

  // Enhanced voice synthesis
  const speakWithEnhancedVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise(async (resolve) => {
      console.log('🔊 AI starting enhanced speech');
      
      setAudioState(prev => ({
        ...prev,
        isSpeaking: true
      }));
      
      setSessionState(prev => ({
        ...prev,
        status: 'ai-speaking'
      }));

      try {
        // Try enhanced voice synthesis first
        if (voiceSynthesizerRef.current) {
          await voiceSynthesizerRef.current.speak(text, {
            character: scenario.character_name,
            emotion: emotion,
            enhancedProcessing: true
          });
        } else {
          // Fallback to original voice synthesis
          await speakWithOriginalVoice(text, scenario, emotion);
        }

        // Track voice synthesis
        analyticsRef.current?.trackEvent('enhanced_voice_synthesis', {
          session_id: sessionState.sessionId,
          character: scenario.character_name,
          emotion: emotion,
          text_length: text.length
        });

      } catch (error) {
        console.error('🚨 Enhanced speech synthesis error:', error);
        // Fallback to original method
        await speakWithOriginalVoice(text, scenario, emotion);
      }

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
    });
  };

  // Original voice synthesis as fallback
  const speakWithOriginalVoice = async (text: string, scenario: Scenario, emotion: string = 'professional'): Promise<void> => {
    return new Promise((resolve) => {
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
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🚨 Speech synthesis error:', event);
        resolve();
      };

      speechSynthesisRef.current.speak(utterance);
    });
  };

  // Select character voice (original method)
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

  // Get emotional voice parameters (original method)
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

  // Save conversation to database (enhanced)
  const saveConversationToDatabase = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionState.sessionId) return;
    
    try {
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionState.sessionId,
          conversation: updatedConversation,
          performance_metrics: performanceMetrics,
          enhanced_features: true
        })
      });
    } catch (err) {
      console.error('❌ Error saving enhanced conversation:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('🛑 Stopping enhanced speech recognition');
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

  // Enhanced cleanup
  const cleanup = () => {
    console.log('🧹 Enhanced session cleanup');
    
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      status: 'ended'
    }));
    
    stopListening();
    
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    if (voiceSynthesizerRef.current) {
      voiceSynthesizerRef.current.stop();
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

    // Cleanup enhanced systems
    if (speechProcessorRef.current) {
      speechProcessorRef.current.cleanup();
    }
    
    if (performanceMonitorRef.current) {
      performanceMonitorRef.current.cleanup();
    }
    
    console.log('✅ Enhanced session cleanup completed');
  };

  // Enhanced session end
  const endSession = async () => {
    if (isEndingSession) return;
    
    console.log('🛑 Ending enhanced session...');
    setIsEndingSession(true);
    
    cleanup();
    
    if (sessionState.sessionId && conversation.length > 0) {
      const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        // Enhanced scoring based on performance metrics
        let score = 2.0;
        score += (exchanges >= 2 ? 0.5 : 0);
        score += (exchanges >= 4 ? 0.5 : 0);
        score += (exchanges >= 6 ? 0.5 : 0);
        score += (duration >= 3 ? 0.5 : 0);
        score += (performanceMetrics.speechAccuracy > 80 ? 0.3 : 0);
        score += (performanceMetrics.characterInteraction > 70 ? 0.2 : 0);
        score = Math.min(5.0, score);
        
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionState.sessionId,
            session_status: 'completed',
            duration_minutes: duration,
            overall_score: score,
            performance_metrics: performanceMetrics,
            enhanced_session: true
          })
        });

        // Track session completion
        analyticsRef.current?.trackEvent('enhanced_session_completed', {
          session_id: sessionState.sessionId,
          duration_minutes: duration,
          exchanges: exchanges,
          overall_score: score,
          performance_metrics: performanceMetrics,
          character: scenario?.character_name
        });

      } catch (err) {
        console.error('❌ Error ending enhanced session:', err);
      }
    }
    
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - sessionState.startTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail,
      sessionId: sessionState.sessionId,
      performanceMetrics,
      enhancedFeatures: true
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // Get enhanced status info
  const getStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
    
    switch (sessionState.status) {
      case 'initializing':
        return { 
          icon: '⏳', 
          title: 'Initializing Enhanced AI System...', 
          message: 'Setting up advanced conversation features', 
          color: 'bg-yellow-500',
          progress: true
        };
      case 'ready':
        return { 
          icon: '🚀', 
          title: 'Enhanced System Ready!', 
          message: `Advanced AI conversation with ${scenario?.character_name} is ready`, 
          color: 'bg-blue-500',
          showStats: false
        };
      case 'listening':
        return { 
          icon: '🎤', 
          title: 'Enhanced Listening Active', 
          message: `AI is processing your speech with ${Math.round(audioState.speechConfidence * 100)}% accuracy`, 
          color: 'bg-green-500',
          pulse: true,
          showStats: true,
          exchanges,
          duration
        };
      case 'processing':
        return { 
          icon: '🧠', 
          title: 'Advanced AI Processing...', 
          message: 'Context-aware response generation in progress', 
          color: 'bg-orange-500',
          progress: true,
          showStats: true,
          exchanges,
          duration
        };
      case 'ai-speaking':
        return { 
          icon: '🔊', 
          title: `Enhanced ${scenario?.character_name} Response`, 
          message: 'Advanced voice synthesis with character personality', 
          color: 'bg-purple-500',
          showStats: true,
          exchanges,
          duration
        };
      case 'ended':
        return { 
          icon: '✅', 
          title: 'Enhanced Session Completed', 
          message: 'Advanced performance analysis in progress...', 
          color: 'bg-gray-500'
        };
      default:
        return { 
          icon: '⏳', 
          title: 'Loading Enhanced Features...', 
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced AI System</h2>
          <p className="text-gray-600">Initializing advanced conversation features...</p>
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
              Retry Enhanced Features
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
                <strong>Enhanced Features Need Microphone:</strong> Make sure to allow microphone access for the best experience with our advanced speech processing.
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
                🚀
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center">
                  {scenario.title}
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Enhanced</span>
                </h1>
                <p className="text-sm text-gray-600">
                  {scenario.character_name} • {scenario.difficulty} level • Advanced AI
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
                <div className="text-center">
                  <div className="font-bold">{Math.round(performanceMetrics.speechAccuracy)}%</div>
                  <div className="opacity-75">Accuracy</div>
                </div>
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
                    {isGeneratingGuide ? 'Generating Enhanced Guide...' : 'AI-Enhanced Guide'}
                  </h3>
                  <span className="text-gray-400">
                    {showScenarioDetails ? '−' : '+'}
                  </span>
                </button>
                
                {/* Enhanced guide indicators */}
                {!isGeneratingGuide && guideSource && (
                  <div className="mt-2 flex space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      guideSource === 'ai-generated' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {guideSource === 'ai-generated' ? '✨ AI-Enhanced' : '📋 Standard'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                      Phase 1
                    </span>
                  </div>
                )}
              </div>

              {/* Enhanced Content - same as before but with performance metrics */}
              {showScenarioDetails && (
                <div className="p-4 space-y-4">
                  
                  {/* Performance Metrics Display */}
                  {conversation.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="text-sm mr-2">📊</span>
                        Real-time Performance
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-gray-600">Speech</div>
                          <div className="font-bold text-blue-600">{Math.round(performanceMetrics.speechAccuracy)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Flow</div>
                          <div className="font-bold text-green-600">{Math.round(performanceMetrics.conversationFlow)}%</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Response</div>
                          <div className="font-bold text-purple-600">{Math.round(performanceMetrics.responseTime)}ms</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Interaction</div>
                          <div className="font-bold text-orange-600">{Math.round(performanceMetrics.characterInteraction)}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rest of the guide content remains the same */}
                  {isGeneratingGuide ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">
                        Enhanced AI is creating a personalized guide for {scenario.character_name}...
                      </p>
                    </div>
                  ) : aiGuide ? (
                    <>
                      {/* Enhanced Goal */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">🚀</span>
                          Enhanced Goal
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {aiGuide.goal}
                        </p>
                      </div>

                      {/* Enhanced Objectives */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                          <span className="text-sm mr-2">📋</span>
                          AI-Powered Objectives
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

                      {/* Enhanced Tips */}
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
                            Character AI Insights
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
                        Enhanced guide temporarily unavailable. Advanced conversation features still active!
                      </p>
                    </div>
                  )}

                  {/* Enhanced Character Profile */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                      <span className="text-sm mr-2">👤</span>
                      Enhanced Character Profile
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><strong>Name:</strong> {scenario.character_name}</div>
                      <div><strong>Role:</strong> {scenario.character_role}</div>
                      {scenario.character_personality && (
                        <div><strong>Personality:</strong> {scenario.character_personality}</div>
                      )}
                      <div className="flex items-center mt-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-xs">Enhanced AI Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Progress Indicator */}
                  {conversation.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="text-sm mr-2">📊</span>
                        Enhanced Session Progress
                      </h4>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between mb-1">
                          <span>Exchanges</span>
                          <span>{Math.floor(conversation.length / 2)}/8 (optimal)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (Math.floor(conversation.length / 2) / 8) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.length < 6 ? 'Enhanced AI is warming up! Keep going for better insights' : 
                           conversation.length < 12 ? 'Excellent depth! Enhanced features are fully active' :
                           'Outstanding session! Enhanced analysis will be comprehensive'}
                        </p>
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
                    <div className="text-6xl mb-6">🚀</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Enhanced AI System Ready!
                    </h3>
                    <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                      You&apos;re about to experience our <strong>Enhanced AI Roleplay System</strong> with 
                      <strong> {scenario.character_name}</strong>. Advanced features include context-aware 
                      responses, improved speech processing, and real-time performance analytics.
                    </p>
                    
                    {/* Enhanced features list */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 max-w-lg mx-auto">
                      <h4 className="font-semibold text-purple-900 mb-3">🚀 Enhanced Features Active:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm text-purple-800">
                        <div className="flex items-center"><span className="text-green-500 mr-1">✓</span> Context Awareness</div>
                        <div className="flex items-center"><span className="text-green-500 mr-1">✓</span> Advanced Speech</div>
                        <div className="flex items-center"><span className="text-green-500 mr-1">✓</span> Voice Synthesis</div>
                        <div className="flex items-center"><span className="text-green-500 mr-1">✓</span> Performance Analytics</div>
                      </div>
                    </div>
                    
                    {sessionState.status === 'ready' && !isEndingSession && (
                      <div>
                        {audioState.permissionDenied ? (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
                            <h4 className="text-red-800 font-medium mb-2">Enhanced Features Need Microphone</h4>
                            <p className="text-red-700 text-sm mb-4">
                              Please allow microphone access for the best enhanced AI experience.
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
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg transform hover:scale-105"
                          >
                            <span className="mr-2">🚀</span>
                            Start Enhanced Conversation
                          </button>
                        )}
                      </div>
                    )}
                    
                    {sessionState.status === 'initializing' && (
                      <div className="text-blue-600">
                        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg">Initializing Enhanced AI Systems...</p>
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
                          {message.speaker === 'user' ? '👤' : '🤖'}
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
                              {message.speaker === 'user' ? 'You' : scenario.character_name}
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
                          {message.context && message.speaker === 'ai' && (
                            <div className="mt-2 text-xs text-gray-500">
                              Enhanced AI • Context-aware response
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
                            <span>You (enhanced processing...)</span>
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
                          🤖
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <span className="text-purple-600 text-sm ml-2">
                            Enhanced AI is analyzing context...
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

        {/* Enhanced Mobile Help */}
        {isMobile && sessionState.status === 'listening' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Enhanced Mobile Experience:</strong> Our advanced speech processing works great on mobile! 
              Speak clearly for {Math.round(audioState.speechConfidence * 100)}% accuracy detection.
            </p>
          </div>
        )}

        {/* Enhanced Session Encouragement */}
        {conversation.length >= 8 && sessionState.status !== 'ended' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              🎉 Outstanding conversation depth! Enhanced AI analysis will provide comprehensive feedback.
            </p>
            <div className="mt-2 text-sm text-green-700">
              Performance Score: {Math.round(performanceMetrics.speechAccuracy)}% accuracy • 
              {Math.round(performanceMetrics.conversationFlow)}% flow quality
            </div>
          </div>
        )}

        {/* Enhanced AI Indicator */}
        {guideSource === 'ai-generated' && !isGeneratingGuide && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 text-center">
            <p className="text-purple-800 font-medium text-sm">
              ✨ <strong>Enhanced AI Roleplay System Active:</strong> You&apos;re experiencing our most advanced 
              conversation training with context awareness, performance analytics, and personalized character interactions.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

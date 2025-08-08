// app/session/[id]/page.tsx - Enhanced Voice Integration
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

interface ObjectiveProgress {
  id: string;
  text: string;
  completed: boolean;
  evidence?: string;
}

export default function EnhancedSessionPage({ params }: { params: { id: string } }) {
  // Core state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Objectives state
  const [objectives, setObjectives] = useState<ObjectiveProgress[]>([]);
  const [objectivesCompleted, setObjectivesCompleted] = useState(0);
  
  // Enhanced speech state with better reliability
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [error, setError] = useState('');
  const [sessionStatus, setSessionStatus] = useState<'setup' | 'ready' | 'active' | 'processing' | 'speaking' | 'listening' | 'ending'>('setup');
  
  // Natural ending state
  const [aiSuggestedEnd, setAiSuggestedEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  // Enhanced refs for stable voice handling
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationRef = useRef<ConversationMessage[]>([]);
  const processingRef = useRef(false);
  const breathingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  const router = useRouter();

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Enhanced cleanup of voice components...');
    
    // Clear all timeouts
    if (breathingTimeoutRef.current) {
      clearTimeout(breathingTimeoutRef.current);
      breathingTimeoutRef.current = null;
    }
    
    // Stop speech recognition with better error handling
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Recognition cleanup completed');
      }
      recognitionRef.current = null;
    }
    
    // Cancel speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    
    // Reset all states
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setMicrophoneEnabled(false);
    setCurrentTranscript('');
    setSessionStatus('setup');
    processingRef.current = false;
    retryCountRef.current = 0;
  }, []);

  // Enhanced microphone permission with better UX
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting enhanced microphone permission...');
      setSessionStatus('setup');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      // Test the stream briefly
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      
      // Stop test stream
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      console.log('✅ Enhanced microphone permission granted with audio test');
      setHasPermission(true);
      setMicrophoneEnabled(true);
      setError('');
      setSessionStatus('ready');
      return true;
      
    } catch (err: any) {
      console.error('❌ Enhanced microphone permission error:', err);
      let errorMessage = 'Microphone access is required for voice conversations.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access was denied. Please allow microphone access and refresh the page.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Microphone is being used by another application. Please close other apps and try again.';
      }
      
      setError(errorMessage);
      setHasPermission(false);
      setMicrophoneEnabled(false);
      setSessionStatus('setup');
      return false;
    }
  };

  // Enhanced speech recognition with better reliability
  const startListening = useCallback(() => {
    if (!isActive || !microphoneEnabled || isSpeaking || processingRef.current || isEnding) {
      console.log('🚫 Cannot start enhanced listening:', { 
        isActive, microphoneEnabled, isSpeaking, isProcessing: processingRef.current, isEnding 
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Clean up any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        console.log('Cleaned up previous recognition');
      }
      recognitionRef.current = null;
    }

    console.log('🎤 Starting enhanced speech recognition...');
    setSessionStatus('listening');
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced configuration for better reliability
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    recognition.serviceURI = 'wss://www.google.com/speech-api/v2/recognize';
    
    recognitionRef.current = recognition;
    
    let silenceTimer: NodeJS.Timeout;
    let finalTranscript = '';
    let hasRecognizedSpeech = false;
    let confidenceSum = 0;
    let confidenceCount = 0;

    recognition.onstart = () => {
      console.log('🎤 Enhanced speech recognition started');
      setIsListening(true);
      setCurrentTranscript('');
      hasRecognizedSpeech = false;
      retryCountRef.current = 0;
      
      // Enhanced silence detection with adaptive timeout
      const silenceTimeout = conversation.length > 4 ? 15000 : 10000;
      silenceTimer = setTimeout(() => {
        if (recognitionRef.current && !hasRecognizedSpeech && retryCountRef.current < maxRetries) {
          console.log('🔄 Restarting recognition due to silence');
          recognition.stop();
        }
      }, silenceTimeout);
    };

    recognition.onresult = (event: any) => {
      if (!isActive || !microphoneEnabled || processingRef.current || isEnding) {
        return;
      }

      clearTimeout(silenceTimer);
      hasRecognizedSpeech = true;

      let interimTranscript = '';
      let bestConfidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence || 0.8;
        
        if (result.isFinal) {
          finalTranscript = transcript;
          bestConfidence = confidence;
          confidenceSum += confidence;
          confidenceCount++;
          console.log('🎤 Enhanced final transcript:', finalTranscript, 'confidence:', confidence);
        } else {
          interimTranscript = transcript;
          bestConfidence = Math.max(bestConfidence, confidence);
        }
      }

      // Enhanced interim result display
      setCurrentTranscript(interimTranscript);

      // Process final transcript with confidence threshold
      if (finalTranscript && finalTranscript.length > 2 && bestConfidence > 0.7 && !processingRef.current) {
        console.log('✅ Processing enhanced transcript with high confidence');
        recognition.stop();
        setIsListening(false);
        setCurrentTranscript('');
        setSessionStatus('processing');
        processUserSpeech(finalTranscript, bestConfidence);
      } else if (finalTranscript && bestConfidence <= 0.7) {
        console.log('⚠️ Low confidence transcript, asking for clarification');
        setCurrentTranscript('(Low confidence - please speak clearly)');
        setTimeout(() => setCurrentTranscript(''), 2000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Enhanced speech recognition error:', event.error);
      setIsListening(false);
      setCurrentTranscript('');
      setSessionStatus('active');
      clearTimeout(silenceTimer);
      
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone access and refresh the page.');
        setMicrophoneEnabled(false);
        return;
      }
      
      if (event.error === 'network') {
        setError('Network error occurred. Please check your internet connection.');
        return;
      }
      
      if (event.error === 'audio-capture') {
        setError('No microphone detected. Please check your microphone connection.');
        return;
      }
      
      // Enhanced retry logic with exponential backoff
      if (event.error !== 'aborted' && isActive && microphoneEnabled && !processingRef.current && !isEnding) {
        retryCountRef.current++;
        if (retryCountRef.current <= maxRetries) {
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
          console.log(`🔄 Retrying recognition (${retryCountRef.current}/${maxRetries}) after ${retryDelay}ms`);
          setTimeout(() => {
            if (isActive && microphoneEnabled && !isSpeaking && !processingRef.current && !isEnding) {
              startListening();
            }
          }, retryDelay);
        } else {
          setError('Speech recognition failed multiple times. Please refresh the page and try again.');
        }
      }
    };

    recognition.onend = () => {
      console.log('🎤 Enhanced speech recognition ended');
      setIsListening(false);
      setSessionStatus('active');
      clearTimeout(silenceTimer);
      
      // Auto-restart with improved conditions
      if (!finalTranscript && !hasRecognizedSpeech && isActive && microphoneEnabled && !isSpeaking && !processingRef.current && !isEnding && retryCountRef.current < maxRetries) {
        setTimeout(() => {
          if (isActive && microphoneEnabled && !isSpeaking && !processingRef.current && !isEnding) {
            startListening();
          }
        }, 1000);
      }
    };

    // Start recognition with error handling
    try {
      recognition.start();
    } catch (error) {
      console.error('🎤 Failed to start enhanced recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
      setSessionStatus('active');
    }
  }, [isActive, microphoneEnabled, isSpeaking, isEnding, conversation.length]);

  // Enhanced speech synthesis with better timing
  const speakMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.log('⚠️ Speech synthesis not available');
        resolve();
        return;
      }
      
      console.log('🔊 Enhanced AI speaking:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
      setSessionStatus('speaking');
      
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice settings for better quality
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      
      // Try to use a natural voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Natural') || 
        voice.name.includes('Neural') || 
        voice.name.includes('Google')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        console.log('🔊 Enhanced AI finished speaking');
        setIsSpeaking(false);
        setSessionStatus('active');
        utteranceRef.current = null;
        
        // Enhanced breathing room with adaptive timing
        const breathingTime = text.length > 100 ? 4000 : 3000;
        console.log(`💭 Giving ${breathingTime}ms breathing room...`);
        
        breathingTimeoutRef.current = setTimeout(() => {
          if (isActive && microphoneEnabled && !isEnding && !processingRef.current) {
            console.log('🎤 Starting to listen after breathing room');
            startListening();
          }
          breathingTimeoutRef.current = null;
        }, breathingTime);
        
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🔊 Enhanced speech synthesis error:', event);
        setIsSpeaking(false);
        setSessionStatus('active');
        utteranceRef.current = null;
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  // Enhanced conversation starter
  const startConversation = async () => {
    if (!scenario || !sessionId) return;

    try {
      // Request enhanced microphone permission
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;

      console.log('🎯 Starting enhanced conversation...');
      setSessionStatus('active');
      
      // Generate contextual greeting
      const greeting = getContextualGreeting(scenario);
      
      const aiMessage: ConversationMessage = {
        speaker: 'ai',
        message: greeting,
        timestamp: Date.now()
      };
      
      const initialConversation = [aiMessage];
      setConversation(initialConversation);
      conversationRef.current = initialConversation;
      
      // Save to database
      await saveConversation(initialConversation);
      
      console.log('🔊 AI will speak enhanced greeting...');
      
      // Speak greeting with enhanced timing
      await speakMessage(greeting);
      
    } catch (err) {
      console.error('❌ Enhanced conversation start error:', err);
      setError('Failed to start conversation. Please try again.');
      setSessionStatus('setup');
    }
  };

  // Enhanced greeting generation
  const getContextualGreeting = (scenario: Scenario): string => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    
    const greetings: Record<string, string[]> = {
      'sales': [
        `Good ${timeOfDay}! I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. I'm excited to learn more about what you're offering and how it might help us.`,
        `Hello! I'm ${scenario.character_name} from the ${scenario.character_role} team. I've heard you might have a solution that could help us with ${scenario.title}. I'm all ears!`
      ],
      'project-manager': [
        `Hi there! I'm ${scenario.character_name}. Thanks for setting up this meeting about ${scenario.title}. What should we prioritize in our discussion today?`,
        `Good ${timeOfDay}! I'm ${scenario.character_name}. I'm here for our scheduled discussion about ${scenario.title}. How should we approach this?`
      ],
      'support-agent': [
        `Hi! I'm ${scenario.character_name} and I really need some help today. I'm having issues with ${scenario.title} and I'm hoping you can guide me through this. Can you assist?`,
        `Hello! My name is ${scenario.character_name}. I'm experiencing some challenges related to ${scenario.title} and I heard you might be able to help me resolve this.`
      ],
      'manager': [
        `Good ${timeOfDay}! Thanks for meeting with me today, I'm ${scenario.character_name}. I wanted to discuss ${scenario.title} with you. How do you feel things are going overall?`,
        `Hi! I'm ${scenario.character_name}. I appreciate you taking the time for this conversation about ${scenario.title}. What's your perspective on the current situation?`
      ]
    };

    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    return roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
  };

  // Get scenario objectives (same as before)
  const getScenarioObjectives = (role: string): string[] => {
    const objectiveMap: Record<string, string[]> = {
      'sales': [
        'Build rapport and establish trust with the prospect',
        'Identify customer needs and pain points through questioning',
        'Present solution benefits clearly and guide toward next steps'
      ],
      'project-manager': [
        'Clarify project scope, timeline, and deliverables',
        'Identify stakeholders and manage expectations',
        'Establish clear next steps and accountability'
      ],
      'product-manager': [
        'Gather comprehensive user requirements and feedback',
        'Prioritize features based on business impact',
        'Align stakeholders on product roadmap decisions'
      ],
      'leader': [
        'Communicate organizational vision and strategic direction',
        'Inspire and motivate team members toward common goals',
        'Demonstrate emotional intelligence and active listening'
      ],
      'manager': [
        'Provide specific, constructive feedback on performance',
        'Set clear expectations and measurable goals',
        'Support professional development and career growth'
      ],
      'support-agent': [
        'Quickly understand and diagnose customer issues',
        'Provide clear, step-by-step solutions and guidance',
        'Ensure complete issue resolution and customer satisfaction'
      ],
      'data-analyst': [
        'Understand business questions and analytical requirements',
        'Communicate findings clearly to non-technical stakeholders',
        'Provide actionable insights and data-driven recommendations'
      ],
      'engineer': [
        'Understand technical requirements and system constraints',
        'Communicate technical concepts to non-technical stakeholders',
        'Collaborate effectively on solution architecture decisions'
      ],
      'nurse': [
        'Provide compassionate and professional patient care',
        'Communicate clearly about procedures and care plans',
        'Coordinate effectively with medical team members'
      ],
      'doctor': [
        'Gather comprehensive patient history and symptoms',
        'Explain medical conditions and treatment options clearly',
        'Involve patients in treatment decisions and ensure informed consent'
      ]
    };
    
    return objectiveMap[role] || objectiveMap['sales'];
  };

  // Initialize session (same as before but with enhanced status tracking)
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  const initializeSession = async () => {
    try {
      setSessionStatus('setup');
      
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
      
      // Initialize objectives
      const scenarioObjectives = getScenarioObjectives(scenarioData.role);
      const objectiveProgress: ObjectiveProgress[] = scenarioObjectives.map((obj, index) => ({
        id: `obj_${index + 1}`,
        text: obj,
        completed: false
      }));
      setObjectives(objectiveProgress);
      
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
        setSessionStatus('ready');
      }
      
    } catch (err) {
      console.error('Enhanced session initialization error:', err);
      setError('Failed to initialize session. Please try again.');
      setSessionStatus('setup');
    }
  };

  // Enhanced user speech processing
  const processUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || userMessage.length < 2 || !scenario || !sessionId || !isActive || isEnding || processingRef.current) {
      return;
    }
    
    console.log('🔄 Processing enhanced user speech:', userMessage);
    
    // Set processing state
    processingRef.current = true;
    setIsProcessing(true);
    setSessionStatus('processing');
    
    // Create user message with confidence
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now(),
      confidence
    };
    
    // Update conversation state
    const updatedConversation = [...conversationRef.current, userMsg];
    setConversation(updatedConversation);
    conversationRef.current = updatedConversation;
    
    await saveConversation(updatedConversation);

    try {
      // Get AI response
      const aiResponse = await getAIResponse(scenario, userMessage, updatedConversation);
      
      if (!aiResponse || !aiResponse.response) {
        throw new Error('No response from AI');
      }
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now()
      };
      
      // Update conversation with AI response
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      conversationRef.current = finalConversation;
      
      await saveConversation(finalConversation);
      
      // Update objectives
      updateObjectiveProgress(finalConversation);
      
      // Check for natural ending
      if (aiResponse.shouldEndConversation && !aiSuggestedEnd) {
        setAiSuggestedEnd(true);
      }
      
      // Reset processing state
      processingRef.current = false;
      setIsProcessing(false);
      setSessionStatus('speaking');
      
      // Speak AI response with enhanced timing
      await speakMessage(aiResponse.response);
      
    } catch (err) {
      console.error('❌ Enhanced speech processing error:', err);
      processingRef.current = false;
      setIsProcessing(false);
      setSessionStatus('active');
      
      setError('Having trouble processing your message. Please try speaking again.');
      
      // Enhanced error recovery
      setTimeout(() => {
        if (isActive && microphoneEnabled && !isEnding) {
          setError('');
          startListening();
        }
      }, 3000);
    }
  };

  // Enhanced objective progress tracking
  const updateObjectiveProgress = (conversationHistory: ConversationMessage[]) => {
    if (!scenario) return;
    
    const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
    const conversationText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    // Enhanced keyword-based objective detection with confidence scoring
    const updatedObjectives = objectives.map(obj => {
      let completed = false;
      let evidence = '';
      let confidenceScore = 0;
      
      if (obj.text.includes('rapport') || obj.text.includes('trust')) {
        const rapportWords = ['hello', 'hi', 'nice', 'pleasure', 'thank', 'appreciate', 'good morning', 'good afternoon', 'how are you', 'great to meet'];
        const matches = rapportWords.filter(word => conversationText.includes(word));
        confidenceScore = matches.length * 0.2;
        completed = confidenceScore >= 0.4;
        if (completed) evidence = `Used ${matches.length} rapport-building phrases`;
      }
      
      if (obj.text.includes('needs') || obj.text.includes('requirements') || obj.text.includes('questions')) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'tell me', 'can you', 'would you', 'do you', 'are you', 'could you', 'help me understand'];
        const matches = questionWords.filter(word => conversationText.includes(word));
        confidenceScore = matches.length * 0.15;
        completed = confidenceScore >= 0.3;
        if (completed) evidence = `Asked ${matches.length} discovery questions`;
      }
      
      if (obj.text.includes('solution') || obj.text.includes('benefits') || obj.text.includes('present')) {
        const solutionWords = ['we can', 'i can', 'this will', 'help', 'benefit', 'solution', 'offer', 'provide', 'recommend', 'suggest', 'propose'];
        const matches = solutionWords.filter(word => conversationText.includes(word));
        confidenceScore = matches.length * 0.2;
        completed = confidenceScore >= 0.4;
        if (completed) evidence = `Presented ${matches.length} solution elements`;
      }
      
      return { ...obj, completed, evidence };
    });
    
    setObjectives(updatedObjectives);
    setObjectivesCompleted(updatedObjectives.filter(obj => obj.completed).length);
  };

  // Enhanced AI response function (same as before)
  const getAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    try {
      const response = await fetch('/api/ai-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage,
          conversationHistory,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI response failed');
      }
      
      return data.data;
    } catch (error) {
      console.error('❌ Error calling AI API:', error);
      throw error;
    }
  };

  // Enhanced conversation saving (same as before)
  const saveConversation = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          conversation: updatedConversation
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save conversation:', response.status);
      }
    } catch (err) {
      console.error('❌ Error saving conversation:', err);
    }
  };

  // Enhanced session ending
  const endSession = async () => {
    if (isEnding) return;
    
    console.log('🛑 Ending enhanced session...');
    
    setIsEnding(true);
    setSessionStatus('ending');
    setMicrophoneEnabled(false);
    cleanup();
    setIsActive(false);
    
    // Save enhanced session data
    if (sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        // Enhanced scoring algorithm
        let score = 2.0;
        score += (objectivesCompleted / objectives.length) * 2.0; // Objectives weight
        score += exchanges >= 4 ? 0.5 : 0; // Engagement bonus
        score += duration >= 3 ? 0.5 : 0; // Duration bonus
        
        // Confidence bonus from speech recognition
        const avgConfidence = conversation
          .filter(msg => msg.speaker === 'user' && msg.confidence)
          .reduce((sum, msg) => sum + (msg.confidence || 0), 0) / 
          conversation.filter(msg => msg.speaker === 'user' && msg.confidence).length || 0;
        
        if (avgConfidence > 0.8) score += 0.3; // High confidence bonus
        score = Math.min(5.0, score);
        
        await fetch('/api/sessions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            session_status: 'completed',
            duration_minutes: duration,
            overall_score: score,
            conversation_metadata: {
              natural_ending: aiSuggestedEnd,
              session_quality: exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : 'basic',
              total_exchanges: exchanges,
              objectives_completed: objectivesCompleted,
              objectives_total: objectives.length,
              average_confidence: avgConfidence,
              enhanced_features_used: true
            }
          })
        });

      } catch (err) {
        console.error('Error saving enhanced session data:', err);
      }
    }
    
    // Prepare enhanced feedback data
    const sessionData = {
      scenario,
      conversation,
      duration: Math.floor((Date.now() - startTime) / 60000),
      exchanges: Math.floor(conversation.length / 2),
      userEmail: localStorage.getItem('userEmail'),
      sessionId,
      objectives,
      objectivesCompleted,
      sessionContext: {
        startTime,
        naturalEnding: aiSuggestedEnd,
        sessionQuality: conversation.length >= 12 ? 'excellent' : conversation.length >= 8 ? 'good' : 'basic',
        enhancedFeatures: {
          voiceConfidence: conversation.filter(msg => msg.speaker === 'user' && msg.confidence).length > 0,
          naturalConversationFlow: true,
          adaptiveListening: true
        }
      }
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // Enhanced status info with more detailed states
  const getEnhancedStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    
    switch (sessionStatus) {
      case 'setup':
        return { 
          icon: '⏳', 
          title: 'Setting Up...', 
          message: 'Preparing your voice conversation', 
          color: 'bg-gray-500' 
        };
      
      case 'ready':
        return { 
          icon: '🎯', 
          title: 'Ready to Start', 
          message: `Practice with ${scenario?.character_name}`, 
          color: 'bg-blue-500' 
        };
      
      case 'processing':
        return { 
          icon: '🤖', 
          title: 'AI Processing...', 
          message: `${scenario?.character_name} is thinking`, 
          color: 'bg-orange-500' 
        };
      
      case 'speaking':
        return { 
          icon: '🔊', 
          title: `${scenario?.character_name} Speaking`, 
          message: 'Listen carefully to the response', 
          color: 'bg-purple-500' 
        };
      
      case 'listening':
        return { 
          icon: '🎤', 
          title: 'Your Turn to Speak', 
          message: currentTranscript || 'Speak clearly into your microphone',
          color: 'bg-green-500'
        };
      
      case 'ending':
        return { 
          icon: '🏁', 
          title: 'Session Ending...', 
          message: 'Preparing your feedback', 
          color: 'bg-red-500' 
        };
      
      default:
        return { 
          icon: '💬', 
          title: 'In Conversation', 
          message: `${exchanges} exchanges completed`, 
          color: 'bg-blue-600' 
        };
    }
  };

  // Enhanced manual controls
  const toggleMicrophone = () => {
    if (!microphoneEnabled) {
      setError('Please start the conversation first to enable microphone controls.');
      return;
    }

    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setSessionStatus('active');
    } else if (!isSpeaking && !isProcessing) {
      // Start listening
      startListening();
    }
  };

  const restartListening = () => {
    console.log('🔄 Manual restart of enhanced listening...');
    setError('');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTimeout(() => {
      if (isActive && microphoneEnabled && !isSpeaking && !isProcessing) {
        startListening();
      }
    }, 1000);
  };

  // Loading state
  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Enhanced Session</h2>
          <p className="text-gray-600">Setting up your AI voice conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && sessionStatus === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Session Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setError('');
                window.location.reload();
              }}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Refresh & Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getEnhancedStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                🎯
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
                <p className="text-sm text-gray-600">
                  Enhanced Voice Chat • {scenario.character_name} • {scenario.difficulty} level
                </p>
              </div>
            </div>
            
            {/* Enhanced Controls */}
            <div className="flex items-center space-x-4">
              {/* Microphone Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                microphoneEnabled 
                  ? isListening 
                    ? 'bg-green-100 text-green-800 animate-pulse' 
                    : 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-lg">
                  {isListening ? '🎤' : microphoneEnabled ? '🔇' : '❌'}
                </span>
                <span className="text-sm font-medium">
                  {isListening ? 'Listening' : microphoneEnabled ? 'Ready' : 'Disabled'}
                </span>
              </div>
              
              {/* Manual Controls */}
              {microphoneEnabled && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleMicrophone}
                    disabled={isSpeaking || isProcessing}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSpeaking || isProcessing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isListening
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isListening ? '⏸️ Pause' : '🎤 Listen'}
                  </button>
                  
                  {error && (
                    <button
                      onClick={restartListening}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              )}
              
              {/* End Session Button */}
              <button
                onClick={endSession}
                disabled={isEnding}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                  isEnding 
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : aiSuggestedEnd
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 animate-pulse'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                }`}
              >
                {isEnding ? 'Ending...' : aiSuggestedEnd ? '🎉 Get Feedback' : '🛑 End Session'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Status Bar */}
      <div className={`${statusInfo.color} text-white px-6 py-4`}>
        <div className="max-w-6xl mx-auto">
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
                <div className="font-bold">{Math.floor((Date.now() - startTime) / 60000)}m</div>
                <div className="opacity-75">Duration</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{objectivesCompleted}/{objectives.length}</div>
                <div className="opacity-75">Objectives</div>
              </div>
              {conversation.filter(msg => msg.speaker === 'user' && msg.confidence).length > 0 && (
                <div className="text-center">
                  <div className="font-bold">
                    {Math.round(conversation
                      .filter(msg => msg.speaker === 'user' && msg.confidence)
                      .reduce((sum, msg) => sum + (msg.confidence || 0), 0) / 
                      conversation.filter(msg => msg.speaker === 'user' && msg.confidence).length * 100
                    )}%
                  </div>
                  <div className="opacity-75">Clarity</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && sessionStatus !== 'setup' && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enhanced Objectives Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">🎯</span>
              Session Objectives
            </h3>
            
            <div className="space-y-3">
              {objectives.map((objective, index) => (
                <div
                  key={objective.id}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    objective.completed
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      objective.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {objective.completed ? '✓' : index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${objective.completed ? 'text-green-800' : 'text-gray-700'}`}>
                        {objective.text}
                      </p>
                      {objective.completed && objective.evidence && (
                        <p className="text-xs text-green-600 mt-1 italic">
                          ✨ {objective.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Enhanced Progress Display */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {objectivesCompleted}/{objectives.length}
                </div>
                <div className="text-sm text-blue-800">Objectives Completed</div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(objectivesCompleted / objectives.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Enhanced Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-2">Enhanced Debug:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Status: {sessionStatus}</div>
                  <div>Microphone: {microphoneEnabled ? '✅' : '❌'}</div>
                  <div>Listening: {isListening ? '✅' : '❌'}</div>
                  <div>Speaking: {isSpeaking ? '✅' : '❌'}</div>
                  <div>Processing: {isProcessing ? '✅' : '❌'}</div>
                  <div>Retries: {retryCountRef.current}/{maxRetries}</div>
                  <div>Permission: {hasPermission ? '✅' : '❌'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Conversation Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
            <div className="p-6">
              
              {/* Start Screen */}
              {conversation.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🎯</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for Enhanced Voice Practice!</h3>
                  <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                    Practice with <strong>{scenario.character_name}</strong>, 
                    a {scenario.character_role}. This session includes enhanced voice recognition and natural conversation flow.
                  </p>
                  
                  {sessionStatus === 'setup' && !hasPermission ? (
                    <div className="space-y-4">
                      <button
                        onClick={startConversation}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                      >
                        🎤 Start Enhanced Conversation
                      </button>
                      <div className="text-sm text-gray-500">
                        ✨ Includes advanced speech recognition and natural conversation timing
                      </div>
                    </div>
                  ) : sessionStatus === 'ready' ? (
                    <div className="space-y-4">
                      <button
                        onClick={startConversation}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
                      >
                        🚀 Begin Conversation
                      </button>
                      <div className="text-sm text-green-600">
                        ✅ Microphone ready • Enhanced features enabled
                      </div>
                    </div>
                  ) : (
                    <div className="text-blue-600">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg">Preparing enhanced voice session...</p>
                    </div>
                  )}
                </div>
              ) : (
                
                /* Enhanced Conversation Messages */
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
                          <span>{message.speaker === 'user' ? 'You' : scenario.character_name}</span>
                          {message.confidence && (
                            <span className="bg-blue-600 px-2 py-1 rounded-full text-xs text-white">
                              {Math.round(message.confidence * 100)}% clear
                            </span>
                          )}
                        </div>
                        <div className="leading-relaxed">{message.message}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Enhanced Current Transcript */}
                  {currentTranscript && isListening && (
                    <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 animate-pulse">
                        👤
                      </div>
                      <div className="flex-1 max-w-md p-4 rounded-2xl bg-yellow-50 border-2 border-dashed border-yellow-300 text-yellow-800">
                        <div className="text-xs mb-2 font-medium text-yellow-600 flex items-center">
                          <span>You (speaking...)</span>
                          <div className="ml-2 flex space-x-1">
                            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce"></div>
                            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1 h-1 bg-yellow-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                        <div className="leading-relaxed">{currentTranscript}</div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Processing Indicator */}
                  {isProcessing && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></div>
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-purple-600 text-sm font-medium">
                          {scenario.character_name} is thinking...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Listening Indicator */}
                  {isListening && !currentTranscript && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 text-sm font-medium">
                          🎤 Listening for your response...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Speaking Indicator */}
                  {isSpeaking && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-purple-600 text-sm font-medium">
                          🔊 {scenario.character_name} is speaking...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Natural Ending Suggestion */}
      {aiSuggestedEnd && !isEnding && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Perfect Natural Conclusion!</h3>
            <p className="text-green-700 mb-4">
              Your enhanced conversation with {scenario.character_name} reached a natural end. 
              You completed {objectivesCompleted}/{objectives.length} objectives in {Math.floor(conversation.length / 2)} exchanges 
              with excellent voice clarity!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={endSession}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                🎉 Get Enhanced Feedback
              </button>
              <button
                onClick={() => setAiSuggestedEnd(false)}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600"
              >
                Continue Talking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

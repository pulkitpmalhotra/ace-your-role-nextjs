// app/session/[id]/page.tsx - Fixed AI Conversation & Voice Timing
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

export default function FixedSessionPage({ params }: { params: { id: string } }) {
  // Core state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Objectives state
  const [objectives, setObjectives] = useState<ObjectiveProgress[]>([]);
  const [objectivesCompleted, setObjectivesCompleted] = useState(0);
  
  // Fixed speech state with proper timing
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
  
  // Fixed refs for proper voice handling
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationRef = useRef<ConversationMessage[]>([]);
  const processingRef = useRef(false);
  const userSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  
  // Fixed timing constants
  const USER_SILENCE_TIMEOUT = 8000; // 8 seconds of silence before processing
  const AI_RESPONSE_DELAY = 2000; // 2 seconds delay before AI starts speaking
  const POST_AI_DELAY = 3000; // 3 seconds after AI finishes before listening again
  
  const router = useRouter();

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Enhanced cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up voice components...');
    
    // Clear all timeouts
    if (userSpeechTimeoutRef.current) {
      clearTimeout(userSpeechTimeoutRef.current);
      userSpeechTimeoutRef.current = null;
    }
    
    if (aiResponseTimeoutRef.current) {
      clearTimeout(aiResponseTimeoutRef.current);
      aiResponseTimeoutRef.current = null;
    }
    
    // Stop speech recognition
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

  // Fixed microphone permission
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      console.log('🎤 Requesting microphone permission...');
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
      
      console.log('✅ Microphone permission granted');
      setHasPermission(true);
      setMicrophoneEnabled(true);
      setError('');
      setSessionStatus('ready');
      return true;
      
    } catch (err: any) {
      console.error('❌ Microphone permission error:', err);
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

  // Fixed speech recognition with proper user silence handling
  const startListening = useCallback(() => {
    if (!isActive || !microphoneEnabled || isSpeaking || processingRef.current || isEnding) {
      console.log('🚫 Cannot start listening:', { 
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

    console.log('🎤 Starting speech recognition...');
    setSessionStatus('listening');
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced configuration
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;
    
    recognitionRef.current = recognition;
    
    let finalTranscript = '';
    let hasRecognizedSpeech = false;
    let lastSpeechTime = Date.now();

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      setIsListening(true);
      setCurrentTranscript('');
      hasRecognizedSpeech = false;
      retryCountRef.current = 0;
      lastSpeechTime = Date.now();
    };

    recognition.onresult = (event: any) => {
      if (!isActive || !microphoneEnabled || processingRef.current || isEnding) {
        return;
      }

      // Clear any existing user speech timeout
      if (userSpeechTimeoutRef.current) {
        clearTimeout(userSpeechTimeoutRef.current);
        userSpeechTimeoutRef.current = null;
      }

      hasRecognizedSpeech = true;
      lastSpeechTime = Date.now();

      let interimTranscript = '';
      let bestConfidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        const confidence = result[0].confidence || 0.8;
        
        if (result.isFinal) {
          finalTranscript = transcript;
          bestConfidence = confidence;
          console.log('🎤 Final transcript:', finalTranscript, 'confidence:', confidence);
        } else {
          interimTranscript = transcript;
          bestConfidence = Math.max(bestConfidence, confidence);
        }
      }

      // Show interim results
      setCurrentTranscript(interimTranscript);

      // Process final transcript immediately if high confidence
      if (finalTranscript && finalTranscript.length > 2 && bestConfidence > 0.7) {
        console.log('✅ Processing high confidence transcript immediately');
        recognition.stop();
        return;
      }

      // Set timeout for user silence (fixed timing)
      userSpeechTimeoutRef.current = setTimeout(() => {
        if (hasRecognizedSpeech && !processingRef.current) {
          const currentTranscriptValue = interimTranscript || finalTranscript;
          if (currentTranscriptValue && currentTranscriptValue.length > 2) {
            console.log('⏰ User silence timeout - processing transcript:', currentTranscriptValue);
            recognition.stop();
            setIsListening(false);
            setCurrentTranscript('');
            processUserSpeech(currentTranscriptValue, bestConfidence || 0.8);
          }
        }
      }, USER_SILENCE_TIMEOUT);
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      setIsListening(false);
      setCurrentTranscript('');
      setSessionStatus('active');
      
      // Clear timeouts
      if (userSpeechTimeoutRef.current) {
        clearTimeout(userSpeechTimeoutRef.current);
        userSpeechTimeoutRef.current = null;
      }
      
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. Please allow microphone access and refresh the page.');
        setMicrophoneEnabled(false);
        return;
      }
      
      // Enhanced retry logic
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
      console.log('🎤 Speech recognition ended');
      setIsListening(false);
      setSessionStatus('active');
      
      // Clear timeout
      if (userSpeechTimeoutRef.current) {
        clearTimeout(userSpeechTimeoutRef.current);
        userSpeechTimeoutRef.current = null;
      }
      
      // Process final transcript if available
      if (finalTranscript && finalTranscript.length > 2 && !processingRef.current) {
        console.log('🎤 Processing final transcript on end:', finalTranscript);
        processUserSpeech(finalTranscript, 0.8);
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
      setSessionStatus('active');
    }
  }, [isActive, microphoneEnabled, isSpeaking, isEnding]);

  // Fixed speech synthesis with proper timing
  const speakMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.log('⚠️ Speech synthesis not available');
        resolve();
        return;
      }
      
      console.log('🔊 AI speaking:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
      setSessionStatus('speaking');
      
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced voice settings
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      utterance.lang = 'en-US';
      
      // Select consistent voice
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = voices.find(voice => 
        voice.name.includes('Google US English') || 
        voice.name.includes('Microsoft David') ||
        voice.name.includes('Alex')
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🎤 Using voice:', selectedVoice.name);
      }
      
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        console.log('🔊 AI finished speaking');
        setIsSpeaking(false);
        setSessionStatus('active');
        utteranceRef.current = null;
        
        // Fixed timing: Wait before starting to listen again
        aiResponseTimeoutRef.current = setTimeout(() => {
          if (isActive && microphoneEnabled && !isEnding && !processingRef.current) {
            console.log('🎤 Starting to listen after AI response delay');
            startListening();
          }
          aiResponseTimeoutRef.current = null;
        }, POST_AI_DELAY);
        
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🔊 Speech synthesis error:', event);
        setIsSpeaking(false);
        setSessionStatus('active');
        utteranceRef.current = null;
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  // Fixed conversation starter
  const startConversation = async () => {
    if (!scenario || !sessionId) return;

    try {
      // Request microphone permission
      const permissionGranted = await requestMicrophonePermission();
      if (!permissionGranted) return;

      console.log('🎯 Starting conversation...');
      setSessionStatus('active');
      
      // Create contextual greeting based on scenario
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
      
      console.log('🔊 AI will speak greeting...');
      
      // Fixed timing: Add delay before AI speaks, then start listening
      setTimeout(async () => {
        await speakMessage(greeting);
      }, AI_RESPONSE_DELAY);
      
    } catch (err) {
      console.error('❌ Conversation start error:', err);
      setError('Failed to start conversation. Please try again.');
      setSessionStatus('setup');
    }
  };

  // Fixed greeting generation
  const getContextualGreeting = (scenario: Scenario): string => {
    const timeOfDay = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening';
    
    const greetings: Record<string, string[]> = {
      'sales': [
        `Good ${timeOfDay}! I'm ${scenario.character_name} from ${scenario.character_role}. I understand you wanted to discuss ${scenario.title}. I'm curious to learn more about what you're offering.`,
        `Hello! I'm ${scenario.character_name}. I've heard you might have a solution that could help us with our current challenges. What can you tell me about it?`
      ],
      'project-manager': [
        `Hi! I'm ${scenario.character_name}. Thanks for setting up this meeting about ${scenario.title}. I have some questions about the scope and timeline.`,
        `Good ${timeOfDay}! I'm ${scenario.character_name}. I'm here to discuss ${scenario.title}. What's your take on how we should approach this?`
      ],
      'support-agent': [
        `Hi, I'm ${scenario.character_name} and I really need help today. I'm having issues with ${scenario.title} and it's been frustrating. Can you assist me?`,
        `Hello! My name is ${scenario.character_name}. I'm experiencing problems with ${scenario.title} and I heard you might be able to help me resolve this.`
      ],
      'manager': [
        `Good ${timeOfDay}! Thanks for meeting with me, I'm ${scenario.character_name}. I wanted to discuss ${scenario.title} with you. How do you think things are going?`,
        `Hi! I'm ${scenario.character_name}. I appreciate you taking time for this conversation about ${scenario.title}. What's your perspective?`
      ],
      'product-manager': [
        `Hello! I'm ${scenario.character_name}. I wanted to discuss ${scenario.title} with you. I have some ideas but I'd love to hear your thoughts first.`,
        `Good ${timeOfDay}! I'm ${scenario.character_name}. We need to talk about ${scenario.title}. What's your take on the current situation?`
      ],
      'leader': [
        `Good ${timeOfDay}! I'm ${scenario.character_name}. I wanted to discuss the ${scenario.title} initiative with you. How do you see this fitting with our goals?`,
        `Hello! I'm ${scenario.character_name}. I'm here to talk about ${scenario.title}. What are your thoughts on this direction?`
      ]
    };

    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    return roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
  };

  // Get scenario objectives
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
      ]
    };
    
    return objectiveMap[role] || objectiveMap['sales'];
  };

  // Initialize session
  useEffect(() => {
    initializeSession();
    
    // Ensure voice selection
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🎤 Available voices:', voices.map(v => v.name));
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
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
      console.error('Session initialization error:', err);
      setError('Failed to initialize session. Please try again.');
      setSessionStatus('setup');
    }
  };

  // Fixed user speech processing with better AI calls
  const processUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || userMessage.length < 2 || !scenario || !sessionId || !isActive || isEnding || processingRef.current) {
      return;
    }
    
    console.log('🔄 Processing user speech:', userMessage);
    
    // Set processing state
    processingRef.current = true;
    setIsProcessing(true);
    setSessionStatus('processing');
    
    // Create user message
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
      // Call AI API with retry logic
      let aiResponse = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!aiResponse && attempts < maxAttempts) {
        attempts++;
        console.log(`🤖 AI API call attempt ${attempts}/${maxAttempts}`);
        
        try {
          const response = await fetch('/api/ai-conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenario,
              userMessage,
              conversationHistory: updatedConversation,
              sessionId
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout
          });

          if (!response.ok) {
            throw new Error(`AI API failed with status: ${response.status}`);
          }

          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'AI response failed');
          }
          
          aiResponse = data.data;
          console.log(`✅ AI API call successful on attempt ${attempts}`);
          break;
          
        } catch (apiError) {
          console.error(`❌ AI API attempt ${attempts} failed:`, apiError);
          
          if (attempts === maxAttempts) {
            // Use intelligent fallback
            aiResponse = generateIntelligentFallback(scenario, userMessage, updatedConversation);
            console.log('🔄 Using intelligent fallback after all attempts failed');
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
      }
      
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
      
      // Speak AI response with fixed timing
      setTimeout(async () => {
        await speakMessage(aiResponse.response);
      }, AI_RESPONSE_DELAY);
      
    } catch (err) {
      console.error('❌ Speech processing error:', err);
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

  // Intelligent fallback generator
  const generateIntelligentFallback = (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    const exchanges = Math.floor(conversationHistory.length / 2);
    const stage = exchanges < 3 ? 'opening' : exchanges < 6 ? 'middle' : 'closing';
    
    // More intelligent context-aware fallbacks
    const intelligentResponses: Record<string, Record<string, string[]>> = {
      'sales': {
        opening: [
          `That sounds interesting. Can you tell me more about how this specifically addresses our challenges?`,
          `I appreciate you explaining that. What makes your approach different from others we've considered?`,
          `Help me understand - what kind of ROI have other companies seen with this solution?`
        ],
        middle: [
          `That's a compelling point. What would the implementation timeline look like for us?`,
          `I can see the value proposition. What are the total costs involved?`,
          `This sounds promising. How do you handle training and ongoing support?`
        ],
        closing: [
          `I think this could work for us. What are the next steps to move forward?`,
          `Let me discuss this with my team. When could we schedule a follow-up meeting?`,
          `What kind of timeline are we looking at for implementation?`
        ]
      },
      'support-agent': {
        opening: [
          `I've been dealing with this issue for hours and it's really frustrating. Can you help me?`,
          `This problem is affecting my work productivity. What can we do to fix it?`,
          `I've tried the basic troubleshooting steps but nothing worked. What else can I try?`
        ],
        middle: [
          `Okay, I tried that but I'm still seeing the same error. What's the next step?`,
          `That seems to have helped a bit, but the issue isn't completely resolved. What else?`,
          `I'm following your instructions but I'm not very technical. Can you walk me through it slowly?`
        ],
        closing: [
          `Perfect! That fixed it. Thank you so much for your patience.`,
          `Great, it's working now. Is there anything I should do to prevent this in the future?`,
          `Excellent support! I really appreciate you helping me resolve this issue.`
        ]
      }
    };
    
    const roleResponses = intelligentResponses[scenario.role] || intelligentResponses['sales'];
    const stageResponses = roleResponses[stage] || roleResponses['opening'];
    const response = stageResponses[Math.floor(Math.random() * stageResponses.length)];
    
    return {
      response,
      character: scenario.character_name,
      emotion: 'engaged',
      shouldEndConversation: stage === 'closing' && exchanges >= 8,
      model: 'intelligent-fallback'
    };
  };

  // Update objective progress
  const updateObjectiveProgress = (conversationHistory: ConversationMessage[]) => {
    if (!scenario) return;
    
    const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
    const conversationText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    const updatedObjectives = objectives.map(obj => {
      let completed = false;
      let evidence = '';
      
      if (obj.text.includes('rapport') || obj.text.includes('trust')) {
        const rapportWords = ['hello', 'hi', 'nice', 'pleasure', 'thank', 'appreciate', 'good morning', 'good afternoon', 'how are you', 'great to meet'];
        const matches = rapportWords.filter(word => conversationText.includes(word));
        completed = matches.length >= 2;
        if (completed) evidence = `Used ${matches.length} rapport-building phrases`;
      }
      
      if (obj.text.includes('needs') || obj.text.includes('requirements') || obj.text.includes('questions')) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'tell me', 'can you', 'would you', 'do you', 'are you', 'could you', 'help me understand'];
        const matches = questionWords.filter(word => conversationText.includes(word));
        completed = matches.length >= 3;
        if (completed) evidence = `Asked ${matches.length} discovery questions`;
      }
      
      if (obj.text.includes('solution') || obj.text.includes('benefits') || obj.text.includes('present')) {
        const solutionWords = ['we can', 'i can', 'this will', 'help', 'benefit', 'solution', 'offer', 'provide', 'recommend', 'suggest', 'propose'];
        const matches = solutionWords.filter(word => conversationText.includes(word));
        completed = matches.length >= 2;
        if (completed) evidence = `Presented ${matches.length} solution elements`;
      }
      
      return { ...obj, completed, evidence };
    });
    
    setObjectives(updatedObjectives);
    setObjectivesCompleted(updatedObjectives.filter(obj => obj.completed).length);
  };

  // Save conversation
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

  // End session
  const endSession = async () => {
    if (isEnding) return;
    
    console.log('🛑 Ending session...');
    
    setIsEnding(true);
    setSessionStatus('ending');
    setMicrophoneEnabled(false);
    cleanup();
    setIsActive(false);
    
    // Save session data
    if (sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        let score = 2.0;
        score += (objectivesCompleted / objectives.length) * 2.0;
        score += exchanges >= 4 ? 0.5 : 0;
        score += duration >= 3 ? 0.5 : 0;
        
        const avgConfidence = conversation
          .filter(msg => msg.speaker === 'user' && msg.confidence)
          .reduce((sum, msg) => sum + (msg.confidence || 0), 0) / 
          conversation.filter(msg => msg.speaker === 'user' && msg.confidence).length || 0;
        
        if (avgConfidence > 0.8) score += 0.3;
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
        console.error('Error saving session data:', err);
      }
    }
    
    // Prepare feedback data
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
        sessionQuality: conversation.length >= 12 ? 'excellent' : conversation.length >= 8 ? 'good' : 'basic'
      }
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  // Status info
  const getStatusInfo = () => {
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

  // Manual controls
  const toggleMicrophone = () => {
    if (!microphoneEnabled) {
      setError('Please start the conversation first to enable microphone controls.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setSessionStatus('active');
    } else if (!isSpeaking && !isProcessing) {
      startListening();
    }
  };

  const restartListening = () => {
    console.log('🔄 Manual restart of listening...');
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Session</h2>
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

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
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
                  Voice Chat • {scenario.character_name} • {scenario.difficulty} level
                </p>
              </div>
            </div>
            
            {/* Controls */}
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

      {/* Status Bar */}
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
        
        {/* Objectives Panel */}
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
            
            {/* Progress Display */}
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
          </div>
        </div>

        {/* Conversation Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
            <div className="p-6">
              
              {/* Start Screen */}
              {conversation.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🎯</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for Voice Practice!</h3>
                  <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                    Practice with <strong>{scenario.character_name}</strong>, 
                    a {scenario.character_role}. Fixed timing and AI responses!
                  </p>
                  
                  {sessionStatus === 'setup' && !hasPermission ? (
                    <div className="space-y-4">
                      <button
                        onClick={startConversation}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                      >
                        🎤 Start Conversation
                      </button>
                      <div className="text-sm text-gray-500">
                        ✨ With improved speech recognition and AI responses
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
                      <p className="text-lg">Preparing voice session...</p>
                    </div>
                  )}
                </div>
              ) : (
                
                /* Conversation Messages */
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
                  
                  {/* Current Transcript */}
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

                  {/* Processing Indicator */}
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

                  {/* Listening Indicator */}
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

      {/* Natural Ending Suggestion */}
      {aiSuggestedEnd && !isEnding && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Perfect Natural Conclusion!</h3>
            <p className="text-green-700 mb-4">
              Your conversation with {scenario.character_name} reached a natural end. 
              You completed {objectivesCompleted}/{objectives.length} objectives in {Math.floor(conversation.length / 2)} exchanges!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={endSession}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 shadow-lg"
              >
                🎉 Get Feedback
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

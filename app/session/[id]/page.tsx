// app/session/[id]/page.tsx - Fixed Speech Recognition and Conversation Flow
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
  
  // Speech state - Simplified and more reliable
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [error, setError] = useState('');
  
  // Natural ending state
  const [aiSuggestedEnd, setAiSuggestedEnd] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  // Refs for stable references
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const conversationRef = useRef<ConversationMessage[]>([]);
  const processingRef = useRef(false);
  
  const router = useRouter();

  // Keep conversation ref in sync
  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Get scenario objectives based on role
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
      }
      
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('Failed to initialize session. Please try again.');
    }
  };

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up speech components...');
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
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
    processingRef.current = false;
  }, []);

  const startConversation = async () => {
    if (!scenario || !sessionId) return;

    try {
      console.log('🎤 Requesting microphone permission...');
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      setMicrophoneEnabled(true);
      setError('');
      
      console.log('✅ Microphone permission granted');
      
      // Generate greeting
      const greeting = getCharacterGreeting(scenario);
      
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
      
      // Speak greeting and then start listening
      await speakMessage(greeting);
      
      // Start listening after a brief delay
      setTimeout(() => {
        if (isActive && !isEnding && microphoneEnabled) {
          console.log('🎤 Starting to listen for user input...');
          startListening();
        }
      }, 500);
      
    } catch (err) {
      console.error('❌ Microphone permission error:', err);
      setError('Microphone access is required. Please allow microphone access and try again.');
      setMicrophoneEnabled(false);
      setHasPermission(false);
    }
  };

  const getCharacterGreeting = (scenario: Scenario): string => {
    const greetings: Record<string, string[]> = {
      'sales': [
        `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. I'm interested to learn more about what you're offering.`,
        `Hello! I'm ${scenario.character_name}. I've heard you might have a solution that could help us. Tell me more.`
      ],
      'project-manager': [
        `Hi, I'm ${scenario.character_name}. I'm here for our meeting about ${scenario.title}. What's our main focus today?`,
        `Hello! Thanks for setting up this meeting. What should we prioritize?`
      ],
      'support-agent': [
        `Hi there! I'm ${scenario.character_name} and I need some help. I'm having an issue related to ${scenario.title}. Can you assist me?`,
        `Hello, I'm ${scenario.character_name}. I'm experiencing some problems and need assistance. Can you help?`
      ],
      'manager': [
        `Hi, thanks for meeting with me today. I wanted to discuss ${scenario.title}. How do you think things are going?`,
        `Hello! I appreciate you taking the time to chat. What's your perspective on this?`
      ]
    };

    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    return roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
  };

  const speakMessage = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.log('⚠️ Speech synthesis not available');
        resolve();
        return;
      }
      
      console.log('🔊 AI speaking:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
      
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utteranceRef.current = utterance;
      
      utterance.onend = () => {
        console.log('🔊 AI finished speaking');
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('🔊 Speech synthesis error:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const startListening = useCallback(() => {
    // Comprehensive state check
    if (!isActive || !microphoneEnabled || isSpeaking || processingRef.current || isEnding) {
      console.log('🚫 Cannot start listening:', { 
        isActive, 
        microphoneEnabled, 
        isSpeaking, 
        isProcessing: processingRef.current, 
        isEnding 
      });
      return;
    }

    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is only supported in Chrome browser. Please use Chrome to continue.');
      return;
    }

    // Clean up any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (e) {
        console.log('Cleaned up previous recognition');
      }
    }

    console.log('🎤 Initializing speech recognition...');
    
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure recognition for better reliability
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognitionRef.current = recognition;
    
    let silenceTimer: NodeJS.Timeout;
    let finalTranscript = '';
    let hasRecognizedSpeech = false;

    recognition.onstart = () => {
      console.log('🎤 Speech recognition started successfully');
      setIsListening(true);
      setCurrentTranscript('');
      hasRecognizedSpeech = false;
      
      // Set a timeout to detect silence and restart if needed
      silenceTimer = setTimeout(() => {
        if (recognitionRef.current && !hasRecognizedSpeech) {
          console.log('🔄 Restarting recognition due to silence');
          recognition.stop();
        }
      }, 10000); // 10 second timeout
    };

    recognition.onresult = (event: any) => {
      if (!isActive || !microphoneEnabled || processingRef.current || isEnding) {
        console.log('🚫 Ignoring recognition result due to state');
        return;
      }

      clearTimeout(silenceTimer);
      hasRecognizedSpeech = true;

      let interimTranscript = '';
      let confidence = 0;
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();
        confidence = result[0].confidence || 0.8;
        
        if (result.isFinal) {
          finalTranscript = transcript;
          console.log('🎤 Final transcript received:', finalTranscript);
        } else {
          interimTranscript = transcript;
        }
      }

      // Update UI with interim results
      setCurrentTranscript(interimTranscript);

      // Process final transcript
      if (finalTranscript && finalTranscript.length > 0 && !processingRef.current) {
        console.log('✅ Processing final transcript:', finalTranscript);
        recognition.stop(); // Stop recognition before processing
        setIsListening(false);
        setCurrentTranscript('');
        processUserSpeech(finalTranscript, confidence);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      setIsListening(false);
      setCurrentTranscript('');
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
      
      // For other errors, try to restart after a delay
      if (event.error !== 'aborted' && isActive && microphoneEnabled && !processingRef.current && !isEnding) {
        console.log('🔄 Will restart recognition after error:', event.error);
        setTimeout(() => {
          if (isActive && microphoneEnabled && !isSpeaking && !processingRef.current && !isEnding) {
            startListening();
          }
        }, 2000);
      }
    };

    recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      setIsListening(false);
      clearTimeout(silenceTimer);
      
      // Only restart if we haven't captured speech and conditions are still good
      if (!finalTranscript && !hasRecognizedSpeech && isActive && microphoneEnabled && !isSpeaking && !processingRef.current && !isEnding) {
        console.log('🔄 Auto-restarting recognition');
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    // Start recognition
    try {
      recognition.start();
    } catch (error) {
      console.error('🎤 Failed to start recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      setIsListening(false);
    }
  }, [isActive, microphoneEnabled, isSpeaking, isEnding]);

  const processUserSpeech = async (userMessage: string, confidence: number) => {
    if (!userMessage || userMessage.length < 2 || !scenario || !sessionId || !isActive || isEnding || processingRef.current) {
      console.log('🚫 Cannot process speech:', { 
        userMessage: userMessage?.length, 
        scenario: !!scenario, 
        sessionId: !!sessionId, 
        isActive, 
        isEnding, 
        isProcessing: processingRef.current 
      });
      return;
    }
    
    console.log('🔄 Processing user speech:', userMessage);
    
    // Set processing state
    processingRef.current = true;
    setIsProcessing(true);
    
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
    
    console.log('💾 Saving conversation with user message...');
    await saveConversation(updatedConversation);

    try {
      console.log('🤖 Getting AI response...');
      
      // Get AI response
      const aiResponse = await getAIResponse(scenario, userMessage, updatedConversation);
      
      if (!aiResponse || !aiResponse.response) {
        throw new Error('No response from AI');
      }
      
      console.log('🤖 AI responded:', aiResponse.response.substring(0, 50) + '...');
      
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse.response,
        timestamp: Date.now()
      };
      
      // Update conversation with AI response
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      conversationRef.current = finalConversation;
      
      console.log('💾 Saving conversation with AI response...');
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
      
      console.log('🔊 AI will speak response...');
      
      // Speak AI response
      await speakMessage(aiResponse.response);
      
      console.log('🎤 Ready to listen again...');
      
      // Start listening again after AI finishes speaking
      setTimeout(() => {
        if (isActive && microphoneEnabled && !isEnding && !processingRef.current) {
          startListening();
        }
      }, 500);
      
    } catch (err) {
      console.error('❌ Error processing speech:', err);
      processingRef.current = false;
      setIsProcessing(false);
      
      setError('Having trouble processing your message. Please try speaking again.');
      
      // Restart listening after error
      setTimeout(() => {
        if (isActive && microphoneEnabled && !isEnding) {
          startListening();
        }
      }, 2000);
    }
  };

  const updateObjectiveProgress = (conversationHistory: ConversationMessage[]) => {
    if (!scenario) return;
    
    const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
    const conversationText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    // Enhanced keyword-based objective detection
    const updatedObjectives = objectives.map(obj => {
      let completed = false;
      let evidence = '';
      
      if (obj.text.includes('rapport') || obj.text.includes('trust')) {
        const rapportWords = ['hello', 'hi', 'nice', 'pleasure', 'thank', 'appreciate', 'good morning', 'good afternoon', 'how are you'];
        completed = rapportWords.some(word => conversationText.includes(word));
        if (completed) evidence = 'Used greeting and positive language';
      }
      
      if (obj.text.includes('needs') || obj.text.includes('requirements') || obj.text.includes('questions')) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'tell me', 'can you', 'would you', 'do you', 'are you'];
        completed = questionWords.some(word => conversationText.includes(word));
        if (completed) evidence = 'Asked questions to understand needs';
      }
      
      if (obj.text.includes('solution') || obj.text.includes('benefits') || obj.text.includes('present')) {
        const solutionWords = ['we can', 'i can', 'this will', 'help', 'benefit', 'solution', 'offer', 'provide', 'recommend', 'suggest'];
        completed = solutionWords.some(word => conversationText.includes(word));
        if (completed) evidence = 'Presented solutions or benefits';
      }
      
      return { ...obj, completed, evidence };
    });
    
    setObjectives(updatedObjectives);
    setObjectivesCompleted(updatedObjectives.filter(obj => obj.completed).length);
  };

  const getAIResponse = async (scenario: Scenario, userMessage: string, conversationHistory: ConversationMessage[]) => {
    try {
      console.log('📡 Calling AI API...');
      
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
        const errorText = await response.text();
        console.error('AI API failed:', response.status, errorText);
        throw new Error(`AI API failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        console.error('AI API returned error:', data.error);
        throw new Error(data.error || 'AI response failed');
      }
      
      console.log('✅ AI API successful');
      return data.data;
    } catch (error) {
      console.error('❌ Error calling AI API:', error);
      throw error;
    }
  };

  const saveConversation = async (updatedConversation: ConversationMessage[]) => {
    if (!sessionId) {
      console.warn('⚠️ No session ID for saving conversation');
      return;
    }
    
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
      } else {
        console.log('💾 Conversation saved successfully');
      }
    } catch (err) {
      console.error('❌ Error saving conversation:', err);
    }
  };

  const endSession = async () => {
    if (isEnding) return;
    
    console.log('🛑 Ending session...');
    
    setIsEnding(true);
    setMicrophoneEnabled(false);
    cleanup();
    setIsActive(false);
    
    // Save session data
    if (sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        // Calculate score based on objectives and conversation quality
        let score = 2.0;
        score += (objectivesCompleted / objectives.length) * 2.0;
        score += exchanges >= 4 ? 0.5 : 0;
        score += duration >= 3 ? 0.5 : 0;
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
              objectives_total: objectives.length
            }
          })
        });

      } catch (err) {
        console.error('Error saving session data:', err);
      }
    }
    
    // Prepare for feedback
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

  // Manual restart listening button (for debugging)
  const restartListening = () => {
    console.log('🔄 Manual restart listening...');
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setTimeout(() => {
      startListening();
    }, 500);
  };

  // Get status info for UI
  const getStatusInfo = () => {
    const exchanges = Math.floor(conversation.length / 2);
    
    if (!scenario) {
      return { icon: '⏳', title: 'Loading...', message: 'Setting up session', color: 'bg-gray-500' };
    }
    
    if (conversation.length === 0) {
      return { icon: '🎯', title: 'Ready to Start', message: `Practice with ${scenario.character_name}`, color: 'bg-blue-500' };
    }
    
    if (isProcessing) {
      return { icon: '🤖', title: 'AI Processing...', message: `${scenario.character_name} is thinking`, color: 'bg-orange-500' };
    }
    
    if (isSpeaking) {
      return { icon: '🔊', title: `${scenario.character_name} Speaking`, message: 'Listen to the response', color: 'bg-purple-500' };
    }
    
    if (isListening) {
      return { 
        icon: '🎤', 
        title: 'Your Turn to Speak', 
        message: 'Speak clearly into your microphone',
        color: 'bg-green-500'
      };
    }

    if (microphoneEnabled && !isListening && !isSpeaking && !isProcessing) {
      return { icon: '⏸️', title: 'Ready to Listen', message: 'Waiting to start listening...', color: 'bg-blue-500' };
    }
    
    return { icon: '💬', title: 'In Conversation', message: `${exchanges} exchanges completed`, color: 'bg-blue-600' };
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

  // Error state
  if (error) {
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
                  {scenario.character_name} • {scenario.difficulty} level
                </p>
              </div>
            </div>
            
            {/* Microphone Status Indicator */}
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                microphoneEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="text-lg">{microphoneEnabled ? '🎤' : '🔇'}</span>
                <span className="text-sm font-medium">
                  {microphoneEnabled ? 'Mic Active' : 'Mic Disabled'}
                </span>
              </div>
              
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
                      ? 'border-green-500 bg-green-50'
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
                          {objective.evidence}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {objectivesCompleted}/{objectives.length}
                </div>
                <div className="text-sm text-blue-800">Objectives Completed</div>
              </div>
            </div>

            {/* Speech Control Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                <h4 className="text-xs font-bold text-gray-700 mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Microphone: {microphoneEnabled ? '✅' : '❌'}</div>
                  <div>Listening: {isListening ? '✅' : '❌'}</div>
                  <div>Speaking: {isSpeaking ? '✅' : '❌'}</div>
                  <div>Processing: {isProcessing ? '✅' : '❌'}</div>
                  <div>Active: {isActive ? '✅' : '❌'}</div>
                </div>
              </div>
            )}
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Practice!</h3>
                  <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                    Practice with <strong>{scenario.character_name}</strong>, 
                    a {scenario.character_role}. Complete the objectives on the left.
                  </p>
                  
                  {!hasPermission ? (
                    <button
                      onClick={startConversation}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                    >
                      🎤 Start Conversation & Enable Microphone
                    </button>
                  ) : (
                    <div className="text-blue-600">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-lg">Starting conversation...</p>
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
                        <div className={`text-xs mb-2 font-medium ${
                          message.speaker === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.speaker === 'user' ? 'You' : scenario.character_name}
                          {message.confidence && (
                            <span className="ml-2 bg-blue-600 px-2 py-1 rounded-full text-xs">
                              {Math.round(message.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <div className="leading-relaxed">{message.message}</div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Current transcript */}
                  {currentTranscript && isListening && (
                    <div className="flex items-start space-x-3 flex-row-reverse space-x-reverse">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1 max-w-md p-4 rounded-2xl bg-yellow-50 border-2 border-dashed border-yellow-300 text-yellow-800">
                        <div className="text-xs mb-2 font-medium text-yellow-600">
                          You (speaking...)
                        </div>
                        <div className="leading-relaxed">{currentTranscript}</div>
                      </div>
                    </div>
                  )}

                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-purple-600 text-sm ml-2">{scenario.character_name} is thinking...</span>
                      </div>
                    </div>
                  )}

                  {/* Listening indicator */}
                  {isListening && !currentTranscript && (
                    <div className="flex items-center justify-center py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-green-600 text-sm">Listening for your response...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Natural ending suggestion */}
      {aiSuggestedEnd && !isEnding && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Perfect Natural Conclusion!</h3>
            <p className="text-green-700 mb-4">
              Your conversation with {scenario.character_name} reached a natural end. 
              You completed {objectivesCompleted}/{objectives.length} objectives in {Math.floor(conversation.length / 2)} exchanges!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={endSession}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700"
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

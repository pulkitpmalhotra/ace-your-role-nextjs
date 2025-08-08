// app/session/[id]/page.tsx - Fixed Session with Objectives Display
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
      
      // Generate proper character greeting
      const greeting = getCharacterGreeting(scenario);
      
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

  const getCharacterGreeting = (scenario: Scenario): string => {
    const greetings: Record<string, string[]> = {
      'sales': [
        `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. I'm interested to learn more about what you're offering.`,
        `Hello! I'm ${scenario.character_name}. I've heard you might have a solution that could help us with ${scenario.title}. Tell me more.`
      ],
      'project-manager': [
        `Hi, I'm ${scenario.character_name}. I'm here for our meeting about ${scenario.title}. What's our main focus today?`,
        `Hello! Thanks for setting up this meeting about ${scenario.title}. What should we prioritize?`
      ],
      'support-agent': [
        `Hi there! I'm ${scenario.character_name} and I need some help. I'm having an issue related to ${scenario.title}. Can you assist me?`,
        `Hello, I'm ${scenario.character_name}. I'm calling because I'm experiencing some problems with ${scenario.title}. Can you help?`
      ],
      'manager': [
        `Hi, thanks for meeting with me today. I wanted to discuss ${scenario.title}. How do you think things are going so far?`,
        `Hello! I appreciate you taking the time to chat about ${scenario.title}. What's your perspective on this?`
      ]
    };

    const roleGreetings = greetings[scenario.role] || greetings['sales'];
    return roleGreetings[Math.floor(Math.random() * roleGreetings.length)];
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
      
      // Update objectives based on conversation
      updateObjectiveProgress(finalConversation);
      
      // Check for natural ending
      if (aiResponse.shouldEndConversation && !aiSuggestedEnd) {
        setAiSuggestedEnd(true);
      }
      
      // Speak response
      await speakMessage(aiResponse.response);
      
      setIsProcessing(false);
      
      // Continue listening
      setTimeout(() => {
        if (isActive && !isSpeaking && !isEnding) {
          startListening();
        }
      }, 1500);
      
    } catch (err) {
      console.error('Error processing speech:', err);
      setError('Having trouble processing your message. Please try again.');
      setIsProcessing(false);
      
      setTimeout(() => {
        if (isActive && !isEnding) {
          startListening();
        }
      }, 3000);
    }
  };

  const updateObjectiveProgress = (conversationHistory: ConversationMessage[]) => {
    if (!scenario) return;
    
    const userMessages = conversationHistory.filter(msg => msg.speaker === 'user');
    const conversationText = userMessages.map(msg => msg.message.toLowerCase()).join(' ');
    
    // Simple keyword-based objective detection
    const updatedObjectives = objectives.map(obj => {
      let completed = false;
      let evidence = '';
      
      // Basic pattern matching for different objectives
      if (obj.text.includes('rapport') || obj.text.includes('trust')) {
        const rapportWords = ['nice to meet', 'pleasure', 'understand', 'appreciate', 'thanks'];
        completed = rapportWords.some(word => conversationText.includes(word));
        if (completed) evidence = 'Used positive language and showed appreciation';
      }
      
      if (obj.text.includes('needs') || obj.text.includes('requirements')) {
        const questionWords = ['what', 'how', 'why', 'when', 'where', 'tell me', 'explain'];
        completed = questionWords.some(word => conversationText.includes(word));
        if (completed) evidence = 'Asked questions to understand needs';
      }
      
      if (obj.text.includes('solution') || obj.text.includes('benefits')) {
        const solutionWords = ['we can', 'this will', 'help you', 'benefit', 'solution'];
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
      console.error('Error getting AI response:', error);
      throw error; // Re-throw to trigger error handling
    }
  };

  const saveConversation = async (updatedConversation: ConversationMessage[]) => {
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
      console.error('Error saving conversation:', err);
    }
  };

  const endSession = async () => {
    if (isEnding) return;
    
    setIsEnding(true);
    cleanup();
    setIsActive(false);
    
    // Save session data
    if (sessionId && conversation.length > 0) {
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 60000);
      const exchanges = Math.floor(conversation.length / 2);
      
      try {
        // Calculate score based on objectives and conversation quality
        let score = 2.0; // Base score
        score += (objectivesCompleted / objectives.length) * 2.0; // Up to 2 points for objectives
        score += exchanges >= 4 ? 0.5 : 0; // Engagement bonus
        score += duration >= 3 ? 0.5 : 0; // Duration bonus
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
              session_quality

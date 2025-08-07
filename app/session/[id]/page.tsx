// app/session/[id]/page.tsx - Simplified with browser speech APIs
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

export default function SimplifiedSessionPage({ params }: { params: { id: string } }) {
  // Core state
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [startTime] = useState(Date.now());
  
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
      
      // Generate greeting
      const greeting = `Hi, I'm ${scenario.character_name}. I understand you wanted to discuss ${scenario.title}. How can I help you today?`;
      
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
      
      // Fallback response
      const exchanges = Math.floor(conversationHistory.length / 2);
      const shouldSuggestEnding = exchanges >= 6;
      
      return {
        response: shouldSuggestEnding 
          ? "Thank you for this great discussion. I feel we've covered the key points well."
          : "That's interesting. Could you tell me more about that?",
        shouldEndConversation: shouldSuggestEnding
      };
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
        // Calculate score
        let score = 2.0;
        score += exchanges >= 2 ? 0.5 : 0;
        score += exchanges >= 4 ? 0.5 : 0;
        score += exchanges >= 6 ? 0.5 : 0;
        score += exchanges >= 8 ? 0.5 : 0;
        score += duration >= 3 ? 0.5 : 0;
        score += aiSuggestedEnd ? 0.5 : 0;
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
              session_quality: exchanges >= 8 ? 'excellent' : exchanges >= 6 ? 'good' : 'basic'
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
      sessionContext: {
        startTime,
        naturalEnding: aiSuggestedEnd,
        sessionQuality: conversation.length >= 12 ? 'excellent' : conversation.length >= 8 ? 'good' : 'basic'
      }
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
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
      return { icon: '🤖', title: 'AI Thinking...', message: `${scenario.character_name} is processing`, color: 'bg-orange-500' };
    }
    
    if (isSpeaking) {
      return { icon: '🔊', title: `${scenario.character_name} Speaking`, message: 'AI is responding', color: 'bg-purple-500' };
    }
    
    if (isListening) {
      return { 
        icon: '🎤', 
        title: aiSuggestedEnd ? 'Natural Conclusion Ready' : 'Listening...', 
        message: aiSuggestedEnd ? 'Conversation completed - ready for feedback' : 'Speak your message',
        color: aiSuggestedEnd ? 'bg-green-600' : 'bg-green-500'
      };
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
                if (sessionId) startConversation();
              }}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
            >
              Try Again
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-white/20 min-h-[600px]">
          <div className="p-6">
            
            {/* Start Screen */}
            {conversation.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Practice!</h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  Practice with <strong>{scenario.character_name}</strong>, 
                  a {scenario.character_role}. This is a {scenario.difficulty} level scenario.
                </p>
                
                {!hasPermission ? (
                  <button
                    onClick={startConversation}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    🎤 Start Conversation
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
              </div>
            )}
          </div>
        </div>

        {/* Natural ending suggestion */}
        {aiSuggestedEnd && !isEnding && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Perfect Natural Conclusion!</h3>
            <p className="text-green-700 mb-4">
              Your conversation with {scenario.character_name} reached a natural end. 
              Ready to get feedback on your {Math.floor(conversation.length / 2)}-exchange conversation!
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
        )}
      </main>
    </div>
  );
}

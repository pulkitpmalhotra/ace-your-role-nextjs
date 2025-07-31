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
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [sessionStartTime] = useState(Date.now());
  
  // Simple states
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [currentUserSpeech, setCurrentUserSpeech] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }
    setUserEmail(email);

    const storedScenario = localStorage.getItem('currentScenario');
    if (storedScenario) {
      setScenario(JSON.parse(storedScenario));
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  // Start the conversation
  const startConversation = async () => {
    if (!scenario) return;
    
    setSessionActive(true);
    setError('');
    
    // AI greets first
    const greeting = `Hi! I'm ${scenario.character_name}. How can I help you today?`;
    
    const aiMessage: ConversationMessage = {
      speaker: 'ai',
      message: greeting,
      timestamp: Date.now()
    };
    
    setConversation([aiMessage]);
    
    // Speak the greeting
    await speakText(greeting);
    
    // After AI speaks, start listening
    setTimeout(() => {
      startListening();
    }, 1000);
  };

  // Simple speech-to-text
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognitionRef.current = recognition;
    setIsListening(true);
    setCurrentUserSpeech('');

    recognition.onstart = () => {
      console.log('🎤 Listening started');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      setCurrentUserSpeech(transcript);
      
      // If final result, process it
      if (event.results[event.results.length - 1].isFinal) {
        processUserMessage(transcript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setError('Could not understand. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Process what user said
  const processUserMessage = async (userMessage: string) => {
    if (!userMessage || !scenario) return;
    
    setIsListening(false);
    setCurrentUserSpeech('');
    
    // Add user message to conversation
    const userMsg: ConversationMessage = {
      speaker: 'user',
      message: userMessage,
      timestamp: Date.now()
    };
    
    const updatedConversation = [...conversation, userMsg];
    setConversation(updatedConversation);

    // Get AI response
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage,
          conversationHistory: updatedConversation,
          messageCount: Math.floor(updatedConversation.length / 2)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMessage: ConversationMessage = {
          speaker: 'ai',
          message: data.data.response,
          timestamp: Date.now()
        };
        
        const finalConversation = [...updatedConversation, aiMessage];
        setConversation(finalConversation);
        
        // AI speaks response
        await speakText(data.data.response);
        
        // After AI finishes speaking, start listening again
        setTimeout(() => {
          if (sessionActive) {
            startListening();
          }
        }, 1500);
        
      } else {
        setError('AI response failed. Please try again.');
      }
      
    } catch (err) {
      console.error('Error getting AI response:', err);
      setError('Connection error. Please try again.');
    }
  };

  // Simple text-to-speech
  const speakText = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported');
        resolve();
        return;
      }

      setIsAISpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Try to find a good voice
      const voices = speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        setIsAISpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsAISpeaking(false);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  };

  // End session
  const endSession = () => {
    setSessionActive(false);
    stopListening();
    speechSynthesis.cancel();
    
    const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
    const exchanges = Math.floor(conversation.length / 2);
    
    const sessionData = {
      scenario,
      conversation,
      duration,
      exchanges,
      userEmail
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Simple Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
            <p className="text-sm text-gray-600">Talking with {scenario.character_name}</p>
          </div>
          <button
            onClick={endSession}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            End Chat
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        
        {/* Status Indicator */}
        <div className="bg-white/80 rounded-lg p-4 mb-6 text-center">
          {!sessionActive && (
            <div>
              <div className="text-4xl mb-4">🎤</div>
              <h2 className="text-xl font-semibold mb-2">Ready to start your conversation</h2>
              <p className="text-gray-600 mb-4">
                Click "Start Talking" and {scenario.character_name} will greet you
              </p>
              <button
                onClick={startConversation}
                className="bg-green-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
              >
                Start Talking
              </button>
            </div>
          )}
          
          {sessionActive && (
            <div>
              {isAISpeaking && (
                <div className="text-blue-600">
                  <div className="text-3xl mb-2">🔊</div>
                  <p className="font-medium">{scenario.character_name} is speaking...</p>
                  <p className="text-sm text-gray-600">Listen carefully</p>
                </div>
              )}
              
              {isListening && (
                <div className="text-green-600">
                  <div className="text-3xl mb-2">🎤</div>
                  <p className="font-medium">Your turn to speak</p>
                  <p className="text-sm text-gray-600">Say something now</p>
                  {currentUserSpeech && (
                    <p className="mt-2 text-blue-800 italic">"{currentUserSpeech}"</p>
                  )}
                  <button 
                    onClick={stopListening}
                    className="mt-3 bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
                  >
                    Stop Speaking
                  </button>
                </div>
              )}
              
              {!isAISpeaking && !isListening && (
                <div className="text-gray-600">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="font-medium">Processing...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button 
              onClick={() => setError('')}
              className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Conversation Display */}
        {conversation.length > 0 && (
          <div className="bg-white/80 rounded-lg p-6">
            <h3 className="font-semibold mb-4">Conversation:</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversation.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.speaker === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-75">
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </div>
                    <div>{message.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simple Controls */}
        {sessionActive && (
          <div className="mt-6 text-center">
            <div className="bg-white/80 rounded-lg p-4">
              <h4 className="font-medium mb-3">Quick Actions:</h4>
              <div className="flex gap-3 justify-center">
                {!isListening && !isAISpeaking && (
                  <button
                    onClick={startListening}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Start Speaking
                  </button>
                )}
                <button
                  onClick={() => {
                    speechSynthesis.cancel();
                    stopListening();
                  }}
                  className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Stop Audio
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

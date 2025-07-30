'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Scenario {
  id: string;
  title: string;
  character_name: string;
  character_role: string;
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
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sessionStartTime] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/');
      return;
    }
    setUserEmail(email);

    // Load scenario from localStorage
    const storedScenario = localStorage.getItem('currentScenario');
    if (storedScenario) {
      setScenario(JSON.parse(storedScenario));
    } else {
      // Fallback: redirect to dashboard
      router.push('/dashboard');
    }
  }, [router]);

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading || !scenario) return;

    const userMessage: ConversationMessage = {
      speaker: 'user',
      message: currentMessage.trim(),
      timestamp: Date.now()
    };

    // Add user message to conversation
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Call AI API
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage: userMessage.message,
          conversationHistory: newConversation,
          messageCount: newConversation.filter(msg => msg.speaker === 'user').length - 1
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: ConversationMessage = {
          speaker: 'ai',
          message: data.data.response,
          timestamp: Date.now()
        };
        setConversation(prev => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'AI response failed');
      }

    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Add fallback response
      const fallbackMessage: ConversationMessage = {
        speaker: 'ai',
        message: "I apologize, but I'm having trouble responding right now. Could you please try again?",
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const endSession = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    const exchanges = conversation.filter(msg => msg.speaker === 'user').length;
    
    // Store session data for feedback
    const sessionData = {
      scenario,
      conversation,
      duration: sessionDuration,
      exchanges,
      userEmail
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
              <p className="text-sm text-gray-600">
                Role-playing with {scenario.character_name} ({scenario.character_role})
              </p>
            </div>
            <button
              onClick={endSession}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-96 mb-6 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p className="mb-2">👋 Start the conversation!</p>
                <p className="text-sm">
                  You're now speaking with <strong>{scenario.character_name}</strong>
                </p>
              </div>
            )}
            
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.speaker === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.speaker === 'user' ? 'You' : scenario.character_name} • {
                      new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                    }
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{scenario.character_name} is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex space-x-4">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type your message to ${scenario.character_name}...`}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </main>
    </div>
  );
}

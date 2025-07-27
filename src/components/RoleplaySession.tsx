// src/components/RoleplaySession.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Scenario, ConversationMessage, apiService } from '../services/api';
import { speechService } from '../services/speech';
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, MessageCircle } from 'lucide-react';

interface RoleplaySessionProps {
  scenario: Scenario;
  userEmail: string;
  onEndSession: () => void;
}

type SessionState = 'starting' | 'listening' | 'processing' | 'ai-speaking' | 'ended';

export const RoleplaySession: React.FC<RoleplaySessionProps> = ({
  scenario,
  userEmail,
  onEndSession
}) => {
  const [sessionState, setSessionState] = useState<SessionState>('starting');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [error, setError] = useState<string>('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const conversationEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom of conversation
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeSession = async () => {
    try {
      // Create session in database
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      setSessionId(newSessionId);
      setStartTime(new Date());
      
      // Start listening after brief delay
      setTimeout(() => {
        startListening();
      }, 1000);
      
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error('Session initialization error:', err);
    }
  };

  const startListening = () => {
    const support = speechService.isSupported();
    
    if (!support.recognition) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    setSessionState('listening');
    setCurrentTranscript('');
    setError('');

    speechService.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          if (transcript.trim().length > 2) {
            processUserSpeech(transcript.trim());
          } else {
            // If speech too short, start listening again
            setTimeout(() => startListening(), 1000);
          }
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        if (!error.includes('No speech detected')) {
          setError(error);
        }
        // Restart listening after errors (except permission denied)
        if (!error.includes('denied')) {
          setTimeout(() => startListening(), 2000);
        }
      },
      () => {
        // Recognition ended - this is normal
        if (sessionState === 'listening') {
          setTimeout(() => startListening(), 500);
        }
      }
    );
  };

  const processUserSpeech = async (userMessage: string) => {
    try {
      setSessionState('processing');
      setCurrentTranscript('');
      
      // Add user message to conversation
      const userMsg: ConversationMessage = {
        speaker: 'user',
        message: userMessage,
        timestamp: Date.now()
      };
      
      const updatedConversation = [...conversation, userMsg];
      setConversation(updatedConversation);

      // Update session in database
      await apiService.updateSessionConversation(sessionId, updatedConversation);

      // Get AI response
      const { response: aiResponse } = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      // Add AI message to conversation
      const aiMsg: ConversationMessage = {
        speaker: 'ai',
        message: aiResponse,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);

      // Update session again with AI response
      await apiService.updateSessionConversation(sessionId, finalConversation);

      // Speak AI response
      if (isAudioEnabled) {
        setSessionState('ai-speaking');
        
        try {
          const characterGender = getCharacterGender(scenario.character_name);
          await speechService.speak(aiResponse, characterGender);
        } catch (speechError) {
          console.error('Speech synthesis error:', speechError);
        }
      }

      // Return to listening
      setTimeout(() => {
        if (sessionState !== 'ended') {
          startListening();
        }
      }, isAudioEnabled ? 1000 : 500);

    } catch (err) {
      console.error('Error processing speech:', err);
      setError('Failed to process your message. Please try again.');
      setTimeout(() => startListening(), 2000);
    }
  };

  const getCharacterGender = (characterName: string): 'male' | 'female' => {
    const femaleNames = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy'];
    const firstName = characterName.split(' ')[0].toLowerCase();
    return femaleNames.includes(firstName) ? 'female' : 'male';
  };

  const handleEndSession = async () => {
    try {
      setSessionState('ended');
      speechService.stopListening();
      speechService.stopSpeaking();

      const duration = Math.round((Date.now() - startTime.getTime()) / 60000); // minutes
      const feedback = generateFeedback();
      
      await apiService.endSession(sessionId, feedback, duration);
      
      // Show feedback briefly then return to dashboard
      setTimeout(() => {
        onEndSession();
      }, 3000);
      
    } catch (err) {
      console.error('Error ending session:', err);
      // Even if there's an error, return to dashboard
      setTimeout(() => onEndSession(), 1000);
    }
  };

  const generateFeedback = (): string => {
    const userMessages = conversation.filter(msg => msg.speaker === 'user');
    const exchanges = Math.floor(conversation.length / 2);
    
    if (exchanges === 0) {
      return "Great start! Try to have a longer conversation next time to get more practice.";
    } else if (exchanges < 3) {
      return `Good effort! You had ${exchanges} exchange${exchanges > 1 ? 's' : ''}. Try to extend the conversation longer to practice more scenarios.`;
    } else if (exchanges < 6) {
      return `Well done! You had a good conversation with ${exchanges} exchanges. You're getting comfortable with the roleplay format.`;
    } else {
      return `Excellent session! You had ${exchanges} exchanges and really engaged with the scenario. Keep up the great work!`;
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (isAudioEnabled) {
      speechService.stopSpeaking();
    }
  };

  const getStateMessage = () => {
    switch (sessionState) {
      case 'starting':
        return '🚀 Starting your practice session...';
      case 'listening':
        return '🎤 Listening... Start speaking!';
      case 'processing':
        return '🤔 Processing your message...';
      case 'ai-speaking':
        return `🗣️ ${scenario.character_name} is responding...`;
      case 'ended':
        return '✅ Session completed! Great job!';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (sessionState) {
      case 'starting': return '#f59e0b';
      case 'listening': return '#10b981';
      case 'processing': return '#3b82f6';
      case 'ai-speaking': return '#8b5cf6';
      case 'ended': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (error && !error.includes('No speech detected')) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Session Error</h2>
          <p style={{ color: '#b91c1c', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={onEndSession}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              margin: 0,
              color: '#1f2937'
            }}>
              {scenario.title}
            </h1>
            <p style={{ 
              color: '#6b7280', 
              margin: '4px 0 0 0',
              fontSize: '0.9rem'
            }}>
              Speaking with {scenario.character_name} • {scenario.character_role}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={toggleAudio}
              style={{
                backgroundColor: isAudioEnabled ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isAudioEnabled ? 'Audio On' : 'Audio Off'}
            >
              {isAudioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            <button
              onClick={handleEndSession}
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        backgroundColor: getStatusColor(),
        color: 'white',
        padding: '12px 24px',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {getStateMessage()}
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px',
        padding: '24px'
      }}>
        {/* Conversation Area */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px'
          }}>
            <MessageCircle size={20} />
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              margin: 0,
              color: '#1f2937'
            }}>
              Conversation
            </h2>
          </div>

          <div style={{
            flex: 1,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {conversation.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#6b7280',
                padding: '40px 20px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👋</div>
                <p style={{ marginBottom: '8px' }}>
                  <strong>Start the conversation!</strong>
                </p>
                <p style={{ fontSize: '0.9rem' }}>
                  Say "Hello" or introduce yourself to {scenario.character_name}
                </p>
              </div>
            ) : (
              <div>
                {conversation.map((message, index) => (
                  <div 
                    key={index}
                    style={{
                      marginBottom: '16px',
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: message.speaker === 'user' ? '#dbeafe' : '#dcfce7',
                      border: `1px solid ${message.speaker === 'user' ? '#93c5fd' : '#86efac'}`
                    }}
                  >
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: message.speaker === 'user' ? '#1e40af' : '#166534'
                    }}>
                      {message.speaker === 'user' ? '👤 You' : `🤖 ${scenario.character_name}`}
                    </div>
                    <div style={{ color: '#374151' }}>
                      {message.message}
                    </div>
                  </div>
                ))}
                
                {currentTranscript && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: '#fef3c7',
                    border: '1px dashed #fbbf24',
                    fontStyle: 'italic',
                    color: '#92400e'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      👤 You (speaking...)
                    </div>
                    {currentTranscript}
                  </div>
                )}
                
                <div ref={conversationEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Scenario Info */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              Scenario Details
            </h3>
            <div style={{ fontSize: '0.9rem', color: '#6b7280', lineHeight: '1.5' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>Description:</strong> {scenario.description}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Character:</strong> {scenario.character_name}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Personality:</strong> {scenario.character_personality}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Difficulty:</strong> {scenario.difficulty}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#0c4a6e'
            }}>
              💡 Tips for Success
            </h3>
            <ul style={{ 
              fontSize: '0.9rem', 
              color: '#075985',
              paddingLeft: '16px',
              margin: 0
            }}>
              <li>Speak clearly and at normal pace</li>
              <li>Ask questions to understand needs</li>
              <li>Listen to objections carefully</li>
              <li>Focus on benefits, not just features</li>
              <li>Stay professional and confident</li>
            </ul>
          </div>

          {/* Session Stats */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '12px',
              color: '#1f2937'
            }}>
              📊 Session Stats
            </h3>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Exchanges:</span>
                <span style={{ fontWeight: '600' }}>
                  {Math.floor(conversation.length / 2)}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Duration:</span>
                <span style={{ fontWeight: '600' }}>
                  {Math.floor((Date.now() - startTime.getTime()) / 60000)}m
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between'
              }}>
                <span>Status:</span>
                <span style={{ 
                  fontWeight: '600',
                  color: getStatusColor()
                }}>
                  {sessionState === 'listening' ? 'Active' : 
                   sessionState === 'processing' ? 'Thinking' :
                   sessionState === 'ai-speaking' ? 'AI Speaking' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

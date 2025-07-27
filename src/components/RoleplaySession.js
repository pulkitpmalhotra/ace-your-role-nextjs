import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { speechService } from '../services/speech';
import { Volume2, VolumeX, MessageCircle, CheckCircle, Star } from 'lucide-react';

function RoleplaySession({ scenario, userEmail, onEndSession }) {
  const [sessionState, setSessionState] = useState('starting');
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [error, setError] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  
  const conversationEndRef = useRef(null);
  const microphoneRetries = useRef(0);

  useEffect(() => {
    initializeSession();
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeSession = async () => {
    try {
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      setSessionId(newSessionId);
      setStartTime(new Date());
      
      setTimeout(() => {
        requestMicrophoneAndStart();
      }, 1500);
      
    } catch (err) {
      setError('Failed to start session. Please try again.');
      console.error('Session initialization error:', err);
    }
  };

  const requestMicrophoneAndStart = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone permission granted');
      
      setTimeout(() => {
        startListening();
      }, 500);
      
    } catch (err) {
      console.error('❌ Microphone permission denied:', err);
      setError('Microphone access is required for this session. Please allow microphone access and refresh the page.');
    }
  };

  const startListening = () => {
    const support = speechService.isSupported();
    
    if (!support.recognition) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    console.log('🎤 Attempting to start listening...');
    setSessionState('listening');
    setCurrentTranscript('');
    setError('');
    microphoneRetries.current = 0;

    speechService.startListening(
      (transcript, isFinal) => {
        console.log(`📝 Transcript (${isFinal ? 'final' : 'interim'}):`, transcript);
        
        if (isFinal) {
          if (transcript.trim().length > 2) {
            processUserSpeech(transcript.trim());
          } else {
            console.log('🔄 Speech too short, restarting...');
            setTimeout(() => {
              if (sessionState !== 'ended') {
                startListening();
              }
            }, 1000);
          }
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        console.error('🚨 Speech recognition error:', error);
        
        if (!error.includes('No speech detected') && !error.includes('no-speech')) {
          setError(error);
        }
        
        if (!error.includes('denied') && microphoneRetries.current < 3) {
          microphoneRetries.current++;
          console.log(`🔄 Retrying speech recognition (${microphoneRetries.current}/3)...`);
          setTimeout(() => {
            if (sessionState !== 'ended') {
              startListening();
            }
          }, 2000);
        }
      },
      () => {
        console.log('🏁 Speech recognition ended');
        if (sessionState === 'listening') {
          setTimeout(() => {
            if (sessionState !== 'ended') {
              startListening();
            }
          }, 1000);
        }
      }
    );
  };

  const processUserSpeech = async (userMessage) => {
    try {
      console.log('🗣️ Processing user speech:', userMessage);
      setSessionState('processing');
      setCurrentTranscript('');
      
      const userMsg = {
        speaker: 'user',
        message: userMessage,
        timestamp: Date.now()
      };
      
      const updatedConversation = [...conversation, userMsg];
      setConversation(updatedConversation);

      await apiService.updateSessionConversation(sessionId, updatedConversation);

      const { response: aiResponse } = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      const aiMsg = {
        speaker: 'ai',
        message: aiResponse,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await apiService.updateSessionConversation(sessionId, finalConversation);

      if (isAudioEnabled) {
        setSessionState('ai-speaking');
        
        try {
          const characterGender = getCharacterGender(scenario.character_name);
          await speechService.speak(aiResponse, characterGender);
        } catch (speechError) {
          console.error('Speech synthesis error:', speechError);
        }
      }

      setTimeout(() => {
        if (sessionState !== 'ended') {
          startListening();
        }
      }, isAudioEnabled ? 1500 : 500);

    } catch (err) {
      console.error('Error processing speech:', err);
      setError('Failed to process your message. Please try again.');
      setTimeout(() => {
        if (sessionState !== 'ended') {
          startListening();
        }
      }, 2000);
    }
  };

  const getCharacterGender = (characterName) => {
    const femaleNames = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy'];
    const firstName = characterName.split(' ')[0].toLowerCase();
    return femaleNames.includes(firstName) ? 'female' : 'male';
  };

  const handleEndSession = async () => {
    try {
      console.log('🛑 Ending session...');
      setSessionState('ended');
      speechService.stopListening();
      speechService.stopSpeaking();

      const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
      const sessionFeedback = generateFeedback();
      setFeedback(sessionFeedback);
      
      await apiService.endSession(sessionId, sessionFeedback, duration);
      setShowFeedback(true);
      
    } catch (err) {
      console.error('Error ending session:', err);
      const sessionFeedback = generateFeedback();
      setFeedback(sessionFeedback);
      setShowFeedback(true);
    }
  };

  const generateFeedback = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
    
    let performance = '';
    let tips = [];
    
    if (exchanges === 0) {
      performance = "Great start!";
      tips = [
        "Try to have a longer conversation next time",
        "Don't be afraid to ask questions",
        "Practice makes perfect!"
      ];
    } else if (exchanges < 3) {
      performance = "Good effort!";
      tips = [
        "Try to extend the conversation longer",
        "Ask follow-up questions to show interest",
        "Listen carefully to the customer's needs"
      ];
    } else if (exchanges < 6) {
      performance = "Well done!";
      tips = [
        "You're getting comfortable with roleplay",
        "Focus on understanding customer pain points",
        "Practice handling objections"
      ];
    } else {
      performance = "Excellent session!";
      tips = [
        "You really engaged with the scenario",
        "Great conversation flow",
        "Keep up the fantastic work!"
      ];
    }

    return {
      performance,
      exchanges,
      duration,
      tips,
      scenario: scenario.title
    };
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

  // Show feedback screen
  if (showFeedback && feedback) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f9ff',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '16px',
          textAlign: 'center',
          maxWidth: '600px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🎉</div>
          
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            color: '#1f2937'
          }}>
            Session Complete!
          </h1>

          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              color: '#1e40af',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <Star size={24} />
              {feedback.performance}
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {feedback.exchanges}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Exchanges
                </div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {feedback.duration}m
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                  Duration
                </div>
              </div>
            </div>

            <h3 style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600',
              marginBottom: '12px',
              color: '#374151'
            }}>
              💡 Tips for Next Time:
            </h3>
            <ul style={{
              textAlign: 'left',
              color: '#6b7280',
              paddingLeft: '20px'
            }}>
              {feedback.tips.map((tip, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>{tip}</li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => {
              setShowFeedback(false);
              onEndSession();
            }}
            style={{
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <CheckCircle size={20} />
            Continue Practicing
          </button>
        </div>
      </div>
    );
  }

  // Show error screen
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
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setError('');
                setSessionState('starting');
                requestMicrophoneAndStart();
              }}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try Again
            </button>
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
      </div>
    );
  }

  // Main session interface
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
        {sessionState === 'listening' && (
          <div style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
            {speechService.isCurrentlyListening() ? 'Microphone is active' : 'Starting microphone...'}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
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
                {sessionState === 'starting' && (
                  <div style={{ 
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#92400e'
                  }}>
                    🎤 Getting microphone ready...
                  </div>
                )}
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
      </div>
    </div>
  );
}

export default RoleplaySession;

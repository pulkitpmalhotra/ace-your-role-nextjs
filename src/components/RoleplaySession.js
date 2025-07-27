import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { speechService } from '../services/speech';
import { CheckCircle, Star } from 'lucide-react';

function RoleplaySession({ scenario, userEmail, onEndSession }) {
  const [sessionState, setSessionState] = useState('starting');
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(true);

  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    console.log('🧹 Cleaning up session...');
    setIsSessionActive(false);
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  const initializeSession = async () => {
    try {
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      setSessionId(newSessionId);
      setStartTime(new Date());
      
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTimeout(() => {
        if (isSessionActive) {
          startListening();
        }
      }, 2000);
      
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const startListening = () => {
    if (!isSessionActive) {
      console.log('❌ Session not active, not starting listening');
      return;
    }

    const support = speechService.isSupported();
    
    if (!support.recognition) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    console.log('🎤 Starting to listen...');
    setSessionState('listening');
    setCurrentTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        if (!isSessionActive) return;
        
        if (isFinal && transcript.trim().length > 2) {
          console.log('📝 Final transcript:', transcript);
          processUserSpeech(transcript.trim());
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        if (!isSessionActive) return;
        
        console.error('🚨 Speech error:', error);
        if (!error.includes('No speech detected') && !error.includes('no-speech')) {
          setTimeout(() => {
            if (isSessionActive && sessionState === 'listening') {
              startListening();
            }
          }, 2000);
        }
      },
      () => {
        if (!isSessionActive) return;
        
        console.log('🏁 Speech recognition ended');
        if (sessionState === 'listening') {
          setTimeout(() => {
            if (isSessionActive) {
              startListening();
            }
          }, 1000);
        }
      }
    );
  };

  const processUserSpeech = async (userMessage) => {
    if (!isSessionActive) return;
    
    try {
      console.log('🤔 Processing user speech:', userMessage);
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

      console.log('🤖 Getting AI response...');
      const { response: aiResponse } = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      console.log('✅ AI responded:', aiResponse);

      const aiMsg = {
        speaker: 'ai',
        message: aiResponse,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      await apiService.updateSessionConversation(sessionId, finalConversation);

      if (!isSessionActive) return;

      setSessionState('ai-speaking');
      
      try {
        const characterGender = getCharacterGender(scenario.character_name);
        await speechService.speak(aiResponse, characterGender);
      } catch (speechError) {
        console.error('Speech synthesis error:', speechError);
      }

      if (!isSessionActive) return;

      setTimeout(() => {
        if (isSessionActive) {
          startListening();
        }
      }, 1500);

    } catch (err) {
      console.error('💥 Error processing speech:', err);
      if (isSessionActive) {
        setTimeout(() => {
          if (sessionState !== 'ended') {
            startListening();
          }
        }, 2000);
      }
    }
  };

  const getCharacterGender = (characterName) => {
    const femaleNames = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy'];
    const firstName = characterName.split(' ')[0].toLowerCase();
    return femaleNames.includes(firstName) ? 'female' : 'male';
  };

  const handleEndSession = async () => {
    console.log('🛑 Ending session...');
    
    // Immediately stop everything
    setIsSessionActive(false);
    setSessionState('ended');
    cleanup();

    try {
      const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
      const sessionFeedback = generateFeedback();
      setFeedback(sessionFeedback);
      
      await apiService.endSession(sessionId, JSON.stringify(sessionFeedback), duration);
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

  const getStateMessage = () => {
    switch (sessionState) {
      case 'starting':
        return 'Getting ready...';
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Thinking...';
      case 'ai-speaking':
        return 'Speaking...';
      case 'ended':
        return 'Session ended';
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

  // Feedback Screen
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
              Tips for improvement:
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

  // Error Screen
  if (error) {
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
          maxWidth: '500px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Error</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => {
              cleanup();
              onEndSession();
            }}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Main Session Interface
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
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
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{scenario.title}</h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              {scenario.character_name} • {scenario.character_role}
            </p>
          </div>
          <button
            onClick={handleEndSession}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            End Session
          </button>
        </div>
      </div>

      <div style={{
        backgroundColor: getStatusColor(),
        color: 'white',
        padding: '12px 24px',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {getStateMessage()}
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fafafa',
            minHeight: '400px',
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {conversation.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👋</div>
                <p>Start speaking to begin the conversation</p>
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
                      backgroundColor: message.speaker === 'user' ? '#dbeafe' : '#dcfce7'
                    }}
                  >
                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      marginBottom: '4px',
                      color: message.speaker === 'user' ? '#1e40af' : '#166534'
                    }}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </div>
                    <div>{message.message}</div>
                  </div>
                ))}
                
                {currentTranscript && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    fontStyle: 'italic',
                    color: '#92400e'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                      You (speaking...)
                    </div>
                    {currentTranscript}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleplaySession;

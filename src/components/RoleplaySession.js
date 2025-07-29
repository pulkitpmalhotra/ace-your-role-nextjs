// src/components/RoleplaySession.js - Complete file with proper hook management
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { speechService } from '../services/speech';
import { CheckCircle, Star, Mic, MicOff, User, Bot } from 'lucide-react';
import EnhancedFeedback from './EnhancedFeedback';

function RoleplaySession({ scenario, userEmail, onEndSession, isMobile }) {
  // All useState hooks must be called in the same order every render
  const [sessionState, setSessionState] = useState('starting');
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [error, setError] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [showDebugLog, setShowDebugLog] = useState(false);
  const [debugLog, setDebugLog] = useState([]);

  // Debug logging function
  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugLog(prev => [...prev.slice(-5), `${timestamp}: ${message}`]);
  };

  // Initialize session effect - runs once when component mounts
  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []); // Empty dependency array - runs once on mount

  // Session ID change effect - triggers listening when session is ready
  useEffect(() => {
    if (sessionId && sessionState === 'starting' && isSessionActive) {
      addDebugLog(`Session ID set: ${sessionId}, starting listening in 1 second`);
      const timer = setTimeout(() => {
        if (isSessionActive && sessionId) {
          addDebugLog('Starting listening with valid sessionId...');
          startListening();
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, sessionState, isSessionActive]);

  // Cleanup function for when component unmounts
  const cleanup = () => {
    addDebugLog('Cleaning up session - stopping all audio...');
    setIsSessionActive(false);
    
    speechService.stopListening();
    speechService.stopSpeaking();
    
    addDebugLog('All audio stopped');
  };

  // Initialize session function
  const initializeSession = async () => {
    try {
      addDebugLog('Starting session initialization...');
      
      // Validate required props
      if (!scenario || !scenario.id) {
        throw new Error('Invalid scenario - missing ID');
      }
      if (!userEmail) {
        throw new Error('Invalid user email');
      }

      addDebugLog('Creating session via API...');
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      
      if (!newSessionId) {
        throw new Error('Session creation returned empty ID');
      }
      
      addDebugLog(`Session created with ID: ${newSessionId}`);
      
      setSessionId(newSessionId);
      setStartTime(new Date());
      
      addDebugLog('Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addDebugLog('Microphone permission granted');
      
    } catch (err) {
      addDebugLog(`Session initialization failed: ${err.message}`);
      console.error('Full error:', err);
      setError(`Failed to start session: ${err.message}`);
    }
  };

  // Start listening function
  const startListening = () => {
    if (!isSessionActive || !sessionId || sessionState === 'ai-speaking') {
      return;
    }

    const support = speechService.isSupported();
    
    if (!support.recognition) {
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    setSessionState('listening');
    setCurrentTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        if (!isSessionActive || !sessionId || sessionState === 'ai-speaking') return;
        
        if (isFinal && transcript.trim().length > 2) {
          processUserSpeech(transcript.trim());
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        if (!isSessionActive) return;
        
        if (!error.includes('No speech detected') && !error.includes('no-speech')) {
          setTimeout(() => {
            if (isSessionActive && sessionState === 'listening' && sessionId) {
              startListening();
            }
          }, 2000);
        }
      },
      () => {
        if (!isSessionActive) return;
        
        if (sessionState === 'listening') {
          setTimeout(() => {
            if (isSessionActive && sessionId && sessionState !== 'ai-speaking') {
              startListening();
            }
          }, 1000);
        }
      }
    );
  };

  // Process user speech function
  const processUserSpeech = async (userMessage) => {
    if (!isSessionActive || !sessionId) return;
    
    try {
      speechService.stopListening();
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

      const aiResult = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      const aiMsg = {
        speaker: 'ai',
        message: aiResult.response,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);

      await apiService.updateSessionConversation(sessionId, finalConversation);

      if (!isSessionActive) return;

      setSessionState('ai-speaking');
      
      try {
        const characterGender = getCharacterGender(scenario.character_name);
        await speechService.speak(aiResult.response, characterGender);
      } catch (speechError) {
        addDebugLog(`Speech synthesis error: ${speechError.message}`);
      }

      if (!isSessionActive) return;

      setTimeout(() => {
        if (isSessionActive && sessionId) {
          startListening();
        }
      }, 500);

    } catch (err) {
      addDebugLog(`Error in processUserSpeech: ${err.message}`);
      console.error('Full error:', err);
      
      setError(`Processing error: ${err.message}`);
      
      if (isSessionActive && sessionId) {
        setTimeout(() => {
          if (sessionState !== 'ended') {
            startListening();
          }
        }, 3000);
      }
    }
  };

  // Utility functions
  const getCharacterGender = (characterName) => {
    const femaleNames = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily', 'jessica', 'rachel'];
    const firstName = characterName.split(' ')[0].toLowerCase();
    return femaleNames.includes(firstName) ? 'female' : 'male';
  };

  const getCharacterAvatar = (characterName, characterRole) => {
    const firstName = characterName.split(' ')[0].toLowerCase();
    const isFemale = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy', 'emily', 'jessica', 'rachel'].includes(firstName);
    
    const avatarStyle = {
      width: '45px',
      height: '45px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      color: 'white',
      background: isFemale ? 
        'linear-gradient(135deg, #ff6b9d, #c44569)' : 
        'linear-gradient(135deg, #4facfe, #00f2fe)'
    };

    let emoji = '👤';
    const roleLower = (characterRole || '').toLowerCase();
    
    if (roleLower.includes('manager') || roleLower.includes('director')) {
      emoji = isFemale ? '👩‍💼' : '👨‍💼';
    } else if (roleLower.includes('ceo') || roleLower.includes('executive')) {
      emoji = isFemale ? '👩‍💼' : '👨‍💼';
    } else if (roleLower.includes('owner') || roleLower.includes('founder')) {
      emoji = isFemale ? '👩‍💼' : '👨‍💼';
    } else if (roleLower.includes('it') || roleLower.includes('tech')) {
      emoji = isFemale ? '👩‍💻' : '👨‍💻';
    } else if (roleLower.includes('buyer') || roleLower.includes('purchas')) {
      emoji = isFemale ? '👩‍💼' : '👨‍💼';
    } else {
      emoji = isFemale ? '👩' : '👨';
    }

    return (
      <div style={avatarStyle}>
        {emoji}
      </div>
    );
  };

  const getUserAvatar = () => {
    return (
      <div style={{
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white'
      }}>
        👤
      </div>
    );
  };

  // End session handler
  const handleEndSession = async () => {
    addDebugLog('User clicked End Session - stopping everything immediately...');
    
    setIsSessionActive(false);
    setSessionState('ended');
    
    speechService.stopListening();
    speechService.stopSpeaking();

    try {
      if (sessionId) {
        const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
        const basicFeedback = generateFeedback();
        setFeedback(basicFeedback);
        
        await apiService.endSession(sessionId, JSON.stringify(basicFeedback), duration);
        
        try {
          await apiService.triggerFeedbackAnalysis(sessionId, conversation, scenario);
        } catch (analysisError) {
          addDebugLog(`Detailed analysis failed: ${analysisError.message}`);
        }
      }
      setShowFeedback(true);
      
    } catch (err) {
      addDebugLog(`Error ending session: ${err.message}`);
      const basicFeedback = generateFeedback();
      setFeedback(basicFeedback);
      setShowFeedback(true);
    }
  };

  // Generate basic feedback
  const generateFeedback = () => {
    const exchanges = Math.floor(conversation.length / 2);
    const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
    
    let performance = '';
    
    if (exchanges === 0) {
      performance = "Great start!";
    } else if (exchanges < 3) {
      performance = "Good effort!";
    } else if (exchanges < 6) {
      performance = "Well done!";
    } else {
      performance = "Excellent session!";
    }

    return { performance, exchanges, duration, scenario: scenario.title };
  };

  // State message helper
  const getStateMessage = () => {
    switch (sessionState) {
      case 'starting': return 'Initializing conversation...';
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'ai-speaking': return `${scenario.character_name} is speaking...`;
      case 'ended': return 'Session ended';
      default: return '';
    }
  };

  // Status color helper
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

  // Microphone icon helper
  const getMicrophoneIcon = () => {
    if (sessionState === 'listening') {
      return <Mic size={20} className="animate-pulse" />;
    } else if (sessionState === 'ai-speaking') {
      return <MicOff size={20} />;
    } else {
      return <Mic size={20} />;
    }
  };

  // Enhanced Feedback Screen
  if (showFeedback && feedback) {
    return (
      <EnhancedFeedback
        sessionId={sessionId}
        basicFeedback={{
          ...feedback,
          userEmail: userEmail
        }}
        onContinue={() => {
          setShowFeedback(false);
          onEndSession();
        }}
        onViewDashboard={(tab = 'progress') => {
          setShowFeedback(false);
          onEndSession(tab);
        }}
      />
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
          maxWidth: '600px' 
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Session Error</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          
          {showDebugLog && (
            <div style={{ 
              textAlign: 'left', 
              backgroundColor: '#f3f4f6', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '24px', 
              maxHeight: '200px', 
              overflowY: 'auto' 
            }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Debug Log:</h3>
              {debugLog.map((log, index) => (
                <div key={index} style={{ 
                  fontSize: '0.8rem', 
                  fontFamily: 'monospace', 
                  marginBottom: '4px' 
                }}>
                  {log}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setShowDebugLog(!showDebugLog)}
              style={{
                backgroundColor: '#6b7280', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px',
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '0.9rem'
              }}
            >
              {showDebugLog ? 'Hide' : 'Show'} Debug Info
            </button>
            <button 
              onClick={() => {
                setError('');
                setSessionId('');
                setIsSessionActive(true);
                setSessionState('starting');
                initializeSession();
              }}
              style={{
                backgroundColor: '#10b981', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px',
                borderRadius: '8px', 
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
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
      </div>
    );
  }

  // Main Session Interface
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {getCharacterAvatar(scenario.character_name, scenario.character_role)}
            <div>
              <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{scenario.title}</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
                {scenario.character_name} • {scenario.character_role}
              </p>
            </div>
          </div>
          <button 
            onClick={handleEndSession} 
            style={{ 
              backgroundColor: '#f97316',
              color: 'white', 
              border: 'none', 
              padding: '12px 24px',
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ea580c';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f97316';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{ 
        backgroundColor: getStatusColor(), 
        color: 'white', 
        padding: '12px 24px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontWeight: '500'
      }}>
        {getMicrophoneIcon()}
        {getStateMessage()}
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Conversation Area */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
          minHeight: '500px' 
        }}>
          
          {conversation.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <div style={{ marginBottom: '20px' }}>
                {getCharacterAvatar(scenario.character_name, scenario.character_role)}
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#374151' }}>
                Ready to start your conversation
              </h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                You're about to speak with <strong>{scenario.character_name}</strong>
              </p>
              <p>Start speaking to begin the roleplay session</p>
              {sessionState === 'starting' && (
                <p style={{ fontSize: '0.9rem', marginTop: '15px', color: '#f59e0b' }}>
                  Setting up your session...
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {conversation.map((message, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  flexDirection: message.speaker === 'user' ? 'row-reverse' : 'row'
                }}>
                  {/* Avatar */}
                  {message.speaker === 'user' ? 
                    getUserAvatar() : 
                    getCharacterAvatar(scenario.character_name, scenario.character_role)
                  }
                  
                  {/* Message Bubble */}
                  <div style={{
                    maxWidth: '70%',
                    padding: '16px 20px',
                    borderRadius: '18px',
                    backgroundColor: message.speaker === 'user' ? '#667eea' : '#f1f5f9',
                    color: message.speaker === 'user' ? 'white' : '#374151',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    position: 'relative'
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      opacity: 0.8
                    }}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                      {message.message}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current Transcript (User Speaking) */}
              {currentTranscript && sessionState === 'listening' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '15px',
                  flexDirection: 'row-reverse'
                }}>
                  {getUserAvatar()}
                  <div style={{
                    maxWidth: '70%',
                    padding: '16px 20px',
                    borderRadius: '18px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    border: '2px dashed #f59e0b'
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: '600', 
                      marginBottom: '6px',
                      opacity: 0.8
                    }}>
                      You (speaking...)
                    </div>
                    <div style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                      {currentTranscript}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Thinking Indicator */}
              {sessionState === 'processing' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '20px',
                  justifyContent: 'center'
                }}>
                  {getCharacterAvatar(scenario.character_name, scenario.character_role)}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out 0.16s'
                    }}></div>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#8b5cf6',
                      animation: 'bounce 1.4s infinite ease-in-out 0.32s'
                    }}></div>
                    <span style={{ marginLeft: '10px', color: '#8b5cf6', fontSize: '0.9rem' }}>
                      {scenario.character_name} is thinking...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Debug Toggle (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => setShowDebugLog(!showDebugLog)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {showDebugLog ? 'Hide' : 'Show'} Debug Log
            </button>
          </div>
        )}

        {/* Debug Log Panel */}
        {showDebugLog && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '16px', 
            borderRadius: '8px', 
            marginTop: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Debug Log:</h3>
            <div style={{ 
              maxHeight: '120px', 
              overflowY: 'auto', 
              fontSize: '0.8rem', 
              fontFamily: 'monospace' 
            }}>
              {debugLog.map((log, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default RoleplaySession;

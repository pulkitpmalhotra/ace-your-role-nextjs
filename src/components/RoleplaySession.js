import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { speechService } from '../services/speech';
import { CheckCircle, Star } from 'lucide-react';
import EnhancedFeedback from './EnhancedFeedback';

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
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugLog(prev => [...prev.slice(-5), `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  // Separate effect to handle starting listening after sessionId is set
  useEffect(() => {
    if (sessionId && sessionState === 'starting' && isSessionActive) {
      addDebugLog(`🔗 SessionId state updated: ${sessionId}`);
      setTimeout(() => {
        if (isSessionActive && sessionId) {
          addDebugLog('🎧 Starting listening with valid sessionId...');
          startListening();
        }
      }, 1000);
    }
  }, [sessionId, sessionState, isSessionActive]);

  const cleanup = () => {
    addDebugLog('🧹 Cleaning up session - stopping all audio...');
    setIsSessionActive(false);
    
    // Stop both speech recognition AND speech synthesis
    speechService.stopListening();
    speechService.stopSpeaking();
    
    addDebugLog('✅ All audio stopped');
  };

  const initializeSession = async () => {
    try {
      addDebugLog('🚀 Starting session initialization...');
      addDebugLog(`📋 Scenario ID: ${scenario.id}`);
      addDebugLog(`📧 User Email: ${userEmail}`);
      
      if (!scenario || !scenario.id) {
        throw new Error('Invalid scenario - missing ID');
      }
      if (!userEmail) {
        throw new Error('Invalid user email');
      }

      addDebugLog('🎬 Creating session via API...');
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      
      if (!newSessionId) {
        throw new Error('Session creation returned empty ID');
      }
      
      addDebugLog(`✅ Session created with ID: ${newSessionId}`);
      
      setSessionId(newSessionId);
      setStartTime(new Date());
      
      addDebugLog('🎤 Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addDebugLog('✅ Microphone permission granted');
      
      addDebugLog('⏳ Waiting for sessionId state to update...');
      
    } catch (err) {
      addDebugLog(`❌ Session initialization failed: ${err.message}`);
      console.error('Full error:', err);
      setError(`Failed to start session: ${err.message}`);
    }
  };

  const startListening = () => {
    addDebugLog(`🔍 Checking session status before starting listening...`);
    addDebugLog(`📋 isSessionActive: ${isSessionActive}`);
    addDebugLog(`🆔 sessionId: ${sessionId || 'MISSING'}`);
    addDebugLog(`📊 sessionState: ${sessionState}`);

    if (!isSessionActive) {
      addDebugLog('❌ Session not active, not starting listening');
      return;
    }

    if (!sessionId) {
      addDebugLog('❌ No session ID available, cannot start listening');
      setError('Session not properly initialized. Please try again.');
      return;
    }

    // Don't start listening if AI is speaking
    if (sessionState === 'ai-speaking') {
      addDebugLog('⏸️ AI is speaking, skipping microphone start');
      return;
    }

    const support = speechService.isSupported();
    
    if (!support.recognition) {
      addDebugLog('❌ Speech recognition not supported');
      setError('Speech recognition not supported. Please use Chrome browser.');
      return;
    }

    addDebugLog('🎤 Starting speech recognition...');
    setSessionState('listening');
    setCurrentTranscript('');

    speechService.startListening(
      (transcript, isFinal) => {
        if (!isSessionActive || !sessionId) return;
        
        // Don't process speech if AI is speaking
        if (sessionState === 'ai-speaking') {
          addDebugLog('⏸️ Ignoring speech while AI is talking');
          return;
        }
        
        if (isFinal && transcript.trim().length > 2) {
          addDebugLog(`📝 Final transcript received: "${transcript}"`);
          processUserSpeech(transcript.trim());
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        if (!isSessionActive) return;
        
        addDebugLog(`🚨 Speech error: ${error}`);
        if (!error.includes('No speech detected') && !error.includes('no-speech')) {
          setTimeout(() => {
            if (isSessionActive && sessionState === 'listening' && sessionId) {
              addDebugLog('🔄 Restarting listening after error...');
              startListening();
            }
          }, 2000);
        }
      },
      () => {
        if (!isSessionActive) return;
        
        addDebugLog('🏁 Speech recognition ended');
        // Only restart if we're in listening state (not ai-speaking)
        if (sessionState === 'listening') {
          setTimeout(() => {
            if (isSessionActive && sessionId && sessionState !== 'ai-speaking') {
              addDebugLog('🔄 Restarting listening...');
              startListening();
            }
          }, 1000);
        }
      }
    );
  };

  const processUserSpeech = async (userMessage) => {
    if (!isSessionActive || !sessionId) {
      addDebugLog('❌ Cannot process speech - session inactive or no ID');
      return;
    }
    
    try {
      addDebugLog(`🗣️ Processing user message: "${userMessage}"`);
      addDebugLog(`🆔 Using session ID: ${sessionId}`);
      
      // Stop listening while processing
      addDebugLog('⏸️ Stopping microphone for AI processing...');
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
      addDebugLog('✅ User message added to conversation');

      addDebugLog('💾 Updating session conversation...');
      await apiService.updateSessionConversation(sessionId, updatedConversation);
      addDebugLog('✅ Session conversation updated');

      addDebugLog('🤖 Requesting AI response...');
      const aiResult = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      addDebugLog(`✅ AI response received: "${aiResult.response}"`);

      const aiMsg = {
        speaker: 'ai',
        message: aiResult.response,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      addDebugLog('✅ AI message added to conversation');

      addDebugLog('💾 Updating session with AI response...');
      await apiService.updateSessionConversation(sessionId, finalConversation);
      addDebugLog('✅ Session updated with AI response');

      if (!isSessionActive) return;

      // AI speaking phase - microphone should be OFF
      setSessionState('ai-speaking');
      addDebugLog('🔊 AI speaking - microphone OFF');
      
      try {
        const characterGender = getCharacterGender(scenario.character_name);
        await speechService.speak(aiResult.response, characterGender);
        addDebugLog('✅ AI finished speaking');
      } catch (speechError) {
        addDebugLog(`❌ Speech synthesis error: ${speechError.message}`);
      }

      if (!isSessionActive) {
        addDebugLog('❌ Session ended during AI speech');
        return;
      }

      // AI finished speaking - restart microphone
      addDebugLog('🎤 AI finished - restarting microphone...');
      setTimeout(() => {
        if (isSessionActive && sessionId) {
          startListening();
        }
      }, 500);

    } catch (err) {
      addDebugLog(`💥 Error in processUserSpeech: ${err.message}`);
      console.error('Full error:', err);
      
      setError(`Processing error: ${err.message}`);
      
      if (isSessionActive && sessionId) {
        setTimeout(() => {
          if (sessionState !== 'ended') {
            addDebugLog('🔄 Restarting listening after error...');
            startListening();
          }
        }, 3000);
      }
    }
  };

  const getCharacterGender = (characterName) => {
    const femaleNames = ['sarah', 'lisa', 'jennifer', 'mary', 'susan', 'karen', 'nancy'];
    const firstName = characterName.split(' ')[0].toLowerCase();
    return femaleNames.includes(firstName) ? 'female' : 'male';
  };

  const handleEndSession = async () => {
    addDebugLog('🛑 User clicked End Session - stopping everything immediately...');
    
    // Immediately stop all audio and set session as inactive
    setIsSessionActive(false);
    setSessionState('ended');
    
    // Force stop both speech recognition and synthesis
    addDebugLog('🔇 Force stopping all audio...');
    speechService.stopListening();
    speechService.stopSpeaking();
    
    addDebugLog('✅ All audio stopped, processing session end...');

    try {
      if (sessionId) {
        const duration = Math.round((Date.now() - startTime.getTime()) / 60000);
        const sessionFeedback = generateFeedback();
        setFeedback(sessionFeedback);
        
        await apiService.endSession(sessionId, JSON.stringify(sessionFeedback), duration);
        addDebugLog('✅ Session ended successfully');
      }
      setShowFeedback(true);
      
    } catch (err) {
      addDebugLog(`❌ Error ending session: ${err.message}`);
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
      tips = ["Try to have a longer conversation next time"];
    } else if (exchanges < 3) {
      performance = "Good effort!";
      tips = ["Try to extend the conversation longer"];
    } else if (exchanges < 6) {
      performance = "Well done!";
      tips = ["You're getting comfortable with roleplay"];
    } else {
      performance = "Excellent session!";
      tips = ["Great conversation flow"];
    }

    return { performance, exchanges, duration, tips, scenario: scenario.title };
  };

  const getStateMessage = () => {
    switch (sessionState) {
      case 'starting': return 'Initializing session...';
      case 'listening': return '🎤 Listening for your voice...';
      case 'processing': return '🤔 AI is thinking...';
      case 'ai-speaking': return '🔊 AI is speaking (mic off)...';
      case 'ended': return 'Session ended';
      default: return '';
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
    <EnhancedFeedback
      sessionId={sessionId}
      basicFeedback={feedback}
      onContinue={() => {
        setShowFeedback(false);
        onEndSession();
      }}
      onViewDashboard={() => {
        setShowFeedback(false);
        onEndSession();
      }}
    />
  );
}

  // Error Screen
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '600px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Session Error</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          
          <div style={{ textAlign: 'left', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Debug Log:</h3>
            {debugLog.map((log, index) => (
              <div key={index} style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '4px' }}>
                {log}
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => {
                setError('');
                setSessionId('');
                setIsSessionActive(true);
                setSessionState('starting');
                initializeSession();
              }}
              style={{
                backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => { cleanup(); onEndSession(); }}
              style={{
                backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '12px 24px',
                borderRadius: '8px', cursor: 'pointer'
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
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0 }}>{scenario.title}</h1>
            <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>
              {scenario.character_name} • {scenario.character_role}
            </p>
            {sessionId && (
              <p style={{ color: '#10b981', margin: '2px 0 0 0', fontSize: '0.8rem' }}>
                Session: {sessionId.substring(0, 8)}...
              </p>
            )}
          </div>
          <button 
            onClick={handleEndSession} 
            style={{ 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            End Session
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: getStatusColor(), color: 'white', padding: '12px 24px', textAlign: 'center', fontWeight: '500' }}>
        {getStateMessage()}
      </div>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          
          {/* Debug Log Panel */}
          <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>Debug Log:</h3>
            <div style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {debugLog.map((log, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>{log}</div>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#fafafa', minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
            {conversation.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👋</div>
                <p>Start speaking to begin the conversation</p>
                {sessionState === 'starting' && (
                  <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>Setting up your session...</p>
                )}
              </div>
            ) : (
              <div>
                {conversation.map((message, index) => (
                  <div key={index} style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', backgroundColor: message.speaker === 'user' ? '#dbeafe' : '#dcfce7' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px', color: message.speaker === 'user' ? '#1e40af' : '#166534' }}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </div>
                    <div>{message.message}</div>
                  </div>
                ))}
                
                {currentTranscript && sessionState === 'listening' && (
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', fontStyle: 'italic', color: '#92400e' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>You (speaking...)</div>
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

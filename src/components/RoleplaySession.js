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
  const [debugLog, setDebugLog] = useState([]);

  const addDebugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    setDebugLog(prev => [...prev.slice(-4), `${timestamp}: ${message}`]);
  };

  useEffect(() => {
    initializeSession();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    addDebugLog('🧹 Cleaning up session...');
    setIsSessionActive(false);
    speechService.stopListening();
    speechService.stopSpeaking();
  };

  const initializeSession = async () => {
    try {
      addDebugLog('🚀 Starting session initialization...');
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      setSessionId(newSessionId);
      addDebugLog(`✅ Session created with ID: ${newSessionId}`);
      setStartTime(new Date());
      
      addDebugLog('🎤 Requesting microphone permission...');
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addDebugLog('✅ Microphone permission granted');
      
      setTimeout(() => {
        if (isSessionActive) {
          addDebugLog('🎧 Starting listening...');
          startListening();
        }
      }, 2000);
      
    } catch (err) {
      addDebugLog(`❌ Session initialization failed: ${err.message}`);
      setError('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const startListening = () => {
    if (!isSessionActive) {
      addDebugLog('❌ Session not active, not starting listening');
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
        if (!isSessionActive) return;
        
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
            if (isSessionActive && sessionState === 'listening') {
              addDebugLog('🔄 Restarting listening after error...');
              startListening();
            }
          }, 2000);
        }
      },
      () => {
        if (!isSessionActive) return;
        
        addDebugLog('🏁 Speech recognition ended');
        if (sessionState === 'listening') {
          setTimeout(() => {
            if (isSessionActive) {
              addDebugLog('🔄 Restarting listening...');
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
      addDebugLog(`🗣️ Processing user message: "${userMessage}"`);
      setSessionState('processing');
      setCurrentTranscript('');
      
      // Add user message to conversation
      const userMsg = {
        speaker: 'user',
        message: userMessage,
        timestamp: Date.now()
      };
      
      const updatedConversation = [...conversation, userMsg];
      setConversation(updatedConversation);
      addDebugLog('✅ User message added to conversation');

      // Update session in database
      addDebugLog('💾 Updating session conversation...');
      await apiService.updateSessionConversation(sessionId, updatedConversation);
      addDebugLog('✅ Session conversation updated');

      // Get AI response
      addDebugLog('🤖 Requesting AI response...');
      addDebugLog(`📋 Scenario ID: ${scenario.id}`);
      addDebugLog(`📋 Conversation history length: ${conversation.length}`);
      
      const aiResult = await apiService.generateAIResponse(
        scenario.id,
        userMessage,
        conversation
      );

      addDebugLog(`✅ AI response received: "${aiResult.response}"`);
      addDebugLog(`👤 Character: ${aiResult.character}`);

      const aiMsg = {
        speaker: 'ai',
        message: aiResult.response,
        timestamp: Date.now()
      };
      
      const finalConversation = [...updatedConversation, aiMsg];
      setConversation(finalConversation);
      addDebugLog('✅ AI message added to conversation');

      // Update session with AI response
      addDebugLog('💾 Updating session with AI response...');
      await apiService.updateSessionConversation(sessionId, finalConversation);
      addDebugLog('✅ Session updated with AI response');

      if (!isSessionActive) return;

      // Speak AI response
      setSessionState('ai-speaking');
      addDebugLog('🔊 Starting speech synthesis...');
      
      try {
        const characterGender = getCharacterGender(scenario.character_name);
        addDebugLog(`🎭 Character gender: ${characterGender}`);
        await speechService.speak(aiResult.response, characterGender);
        addDebugLog('✅ Speech synthesis completed');
      } catch (speechError) {
        addDebugLog(`❌ Speech synthesis error: ${speechError.message}`);
      }

      if (!isSessionActive) return;

      // Return to listening
      addDebugLog('🔄 Returning to listening state...');
      setTimeout(() => {
        if (isSessionActive) {
          startListening();
        }
      }, 1500);

    } catch (err) {
      addDebugLog(`💥 Error in processUserSpeech: ${err.message}`);
      addDebugLog(`🔍 Error stack: ${err.stack}`);
      
      // Show error in UI
      setError(`Failed to get AI response: ${err.message}`);
      
      if (isSessionActive) {
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
    addDebugLog('🛑 Ending session...');
    
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
      case 'starting': return 'Getting ready...';
      case 'listening': return 'Listening...';
      case 'processing': return 'AI is thinking...';
      case 'ai-speaking': return 'AI is speaking...';
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            Session Complete!
          </h1>
          <div style={{ backgroundColor: '#f0f9ff', padding: '24px', borderRadius: '12px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#1e40af', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Star size={24} />
              {feedback.performance}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>{feedback.exchanges}</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Exchanges</div>
              </div>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>{feedback.duration}m</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Duration</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setShowFeedback(false);
              onEndSession();
            }}
            style={{
              backgroundColor: '#667eea', color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto'
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Error</h2>
          <p style={{ marginBottom: '24px' }}>{error}</p>
          
          {/* Debug log */}
          <div style={{ textAlign: 'left', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Debug Log:</h3>
            {debugLog.map((log, index) => (
              <div key={index} style={{ fontSize: '0.8rem', fontFamily: 'monospace', marginBottom: '4px' }}>
                {log}
              </div>
            ))}
          </div>
          
          <button onClick={() => { cleanup(); onEndSession(); }} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>
            Return to Dashboard
          </button>
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
          </div>
          <button onClick={handleEndSession} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
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
            <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.8rem', fontFamily: 'monospace' }}>
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
                
                {currentTranscript && (
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

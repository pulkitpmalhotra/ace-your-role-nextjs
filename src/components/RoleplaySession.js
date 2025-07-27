import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { speechService } from '../services/speech';

function RoleplaySession({ scenario, userEmail, onEndSession }) {
  const [sessionState, setSessionState] = useState('starting');
  const [conversation, setConversation] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    initializeSession();
    return () => {
      speechService.stopListening();
      speechService.stopSpeaking();
    };
  }, []);

  const initializeSession = async () => {
    try {
      const newSessionId = await apiService.createSession(scenario.id, userEmail);
      setSessionId(newSessionId);
      
      setTimeout(() => {
        startListening();
      }, 2000);
      
    } catch (err) {
      setError('Failed to start session. Please try again.');
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

    speechService.startListening(
      (transcript, isFinal) => {
        if (isFinal && transcript.trim().length > 2) {
          processUserSpeech(transcript.trim());
        } else {
          setCurrentTranscript(transcript);
        }
      },
      (error) => {
        console.error('Speech error:', error);
        setTimeout(() => startListening(), 2000);
      },
      () => {
        setTimeout(() => startListening(), 1000);
      }
    );
  };

  const processUserSpeech = async (userMessage) => {
    try {
      setSessionState('processing');
      setCurrentTranscript('');
      
      const userMsg = {
        speaker: 'user',
        message: userMessage,
        timestamp: Date.now()
      };
      
      const updatedConversation = [...conversation, userMsg];
      setConversation(updatedConversation);

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

      setSessionState('ai-speaking');
      await speechService.speak(aiResponse, 'female');

      setTimeout(() => startListening(), 1000);

    } catch (err) {
      console.error('Error processing speech:', err);
      setTimeout(() => startListening(), 2000);
    }
  };

  const handleEndSession = () => {
    speechService.stopListening();
    speechService.stopSpeaking();
    onEndSession();
  };

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: 'red' }}>Error</h2>
          <p>{error}</p>
          <button onClick={handleEndSession}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h1>{scenario.title}</h1>
          <p>Speaking with {scenario.character_name}</p>
          <p>Status: {sessionState}</p>
          <button onClick={handleEndSession}>End Session</button>
        </div>

        <div style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          minHeight: '400px'
        }}>
          {conversation.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3>Start the conversation!</h3>
              <p>Say hello to {scenario.character_name}</p>
            </div>
          ) : (
            <div>
              {conversation.map((message, index) => (
                <div 
                  key={index}
                  style={{
                    marginBottom: '15px',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: message.speaker === 'user' ? '#e3f2fd' : '#e8f5e8'
                  }}
                >
                  <strong>{message.speaker === 'user' ? 'You' : scenario.character_name}:</strong>
                  <div>{message.message}</div>
                </div>
              ))}
              
              {currentTranscript && (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '8px',
                  fontStyle: 'italic'
                }}>
                  You (speaking): {currentTranscript}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoleplaySession;

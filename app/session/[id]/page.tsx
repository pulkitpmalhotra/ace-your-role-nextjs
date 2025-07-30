'use client';

import { useState, useEffect, useRef } from 'react';
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
  audioUrl?: string;
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sessionStartTime] = useState(Date.now());
  
  // Speech features
  const [isRecording, setIsRecording] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const startRecording = async () => {
    try {
      console.log('🎤 Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('🎤 Recording stopped, processing...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Could not access microphone. Please check permissions and try again.');
    }
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      console.log('🔄 Processing voice input...');
      
      // Convert audio to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const audioData = reader.result as string;
          console.log('📤 Sending to speech API...');
          
          const response = await fetch('/api/speech/to-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              audioData,
              config: {
                languageCode: 'en-US',
                sampleRateHertz: 44100
              }
            })
          });

          const data = await response.json();
          console.log('📥 Speech API response:', data);
          
          if (data.success && data.data.transcript) {
            console.log('✅ Transcript received:', data.data.transcript);
            setCurrentMessage(data.data.transcript);
            // Auto-send the transcribed message
            setTimeout(() => sendMessage(data.data.transcript), 500);
          } else {
            console.error('❌ Speech recognition failed:', data.error);
            alert('Speech recognition failed. Please try typing your message.');
          }
        } catch (error) {
          console.error('❌ Error processing speech:', error);
          alert('Error processing speech. Please try again.');
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Voice processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || currentMessage.trim();
    if (!textToSend || isLoading || !scenario) return;

    console.log('📤 Sending message:', textToSend);

    const userMessage: ConversationMessage = {
      speaker: 'user',
      message: textToSend,
      timestamp: Date.now()
    };

    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Get AI response
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

        // Generate speech for AI response if enabled
        if (speechEnabled) {
          try {
            console.log('🔊 Generating speech for AI response...');
            const ttsResponse = await fetch('/api/speech/to-speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: data.data.response,
                character: scenario.character_name,
                emotion: data.data.emotion || 'professional',
                gender: data.data.gender || 'neutral'
              })
            });

            const ttsData = await ttsResponse.json();
            if (ttsData.success) {
              aiMessage.audioUrl = ttsData.data.audioUrl;
              console.log('✅ Speech generated for AI response');
            }
          } catch (error) {
            console.error('❌ TTS failed:', error);
          }
        }

        setConversation(prev => [...prev, aiMessage]);

        // Auto-play AI response if audio is available
        if (aiMessage.audioUrl && speechEnabled) {
          playAudio(aiMessage.timestamp.toString());
        }
      } else {
        throw new Error(data.error || 'AI response failed');
      }

    } catch (error) {
      console.error('❌ Failed to get AI response:', error);
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

  const playAudio = (messageId: string) => {
    if (currentlyPlaying) return;

    console.log('🔊 Playing audio for message:', messageId);
    setCurrentlyPlaying(messageId);
    
    // Simulate audio playback (since we're using mock audio)
    setTimeout(() => {
      setCurrentlyPlaying(null);
      console.log('✅ Audio playback finished');
    }, 3000);
  };

  const endSession = () => {
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    const exchanges = conversation.filter(msg => msg.speaker === 'user').length;
    
    const sessionData = {
      scenario,
      conversation,
      duration: sessionDuration,
      exchanges,
      userEmail,
      speechEnabled,
      features: ['gemini-2.5-flash-lite', 'google-speech-apis']
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
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #2563eb',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
                {scenario.title}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Role-playing with {scenario.character_name} ({scenario.character_role})
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setSpeechEnabled(!speechEnabled)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: speechEnabled ? '#dcfce7' : '#f3f4f6',
                  color: speechEnabled ? '#166534' : '#374151'
                }}
              >
                🎤 Speech {speechEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={endSession}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conversation Area */}
      <main style={{ flex: 1, maxWidth: '64rem', margin: '0 auto', width: '100%', padding: '24px 16px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          height: '400px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {conversation.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0' }}>
                <p style={{ marginBottom: '8px' }}>👋 Start the conversation!</p>
                <p style={{ fontSize: '14px' }}>
                  You're now speaking with <strong>{scenario.character_name}</strong>
                </p>
                <p style={{ fontSize: '12px', color: '#2563eb', marginTop: '8px' }}>
                  ✨ Enhanced with Google Speech APIs (95%+ accuracy) & Professional voices
                </p>
              </div>
            )}
            
            {conversation.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.speaker === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: message.speaker === 'user' ? '#2563eb' : '#f3f4f6',
                    color: message.speaker === 'user' ? 'white' : '#111827'
                  }}
                >
                  <p style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{message.message}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{
                      fontSize: '12px',
                      margin: 0,
                      color: message.speaker === 'user' ? '#bfdbfe' : '#6b7280'
                    }}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </p>
                    {message.audioUrl && message.speaker === 'ai' && (
                      <button
                        onClick={() => playAudio(message.timestamp.toString())}
                        disabled={currentlyPlaying === message.timestamp.toString()}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginLeft: '8px',
                          color: currentlyPlaying === message.timestamp.toString() ? '#2563eb' : '#6b7280'
                        }}
                      >
                        {currentlyPlaying === message.timestamp.toString() ? '🔊' : '🔈'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  color: '#111827',
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#6b7280', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out infinite both'
                      }}></div>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#6b7280', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                      }}></div>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        backgroundColor: '#6b7280', 
                        borderRadius: '50%',
                        animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {scenario.character_name} is responding...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Input Area with Speech */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          border: '1px solid #e5e7eb',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Type or speak your message to ${scenario.character_name}...`}
              style={{
                flex: 1,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                resize: 'none',
                outline: 'none'
              }}
              rows={3}
              disabled={isLoading}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {speechEnabled && (
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  disabled={isLoading}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isRecording ? '#dc2626' : '#e5e7eb',
                    color: isRecording ? 'white' : '#374151',
                    animation: isRecording ? 'pulse 2s infinite' : 'none'
                  }}
                  title="Hold to record"
                >
                  🎤 {isRecording ? 'Recording...' : 'Hold to Talk'}
                </button>
              )}
              <button
                onClick={() => sendMessage()}
                disabled={!currentMessage.trim() || isLoading}
                style={{
                  backgroundColor: (!currentMessage.trim() || isLoading) ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: (!currentMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Send
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
              Press Enter to send • Shift+Enter for new line
            </p>
            {speechEnabled && (
              <p style={{ fontSize: '12px', color: '#2563eb', margin: 0 }}>
                🎧 Enhanced with Google Speech APIs
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

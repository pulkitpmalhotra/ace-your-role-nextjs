'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  audioUrl?: string;
  confidence?: number;
}

type ConversationState = 
  | 'idle' 
  | 'listening' 
  | 'processing_speech' 
  | 'ai_thinking' 
  | 'ai_speaking' 
  | 'waiting_to_listen';

export default function SessionPage({ params }: { params: { id: string } }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [sessionStartTime] = useState(Date.now());
  
  // Voice conversation state
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [silenceDetected, setSilenceDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const router = useRouter();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const listeningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [router]);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
  }, []);

  // Start voice conversation mode
  const startVoiceConversation = async () => {
    try {
      setVoiceModeEnabled(true);
      setConversationState('ai_thinking');
      
      // Start with AI greeting if this is the first message
      if (conversation.length === 0) {
        await generateAIGreeting();
      } else {
        // Resume listening
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error starting voice conversation:', error);
    }
  };

  // Generate AI greeting based on scenario
  const generateAIGreeting = async () => {
    if (!scenario) return;

    setConversationState('ai_thinking');
    
    const greetingPrompt = `You are ${scenario.character_name}, a ${scenario.character_role}. 

SCENARIO CONTEXT:
- Title: ${scenario.title}
- Description: ${scenario.description || ''}
- Your personality: ${scenario.character_personality || 'Professional and engaging'}
- Industry: ${scenario.category}

Start this roleplay conversation with a natural, contextual greeting that fits the scenario. Be brief (10-20 words) and set the stage for why someone would be talking to you in this situation.

Your opening greeting:`;

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage: greetingPrompt,
          conversationHistory: [],
          messageCount: 0,
          isGreeting: true
        })
      });

      const data = await response.json();

      if (data.success) {
        const greetingMessage: ConversationMessage = {
          speaker: 'ai',
          message: data.data.response,
          timestamp: Date.now()
        };

        setConversation([greetingMessage]);
        
        // Speak the greeting and then start listening
        await speakAIResponse(data.data.response, data.data);
      }
    } catch (error) {
      console.error('❌ Error generating greeting:', error);
      // Fallback greeting
      const fallbackGreeting = `Hi, I'm ${scenario.character_name}. How can I help you today?`;
      const greetingMessage: ConversationMessage = {
        speaker: 'ai',
        message: fallbackGreeting,
        timestamp: Date.now()
      };
      setConversation([greetingMessage]);
      await speakAIResponse(fallbackGreeting, { emotion: 'professional', gender: 'neutral' });
    }
  };

  // Start listening with silence detection
  const startListening = async () => {
    try {
      console.log('🎤 Starting to listen with silence detection...');
      setConversationState('listening');
      setCurrentTranscript('');
      setSilenceDetected(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      // Set up audio analysis for silence detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Start monitoring audio levels
      const checkAudioLevel = () => {
        if (analyserRef.current && conversationState === 'listening') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          
          // Detect silence (adjust threshold as needed)
          if (average < 10) {
            handleSilenceDetected();
          } else {
            resetSilenceTimer();
          }
          
          requestAnimationFrame(checkAudioLevel);
        }
      };
      checkAudioLevel();
      
      // Set up MediaRecorder
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
        console.log('🎤 Recording stopped, processing speech...');
        setConversationState('processing_speech');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processUserSpeech(audioBlob);
        
        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      
      // Auto-stop after 30 seconds max
      listeningTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopListening();
        }
      }, 30000);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setConversationState('idle');
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleSilenceDetected = () => {
    if (!silenceTimerRef.current && isRecording) {
      // Start silence timer (2 seconds of silence triggers stop)
      silenceTimerRef.current = setTimeout(() => {
        if (isRecording && audioChunksRef.current.length > 0) {
          console.log('🔇 Silence detected, stopping recording...');
          setSilenceDetected(true);
          stopListening();
        }
      }, 2000);
    }
  };

  const resetSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
      setSilenceDetected(false);
    }
  };

  // Stop listening
  const stopListening = () => {
    console.log('🛑 Stopping listening...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  // Process user speech to text
  const processUserSpeech = async (audioBlob: Blob) => {
    try {
      console.log('🔄 Converting speech to text...');
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const audioData = reader.result as string;
          
          const response = await fetch('/api/speech/to-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              audioData,
              config: {
                languageCode: 'en-US',
                sampleRateHertz: 44100,
                enableAutomaticPunctuation: true,
                model: 'latest_long'
              }
            })
          });

          const data = await response.json();
          
          if (data.success && data.data.transcript && data.data.transcript.trim()) {
            console.log('✅ User said:', data.data.transcript);
            setCurrentTranscript(data.data.transcript);
            
            const userMessage: ConversationMessage = {
              speaker: 'user',
              message: data.data.transcript,
              timestamp: Date.now(),
              confidence: data.data.confidence
            };
            
            const newConversation = [...conversation, userMessage];
            setConversation(newConversation);
            
            // Get AI response
            await getAIResponse(data.data.transcript, newConversation);
          } else {
            console.log('⚠️ No clear speech detected, listening again...');
            // If no speech detected, resume listening after a short pause
            setTimeout(() => {
              if (voiceModeEnabled) {
                startListening();
              }
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Error processing speech:', error);
          setTimeout(() => {
            if (voiceModeEnabled) {
              startListening();
            }
          }, 2000);
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('❌ Voice processing error:', error);
      setConversationState('idle');
    }
  };

  // Get AI response
  const getAIResponse = async (userMessage: string, conversationHistory: ConversationMessage[]) => {
    try {
      console.log('🤖 Getting AI response...');
      setConversationState('ai_thinking');

      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          userMessage,
          conversationHistory,
          messageCount: conversationHistory.filter(msg => msg.speaker === 'user').length - 1
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
        
        // Speak AI response
        await speakAIResponse(data.data.response, data.data);
      } else {
        throw new Error(data.error || 'AI response failed');
      }

    } catch (error) {
      console.error('❌ Failed to get AI response:', error);
      const fallbackMessage: ConversationMessage = {
        speaker: 'ai',
        message: "I apologize, could you please repeat that?",
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, fallbackMessage]);
      await speakAIResponse(fallbackMessage.message, { emotion: 'professional', gender: 'neutral' });
    }
  };

  // Speak AI response with enhanced timing
  const speakAIResponse = async (text: string, aiData: any) => {
    try {
      console.log('🔊 AI speaking...');
      setConversationState('ai_speaking');

      // Generate speech (for now, simulate duration)
      const ttsResponse = await fetch('/api/speech/to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          character: scenario?.character_name,
          emotion: aiData.emotion || 'professional',
          gender: aiData.gender || 'neutral'
        })
      });

      const ttsData = await ttsResponse.json();
      
      if (ttsData.success) {
        // Estimate speaking duration more accurately
        const words = text.split(' ').length;
        const estimatedDuration = Math.max(2000, words * 500); // ~120 words per minute
        
        console.log(`🔊 AI speaking for ~${estimatedDuration}ms...`);
        
        setTimeout(() => {
          console.log('✅ AI finished speaking');
          setConversationState('waiting_to_listen');
          
          // Wait 1.5 seconds after AI finishes, then start listening again
          setTimeout(() => {
            if (voiceModeEnabled) {
              startListening();
            }
          }, 1500);
        }, estimatedDuration);
      } else {
        // If TTS fails, continue conversation flow
        setTimeout(() => {
          setConversationState('waiting_to_listen');
          setTimeout(() => {
            if (voiceModeEnabled) {
              startListening();
            }
          }, 1500);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ TTS error:', error);
      // Continue conversation even if TTS fails
      setTimeout(() => {
        setConversationState('waiting_to_listen');
        setTimeout(() => {
          if (voiceModeEnabled) {
            startListening();
          }
        }, 1500);
      }, 2000);
    }
  };

  // Stop voice conversation
  const stopVoiceConversation = () => {
    console.log('🛑 Stopping voice conversation');
    setVoiceModeEnabled(false);
    setConversationState('idle');
    cleanup();
  };

  // End session
  const endSession = () => {
    stopVoiceConversation();
    
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000 / 60);
    const exchanges = conversation.filter(msg => msg.speaker === 'user').length;
    
    const sessionData = {
      scenario,
      conversation,
      duration: sessionDuration,
      exchanges,
      userEmail,
      voiceModeUsed: voiceModeEnabled,
      features: ['gemini-2.5-flash-lite', 'advanced-speech', 'silence-detection', 'natural-flow']
    };
    
    localStorage.setItem('lastSession', JSON.stringify(sessionData));
    router.push('/feedback');
  };

  const getStateMessage = () => {
    switch (conversationState) {
      case 'listening':
        return `🎤 Listening... ${silenceDetected ? '(silence detected)' : '(speak now)'}`;
      case 'processing_speech':
        return '🔄 Processing your speech...';
      case 'ai_thinking':
        return `🤖 ${scenario?.character_name} is thinking...`;
      case 'ai_speaking':
        return `🔊 ${scenario?.character_name} is speaking...`;
      case 'waiting_to_listen':
        return '⏳ Preparing to listen...';
      default:
        return 'Ready for natural conversation';
    }
  };

  const getStateColor = () => {
    switch (conversationState) {
      case 'listening':
        return silenceDetected ? 'bg-yellow-500' : 'bg-red-500';
      case 'processing_speech':
        return 'bg-blue-500';
      case 'ai_thinking':
        return 'bg-purple-500';
      case 'ai_speaking':
        return 'bg-green-500';
      case 'waiting_to_listen':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{scenario.title}</h1>
              <p className="text-sm text-gray-600">
                Natural conversation with {scenario.character_name} ({scenario.character_role})
              </p>
              {scenario.description && (
                <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
              )}
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

      {/* Voice Status Bar */}
      <div className={`${getStateColor()} text-white py-3 text-center font-medium transition-colors`}>
        <div className="flex items-center justify-center space-x-2">
          <span>{getStateMessage()}</span>
          {conversationState === 'listening' && (
            <div className="flex space-x-1">
              <div 
                className="w-1 h-4 bg-white rounded animate-pulse"
                style={{ animationDelay: '0ms', opacity: Math.min(1, audioLevel / 50) }}
              ></div>
              <div 
                className="w-1 h-4 bg-white rounded animate-pulse"
                style={{ animationDelay: '100ms', opacity: Math.min(1, audioLevel / 40) }}
              ></div>
              <div 
                className="w-1 h-4 bg-white rounded animate-pulse"
                style={{ animationDelay: '200ms', opacity: Math.min(1, audioLevel / 30) }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Area */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 min-h-96 mb-6 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {conversation.length === 0 && !voiceModeEnabled && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-2">🎙️ Ready for natural voice conversation!</p>
                <p className="text-sm mb-4">
                  Start a natural conversation with <strong>{scenario.character_name}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  ✨ Features: Silence detection • Natural timing • High accuracy speech
                </p>
              </div>
            )}
            
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-lg px-4 py-3 rounded-2xl ${
                    message.speaker === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {message.speaker === 'user' ? 'You' : scenario.character_name}
                    </p>
                    {message.confidence && (
                      <span className={`text-xs ${
                        message.speaker === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {Math.round(message.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {currentTranscript && conversationState === 'processing_speech' && (
              <div className="flex justify-end">
                <div className="bg-blue-100 text-blue-800 max-w-lg px-4 py-3 rounded-2xl rounded-br-md border-2 border-dashed border-blue-300">
                  <p className="text-sm">{currentTranscript}</p>
                  <p className="text-xs text-blue-600 mt-1">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voice Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/20 p-6 text-center">
          {!voiceModeEnabled ? (
            <div>
              <button
                onClick={startVoiceConversation}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
              >
                🎙️ Start Natural Voice Conversation
              </button>
              <p className="text-sm text-gray-600 mt-3">
                Experience natural conversation flow with automatic silence detection
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={stopVoiceConversation}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                🛑 Stop Voice Mode
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Voice conversation active • {conversationState === 'listening' ? 'Microphone ON' : 'Microphone OFF'}
              </p>
              <div className="flex justify-center items-center space-x-4 mt-3 text-xs text-gray-500">
                <span>🎤 Auto silence detection</span>
                <span>🤖 Natural timing</span>
                <span>🔊 Voice responses</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Key fixes for app/session/[id]/page.tsx - Microphone Control

// FIXED: End session function with immediate microphone shutdown
const endSession = async () => {
  if (isEndingSession) return;
  
  console.log('🛑 ENDING SESSION - IMMEDIATE MICROPHONE SHUTDOWN');
  setIsEndingSession(true);
  
  // IMMEDIATELY disable all audio processing
  setSessionState(prev => ({
    ...prev,
    isActive: false,
    status: 'ended'
  }));
  
  // FORCE STOP all speech recognition immediately
  forceStopMicrophone();
  
  // CANCEL any speech synthesis
  if (speechSynthesisRef.current) {
    speechSynthesisRef.current.cancel();
  }
  
  // Update UI state immediately
  setAudioState(prev => ({
    ...prev,
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentTranscript: ''
  }));
  
  // Clear all timers
  clearAllTimers();
  
  console.log('✅ Microphone and AI processing STOPPED');
  
  // Save session data if we have content
  if (sessionState.sessionId && conversation.length > 0) {
    const duration = Math.floor((Date.now() - sessionState.startTime) / 60000);
    const exchanges = Math.floor(conversation.length / 2);
    
    try {
      let score = 2.0;
      score += (exchanges >= 2 ? 0.5 : 0);
      score += (exchanges >= 4 ? 0.5 : 0);
      score += (exchanges >= 6 ? 0.5 : 0);
      score += (duration >= 3 ? 0.5 : 0);
      score = Math.min(5.0, score);
      
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionState.sessionId,
          session_status: 'completed',
          duration_minutes: duration,
          overall_score: score
        })
      });

    } catch (err) {
      console.error('❌ Error saving session data:', err);
    }
  }
  
  // Prepare session data for feedback
  const sessionData = {
    scenario,
    conversation,
    duration: Math.floor((Date.now() - sessionState.startTime) / 60000),
    exchanges: Math.floor(conversation.length / 2),
    userEmail,
    sessionId: sessionState.sessionId
  };
  
  localStorage.setItem('lastSession', JSON.stringify(sessionData));
  router.push('/feedback');
};

// FIXED: Force stop microphone function
const forceStopMicrophone = () => {
  console.log('🎤 FORCE STOPPING microphone...');
  
  // Stop speech recognition aggressively
  if (recognitionRef.current) {
    try {
      recognitionRef.current.stop();
      recognitionRef.current.abort();
    } catch (e) {
      console.log('Recognition already stopped');
    }
    recognitionRef.current = null;
  }
  
  // Clear silence timer
  if (silenceTimerRef.current) {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }
  
  // Try to stop media stream if we can access it
  try {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
      })
      .catch(e => console.log('Could not stop media stream'));
  } catch (e) {
    console.log('Could not access media stream');
  }
  
  console.log('✅ Microphone FORCE STOPPED');
};

// FIXED: Clear all timers function
const clearAllTimers = () => {
  if (silenceTimerRef.current) {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }
  
  if (cleanupTimerRef.current) {
    clearTimeout(cleanupTimerRef.current);
    cleanupTimerRef.current = null;
  }
};

// FIXED: Enhanced cleanup function
const cleanup = () => {
  console.log('🧹 Session cleanup - DISABLING ALL AUDIO');
  
  // Set session to inactive FIRST
  setSessionState(prev => ({
    ...prev,
    isActive: false,
    status: 'ended'
  }));
  
  // Force stop microphone
  forceStopMicrophone();
  
  // Cancel speech synthesis
  if (speechSynthesisRef.current) {
    speechSynthesisRef.current.cancel();
  }
  
  // Update audio state
  setAudioState(prev => ({
    ...prev,
    isSpeaking: false,
    isProcessing: false,
    isListening: false,
    currentTranscript: ''
  }));
  
  // Clear all timers
  clearAllTimers();
  
  console.log('✅ Session cleanup completed - ALL AUDIO DISABLED');
};

// FIXED: Stop listening function with better error handling
const stopListening = () => {
  console.log('🛑 Stopping speech recognition...');
  
  if (recognitionRef.current) {
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.log('Recognition already stopped or error stopping:', e);
    }
    
    // Force clear the reference
    recognitionRef.current = null;
  }
  
  if (silenceTimerRef.current) {
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }
  
  setAudioState(prev => ({
    ...prev,
    isListening: false,
    currentTranscript: ''
  }));
  
  console.log('✅ Speech recognition stopped');
};

// FIXED: Enhanced speech recognition with better session checking
const startListening = useCallback(() => {
  // Check if session is still active FIRST
  if (!sessionState.isActive || !sessionState.sessionId || audioState.isSpeaking || audioState.isProcessing || isEndingSession) {
    console.log('🚫 Cannot start listening - session inactive or ending');
    return;
  }

  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    setError('Voice recognition requires Chrome browser. Please switch to Chrome for the best experience.');
    return;
  }

  console.log('🎤 Starting speech recognition...');

  const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 3;
  
  recognitionRef.current = recognition;
  
  setAudioState(prev => ({
    ...prev,
    isListening: true,
    currentTranscript: ''
  }));

  setSessionState(prev => ({
    ...prev,
    status: 'listening'
  }));

  let finalTranscript = '';
  let isProcessingFinal = false;

  recognition.onstart = () => {
    console.log('🎤 Speech recognition started');
    setError('');
  };

  recognition.onresult = async (event: any) => {
    // Check if session is still active
    if (!sessionState.isActive || audioState.isSpeaking || isProcessingFinal || isEndingSession) {
      console.log('🚫 Ignoring speech result - session inactive or ending');
      return;
    }

    let interimTranscript = '';
    let confidence = 0;
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      confidence = result[0].confidence;
      
      if (result.isFinal) {
        finalTranscript += transcript;
        console.log('✅ Final transcript:', transcript, 'confidence:', confidence);
      } else {
        interimTranscript += transcript;
      }
    }

    setAudioState(prev => ({
      ...prev,
      currentTranscript: interimTranscript,
      speechConfidence: confidence
    }));

    if (finalTranscript.trim() && !isProcessingFinal && sessionState.isActive && !isEndingSession) {
      isProcessingFinal = true;
      clearTimeout(silenceTimerRef.current!);
      processUserSpeech(finalTranscript.trim(), confidence);
      return;
    }

    if (interimTranscript.trim().length > 2 && sessionState.isActive && !isEndingSession) {
      clearTimeout(silenceTimerRef.current!);
      silenceTimerRef.current = setTimeout(() => {
        if (interimTranscript.trim() && !isProcessingFinal && sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
          isProcessingFinal = true;
          console.log('⏰ Auto-finalizing after silence');
          processUserSpeech(interimTranscript.trim(), confidence);
        }
      }, 2500);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('🚨 Speech recognition error:', event.error);
    
    setAudioState(prev => ({
      ...prev,
      isListening: false
    }));
    
    if (event.error === 'not-allowed') {
      setAudioState(prev => ({
        ...prev,
        permissionDenied: true
      }));
      setError('Microphone access was denied. Please allow microphone access in your browser settings and refresh the page.');
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      setError('Having trouble with voice recognition? Try speaking clearly or check your microphone.');
      
      // Only restart if session is still active and not ending
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
          startListening();
        }
      }, 2000);
    }
  };

  recognition.onend = () => {
    console.log('🏁 Speech recognition ended');
    setAudioState(prev => ({
      ...prev,
      isListening: false
    }));
    
    // Only restart if session is still active and not ending
    if (sessionState.isActive && !audioState.isSpeaking && !isProcessingFinal && !isEndingSession) {
      setTimeout(() => {
        if (sessionState.isActive && !audioState.isSpeaking && !audioState.isProcessing && !isEndingSession) {
          startListening();
        }
      }, 1000);
    }
  };

  try {
    recognition.start();
  } catch (error) {
    console.error('❌ Failed to start speech recognition:', error);
    setError('Unable to start voice recognition. Please try again.');
  }
}, [sessionState.isActive, sessionState.sessionId, audioState.isSpeaking, audioState.isProcessing, isEndingSession, conversation]);

// FIXED: Process user speech with session checking
const processUserSpeech = async (userMessage: string, confidence: number) => {
  // Double-check session is still active
  if (!userMessage || !scenario || !sessionState.sessionId || !sessionState.isActive || isEndingSession) {
    console.log('🚫 Cannot process speech - session inactive or ending');
    return;
  }
  
  console.log('💬 Processing user speech:', userMessage, 'confidence:', confidence);
  
  stopListening();
  
  setAudioState(prev => ({
    ...prev,
    isProcessing: true,
    currentTranscript: ''
  }));
  
  setSessionState(prev => ({
    ...prev,
    status: 'processing'
  }));
  
  const userMsg: ConversationMessage = {
    speaker: 'user',
    message: userMessage,
    timestamp: Date.now(),
    confidence: confidence
  };
  
  const updatedConversation = [...conversation, userMsg];
  setConversation(updatedConversation);
  await saveConversationToDatabase(updatedConversation);

  try {
    // Check again before getting AI response
    if (!sessionState.isActive || isEndingSession) {
      console.log('🚫 Session ended during processing - stopping');
      return;
    }
    
    // Get AI response
    const aiResponse = await getAIResponse(scenario, userMessage, updatedConversation);
    
    const aiMsg: ConversationMessage = {
      speaker: 'ai',
      message: aiResponse.response,
      timestamp: Date.now(),
      emotion: aiResponse.emotion || 'professional',
      context: aiResponse.context
    };
    
    const finalConversation = [...updatedConversation, aiMsg];
    setConversation(finalConversation);
    await saveConversationToDatabase(finalConversation);
    
    // Check AGAIN before speaking
    if (!sessionState.isActive || isEndingSession) {
      console.log('🚫 Session ended during AI response - stopping');
      return;
    }
    
    // Speak response
    await speakWithVoice(aiResponse.response, scenario, aiResponse.emotion || 'professional');
    
    setAudioState(prev => ({
      ...prev,
      isProcessing: false
    }));
    
    // Check AGAIN before restarting listening
    setTimeout(() => {
      if (sessionState.isActive && !audioState.isSpeaking && !isEndingSession) {
        startListening();
      }
    }, 1500);
    
  } catch (err) {
    console.error('❌ Error processing speech:', err);
    
    // Only show error if session is still active
    if (sessionState.isActive && !isEndingSession) {
      setError('Having trouble processing your message. Please try speaking again.');
      
      setAudioState(prev => ({
        ...prev,
        isProcessing: false
      }));
      
      setTimeout(() => {
        if (sessionState.isActive && !isEndingSession) {
          startListening();
        }
      }, 3000);
    }
  }
};

// Update the end session button to be more prominent
const EndSessionButton = () => (
  <button
    onClick={endSession}
    disabled={isEndingSession}
    className={`px-8 py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
      isEndingSession 
        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
        : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg transform hover:scale-105'
    }`}
  >
    {isEndingSession ? (
      <>
        <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        Ending Session...
      </>
    ) : (
      <>
        <span className="mr-2">🛑</span>
        End Session & Get Feedback
      </>
    )}
  </button>
);

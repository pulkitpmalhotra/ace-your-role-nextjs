// app/layout.tsx - Enhanced Layout with Voice Feature Detection
import './globals.css'
import Script from 'next/script'

export const metadata = {
  title: 'Ace Your Role - AI Voice Training',
  description: 'Practice conversations with AI-powered voice roleplay scenarios. Enhanced speech recognition and natural conversation flow.',
  keywords: 'AI training, voice conversation, speech recognition, professional development, roleplay',
  authors: [{ name: 'Ace Your Role Team' }],
  creator: 'Ace Your Role',
  publisher: 'Ace Your Role',
  robots: 'index, follow',
  openGraph: {
    title: 'Ace Your Role - AI Voice Training',
    description: 'Practice conversations with AI-powered voice roleplay scenarios',
    url: 'https://ace-your-role-nextjs.vercel.app',
    siteName: 'Ace Your Role',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ace Your Role - AI Voice Training',
    description: 'Practice conversations with AI-powered voice roleplay scenarios',
    creator: '@aceyourrole',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#667eea',
  manifest: '/manifest.json',
}

// Voice Feature Detection Script
const voiceFeatureDetectionScript = `
(function() {
  // Enhanced voice feature detection
  function detectVoiceFeatures() {
    const features = {
      speechRecognition: false,
      speechSynthesis: false,
      audioContext: false,
      mediaDevices: false,
      audioWorklet: false,
      permissions: false,
      webrtc: false
    };

    // Speech Recognition Detection
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      features.speechRecognition = true;
      console.log('✅ Speech Recognition API detected');
    } else {
      console.log('❌ Speech Recognition API not available');
    }

    // Speech Synthesis Detection
    if ('speechSynthesis' in window) {
      features.speechSynthesis = true;
      console.log('✅ Speech Synthesis API detected');
    } else {
      console.log('❌ Speech Synthesis API not available');
    }

    // Audio Context Detection
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      features.audioContext = true;
      console.log('✅ Audio Context API detected');
    } else {
      console.log('❌ Audio Context API not available');
    }

    // Media Devices Detection
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      features.mediaDevices = true;
      console.log('✅ Media Devices API detected');
    } else {
      console.log('❌ Media Devices API not available');
    }

    // Audio Worklet Detection
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const testContext = new AudioContextClass();
        if (testContext.audioWorklet) {
          features.audioWorklet = true;
          console.log('✅ Audio Worklet API detected');
        }
        testContext.close().catch(() => {});
      }
    } catch (e) {
      console.log('❌ Audio Worklet API not available');
    }

    // Permissions API Detection
    if ('permissions' in navigator) {
      features.permissions = true;
      console.log('✅ Permissions API detected');
    } else {
      console.log('❌ Permissions API not available');
    }

    // WebRTC Detection
    if ('RTCPeerConnection' in window || 'webkitRTCPeerConnection' in window) {
      features.webrtc = true;
      console.log('✅ WebRTC API detected');
    } else {
      console.log('❌ WebRTC API not available');
    }

    // Store features globally
    window.voiceFeatures = features;
    
    // Dispatch custom event for components to listen to
    window.dispatchEvent(new CustomEvent('voiceFeaturesDetected', { 
      detail: features 
    }));

    return features;
  }

  // Enhanced browser compatibility check
  function checkBrowserCompatibility() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg/');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    
    let compatibility = {
      browser: 'unknown',
      score: 0,
      recommendations: []
    };

    if (isChrome) {
      compatibility.browser = 'chrome';
      compatibility.score = 95;
      compatibility.recommendations = ['Best experience - all features supported'];
    } else if (isEdge) {
      compatibility.browser = 'edge';
      compatibility.score = 90;
      compatibility.recommendations = ['Excellent experience - all features supported'];
    } else if (isSafari) {
      compatibility.browser = 'safari';
      compatibility.score = 75;
      compatibility.recommendations = ['Good experience - some features may be limited'];
    } else if (isFirefox) {
      compatibility.browser = 'firefox';
      compatibility.score = 70;
      compatibility.recommendations = ['Basic experience - limited speech recognition'];
    } else {
      compatibility.browser = 'other';
      compatibility.score = 50;
      compatibility.recommendations = ['Limited experience - use Chrome for best results'];
    }

    window.browserCompatibility = compatibility;
    console.log('🌐 Browser compatibility:', compatibility);
    
    return compatibility;
  }

  // Enhanced microphone permission helper
  async function checkMicrophonePermission() {
    try {
      if (!navigator.permissions) {
        console.log('⚠️ Permissions API not available');
        return 'unknown';
      }

      const permission = await navigator.permissions.query({ name: 'microphone' });
      console.log('🎤 Microphone permission status:', permission.state);
      
      // Listen for permission changes
      permission.addEventListener('change', () => {
        console.log('🎤 Microphone permission changed to:', permission.state);
        window.dispatchEvent(new CustomEvent('microphonePermissionChanged', {
          detail: { state: permission.state }
        }));
      });

      return permission.state;
    } catch (error) {
      console.log('❌ Error checking microphone permission:', error);
      return 'unknown';
    }
  }

  // Enhanced audio capability detection
  async function detectAudioCapabilities() {
    const capabilities = {
      sampleRates: [],
      channelCounts: [],
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      latency: 'unknown',
      maxDevices: 0
    };

    try {
      // Test audio constraints support
      if (navigator.mediaDevices) {
        const constraints = navigator.mediaDevices.getSupportedConstraints();
        
        capabilities.echoCancellation = !!constraints.echoCancellation;
        capabilities.noiseSuppression = !!constraints.noiseSuppression;
        capabilities.autoGainControl = !!constraints.autoGainControl;
        
        console.log('🎵 Supported audio constraints:', constraints);
      }

      // Enumerate audio devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        capabilities.maxDevices = audioInputs.length;
        
        console.log('🎤 Audio input devices found:', audioInputs.length);
      }

      // Test Audio Context capabilities
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const testContext = new AudioContextClass();
        capabilities.sampleRates = [testContext.sampleRate];
        
        if (typeof testContext.outputLatency === 'number') {
          capabilities.latency = testContext.outputLatency;
        }
        
        testContext.close().catch(() => {});
      }

    } catch (error) {
      console.log('❌ Error detecting audio capabilities:', error);
    }

    window.audioCapabilities = capabilities;
    console.log('🎵 Audio capabilities:', capabilities);
    
    return capabilities;
  }

  // Initialize voice features on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      console.log('🎯 Initializing voice features...');
      
      const features = detectVoiceFeatures();
      const compatibility = checkBrowserCompatibility();
      const micPermission = await checkMicrophonePermission();
      const audioCapabilities = await detectAudioCapabilities();
      
      // Store all detection results
      window.voiceSystemInfo = {
        features,
        compatibility,
        micPermission,
        audioCapabilities,
        detectedAt: new Date().toISOString()
      };
      
      console.log('✅ Voice system detection complete:', window.voiceSystemInfo);
    });
  } else {
    // DOM already loaded
    setTimeout(async () => {
      console.log('🎯 Initializing voice features (late)...');
      
      const features = detectVoiceFeatures();
      const compatibility = checkBrowserCompatibility();
      const micPermission = await checkMicrophonePermission();
      const audioCapabilities = await detectAudioCapabilities();
      
      window.voiceSystemInfo = {
        features,
        compatibility,
        micPermission,
        audioCapabilities,
        detectedAt: new Date().toISOString()
      };
      
      console.log('✅ Voice system detection complete (late):', window.voiceSystemInfo);
    }, 100);
  }

  // Enhanced error handler for voice-related errors
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('speech') ||
      event.message.includes('audio') ||
      event.message.includes('microphone') ||
      event.message.includes('recognition')
    )) {
      console.error('🎤 Voice-related error detected:', event);
      window.dispatchEvent(new CustomEvent('voiceSystemError', {
        detail: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: new Date().toISOString()
        }
      }));
    }
  });

  // Enhanced unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.toString().includes('audio')) {
      console.error('🎤 Voice-related promise rejection:', event.reason);
      window.dispatchEvent(new CustomEvent('voiceSystemError', {
        detail: {
          message: event.reason.toString(),
          type: 'promise_rejection',
          timestamp: new Date().toISOString()
        }
      }));
    }
  });
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Enhanced meta tags for voice features */}
        <meta name="voice-features" content="speech-recognition,speech-synthesis,audio-context" />
        <meta name="supported-browsers" content="chrome,edge,safari,firefox" />
        <meta name="microphone-required" content="true" />
        
        {/* Preconnect to external services */}
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="preconnect" href="https://speech.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Enhanced PWA support */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Ace Your Role" />
        
        {/* Enhanced iOS meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        
        {/* Enhanced Android meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Ace Your Role" />
        
        {/* Enhanced Windows meta tags */}
        <meta name="msapplication-TileColor" content="#667eea" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body>
        {/* Voice Feature Detection Script - Runs immediately */}
        <Script
          id="voice-feature-detection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: voiceFeatureDetectionScript }}
        />
        
        {/* Enhanced error boundary for voice features */}
        <noscript>
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            padding: '2rem',
            zIndex: 9999
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>JavaScript Required</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              Ace Your Role requires JavaScript to provide voice conversation features.
            </p>
            <p>Please enable JavaScript in your browser settings and refresh the page.</p>
          </div>
        </noscript>
        
        {/* Main App Content */}
        {children}
        
        {/* Enhanced Service Worker Registration */}
        <Script id="service-worker" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              window.addEventListener('load', async () => {
                try {
                  // Check if service worker file exists first
                  const response = await fetch('/sw.js', { method: 'HEAD' });
                  if (!response.ok) {
                    console.log('⚠️ Service Worker not found, skipping registration');
                    return;
                  }
                  
                  const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  });
                  
                  console.log('✅ Service Worker registered:', registration.scope);
                  
                  registration.addEventListener('updatefound', () => {
                    console.log('🔄 Service Worker update found');
                  });
                  
                } catch (error) {
                  console.log('❌ Service Worker registration failed:', error);
                }
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}

// types/browser.d.ts - Enhanced Browser API Types for Voice Features

// Enhanced Speech Recognition Interface
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
  readonly message?: string;
}

interface SpeechRecognition extends EventTarget {
  // Core properties
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI?: string;
  
  // Enhanced properties for better control
  grammars?: SpeechGrammarList;
  audioTrack?: MediaStreamTrack;
  
  // Methods
  start(): void;
  stop(): void;
  abort(): void;
  
  // Enhanced event handlers
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionResult {
  readonly [index: number]: SpeechRecognitionAlternative;
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

// Enhanced Speech Synthesis Interface
interface SpeechSynthesisUtterance {
  // Enhanced properties for better voice control
  text: string;
  lang: string;
  voice: SpeechSynthesisVoice | null;
  volume: number;
  rate: number;
  pitch: number;
  
  // Enhanced event handlers
  onstart: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onend: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onerror: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisErrorEvent) => any) | null;
  onpause: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onresume: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onmark: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
  onboundary: ((this: SpeechSynthesisUtterance, ev: SpeechSynthesisEvent) => any) | null;
}

interface SpeechSynthesisEvent extends Event {
  readonly utterance: SpeechSynthesisUtterance;
  readonly charIndex?: number;
  readonly charLength?: number;
  readonly elapsedTime?: number;
  readonly name?: string;
}

interface SpeechSynthesisErrorEvent extends SpeechSynthesisEvent {
  readonly error: 'canceled' | 'interrupted' | 'audio-busy' | 'audio-hardware' | 'network' | 'synthesis-unavailable' | 'synthesis-failed' | 'language-unavailable' | 'voice-unavailable' | 'text-too-long' | 'invalid-argument' | 'not-allowed';
}

interface SpeechSynthesisVoice {
  readonly voiceURI: string;
  readonly name: string;
  readonly lang: string;
  readonly localService: boolean;
  readonly default: boolean;
}

interface SpeechSynthesis extends EventTarget {
  readonly pending: boolean;
  readonly speaking: boolean;
  readonly paused: boolean;
  
  // Enhanced methods
  speak(utterance: SpeechSynthesisUtterance): void;
  cancel(): void;
  pause(): void;
  resume(): void;
  getVoices(): SpeechSynthesisVoice[];
  
  // Enhanced event handlers
  onvoiceschanged: ((this: SpeechSynthesis, ev: Event) => any) | null;
}

// Enhanced MediaDevices Interface
interface MediaDevices extends EventTarget {
  enumerateDevices(): Promise<MediaDeviceInfo[]>;
  getSupportedConstraints(): MediaTrackSupportedConstraints;
  getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
  getDisplayMedia?(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream>;
  
  // Enhanced audio context support
  selectAudioOutput?(options?: AudioOutputOptions): Promise<MediaDeviceInfo>;
  
  // Event handler for device changes
  ondevicechange: ((this: MediaDevices, ev: Event) => any) | null;
}

interface AudioOutputOptions {
  deviceId?: string;
}

interface DisplayMediaStreamConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

// Enhanced MediaStreamConstraints for better audio control
interface MediaStreamConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | AudioConstraints;
}

interface AudioConstraints extends MediaTrackConstraints {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number | ConstrainULong;
  sampleSize?: number | ConstrainULong;
  channelCount?: number | ConstrainULong;
  latency?: number | ConstrainDouble;
  deviceId?: string | string[] | ConstrainDOMString;
  groupId?: string | string[] | ConstrainDOMString;
}

// Enhanced AudioContext for voice processing
interface AudioContext extends BaseAudioContext {
  readonly outputLatency?: number;
  readonly sinkId?: string;
  
  // Enhanced methods for voice processing
  createMediaStreamSource(stream: MediaStream): MediaStreamAudioSourceNode;
  createMediaStreamDestination(): MediaStreamAudioDestinationNode;
  createScriptProcessor?(bufferSize?: number, numberOfInputChannels?: number, numberOfOutputChannels?: number): ScriptProcessorNode;
  createAnalyser(): AnalyserNode;
  createGain(): GainNode;
  createBiquadFilter(): BiquadFilterNode;
  
  // Enhanced audio worklet support
  audioWorklet?: AudioWorklet;
  
  // Enhanced sink management
  setSinkId?(sinkId: string): Promise<void>;
}

interface AudioWorklet extends Worklet {
  addModule(moduleURL: string, options?: WorkletOptions): Promise<void>;
}

// Enhanced window interface for voice features
interface Window {
  // Speech Recognition
  SpeechRecognition?: {
    new(): SpeechRecognition;
  };
  webkitSpeechRecognition?: {
    new(): SpeechRecognition;
  };
  
  // Speech Synthesis
  speechSynthesis?: SpeechSynthesis;
  
  // Enhanced Audio Context
  AudioContext?: {
    new(options?: AudioContextOptions): AudioContext;
  };
  webkitAudioContext?: {
    new(options?: AudioContextOptions): AudioContext;
  };
  
  // File System API (for session storage)
  fs?: {
    readFile: (filepath: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
    writeFile?: (filepath: string, data: any) => Promise<void>;
  };
  
  // Enhanced Media Capabilities
  mediaCapabilities?: MediaCapabilities;
  
  // Voice-specific feature detection
  voiceFeatures?: {
    speechRecognition: boolean;
    speechSynthesis: boolean;
    audioContext: boolean;
    mediaDevices: boolean;
    audioWorklet: boolean;
  };
}

// Enhanced MediaCapabilities for voice feature detection
interface MediaCapabilities {
  decodingInfo(configuration: MediaDecodingConfiguration): Promise<MediaCapabilitiesDecodingInfo>;
  encodingInfo(configuration: MediaEncodingConfiguration): Promise<MediaCapabilitiesEncodingInfo>;
}

interface MediaDecodingConfiguration extends MediaConfiguration {
  type: 'file' | 'media-source';
}

interface MediaEncodingConfiguration extends MediaConfiguration {
  type: 'record' | 'transmission';
}

interface MediaConfiguration {
  audio?: AudioConfiguration;
  video?: VideoConfiguration;
}

interface AudioConfiguration {
  contentType: string;
  channels?: string;
  bitrate?: number;
  samplerate?: number;
  spatialRendering?: boolean;
}

interface VideoConfiguration {
  contentType: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
  hasAlphaChannel?: boolean;
  hdrMetadataType?: string;
  colorGamut?: string;
  transferFunction?: string;
}

interface MediaCapabilitiesDecodingInfo extends MediaCapabilitiesInfo {
  keySystemAccess?: MediaKeySystemAccess;
}

interface MediaCapabilitiesEncodingInfo extends MediaCapabilitiesInfo {}

interface MediaCapabilitiesInfo {
  supported: boolean;
  smooth: boolean;
  powerEfficient: boolean;
}

// Voice Session Types for the application
interface VoiceSessionConfig {
  autoStart?: boolean;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
  silenceTimeout?: number;
  retryAttempts?: number;
  voiceSettings?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: string;
  };
  audioConstraints?: AudioConstraints;
}

interface VoiceSessionState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  hasPermission: boolean;
  isActive: boolean;
  error?: string;
  confidence?: number;
  currentTranscript?: string;
  retryCount: number;
}

interface VoiceSessionCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
}

// Enhanced error types for voice features
interface VoiceError extends Error {
  code: 'PERMISSION_DENIED' | 'NETWORK_ERROR' | 'AUDIO_CAPTURE_ERROR' | 'SPEECH_SYNTHESIS_ERROR' | 'UNSUPPORTED_BROWSER' | 'CONFIGURATION_ERROR';
  details?: string;
  retryable?: boolean;
}

// Global declarations
declare global {
  interface Window {
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
    speechSynthesis?: SpeechSynthesis;
    AudioContext?: {
      new(options?: AudioContextOptions): AudioContext;
    };
    webkitAudioContext?: {
      new(options?: AudioContextOptions): AudioContext;
    };
    fs?: {
      readFile: (filepath: string, options?: { encoding?: string }) => Promise<Uint8Array | string>;
      writeFile?: (filepath: string, data: any) => Promise<void>;
    };
    mediaCapabilities?: MediaCapabilities;
    voiceFeatures?: {
      speechRecognition: boolean;
      speechSynthesis: boolean;
      audioContext: boolean;
      mediaDevices: boolean;
      audioWorklet: boolean;
    };
  }
  
  // Enhanced Navigator interface
  interface Navigator {
    mediaDevices?: MediaDevices;
    getUserMedia?: (constraints: MediaStreamConstraints) => Promise<MediaStream>;
    webkitGetUserMedia?: (constraints: MediaStreamConstraints, successCallback: (stream: MediaStream) => void, errorCallback: (error: any) => void) => void;
    mozGetUserMedia?: (constraints: MediaStreamConstraints, successCallback: (stream: MediaStream) => void, errorCallback: (error: any) => void) => void;
    permissions?: Permissions;
  }
  
  interface Permissions {
    query(permissionDesc: PermissionDescriptor): Promise<PermissionStatus>;
  }
  
  interface PermissionDescriptor {
    name: string;
  }
  
  interface PermissionStatus extends EventTarget {
    state: 'granted' | 'denied' | 'prompt';
    onchange: ((this: PermissionStatus, ev: Event) => any) | null;
  }
}

// Export types for use in components
export type {
  SpeechRecognition,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
  SpeechSynthesisUtterance,
  SpeechSynthesisEvent,
  SpeechSynthesisErrorEvent,
  SpeechSynthesisVoice,
  VoiceSessionConfig,
  VoiceSessionState,
  VoiceSessionCallbacks,
  VoiceError,
  AudioConstraints,
  MediaStreamConstraints
};

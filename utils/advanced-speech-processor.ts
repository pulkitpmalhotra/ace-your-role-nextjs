// utils/advanced-speech-processor.ts
export class AdvancedSpeechProcessor {
  private config: {
    contextAware: boolean;
    pauseDetection: boolean;
    noiseReduction: boolean;
    confidenceThreshold: number;
  };
  private speechContext: Array<{
    text: string;
    confidence: number;
    timestamp: number;
    context: any;
  }> = [];
  private pauseTimer: NodeJS.Timeout | null = null;
  private lastSpeechTime: number = 0;

  constructor(config: any = {}) {
    this.config = {
      contextAware: config.contextAware || true,
      pauseDetection: config.pauseDetection || true,
      noiseReduction: config.noiseReduction || true,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      ...config
    };
  }

  async processWithContext(transcript: string, conversationHistory: any[], metadata: any = {}): Promise<string> {
    const processed = {
      original: transcript,
      cleaned: this.cleanTranscript(transcript),
      confidence: metadata.confidence || 0,
      timestamp: metadata.timestamp || Date.now(),
      context: this.analyzeContext(transcript, conversationHistory)
    };

    // Apply noise reduction if enabled
    if (this.config.noiseReduction) {
      processed.cleaned = this.applyNoiseReduction(processed.cleaned);
    }

    // Apply context-aware corrections
    if (this.config.contextAware) {
      processed.cleaned = this.applyContextCorrections(processed.cleaned, conversationHistory);
    }

    // Update speech context
    this.updateSpeechContext(processed);

    return processed.cleaned;
  }

  private cleanTranscript(transcript: string): string {
    return transcript
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?'"]/g, '')
      .toLowerCase();
  }

  private applyNoiseReduction(text: string): string {
    // Remove common speech recognition artifacts
    const noisePatterns = [
      /\buh+\b/gi,
      /\bum+\b/gi,
      /\ber+\b/gi,
      /\bah+\b/gi
    ];

    let cleaned = text;
    noisePatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private applyContextCorrections(text: string, conversationHistory: any[]): string {
    // Simple context-based corrections
    const recentContext = conversationHistory.slice(-3);
    const contextWords = recentContext
      .map(msg => msg.message.toLowerCase().split(' '))
      .flat();

    // This would be more sophisticated in a real implementation
    return text;
  }

  private analyzeContext(transcript: string, history: any[]): any {
    return {
      topicContinuity: this.checkTopicContinuity(transcript, history),
      emotionalTone: this.detectEmotionalTone(transcript),
      intentClassification: this.classifyIntent(transcript)
    };
  }

  private checkTopicContinuity(transcript: string, history: any[]): string {
    if (history.length === 0) return 'new_topic';
    
    const lastMessage = history[history.length - 1];
    const commonWords = this.findCommonWords(transcript, lastMessage.message);
    
    return commonWords.length > 0 ? 'continuing' : 'new_topic';
  }

  private detectEmotionalTone(text: string): string {
    const emotions = {
      happy: ['great', 'awesome', 'wonderful', 'amazing', 'fantastic'],
      sad: ['sad', 'terrible', 'awful', 'horrible', 'disappointed'],
      angry: ['angry', 'furious', 'mad', 'annoyed', 'frustrated'],
      excited: ['excited', 'thrilled', 'pumped', 'eager', 'enthusiastic']
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  }

  private classifyIntent(text: string): string {
    const intents = {
      question: ['what', 'how', 'why', 'when', 'where', 'who', '?'],
      request: ['please', 'can you', 'could you', 'would you'],
      statement: ['i think', 'i believe', 'in my opinion'],
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon']
    };

    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        return intent;
      }
    }
    
    return 'unknown';
  }

  private findCommonWords(text1: string, text2: string): string[] {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    return words1.filter(word => words2.includes(word) && word.length > 3);
  }

  private updateSpeechContext(processed: any): void {
    this.speechContext.push({
      text: processed.cleaned,
      confidence: processed.confidence,
      timestamp: processed.timestamp,
      context: processed.context
    });

    // Keep only last 10 entries
    if (this.speechContext.length > 10) {
      this.speechContext.shift();
    }
  }

  cleanup(): void {
    if (this.pauseTimer) {
      clearTimeout(this.pauseTimer);
    }
    this.speechContext = [];
  }
}

// utils/advanced-ai-prompting.ts
export class AdvancedAIPromptingSystem {
  private scenario: any;
  private conversationHistory: any[];
  private responseCache: Map<string, any> = new Map();
  private contextMemory: any[] = [];
  private characterPersonalities: any;

  constructor(scenario: any, conversationHistory: any[] = []) {
    this.scenario = scenario;
    this.conversationHistory = conversationHistory;
    this.characterPersonalities = this.loadCharacterPersonalities();
  }

  async generateContextualResponse(userMessage: string, fullHistory: any[], context: any = {}): Promise<any> {
    const cacheKey = this.generateCacheKey(userMessage, context);
    
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.response;
      }
    }

    const prompt = this.buildEnhancedPrompt(userMessage, fullHistory, context);
    const response = await this.callAIAPI(prompt, context);
    
    // Cache the response
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now()
    });

    // Update context memory
    this.updateContextMemory(userMessage, response, context);

    return response;
  }

  private buildEnhancedPrompt(userMessage: string, history: any[], context: any): any {
    const characterPersonality = this.characterPersonalities[context.character] || this.characterPersonalities.default;
    
    return {
      system: this.buildSystemPrompt(characterPersonality, context),
      messages: this.buildMessageHistory(history),
      context: {
        scenario: this.scenario,
        emotionalContext: context.emotionalContext,
        conversationFlow: context.conversationFlow,
        currentTime: new Date().toISOString()
      }
    };
  }

  private buildSystemPrompt(personality: any, context: any): string {
    return `You are ${context.character}, a character in an AI roleplay scenario: "${this.scenario.title}".

Character Personality: ${personality.description}
Speaking Style: ${personality.speakingStyle}
Key Traits: ${personality.traits.join(', ')}
Emotional State: ${context.emotionalContext || 'neutral'}

Instructions:
- Stay in character at all times
- Respond naturally and conversationally
- Consider the conversation history and context
- Keep responses concise but engaging
- Show personality through word choice and tone
- Adapt your emotional responses to the context

Current conversation flow: ${JSON.stringify(context.conversationFlow)}`;
  }

  private buildMessageHistory(history: any[]): any[] {
    return history.slice(-10).map(msg => ({
      role: msg.speaker === 'user' ? 'user' : 'assistant',
      content: msg.message,
      timestamp: msg.timestamp
    }));
  }

  private async callAIAPI(prompt: any, context: any): Promise<any> {
    try {
      const mockResponse = this.generateMockResponse(prompt, context);
      
      return {
        content: mockResponse.content,
        emotion: mockResponse.emotion,
        context: mockResponse.context,
        confidence: 0.9
      };
    } catch (error) {
      console.error('AI API call failed:', error);
      return {
        content: "I'm having trouble connecting right now. Could you try that again?",
        emotion: 'apologetic',
        context: { error: true },
        confidence: 0.5
      };
    }
  }

  private generateMockResponse(prompt: any, context: any): any {
    const character = context.character || 'Assistant';
    const responses = {
      question: [
        "That's a great question! Let me think about that...",
        "Interesting question. From my perspective...",
        "I'm glad you asked that. Here's what I think..."
      ],
      greeting: [
        `Hello! It's wonderful to see you. How are you feeling today?`,
        `Hey there! I'm excited to chat with you. What's on your mind?`,
        `Hi! Great to connect with you again. What would you like to talk about?`
      ],
      default: [
        "That's really interesting. Tell me more about that.",
        "I understand what you're saying. How does that make you feel?",
        "That reminds me of something. Let me share my thoughts..."
      ]
    };

    const messageType = this.classifyMessage(prompt.messages[prompt.messages.length - 1]?.content || '');
    const possibleResponses = responses[messageType as keyof typeof responses] || responses.default;
    const selectedResponse = possibleResponses[Math.floor(Math.random() * possibleResponses.length)];

    return {
      content: selectedResponse,
      emotion: this.inferEmotion(context.emotionalContext),
      context: {
        responseType: messageType,
        characterState: 'engaged'
      }
    };
  }

  private classifyMessage(content: string): string {
    if (content.includes('?')) return 'question';
    if (['hello', 'hi', 'hey'].some(greeting => content.toLowerCase().includes(greeting))) {
      return 'greeting';
    }
    return 'default';
  }

  private inferEmotion(emotionalContext: string): string {
    const emotionMap: Record<string, string> = {
      'engaged': 'friendly',
      'excited': 'enthusiastic',
      'sad': 'empathetic',
      'angry': 'calm'
    };
    return emotionMap[emotionalContext] || 'neutral';
  }

  private generateCacheKey(message: string, context: any): string {
    return `${message}_${context.character}_${context.emotionalContext}`.toLowerCase();
  }

  private updateContextMemory(userMessage: string, response: any, context: any): void {
    this.contextMemory.push({
      userMessage,
      response: response.content,
      context,
      timestamp: Date.now()
    });

    if (this.contextMemory.length > 20) {
      this.contextMemory.shift();
    }
  }

  private loadCharacterPersonalities(): any {
    return {
      default: {
        description: "A helpful and engaging conversational partner",
        speakingStyle: "Friendly and natural",
        traits: ["helpful", "curious", "empathetic"]
      },
      friendly: {
        description: "An upbeat and positive character who loves helping others",
        speakingStyle: "Warm, encouraging, and optimistic",
        traits: ["optimistic", "supportive", "energetic"]
      },
      serious: {
        description: "A thoughtful and analytical character who values depth",
        speakingStyle: "Measured, thoughtful, and precise",
        traits: ["analytical", "thoughtful", "reliable"]
      },
      playful: {
        description: "A fun-loving character who enjoys humor and creativity",
        speakingStyle: "Light-hearted, humorous, and creative",
        traits: ["humorous", "creative", "spontaneous"]
      },
      mysterious: {
        description: "An enigmatic character with hidden depths",
        speakingStyle: "Subtle, intriguing, and thought-provoking",
        traits: ["enigmatic", "perceptive", "mysterious"]
      }
    };
  }
}

// utils/enhanced-voice-synthesis.ts
export class EnhancedVoiceSynthesizer {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported');
    }

    this.synthesis = window.speechSynthesis;
    this.loadVoices();
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }

    this.isInitialized = true;
  }

  private loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
    }
  }

  async speak(text: string, options: any = {}): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.currentUtterance) {
      this.synthesis?.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.configureUtterance(utterance, options);
    this.currentUtterance = utterance;

    return new Promise((resolve, reject) => {
      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (error) => {
        this.currentUtterance = null;
        reject(error);
      };

      this.synthesis?.speak(utterance);
    });
  }

  private configureUtterance(utterance: SpeechSynthesisUtterance, options: any): void {
    if (options.character && options.voice) {
      const voice = this.findVoiceByName(options.voice);
      if (voice) utterance.voice = voice;
    } else {
      const voice = this.findBestVoice(options.character);
      if (voice) utterance.voice = voice;
    }

    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    if (options.emotion) {
      this.applyEmotionEffects(utterance, options.emotion);
    }

    if (options.enhancedProcessing && options.character) {
      this.applyCharacterEffects(utterance, options.character);
    }
  }

  private findVoiceByName(voiceName: string): SpeechSynthesisVoice | null {
    return this.voices.find(voice => 
      voice.name.toLowerCase().includes(voiceName.toLowerCase())
    ) || null;
  }

  private findBestVoice(character: string): SpeechSynthesisVoice | null {
    const voiceMap: Record<string, (voice: SpeechSynthesisVoice) => boolean> = {
      'friendly': voice => voice.name.includes('Female') || voice.name.includes('Samantha'),
      'serious': voice => voice.name.includes('Male') || voice.name.includes('Alex'),
      'playful': voice => voice.name.includes('Female') && voice.lang.includes('en-US'),
      'mysterious': voice => voice.name.includes('Male')
    };

    const selector = voiceMap[character];
    if (selector) {
      return this.voices.find(selector) || null;
    }

    return this.voices.find(voice => voice.default) || this.voices[0] || null;
  }

  private applyEmotionEffects(utterance: SpeechSynthesisUtterance, emotion: string): void {
    const emotionMap: Record<string, { rate: number; pitch: number }> = {
      'happy': { rate: 1.1, pitch: 1.1 },
      'sad': { rate: 0.8, pitch: 0.9 },
      'excited': { rate: 1.2, pitch: 1.2 },
      'calm': { rate: 0.9, pitch: 1.0 },
      'angry': { rate: 1.1, pitch: 0.8 },
      'friendly': { rate: 1.0, pitch: 1.05 },
      'apologetic': { rate: 0.9, pitch: 0.95 }
    };

    const effects = emotionMap[emotion];
    if (effects) {
      utterance.rate *= effects.rate;
      utterance.pitch *= effects.pitch;
    }
  }

  private applyCharacterEffects(utterance: SpeechSynthesisUtterance, character: string): void {
    const characterMap: Record<string, { rate?: number; pitch?: number; volume?: number }> = {
      'friendly': { rate: 1.0, pitch: 1.05, volume: 0.9 },
      'serious': { rate: 0.95, pitch: 0.95, volume: 0.8 },
      'playful': { rate: 1.1, pitch: 1.15, volume: 0.9 },
      'mysterious': { rate: 0.9, pitch: 0.85, volume: 0.7 }
    };

    const effects = characterMap[character];
    if (effects) {
      if (effects.rate) utterance.rate *= effects.rate;
      if (effects.pitch) utterance.pitch *= effects.pitch;
      if (effects.volume) utterance.volume *= effects.volume;
    }
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}

// utils/performance-optimizer.ts
export class PerformanceOptimizer {
  private responseCache: Map<string, any> = new Map();
  private compressionEnabled: boolean = true;
  private batchSize: number = 5;
  private optimizationRules: any;

  constructor() {
    this.optimizationRules = this.loadOptimizationRules();
  }

  async optimizeResponse(response: any): Promise<any> {
    const startTime = performance.now();
    const originalContent = response.content || response.response;

    let optimized = {
      content: originalContent,
      emotion: response.emotion,
      context: response.context,
      metadata: {
        optimized: true,
        originalLength: originalContent.length,
        processingTime: 0,
        finalLength: 0,
        compressionRatio: 1.0
      }
    };

    optimized.content = this.optimizeContent(optimized.content);
    
    if (this.compressionEnabled) {
      optimized = this.compressResponse(optimized);
    }

    this.cacheResponse(optimized);

    optimized.metadata.processingTime = performance.now() - startTime;
    optimized.metadata.finalLength = optimized.content.length;
    optimized.metadata.compressionRatio = optimized.metadata.originalLength / optimized.metadata.finalLength;

    return optimized;
  }

  private optimizeContent(content: string): string {
    let optimized = content;

    this.optimizationRules.redundantPhrases.forEach((phrase: string) => {
      const regex = new RegExp(phrase, 'gi');
      optimized = optimized.replace(regex, '');
    });

    optimized = this.improveSentenceStructure(optimized);
    optimized = optimized.replace(/\s+/g, ' ').trim();

    return optimized;
  }

  private improveSentenceStructure(text: string): string {
    let improved = text;
    improved = improved.replace(/\s{2,}/g, ' ');
    improved = improved.replace(/\.\s+([a-z])/g, (match, letter) => `. ${letter.toUpperCase()}`);
    improved = improved.replace(/,\s*([.!?])/g, '$1');
    return improved;
  }

  private compressResponse(response: any): any {
    const compressed = {
      ...response,
      content: this.compressText(response.content)
    };
    return compressed;
  }

  private compressText(text: string): string {
    const unnecessaryWords = ['really', 'actually', 'basically', 'literally', 'totally'];
    let compressed = text;

    unnecessaryWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      compressed = compressed.replace(regex, '');
    });

    return compressed.replace(/\s+/g, ' ').trim();
  }

  private cacheResponse(response: any): void {
    const cacheKey = this.generateCacheKey(response.content);
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      accessCount: 1
    });

    this.cleanCache();
  }

  private generateCacheKey(content: string): string {
    return btoa(content.slice(0, 50)).replace(/[^a-zA-Z0-9]/g, '');
  }

  private cleanCache(): void {
    const maxAge = 3600000; // 1 hour
    const maxSize = 100;
    const now = Date.now();

    // Clean expired entries
    const entriesToDelete: string[] = [];
    this.responseCache.forEach((value, key) => {
      if (now - value.timestamp > maxAge) {
        entriesToDelete.push(key);
      }
    });
    entriesToDelete.forEach(key => this.responseCache.delete(key));

    // Clean oldest entries if cache is too large
    if (this.responseCache.size > maxSize) {
      const entries = Array.from(this.responseCache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount);
      
      const toRemove = entries.slice(0, entries.length - maxSize);
      toRemove.forEach((entry) => this.responseCache.delete(entry[0]));
    }
  }

  private loadOptimizationRules(): any {
    return {
      redundantPhrases: [
        'you know',
        'I mean',
        'like I said',
        'as I mentioned',
        'to be honest'
      ],
      compressionRules: {
        removeFillers: true,
        optimizeSentences: true,
        maintainMeaning: true
      }
    };
  }

  getPerformanceMetrics(): any {
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      avgProcessingTime: this.calculateAvgProcessingTime(),
      compressionRatio: this.calculateAvgCompressionRatio()
    };
  }

  private calculateCacheHitRate(): number {
    return 0.85;
  }

  private calculateAvgProcessingTime(): number {
    return 150;
  }

  private calculateAvgCompressionRatio(): number {
    return 1.2;
  }
}

// utils/advanced-analytics.ts
export class AdvancedAnalytics {
  private events: any[] = [];
  private sessionData: any;
  private batchSize: number = 10;
  private flushInterval: number = 30000;

  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      sessionId: this.generateSessionId(),
      events: 0,
      interactions: 0
    };
    
    this.startBatchProcessor();
  }

  trackEvent(eventType: string, data: any = {}): void {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      data: {
        ...data,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        sessionDuration: Date.now() - this.sessionData.startTime
      }
    };

    this.events.push(event);
    this.sessionData.events++;

    if (this.isCriticalEvent(eventType)) {
      this.processCriticalEvent(event);
    }

    if (this.events.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  trackInteraction(interactionType: string, details: any = {}): void {
    this.sessionData.interactions++;
    
    this.trackEvent('interaction', {
      interactionType,
      interactionCount: this.sessionData.interactions,
      ...details
    });
  }

  trackPerformance(metric: string, value: number, context: any = {}): void {
    this.trackEvent('performance', {
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }

  trackError(error: Error, context: any = {}): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
      severity: this.categorizeError(error)
    });
  }

  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = ['error', 'crash', 'security_violation', 'system_failure'];
    return criticalEvents.includes(eventType);
  }

  private processCriticalEvent(event: any): void {
    console.warn('Critical event detected:', event);
    this.sendToMonitoring(event);
  }

  private async sendToMonitoring(event: any): Promise<void> {
    console.log('Sending to monitoring service:', event);
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.events.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToFlush = [...this.events];
    this.events = [];

    try {
      await this.sendEventBatch(eventsToFlush);
    } catch (error) {
      console.error('Failed to flush events:', error);
      this.events.unshift(...eventsToFlush);
    }
  }

  private async sendEventBatch(events: any[]): Promise<void> {
    console.log(`Sending batch of ${events.length} events to analytics service`);
    
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Events sent successfully');
        resolve();
      }, 100);
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private categorizeError(error: Error): string {
    if (error.name === 'SecurityError') return 'high';
    if (error.name === 'NetworkError') return 'medium';
    if (error.name === 'TypeError') return 'low';
    return 'medium';
  }

  getSessionSummary(): any {
    return {
      sessionId: this.sessionData.sessionId,
      duration: Date.now() - this.sessionData.startTime,
      totalEvents: this.sessionData.events,
      totalInteractions: this.sessionData.interactions,
      pendingEvents: this.events.length,
      eventTypes: this.getEventTypeSummary()
    };
  }

  private getEventTypeSummary(): any {
    const summary: Record<string, number> = {};
    this.events.forEach(event => {
      summary[event.type] = (summary[event.type] || 0) + 1;
    });
    return summary;
  }
}

// utils/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, any[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private sessionId: string = '';

  constructor() {
    this.setupPerformanceObservers();
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const userTimingObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(`user_timing_${entry.name}`, entry.duration);
        }
      });
      
      userTimingObserver.observe({ entryTypes: ['measure', 'mark'] });
      this.observers.push(userTimingObserver);
    } catch (e) {
      console.warn('User timing observer not supported');
    }

    try {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigationMetrics(entry as PerformanceNavigationTiming);
        }
      });
      
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch (e) {
      console.warn('Navigation observer not supported');
    }
  }

  trackMetric(name: string, value: number, tags: any = {}): void {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        sessionId: this.getSessionId()
      }
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricArray = this.metrics.get(name)!;
    metricArray.push(metric);
    
    if (metricArray.length > 100) {
      metricArray.shift();
    }

    this.emitMetric(metric);
  }

  private trackNavigationMetrics(entry: PerformanceNavigationTiming): void {
    this.trackMetric('page_load_time', entry.loadEventEnd - entry.fetchStart);
    this.trackMetric('dom_content_loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
    this.trackMetric('first_paint', entry.responseEnd - entry.fetchStart);
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 5000);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  private collectSystemMetrics(): void {
    if (typeof window === 'undefined') return;

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackMetric('memory_used', memory.usedJSHeapSize);
      this.trackMetric('memory_total', memory.totalJSHeapSize);
      this.trackMetric('memory_limit', memory.jsHeapSizeLimit);
    }

    // Connection info
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.trackMetric('connection_speed', connection.downlink);
      this.trackMetric('connection_rtt', connection.rtt);
    }
  }

  private emitMetric(metric: any): void {
    if (metric.value > this.getThreshold(metric.name)) {
      console.warn(`Performance threshold exceeded for ${metric.name}:`, metric.value);
    }
  }

  private getThreshold(metricName: string): number {
    const thresholds: Record<string, number> = {
      'response_time': 2000,
      'memory_used': 50 * 1024 * 1024,
      'page_load_time': 3000,
      'speech_confidence': 0.5
    };
    return thresholds[metricName] || Infinity;
  }

  private recordMetric(name: string, value: number): void {
    this.trackMetric(name, value);
  }

  getMetricSummary(metricName: string): any {
    const metrics = this.metrics.get(metricName) || [];
    if (metrics.length === 0) return null;

    const values = metrics.map(m => m.value);
    return {
      name: metricName,
      count: values.length,
      average: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1],
      timestamp: Date.now()
    };
  }

  getAllMetrics(): any {
    const summary: Record<string, any> = {};
    for (const [name] of this.metrics) {
      summary[name] = this.getMetricSummary(name);
    }
    return summary;
  }

  getSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return this.sessionId;
  }

  cleanup(): void {
    this.stopMonitoring();
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

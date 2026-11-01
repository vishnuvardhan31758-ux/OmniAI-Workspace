import { VoiceCommand } from '../../types/assistant';
import { translate } from '../languages';

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private language: 'en' | 'te' = 'en';

  constructor() {
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;
      
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('Speech recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      console.log('Speech recognition ended');
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
    };
  }

  setLanguage(language: 'en' | 'te') {
    this.language = language;
    if (this.recognition) {
      this.recognition.lang = language === 'te' ? 'te-IN' : 'en-US';
    }
  }

  async startListening(): Promise<VoiceCommand | null> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      return null;
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }

      this.recognition.onresult = (event) => {
        const result = event.results[0];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        const voiceCommand: VoiceCommand = {
          id: Date.now().toString(),
          phrase: transcript,
          language: this.language,
          action: this.parseCommand(transcript),
          confidence,
          timestamp: new Date().toISOString()
        };

        resolve(voiceCommand);
      };

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  private parseCommand(transcript: string): string {
    const lowerTranscript = transcript.toLowerCase();
    
    // English commands
    const englishCommands: Record<string, string> = {
      'open': 'open-application',
      'close': 'close-application',
      'shutdown': 'system-shutdown',
      'restart': 'system-restart',
      'volume up': 'volume-up',
      'volume down': 'volume-down',
      'brightness up': 'brightness-up',
      'brightness down': 'brightness-down',
      'play': 'media-play',
      'pause': 'media-pause',
      'stop': 'media-stop',
      'next': 'media-next',
      'previous': 'media-previous'
    };

    // Telugu commands
    const teluguCommands: Record<string, string> = {
      'తెరవండి': 'open-application',
      'మూసివేయండి': 'close-application',
      'షట్‌డౌన్': 'system-shutdown',
      'రీస్టార్ట్': 'system-restart',
      'వాల్యూమ్ పెంచండి': 'volume-up',
      'వాల్యూమ్ తగ్గించండి': 'volume-down',
      'ప్రకాశం పెంచండి': 'brightness-up',
      'ప్రకాశం తగ్గించండి': 'brightness-down',
      'ప్లే చేయండి': 'media-play',
      'పాజ్ చేయండి': 'media-pause',
      'ఆపండి': 'media-stop',
      'తదుపరి': 'media-next',
      'మునుపటి': 'media-previous'
    };

    const commands = this.language === 'te' ? teluguCommands : englishCommands;

    for (const [phrase, action] of Object.entries(commands)) {
      if (lowerTranscript.includes(phrase)) {
        return action;
      }
    }

    return 'unknown-command';
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  getListeningStatus(): boolean {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognitionService();
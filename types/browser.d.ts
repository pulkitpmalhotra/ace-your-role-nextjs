// types/browser.d.ts - Add this file to fix browser speech API types

interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

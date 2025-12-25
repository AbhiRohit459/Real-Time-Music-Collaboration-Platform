import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress the AudioContext warning from Tone.js initialization
// This warning is harmless - AudioContext will be properly started on user interaction
// Note: Primary suppression is in index.html, this is a backup
const originalWarn = console.warn;
const originalError = console.error;

const shouldSuppressAudioContextWarning = (message) => {
  if (typeof message !== 'string') return false;
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('audiocontext') ||
    lowerMessage.includes('must be resumed') ||
    lowerMessage.includes('user gesture') ||
    lowerMessage.includes('autoplay') ||
    message.includes('AudioContext was not allowed to start') ||
    message.includes('must be resumed (or created) after a user gesture')
  );
};

console.warn = (...args) => {
  const message = args[0];
  if (shouldSuppressAudioContextWarning(message)) {
    // Suppress this specific warning
    return;
  }
  originalWarn.apply(console, args);
};

// Also suppress in console.error for some browsers
console.error = (...args) => {
  const message = args[0];
  if (shouldSuppressAudioContextWarning(message)) {
    // Suppress this specific error
    return;
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


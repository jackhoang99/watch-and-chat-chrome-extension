// Initialize Firebase (you'll need to add your Firebase config)
const FIREBASE_CONFIG = {
  // Add your Firebase configuration here
};

// Initialize WebSocket connection (alternative to Firebase)
const WS_URL = 'wss://your-websocket-server.com';

let currentRoom = null;
let username = '';

// Load username from storage
chrome.storage.local.get(['username'], (result) => {
  if (result.username) {
    username = result.username;
    document.getElementById('username').value = username;
  }
});

// Handle username changes
document.getElementById('username').addEventListener('input', (e) => {
  username = e.target.value;
  chrome.storage.local.set({ username });
});

// Get current show information
chrome.storage.local.get(['currentShow'], (result) => {
  if (result.currentShow?.title) {
    document.getElementById('current-show').textContent = 
      `Watching: ${result.currentShow.title}`;
    joinRoom(result.currentShow.title);
  }
});

// Message handling
document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (message && username && currentRoom) {
    // Send message (implement with your chosen backend)
    const messageData = {
      room: currentRoom,
      username,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Add message to UI
    addMessageToUI(messageData);
    
    // Clear input
    input.value = '';
  }
}

function addMessageToUI(messageData) {
  const messages = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  const time = new Date(messageData.timestamp).toLocaleTimeString();
  
  messageElement.innerHTML = `
    <span class="username">${messageData.username}</span>
    <span class="time">${time}</span>
    <div class="content">${messageData.message}</div>
  `;
  
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}

function joinRoom(showTitle) {
  if (currentRoom === showTitle) return;
  
  currentRoom = showTitle;
  // Implement room joining logic with your chosen backend
  console.log(`Joined room: ${showTitle}`);
}
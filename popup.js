// Initialize Firebase (you'll need to add your Firebase config)
const FIREBASE_CONFIG = {
  // Add your Firebase configuration here
};

// Initialize WebSocket connection (alternative to Firebase)
const WS_URL = "wss://your-websocket-server.com";

let currentRoom = null;
let username = "";
let currentVideoTime = 0;

// Load username from storage
chrome.storage.local.get(["username"], (result) => {
  if (result.username) {
    username = result.username;
    document.getElementById("username").value = username;
  }
});

// Handle username changes
document.getElementById("username").addEventListener("input", (e) => {
  username = e.target.value;
  chrome.storage.local.set({ username });
});

// Listen for video time updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TIME_UPDATE") {
    currentVideoTime = message.currentTime;
  }
});

// Get current show information and load chat history
chrome.storage.local.get(["currentShow"], (result) => {
  if (result.currentShow?.title) {
    document.getElementById(
      "current-show"
    ).textContent = `Watching: ${result.currentShow.title}`;
    joinRoom(result.currentShow.title);
    loadChatHistory(result.currentShow.title);
  }
});

// Message handling
document.getElementById("send-button").addEventListener("click", sendMessage);
document.getElementById("message-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const input = document.getElementById("message-input");
  const message = input.value.trim();

  if (message && username && currentRoom) {
    // Send message (implement with your chosen backend)
    const messageData = {
      room: currentRoom,
      username,
      message,
      timestamp: new Date().toISOString(),
      videoTime: currentVideoTime,
    };

    // Add message to UI
    addMessageToUI(messageData);

    // Save message to chat history
    saveMessageToHistory(messageData);

    // Clear input
    input.value = "";
  }
}

function addMessageToUI(messageData) {
  const messages = document.getElementById("messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  const time = new Date(messageData.timestamp).toLocaleTimeString();
  const videoTime = formatVideoTime(messageData.videoTime);

  messageElement.innerHTML = `
    <span class="username">${messageData.username}</span>
    <span class="time">${time}</span>
    <span class="video-time">[${videoTime}]</span>
    <div class="content">${messageData.message}</div>
  `;

  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
}

function formatVideoTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function saveMessageToHistory(messageData) {
  chrome.storage.local.get(["chatHistory"], (result) => {
    const chatHistory = result.chatHistory || {};
    const roomHistory = chatHistory[messageData.room] || [];
    roomHistory.push(messageData);
    chatHistory[messageData.room] = roomHistory;

    chrome.storage.local.set({ chatHistory });
  });
}

function loadChatHistory(room) {
  chrome.storage.local.get(["chatHistory"], (result) => {
    const chatHistory = result.chatHistory || {};
    const roomHistory = chatHistory[room] || [];

    // Clear existing messages
    const messages = document.getElementById("messages");
    messages.innerHTML = "";

    // Load messages
    roomHistory.forEach((messageData) => {
      addMessageToUI(messageData);
    });
  });
}

function joinRoom(showTitle) {
  if (currentRoom === showTitle) return;

  currentRoom = showTitle;
  // Implement room joining logic with your chosen backend
  console.log(`Joined room: ${showTitle}`);
}

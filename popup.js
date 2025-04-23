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

// DOM Elements
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const usernameInput = document.getElementById("username");
const currentShowSpan = document.getElementById("current-show");

// State
let currentVideo = null;
let currentViewers = [];
let socketUrl = "http://localhost:3000";

// Get configuration from background script
chrome.runtime.sendMessage({ type: "GET_CONFIG" }, (response) => {
  if (response && response.socketUrl) {
    socketUrl = response.socketUrl;
    initializeSocket();
  }
});

// Initialize Socket.IO
let socket = null;

function initializeSocket() {
  if (socket) return;

  socket = io(socketUrl);

  // Socket event handlers
  socket.on("connect", () => {
    console.log("Connected to chat server");
  });

  socket.on("new-message", (message) => {
    appendMessage(message);
  });

  socket.on("user-joined", ({ username }) => {
    appendSystemMessage(`${username} joined the chat`);
    updateViewersList();
  });

  socket.on("user-left", ({ username }) => {
    appendSystemMessage(`${username} left the chat`);
    updateViewersList();
  });

  socket.on("current-viewers", (viewers) => {
    currentViewers = viewers;
    updateViewersList();
  });
}

// Message handling
function appendMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  const usernameSpan = document.createElement("span");
  usernameSpan.className = "username";
  usernameSpan.textContent = message.username;

  const textSpan = document.createElement("span");
  textSpan.className = "text";
  textSpan.textContent = message.text;

  const timeSpan = document.createElement("span");
  timeSpan.className = "time";
  timeSpan.textContent = new Date(message.createdAt).toLocaleTimeString();

  messageElement.appendChild(usernameSpan);
  messageElement.appendChild(textSpan);
  messageElement.appendChild(timeSpan);

  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendSystemMessage(text) {
  const messageElement = document.createElement("div");
  messageElement.className = "system-message";
  messageElement.textContent = text;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function updateViewersList() {
  const viewersList = document.createElement("div");
  viewersList.className = "viewers-list";
  viewersList.innerHTML = `
    <h3>Current Viewers (${currentViewers.length})</h3>
    <ul>
      ${currentViewers
        .map(
          (viewer) => `
        <li>${viewer.username}</li>
      `
        )
        .join("")}
    </ul>
  `;

  const existingList = document.querySelector(".viewers-list");
  if (existingList) {
    existingList.replaceWith(viewersList);
  } else {
    document
      .querySelector(".chat-container")
      .insertBefore(viewersList, document.querySelector(".input-container"));
  }
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (text && currentVideo) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "SEND_CHAT_MESSAGE",
        text,
      });
    });
    messageInput.value = "";
  }
}

// Listen for video updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_DETECTED") {
    currentVideo = message;
    currentShowSpan.textContent = message.title || "Not watching anything";

    // Join the video room
    if (socket) {
      socket.emit("join-video", {
        videoId: message.url,
        userId: sender.tab ? sender.tab.id.toString() : "popup",
        username: username || usernameInput.value || "Anonymous",
      });
    }
  }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Get current tab's video info
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { type: "GET_VIDEO_INFO" });
  });
});

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

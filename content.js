// === Utility: Detect the current show/video ===
function detectShow() {
  let showInfo = {
    title: "",
    url: window.location.href,
    platform: "",
    currentTime: 0,
    duration: 0,
  };

  if (window.location.hostname.includes("netflix.com")) {
    showInfo.platform = "netflix";
    const titleElement = document.querySelector(".video-title h1");
    if (titleElement) {
      showInfo.title = titleElement.textContent.trim();
    }
    const video = document.querySelector("video");
    if (video) {
      showInfo.currentTime = video.currentTime;
      showInfo.duration = video.duration;
    }
  } else if (window.location.hostname.includes("youtube.com")) {
    showInfo.platform = "youtube";
    const titleElement = document.querySelector(
      "h1.ytd-video-primary-info-renderer"
    );
    if (titleElement) {
      showInfo.title = titleElement.textContent.trim();
    }
    const video = document.querySelector("video");
    if (video) {
      showInfo.currentTime = video.currentTime;
      showInfo.duration = video.duration;
    }
  }

  return showInfo;
}

// === Socket.IO Configuration ===
// Get the configuration from the background script
let SOCKET_URL = "http://localhost:3000";
chrome.runtime.sendMessage({ type: "GET_CONFIG" }, (response) => {
  if (response && response.socketUrl) {
    SOCKET_URL = response.socketUrl;
  }
});

let socket = null;
let currentUserId = "user_" + Math.random().toString(36).substr(2, 9);
let currentUsername = "Anonymous_" + Math.random().toString(36).substr(2, 4);

function initializeSocket() {
  if (socket) return;

  socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log("Connected to chat server");
    const showInfo = detectShow();
    if (showInfo.url) {
      socket.emit("join-video", {
        videoId: showInfo.url,
        userId: currentUserId,
        username: currentUsername,
      });
    }
  });

  socket.on("user-joined", ({ userId, username }) => {
    console.log(`${username} joined the chat`);
    // Notify the popup
    chrome.runtime.sendMessage({
      type: "USER_JOINED",
      userId,
      username,
    });
  });

  socket.on("user-left", ({ userId }) => {
    console.log(`User ${userId} left the chat`);
    // Notify the popup
    chrome.runtime.sendMessage({
      type: "USER_LEFT",
      userId,
    });
  });

  socket.on("new-message", (message) => {
    console.log("New message:", message);
    // Notify the popup
    chrome.runtime.sendMessage({
      type: "NEW_MESSAGE",
      message,
    });
  });

  socket.on("current-viewers", (viewers) => {
    console.log("Current viewers:", viewers);
    // Notify the popup
    chrome.runtime.sendMessage({
      type: "CURRENT_VIEWERS",
      viewers,
    });
  });
}

// === Utility: Safely send message to background script ===
function safeSendMessage(data) {
  try {
    chrome.runtime.sendMessage(data);
  } catch (err) {
    console.warn("Extension context may be invalidated:", err);
  }
}

// === API Configuration ===
const API_BASE_URL = "http://localhost:3000/api";

// === Utility: Send data to backend ===
async function sendToBackend(endpoint, data) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending data to backend:", error);
  }
}

// === Modified detectAndNotify function ===
async function detectAndNotify() {
  const showInfo = detectShow();
  if (showInfo.title) {
    // Initialize socket if not already done
    initializeSocket();

    // Send to background script
    safeSendMessage({
      type: "SHOW_DETECTED",
      ...showInfo,
    });

    // Join the video room
    if (socket) {
      socket.emit("join-video", {
        videoId: showInfo.url,
        userId: currentUserId,
        username: currentUsername,
      });
    }
  }
}

// === MutationObserver: Detect DOM changes ===
const observer = new MutationObserver(() => {
  detectAndNotify();
});

if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// === Initial detection on load ===
detectAndNotify();

// === SPA support: Watch for URL changes ===
function watchUrlChanges(callback) {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log("[Watch & Chat] URL changed:", currentUrl);
      callback();
    }
  }).observe(document, { subtree: true, childList: true });
}

// Re-run detection on SPA route change
watchUrlChanges(() => {
  detectAndNotify();
});

// === Modified trackVideoTime function ===
function trackVideoTime() {
  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", async () => {
      const showInfo = detectShow();
      // Send to background script
      safeSendMessage({
        type: "TIME_UPDATE",
        ...showInfo,
      });

      // Send time update to socket
      if (socket) {
        socket.emit("video-time-update", {
          videoId: showInfo.url,
          userId: currentUserId,
          currentTime: showInfo.currentTime,
        });
      }
    });
  }
}

// Initialize video time tracking
if (document.body) {
  trackVideoTime();
  // Re-initialize on SPA route changes
  watchUrlChanges(() => {
    setTimeout(trackVideoTime, 1000); // Wait for video element to load
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_CHAT_MESSAGE" && socket) {
    const showInfo = detectShow();
    socket.emit("chat-message", {
      videoId: showInfo.url,
      userId: currentUserId,
      username: currentUsername,
      text: message.text,
      timestamp: showInfo.currentTime,
    });
  } else if (message.type === "GET_VIDEO_INFO") {
    const showInfo = detectShow();
    sendResponse(showInfo);
  }
});

// Import configuration
import config from "./config.js";

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  // Initialize default settings
  chrome.storage.local.set({
    username: "",
    settings: {
      notifications: true,
      autoJoin: true,
    },
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_DETECTED") {
    // Store the current show information
    chrome.storage.local.set({
      currentShow: {
        title: message.title,
        url: message.url,
        platform: message.platform,
      },
    });
  } else if (message.type === "GET_CONFIG") {
    // Return the configuration
    sendResponse({
      socketUrl: config.socketUrl,
      apiUrl: config.apiUrl,
    });
  }
});

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

// === Utility: Safely send message to background script ===
function safeSendMessage(data) {
  try {
    chrome.runtime.sendMessage(data);
  } catch (err) {
    console.warn("Extension context may be invalidated:", err);
  }
}

// === Detect show and send message ===
function detectAndNotify() {
  const showInfo = detectShow();
  if (showInfo.title) {
    safeSendMessage({
      type: "SHOW_DETECTED",
      ...showInfo,
    });
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

// === Track video time updates ===
function trackVideoTime() {
  const video = document.querySelector("video");
  if (video) {
    video.addEventListener("timeupdate", () => {
      const showInfo = detectShow();
      safeSendMessage({
        type: "TIME_UPDATE",
        ...showInfo,
      });
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

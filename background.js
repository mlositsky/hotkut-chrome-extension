chrome.action.onClicked.addListener(async () => {
  // Get all tabs matching chat.qwen.ai
  const tabs = await chrome.tabs.query({
    url: "*://chat.qwen.ai/*"
  });

  if (tabs.length === 0) {
    // Open new tab if none exist
    chrome.tabs.create({ url: "https://chat.qwen.ai" });
    return;
  }

  // Find most recently active tab (highest lastAccessed time)
  const lastActive = tabs.reduce((prev, current) => 
    (prev.lastAccessed > current.lastAccessed) ? prev : current
  );

  // Switch to the tab
  await chrome.tabs.update(lastActive.id, { active: true });
  
  // Focus window
  chrome.windows.update(lastActive.windowId, { focused: true });
  
  // Inject focus script
  chrome.scripting.executeScript({
    target: { tabId: lastActive.id },
    func: () => {
      // Wait for input to exist
      const checkInterval = setInterval(() => {
        const input = document.querySelector('#chat-input');
        if (input) {
          clearInterval(checkInterval);
          input.focus();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => clearInterval(checkInterval), 5000);
    }
  });
});
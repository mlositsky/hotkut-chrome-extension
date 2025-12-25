import { DEFAULT_SITES } from "./config.js";

async function getSiteConfigs() {
  const result = await chrome.storage.sync.get("sites");
  return result.sites || DEFAULT_SITES;
}

async function getHostPermissions() {
  // Get all configured URL patterns and request host permissions
  const configs = await getSiteConfigs();
  const patterns = configs.map((c) => c.siteAddress).filter(Boolean);
  if (patterns.length > 0) {
    // Request host permissions dynamically
    const granted = await chrome.permissions.request({ origins: patterns });
    return granted;
  }
  return true;
}

function focusInputInTab(tabId, selector) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (sel) => {
      const checkInterval = setInterval(() => {
        const input = document.querySelector(sel);
        if (input) {
          clearInterval(checkInterval);
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 5000);
    },
    args: [selector],
  });
}

async function handleSiteActivation(siteAddress, selector) {
  console.log("received " + siteAddress);
  if (!siteAddress.startsWith("https://")) {
    siteAddress = "https://" + siteAddress;
  }

  const tabs = await chrome.tabs.query({ url: siteAddress + "/*" });
  console.log("tabs " + siteAddress);

  if (tabs.length === 0) {
    // Open new tab
    console.log("newTabUrl " + siteAddress);
    const newTab = await chrome.tabs.create({ url: siteAddress });
    console.log("newTab " + newTab);
    // Wait a bit before focusing (optional improvement: use tab updated listener)
    setTimeout(() => focusInputInTab(newTab.id, selector), 1000);
    return;
  }

  const lastActive = tabs.reduce((prev, current) =>
    prev.lastAccessed > current.lastAccessed ? prev : current,
  );

  await chrome.tabs.update(lastActive.id, { active: true });
  await chrome.windows.update(lastActive.windowId, { focused: true });
  focusInputInTab(lastActive.id, selector);
}

// Map command to config index
chrome.commands.onCommand.addListener(async (command) => {
  if (command.startsWith("focus-site-")) {
    const index = parseInt(command.split("-")[2], 10) - 1; // 0-based
    if (index >= 0 && index < 5) {
      const configs = await getSiteConfigs();
      if (configs[index]) {
        const { siteAddress, selector } = configs[index];
        if (siteAddress && selector) {
          handleSiteActivation(siteAddress, selector);
        }
      }
    }
  }
});

// Open options page on extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

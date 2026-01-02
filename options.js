import { DEFAULT_SITES } from "./config.js";

const MAX_SITES = 5;
const COMMAND_NAMES = [
  "focus-site-1",
  "focus-site-2",
  "focus-site-3",
  "focus-site-4",
  "focus-site-5"
];

function getHotkeyDisplay(shortcuts) {
  if (!shortcuts || shortcuts.length === 0) {
    return "Not set";
  }
  // Chrome typically returns only one shortcut per command
  const shortcut = shortcuts[0];
  if (!shortcut) return "Not set";

  // Format the shortcut for display
  return shortcut.replace(/\+(?=.)/g, '+ '); // Add space after + for better readability
}


function restoreOptions() {
  chrome.storage.sync.get("sites", (result) => {
    // First run: populate defaults
    if (!Array.isArray(result.sites) || result.sites.length === 0) {
      chrome.storage.sync.set({ sites: DEFAULT_SITES }, restoreOptions);
      return;
    }

    const sites = result.sites;
    const container = document.getElementById("sites");
    container.innerHTML = "";

    // Get current command shortcuts
    chrome.commands.getAll((commands) => {
      const commandMap = {};
      commands.forEach(cmd => {
        if (cmd.name && cmd.shortcut) {
          commandMap[cmd.name] = cmd.shortcut;
        }
      });

    for (let i = 0; i < MAX_SITES; i++) {
      const site = sites[i] || {};
      const commandName = COMMAND_NAMES[i];
      const currentHotkey = commandMap[commandName] || "";
      const hotkeyDisplay = getHotkeyDisplay([currentHotkey]);

      const div = document.createElement("div");
      div.className = "site";

      let siteName = "";
      if (i < 3) {
        siteName = DEFAULT_SITES[i].siteAddress.split('.')[0] || `Site ${i + 1}`;
      } else {
        siteName = `Custom site ${i - 2}`;
      }

      div.innerHTML = `
        <div><label>URL Pattern:</label><input type="text" class="url" placeholder="example.com" value="${site.siteAddress || ""}"></div>
        <div><label>CSS Selector:</label><input type="text" class="selector" placeholder="#input-box" value="${site.selector || ""}"></div>
        <div class="hotkey"><button type="button" class="hotkey-btn">Hotkey: ${hotkeyDisplay}</button></div>
      `;
      container.appendChild(div);
    }
    });
  });
}

// Open Chrome shortcuts page safely
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".hotkey-btn");
  if (!btn) return;

  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

function saveOptions() {
  const sites = [];
  document.querySelectorAll(".site").forEach((el, i) => {
    const url = el.querySelector(".url").value.trim();
    const selector = el.querySelector(".selector").value.trim();
    if (url && selector) {
      sites.push({ siteAddress: url, selector: selector });
    }
  });

  chrome.storage.sync.set({ sites }, () => {
    const status = document.getElementById("status");
    status.textContent = "Options saved.";
    setTimeout(() => (status.textContent = ""), 2000);
  });
}

function resetOptions() {
  chrome.storage.sync.set({ sites: DEFAULT_SITES }, () => {
    const status = document.getElementById("status");
    status.textContent = "Options reset to defaults.";
    setTimeout(() => (status.textContent = ""), 2000);

    // Optionally, reload the form to reflect reset values
    restoreOptions();
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("reset").addEventListener("click", resetOptions);

import { DEFAULT_SITES } from "./config.js";

const MAX_SITES = 5;
const COMMAND_NAMES = [
  "focus-site-1",
  "focus-site-2",
  "focus-site-3",
  "focus-site-4",
  "focus-site-5"
];

let statusTimer = null;

function showStatus(message) {
  const status = document.getElementById("status");

  status.textContent = message;
  status.classList.add("visible");

  if (statusTimer) clearTimeout(statusTimer);

  statusTimer = setTimeout(() => {
    status.classList.remove("visible");

    setTimeout(() => {
      status.textContent = "";
    }, 350);
  }, 2000);
}

function getHotkeyDisplay(shortcuts) {
  if (!shortcuts || shortcuts.length === 0) {
    return "Not set";
  }

  const shortcut = shortcuts[0];
  if (!shortcut) return "Not set";

  return shortcut.replace(/\+(?=.)/g, '+ ');
}

function restoreOptions() {
  chrome.storage.sync.get("sites", (result) => {
    if (!Array.isArray(result.sites) || result.sites.length === 0) {
      chrome.storage.sync.set({ sites: DEFAULT_SITES }, restoreOptions);
      return;
    }

    const sites = result.sites;
    const container = document.getElementById("sites");
    container.innerHTML = "";

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

        div.innerHTML = `
  <div class="hotkey">
    <button type="button" class="hotkey-btn">Site ${i+1} Hotkey: ${hotkeyDisplay}</button>
  </div>

  <div class="form-row">
    <label>URL:</label>
    <input type="text" class="url" placeholder="example.com" value="${site.siteAddress || ""}">

    <label>#</label>
    <input type="text" class="selector" placeholder="#input-box" value="${site.selector || ""}">
  </div>
`;
        container.appendChild(div);
      }
    });
  });
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".hotkey-btn");
  if (!btn) return;

  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

function saveOptions() {
  const sites = [];

  document.querySelectorAll(".site").forEach((el) => {
    const url = el.querySelector(".url").value.trim();
    const selector = el.querySelector(".selector").value.trim();

    if (url && selector) {
      sites.push({ siteAddress: url, selector: selector });
    }
  });

  chrome.storage.sync.set({ sites }, () => {
    showStatus("Options saved.");
  });
}

function resetOptions() {
  chrome.storage.sync.set({ sites: DEFAULT_SITES }, () => {
    showStatus("Options reset to defaults.");
    restoreOptions();
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("reset").addEventListener("click", resetOptions);

/* -----------------------------
   AUTOSAVE FEATURE
----------------------------- */

let autosaveTimer = null;

function scheduleAutosave() {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
  }

  autosaveTimer = setTimeout(() => {
    saveOptions();
  }, 400);
}

document.addEventListener("input", (e) => {
  if (e.target.classList.contains("url") || e.target.classList.contains("selector")) {
    scheduleAutosave();
  }
});

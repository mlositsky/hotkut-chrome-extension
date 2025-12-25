import { DEFAULT_SITES } from "./config.js";

const MAX_SITES = 5;

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
    for (let i = 0; i < MAX_SITES; i++) {
      const site = sites[i] || {};
      const div = document.createElement("div");
      div.className = "site";
      div.innerHTML = `
        <div><label>URL Pattern:</label><input type="text" class="url" placeholder="example.com" value="${site.siteAddress || ""}"></div>
        <div><label>CSS Selector:</label><input type="text" class="selector" placeholder="#input-box" value="${site.selector || ""}"></div>
      `;
      container.appendChild(div);
    }
  });
}

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

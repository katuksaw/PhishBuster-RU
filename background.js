let rulesCache = {};

async function loadRules() {
  const resp = await fetch(chrome.runtime.getURL("rules.json"));
  rulesCache = await resp.json();
}

chrome.runtime.onInstalled.addListener(loadRules);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "analyzePage") {
    sendResponse({ rules: rulesCache });
  }
  if (msg.action === "updateRisk") {
    const isPhishing = msg.score >= msg.threshold;
    chrome.action.setBadgeText({ text: isPhishing ? "!" : "OK", tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: isPhishing ? "#FF0000" : "#4CAF50", tabId: sender.tab.id });
  }
});
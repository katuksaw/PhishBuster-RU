document.getElementById('refresh').addEventListener('click', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {action: "analyzePage"}, res => {
      document.getElementById('status').textContent = res?.status || "Проверка завершена";
      document.getElementById('status').className = res?.safe ? 'status safe' : 'status danger';
    });
  });
});
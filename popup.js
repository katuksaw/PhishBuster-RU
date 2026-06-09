/**
 * PhishBuster RU — popup.js
 * Логика пользовательского интерфейса popup
 */

document.addEventListener('DOMContentLoaded', () => {
  loadResult();
});

/**
 * Загружает результат анализа текущей страницы
 */
async function loadResult() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showError();
      return;
    }
    
    chrome.runtime.sendMessage(
      { action: "getResult", tabId: tab.id },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('[PhishBuster Popup] Ошибка:', chrome.runtime.lastError);
          showError();
          return;
        }
        
        if (response && response.score !== undefined) {
          showResult(response, tab.url);
        } else {
          showNeutral(tab.url);
        }
      }
    );
  } catch (error) {
    console.error('[PhishBuster Popup] Исключение:', error);
    showError();
  }
}

/**
 * Отображает результат анализа в popup
 * @param {Object} result - результат анализа
 * @param {string} url - URL текущей страницы
 */
function showResult(result, url) {
  // Скрываем loading, показываем результат
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('resultState').style.display = 'block';
  document.getElementById('errorState').style.display = 'none';
  
  // === Score Ring ===
  const scoreRing = document.getElementById('scoreRing');
  scoreRing.className = `score-ring ${result.verdict}`;
  document.getElementById('scoreValue').textContent = result.score;
  
  // === Verdict Text ===
  const verdictText = document.getElementById('verdictText');
  const verdictLabels = {
    safe: "✅ Безопасно",
    warning: "⚠️ Подозрительно",
    danger: "🚨 ФИШИНГ!",
    neutral: "ℹ️ Неизвестный сайт"
  };
  verdictText.textContent = verdictLabels[result.verdict] || "—";
  verdictText.className = `verdict-text ${result.verdict}`;
  
  // === URL ===
  document.getElementById('urlText').textContent = url || result.url || '—';
  
  // === Reasons ===
  const reasonsSection = document.getElementById('reasonsSection');
  const reasonsList = document.getElementById('reasonsList');
  reasonsList.innerHTML = '';
  
  if (result.reasons && result.reasons.length > 0) {
    reasonsSection.style.display = 'block';
    
    result.reasons.forEach(reason => {
      const item = document.createElement('div');
      const reasonClass = `${result.verdict}-reason`;
      item.className = `reason-item ${reasonClass}`;
      
      const icons = {
        safe: '✅',
        warning: '⚠️',
        danger: '🔴',
        neutral: 'ℹ️'
      };
      
      item.innerHTML = `
        <span class="reason-icon">${icons[result.verdict] || '•'}</span>
        <span>${escapeHtml(reason)}</span>
      `;
      reasonsList.appendChild(item);
    });
  } else {
    reasonsSection.style.display = 'none';
  }
  
  // === Service ===
  const serviceSection = document.getElementById('serviceSection');
  if (result.serviceName) {
    serviceSection.style.display = 'block';
    document.getElementById('serviceName').textContent = result.serviceName;
    document.getElementById('serviceIcon').textContent = result.serviceIcon || '🌐';
  } else {
    serviceSection.style.display = 'none';
  }
  
  // === Footer ===
  document.getElementById('rulesVersion').textContent = `База: v${result.rulesVersion || '—'}`;
  document.getElementById('cacheInfo').textContent = result.cached ? '📦 из кэша' : '🔄 свежий анализ';
}

/**
 * Показывает нейтральный результат
 * @param {string} url
 */
function showNeutral(url) {
  showResult({
    score: 0,
    verdict: "neutral",
    reasons: ["Сайт не похож на известные сервисы"],
    serviceName: null,
    serviceIcon: null,
    rulesVersion: "—",
    cached: false,
    url: url
  }, url);
}

/**
 * Показывает состояние ошибки
 */
function showError() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('resultState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
}

/**
 * Экранирует HTML-символы для предотвращения XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

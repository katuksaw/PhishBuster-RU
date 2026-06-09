/**
 * PhishBuster RU — content.js
 * Анализатор DOM: извлечение метрик, MutationObserver, отображение результата
 */

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let analysisTimeout = null;
let observer = null;
let lastResult = null;
const DEBOUNCE_DELAY = 500; // мс

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Точка входа: анализ страницы после загрузки
 */
function init() {
  // Небольшая задержка для SPA-фреймворков
  setTimeout(() => {
    runAnalysis();
    initMutationObserver();
  }, 1000);
}

// Проверяем состояние документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================================
// ИЗВЛЕЧЕНИЕ МЕТРИК
// ============================================================

/**
 * Извлекает все метрики из текущей страницы
 * @returns {Object} объект метрик для отправки в background.js
 */
function extractMetrics() {
  // Базовая информация
  const url = window.location.href;
  const domain = window.location.hostname;
  const title = document.title;
  
  // Текст страницы (первые 5000 символов для производительности)
  const bodyText = document.body ? document.body.innerText.substring(0, 5000) : '';
  
  // Формы
  const forms = Array.from(document.querySelectorAll('form')).slice(0, 10).map(f => ({
    action: f.action || '',
    method: f.method || '',
    id: f.id || '',
    classes: f.className || ''
  }));
  
  // Поля ввода
  const passwordFields = document.querySelectorAll('input[type="password"]').length;
  const allInputs = document.querySelectorAll('input').length;
  
  // Изображения (первые 20)
  const images = Array.from(document.querySelectorAll('img')).slice(0, 20).map(img => ({
    alt: img.alt || '',
    src: img.src ? img.src.substring(0, 200) : ''
  }));
  
  // Кнопки
  const buttons = document.querySelectorAll('button, input[type="submit"]').length;
  
  // Ссылки
  const links = document.querySelectorAll('a').length;
  
  return {
    url: url,
    domain: domain,
    title: title,
    bodyText: bodyText,
    selectors: {
      forms: forms,
      passwordFields: passwordFields,
      inputs: allInputs,
      images: images,
      buttons: buttons,
      links: links
    },
    timestamp: Date.now()
  };
}

// ============================================================
// АНАЛИЗ СТРАНИЦЫ
// ============================================================

/**
 * Запускает анализ: извлекает метрики и отправляет в background.js
 */
function runAnalysis() {
  const metrics = extractMetrics();
  
  try {
    chrome.runtime.sendMessage(
      { action: "analyzePage", data: metrics },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn('[PhishBuster] Ошибка отправки:', chrome.runtime.lastError.message);
          return;
        }
        
        if (response) {
          lastResult = response;
          displayIndicator(response);
        }
      }
    );
  } catch (e) {
    console.warn('[PhishBuster] Исключение при отправке:', e);
  }
}

// ============================================================
// MUTATIONOBSERVER — ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ DOM
// ============================================================

/**
 * Инициализирует MutationObserver для отслеживания динамического контента
 * Использует debounce для защиты от избыточных пересчётов
 */
function initMutationObserver() {
  if (!document.body) return;
  
  const significantTags = ['FORM', 'INPUT', 'BUTTON', 'IMG', 'A', 'DIV', 'SECTION', 'MAIN'];
  
  observer = new MutationObserver((mutationsList) => {
    let hasSignificantChange = false;
    
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (significantTags.includes(node.tagName)) {
              hasSignificantChange = true;
              break;
            }
            // Проверяем дочерние элементы
            for (const tag of significantTags) {
              if (node.querySelector && node.querySelector(tag.toLowerCase())) {
                hasSignificantChange = true;
                break;
              }
            }
          }
          if (hasSignificantChange) break;
        }
      }
      if (hasSignificantChange) break;
    }
    
    if (hasSignificantChange) {
      // Debounce: перезапускаем таймер
      if (analysisTimeout) {
        clearTimeout(analysisTimeout);
      }
      
      analysisTimeout = setTimeout(() => {
        console.log('[PhishBuster] DOM изменён — повторный анализ');
        runAnalysis();
      }, DEBOUNCE_DELAY);
    }
  });
  
  // Наблюдаем за всем body
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Остановка наблюдателя при уходе со страницы
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});

// ============================================================
// ОТОБРАЖЕНИЕ РЕЗУЛЬТАТА НА СТРАНИЦЕ
// ============================================================

/**
 * Показывает плавающий индикатор на странице
 * @param {Object} result - результат анализа от background.js
 */
function displayIndicator(result) {
  // Удаляем предыдущий индикатор
  const existing = document.getElementById('phishbuster-indicator');
  if (existing) existing.remove();
  
  // Не показываем индикатор для нейтральных и безопасных сайтов
  // (показываем только для warning и danger)
  if (result.verdict === 'neutral' || result.verdict === 'safe') {
    return;
  }
  
  const colors = {
    danger: 'linear-gradient(135deg, #EF4444, #DC2626)',
    warning: 'linear-gradient(135deg, #F59E0B, #D97706)'
  };
  
  const texts = {
    danger: '🚨 ФИШИНГ! PhishBuster',
    warning: '⚠️ Подозрительно! PhishBuster'
  };
  
  const indicator = document.createElement('div');
  indicator.id = 'phishbuster-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 2147483647;
    padding: 10px 18px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: white;
    background: ${colors[result.verdict] || '#6B7280'};
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: opacity 0.3s ease;
    max-width: 300px;
    line-height: 1.3;
  `;
  
  indicator.textContent = texts[result.verdict] || 'PhishBuster';
  
  // Клик — скрыть
  indicator.addEventListener('click', () => {
    indicator.style.opacity = '0';
    setTimeout(() => { if (indicator.parentNode) indicator.remove(); }, 300);
  });
  
  document.body.appendChild(indicator);
  
  // Автоскрытие через 8 секунд
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.style.opacity = '0';
      setTimeout(() => { if (indicator.parentNode) indicator.remove(); }, 300);
    }
  }, 8000);
}

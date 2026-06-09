/**
 * PhishBuster RU — background.js (Service Worker)
 * Ядро скоринга: загрузка правил, вычисление риска, кэширование
 */

// ============================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================================

let rulesDatabase = null;
const CACHE_TTL = 3600000; // 1 час в миллисекундах

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================

/**
 * Загружает базу правил из rules.json
 * Вызывается при старте service worker и при каждом "пробуждении"
 */
async function loadRules() {
  try {
    const url = chrome.runtime.getURL('rules.json');
    const response = await fetch(url);
    rulesDatabase = await response.json();
    console.log(`[PhishBuster] База правил загружена: версия ${rulesDatabase.version}, ${rulesDatabase.services.length} сервисов`);
  } catch (error) {
    console.error('[PhishBuster] Ошибка загрузки rules.json:', error);
    rulesDatabase = { version: "0.0.0", services: [], globalSettings: {} };
  }
}

// Загрузка при старте
loadRules();

// ============================================================
// ОБРАБОТКА СООБЩЕНИЙ
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  
  if (message.action === "analyzePage") {
    handleAnalyzePage(sender.tab.id, message.data)
      .then(sendResponse)
      .catch(error => {
        console.error('[PhishBuster] Ошибка анализа:', error);
        sendResponse({ score: 0, verdict: "neutral", reasons: ["Ошибка анализа"], rulesVersion: "0.0.0" });
      });
    return true; // async sendResponse
  }
  
  if (message.action === "getResult") {
    handleGetResult(message.tabId)
      .then(sendResponse)
      .catch(error => {
        console.error('[PhishBuster] Ошибка получения результата:', error);
        sendResponse(null);
      });
    return true;
  }
});

// ============================================================
// ОСНОВНОЙ АНАЛИЗ
// ============================================================

/**
 * Обрабатывает запрос на анализ страницы
 * @param {number} tabId - ID вкладки
 * @param {Object} metrics - метрики от content.js
 * @returns {Object} результат анализа
 */
async function handleAnalyzePage(tabId, metrics) {
  // Убеждаемся, что правила загружены
  if (!rulesDatabase || !rulesDatabase.services) {
    await loadRules();
  }
  
  // Проверяем кэш
  const cached = await getFromCache(tabId, metrics.url);
  if (cached) {
    console.log(`[PhishBuster] Результат из кэша для ${metrics.url}`);
    return { ...cached, cached: true };
  }
  
  // Выполняем анализ
  const result = calculateRisk(metrics, rulesDatabase);
  
  // Сохраняем в кэш
  await saveToCache(tabId, metrics.url, result);
  
  console.log(`[PhishBuster] ${metrics.url} → ${result.verdict} (${result.score})`);
  return { ...result, cached: false };
}

/**
 * Возвращает кэшированный результат для popup
 * @param {number} tabId - ID вкладки
 * @returns {Object|null}
 */
async function handleGetResult(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const result = await getFromCache(tabId, tab.url);
    return result;
  } catch {
    return null;
  }
}

// ============================================================
// ЯДРО СКОРИНГА
// ============================================================

/**
 * Вычисляет риск фишинга для страницы
 * @param {Object} metrics - метрики страницы
 * @param {Object} rules - база правил
 * @returns {Object} { score, verdict, reasons, serviceName, rulesVersion }
 */
function calculateRisk(metrics, rules) {
  const domain = (metrics.domain || '').toLowerCase();
  const title = (metrics.title || '').toLowerCase();
  const bodyText = (metrics.bodyText || '').toLowerCase();
  
  // ----------------------------------------------------------
  // Шаг 1: Проверка на легитимный домен (белый список)
  // ----------------------------------------------------------
  for (const service of rules.services) {
    for (const legitDomain of service.domains.legitimate) {
      if (domain === legitDomain || domain.endsWith('.' + legitDomain)) {
        return {
          score: 0,
          verdict: "safe",
          reasons: [`Легитимный домен ${domain} (${service.name})`],
          serviceName: service.name,
          serviceIcon: service.icon,
          rulesVersion: rules.version,
          url: metrics.url
        };
      }
    }
  }
  
  // ----------------------------------------------------------
  // Шаг 2: Определение целевого сервиса (по ключевым словам)
  // ----------------------------------------------------------
  let matchedService = null;
  let maxConfidence = 0;
  
  for (const service of rules.services) {
    let confidence = 0;
    
    // Проверка title-ключевых слов
    for (const keyword of service.keywords.titleKeywords) {
      if (title.includes(keyword.toLowerCase())) {
        confidence += 0.4;
      }
    }
    
    // Проверка body-ключевых слов
    for (const keyword of service.keywords.bodyKeywords) {
      if (bodyText.includes(keyword.toLowerCase())) {
        confidence += 0.15;
      }
    }
    
    // Проверка suspicious domain patterns (повышает confidence)
    for (const pattern of service.domains.suspiciousPatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(domain)) {
          confidence += 0.5;
        }
      } catch (e) {
        // Невалидный regex — пропускаем
      }
    }
    
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
      matchedService = service;
    }
  }
  
  // ----------------------------------------------------------
  // Шаг 3: Если ни один сервис не совпал — нейтральный результат
  // ----------------------------------------------------------
  if (maxConfidence < 0.3 || !matchedService) {
    return {
      score: 0,
      verdict: "neutral",
      reasons: ["Сайт не похож на известные сервисы"],
      serviceName: null,
      serviceIcon: null,
      rulesVersion: rules.version,
      url: metrics.url
    };
  }
  
  // ----------------------------------------------------------
  // Шаг 4: Вычисление score по трём метрикам
  // ----------------------------------------------------------
  let score = 0;
  const reasons = [];
  const weights = matchedService.weights;
  
  // 4a: Доменная метрика
  const domainResult = evaluateDomain(domain, matchedService);
  if (domainResult.score === 1) {
    score += weights.domainMatch;
    reasons.push(domainResult.reason);
  }
  
  // 4b: Селекторная метрика
  const selectorResult = evaluateSelectors(metrics, matchedService);
  if (selectorResult.score === 1) {
    score += weights.selectorMatch;
    reasons.push(selectorResult.reason);
  }
  
  // 4c: Метрика ключевых слов
  const keywordResult = evaluateKeywords(title, bodyText, matchedService);
  if (keywordResult.score === 1) {
    score += weights.keywordMatch;
    reasons.push(keywordResult.reason);
  }
  
  // 4d: Urgency-сигналы (бонус)
  const urgencyResult = evaluateUrgency(bodyText, matchedService);
  if (urgencyResult.score === 1) {
    score += weights.urgencySignals;
    reasons.push(urgencyResult.reason);
  }
  
  // ----------------------------------------------------------
  // Шаг 5: Определение вердикта
  // ----------------------------------------------------------
  score = Math.min(score, 100);
  const threshold = matchedService.threshold || rules.globalSettings?.defaultThreshold || 60;
  
  let verdict;
  if (score >= threshold) {
    verdict = "danger";
  } else if (score >= 30) {
    verdict = "warning";
  } else {
    verdict = "safe";
  }
  
  // Если нет ни одной причины — neutral
  if (reasons.length === 0) {
    verdict = "neutral";
  }
  
  return {
    score: score,
    verdict: verdict,
    reasons: reasons.length > 0 ? reasons : ["Признаки фишинга не обнаружены"],
    serviceName: matchedService.name,
    serviceIcon: matchedService.icon,
    rulesVersion: rules.version,
    url: metrics.url
  };
}

// ============================================================
// МЕТРИКИ
// ============================================================

/**
 * Метрика 1: Доменные паттерны
 */
function evaluateDomain(domain, service) {
  // Проверка подозрительных паттернов
  for (const pattern of service.domains.suspiciousPatterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(domain)) {
        return {
          score: 1,
          reason: `🔴 Подозрительный домен: "${domain}" совпадает с паттерном фишинга`
        };
      }
    } catch (e) {
      // Пропускаем невалидный regex
    }
  }
  
  // Проверка: домен содержит название бренда, но не легитимный
  for (const pattern of service.domains.patterns) {
    try {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(domain)) {
        // Домен совпадает с паттерном легитимного домена, но НЕ в белом списке
        let isLegit = false;
        for (const legit of service.domains.legitimate) {
          if (domain === legit || domain.endsWith('.' + legit)) {
            isLegit = true;
            break;
          }
        }
        if (!isLegit) {
          return {
            score: 1,
            reason: `🔴 Домен похож на "${service.name}", но не является легитимным`
          };
        }
      }
    } catch (e) {
      // Пропускаем
    }
  }
  
  return { score: 0, reason: null };
}

/**
 * Метрика 2: DOM-селекторы
 */
function evaluateSelectors(metrics, service) {
  if (!metrics.selectors) return { score: 0, reason: null };
  
  let matchCount = 0;
  const allSelectors = [
    ...(service.selectors.loginForms || []),
    ...(service.selectors.brandElements || []),
    ...(service.selectors.securityIndicators || [])
  ];
  
  // Проверяем через данные, полученные от content.js
  const forms = metrics.selectors.forms || [];
  const images = metrics.selectors.images || [];
  
  // Проверка форм
  for (const form of forms) {
    for (const selector of service.selectors.loginForms || []) {
      const simpleMatch = selector
        .replace(/\[.*?\]/g, '')
        .replace(/[.#]/g, '')
        .toLowerCase();
      
      if (form.action && form.action.toLowerCase().includes(simpleMatch)) {
        matchCount++;
        break;
      }
      if (form.id && form.id.toLowerCase().includes(simpleMatch)) {
        matchCount++;
        break;
      }
      if (form.classes && form.classes.toLowerCase().includes(simpleMatch)) {
        matchCount++;
        break;
      }
    }
  }
  
  // Проверка изображений
  for (const img of images) {
    for (const selector of service.selectors.brandElements || []) {
      const altMatch = selector.match(/alt\*?='([^']+)'/);
      if (altMatch && img.alt && img.alt.toLowerCase().includes(altMatch[1].toLowerCase())) {
        matchCount++;
        break;
      }
      const srcMatch = selector.match(/src\*?='([^']+)'/);
      if (srcMatch && img.src && img.src.toLowerCase().includes(srcMatch[1].toLowerCase())) {
        matchCount++;
        break;
      }
    }
  }
  
  // Наличие полей ввода пароля — значимый признак
  if (metrics.selectors.passwordFields > 0) {
    matchCount++;
  }
  
  if (matchCount >= 2) {
    return {
      score: 1,
      reason: `🟠 Обнаружены фирменные элементы интерфейса (${matchCount} совпадений)`
    };
  }
  
  return { score: 0, reason: null };
}

/**
 * Метрика 3: Ключевые слова
 */
function evaluateKeywords(title, bodyText, service) {
  let titleMatches = 0;
  let bodyMatches = 0;
  
  for (const keyword of service.keywords.titleKeywords) {
    if (title.includes(keyword.toLowerCase())) {
      titleMatches++;
    }
  }
  
  for (const keyword of service.keywords.bodyKeywords) {
    if (bodyText.includes(keyword.toLowerCase())) {
      bodyMatches++;
    }
  }
  
  const matched = titleMatches >= 1 || bodyMatches >= 2;
  
  if (matched) {
    return {
      score: 1,
      reason: `🟡 Совпадение ключевых слов (title: ${titleMatches}, body: ${bodyMatches})`
    };
  }
  
  return { score: 0, reason: null };
}

/**
 * Бонусная метрика: Urgency-сигналы
 */
function evaluateUrgency(bodyText, service) {
  for (const keyword of service.keywords.urgencyKeywords || []) {
    if (bodyText.includes(keyword.toLowerCase())) {
      return {
        score: 1,
        reason: `⚠️ Обнаружены признаки социальной инженерии: "${keyword}"`
      };
    }
  }
  return { score: 0, reason: null };
}

// ============================================================
// КЭШИРОВАНИЕ
// ============================================================

/**
 * Сохраняет результат в кэш
 */
async function saveToCache(tabId, url, result) {
  const cacheKey = `cache_${tabId}`;
  const cacheEntry = {
    url: url,
    result: result,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_TTL
  };
  
  try {
    await chrome.storage.local.set({ [cacheKey]: cacheEntry });
  } catch (e) {
    console.warn('[PhishBuster] Ошибка сохранения в кэш:', e);
  }
}

/**
 * Получает результат из кэша
 */
async function getFromCache(tabId, currentUrl) {
  const cacheKey = `cache_${tabId}`;
  
  try {
    const data = await chrome.storage.local.get(cacheKey);
    const cached = data[cacheKey];
    
    if (!cached) return null;
    
    // Проверка срока действия
    if (Date.now() > cached.expiresAt) {
      await chrome.storage.local.remove(cacheKey);
      return null;
    }
    
    // Проверка, что URL не изменился
    if (cached.url !== currentUrl) {
      return null;
    }
    
    return cached.result;
  } catch (e) {
    console.warn('[PhishBuster] Ошибка чтения кэша:', e);
    return null;
  }
}

// Очистка просроченного кэша при установке/обновлении
chrome.runtime.onInstalled.addListener(() => {
  console.log('[PhishBuster] Расширение установлено/обновлено');
  loadRules();
});

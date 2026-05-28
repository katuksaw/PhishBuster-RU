chrome.runtime.sendMessage({ action: "analyzePage" }, async (response) => {
  if (!response || !response.rules) return;

  const url = window.location.hostname;
  const rule = response.rules[url] || findClosestDomain(response.rules, url);
  if (!rule) return;

  let riskScore = 0;
  
  // 1. Проверка селекторов
  for (const sel of rule.required_selectors) {
    if (!document.querySelector(sel)) riskScore++;
  }

  // 2. Проверка домена
  const trusted = rule.trusted_domains.some(d => url === d || url.endsWith('.' + d.replace('*.', '')));
  if (!trusted) riskScore += 2;

  // Отправляем скор в background
  chrome.runtime.sendMessage({ action: "updateRisk", url, score: riskScore, threshold: rule.risk_threshold });
});

function findClosestDomain(rules, hostname) {
  for (const key in rules) {
    if (hostname.includes(key)) return rules[key];
  }
  return null;
}
# PhishBuster RU — Структура rules.json

## Общая структура

```json
{
  "version": "1.3.0",
  "lastUpdated": "2025-12-15",
  "author": "PhishBuster RU Team",
  "description": "База эталонных признаков легитимных сайтов для выявления фишинга",
  "services": [
    { "...сбербанк..." },
    { "...госуслуги..." },
    { "...вконтакте..." },
    { "...яндекс..." },
    { "...т-банк..." }
  ]
}
```

**Поля мета-информации**:
| Поле | Назначение |
|---|---|
| `version` | Версия базы в формате SemVer — отслеживание обновлений |
| `lastUpdated` | Дата последнего обновления — контроль актуальности |
| `author` | Авторство — для демонстрации на защите |
| `description` | Описание — документирование назначения файла |

---

## Полный пример rules.json

```json
{
  "version": "1.3.0",
  "lastUpdated": "2025-12-15",
  "author": "PhishBuster RU Team",
  "description": "База эталонных признаков легитимных сайтов для выявления фишинга",
  
  "globalSettings": {
    "defaultThreshold": 60,
    "cacheTTL": 3600000,
    "maxAnalysisTime": 3000,
    "versionCheckUrl": ""
  },

  "services": [
    {
      "id": "sberbank",
      "name": "Сбербанк",
      "category": "banking",
      "icon": "🏦",
      
      "domains": {
        "legitimate": [
          "sberbank.ru",
          "online.sberbank.ru",
          "www.sberbank.ru",
          "sber.ru",
          "online.sber.ru"
        ],
        "patterns": [
          "sberbank\\.ru$",
          "sber\\.ru$",
          "^online\\.sber",
          "^www\\.sberbank"
        ],
        "suspiciousPatterns": [
          "sberbank-[a-z0-9]+\\.",
          "sber-?[a-z0-9]+\\.(ru|com|net|org|info)",
          "sberbank\\.(online|site|xyz|top|club)",
          "[a-z0-9-]*sber[a-z0-9-]*\\.(tk|ml|ga|cf)"
        ]
      },

      "selectors": {
        "loginForms": [
          "form[action*='login']",
          "form[action*='auth']",
          "input[name='login']",
          "input[name='password']",
          "input[type='password']",
          ".login-form",
          "#login-form",
          "[class*='auth']",
          "[class*='login']"
        ],
        "brandElements": [
          "img[alt*='Сбер']",
          "img[alt*='Сбербанк']",
          "img[src*='sberbank']",
          "img[src*='sber-logo']",
          "[class*='sber']",
          "[class*='header-logo']",
          "svg[class*='logo']"
        ],
        "securityIndicators": [
          "[class*='secure']",
          "[class*='protected']",
          "img[alt*='SSL']",
          "img[alt*='безопасн']"
        ]
      },

      "keywords": {
        "titleKeywords": [
          "Сбербанк",
          "СберБанк Онлайн",
          "Сбер",
          "Sberbank",
          "Sber"
        ],
        "bodyKeywords": [
          "сбербанк онлайн",
          "личный кабинет",
          "вход в систему",
          "подтвердите вход",
          "сберпрайм",
          "перевод",
          "история операций"
        ],
        "urgencyKeywords": [
          "срочно заблокирован",
          "немедленно подтвердите",
          "ваш аккаунт будет удалён",
          "счёт заморожен",
          "подозрительная операция"
        ]
      },

      "weights": {
        "domainMatch": 40,
        "selectorMatch": 35,
        "keywordMatch": 25,
        "urgencySignals": 15
      },

      "threshold": 60,

      "meta": {
        "addedVersion": "1.0.0",
        "lastVerified": "2025-12-01",
        "verificationNotes": "Проверено на online.sberbank.ru"
      }
    },

    {
      "id": "gosuslugi",
      "name": "Госуслуги",
      "category": "government",
      "icon": "🏛️",
      
      "domains": {
        "legitimate": [
          "gosuslugi.ru",
          "esia.gosuslugi.ru",
          "www.gosuslugi.ru",
          "gu.spb.ru"
        ],
        "patterns": [
          "gosuslugi\\.ru$",
          "^esia\\.gosuslugi",
          "^www\\.gosuslugi"
        ],
        "suspiciousPatterns": [
          "gosuslugi-[a-z0-9]+\\.",
          "gos-?[a-z0-9]+\\.(ru|com|net|org|info)",
          "gosuslugi\\.(online|site|xyz|top|club)",
          "госуслуги\\.",
          "[a-z0-9-]*gosuslugi[a-z0-9-]*\\.(tk|ml|ga|cf)",
          "esia-[a-z0-9]+\\."
        ]
      },

      "selectors": {
        "loginForms": [
          "form[action*='login']",
          "form[action*='auth']",
          "input[name='login']",
          "input[name='password']",
          "input[type='password']",
          "#login",
          "#auth",
          "[class*='login-form']",
          "[class*='esia']"
        ],
        "brandElements": [
          "img[alt*='Госуслуги']",
          "img[alt*='gosuslugi']",
          "img[src*='gosuslugi']",
          "[class*='gosuslugi']",
          "[class*='header-logo']",
          "svg[class*='logo']"
        ],
        "securityIndicators": [
          "[class*='secure']",
          "[class*='esia']",
          "[class*='protected']"
        ]
      },

      "keywords": {
        "titleKeywords": [
          "Госуслуги",
          "Единая система идентификации",
          "ЕСИА",
          "Gosuslugi",
          "Портал государственных услуг"
        ],
        "bodyKeywords": [
          "единая система идентификации",
          "личный кабинет",
          "государственные услуги",
          "электронное правительство",
          "запись на приём",
          "заполнение заявления"
        ],
        "urgencyKeywords": [
          "срочно подтвердите",
          "ваш аккаунт заблокирован",
          "немедленно войдите",
          "штраф",
          "судебная задолженность"
        ]
      },

      "weights": {
        "domainMatch": 40,
        "selectorMatch": 35,
        "keywordMatch": 25,
        "urgencySignals": 15
      },

      "threshold": 60,

      "meta": {
        "addedVersion": "1.0.0",
        "lastVerified": "2025-12-01",
        "verificationNotes": "Проверено на esia.gosuslugi.ru"
      }
    },

    {
      "id": "vk",
      "name": "ВКонтакте",
      "category": "social",
      "icon": "💬",
      
      "domains": {
        "legitimate": [
          "vk.com",
          "www.vk.com",
          "m.vk.com",
          "login.vk.com",
          "oauth.vk.com"
        ],
        "patterns": [
          "vk\\.com$",
          "^login\\.vk\\.com",
          "^oauth\\.vk\\.com",
          "^m\\.vk\\.com"
        ],
        "suspiciousPatterns": [
          "vk-[a-z0-9]+\\.",
          "[a-z0-9]*vk[a-z0-9]*\\.(ru|net|org|info|online|site|xyz|top)",
          "vk\\.(online|site|xyz|top|club)",
          "vkon(takte)?-[a-z0-9]+\\.",
          "vkontakte\\.(online|site|xyz)",
          "[a-z0-9-]*vk[a-z0-9-]*\\.(tk|ml|ga|cf)"
        ]
      },

      "selectors": {
        "loginForms": [
          "form[action*='login']",
          "input[name='email']",
          "input[name='pass']",
          "input[type='password']",
          "#quick_email",
          "#quick_pass",
          "#login_submit",
          ".login-form",
          "[class*='oauth']"
        ],
        "brandElements": [
          "img[alt*='VK']",
          "img[alt*='ВКонтакте']",
          "img[src*='vk_logo']",
          "[class*='vk']",
          "[class*='header-logo']",
          "svg[class*='logo']"
        ],
        "securityIndicators": [
          "[class*='secure']",
          "[class*='oauth']",
          "[class*='confirm']"
        ]
      },

      "keywords": {
        "titleKeywords": [
          "ВКонтакте",
          "VK",
          "VK Mobile",
          "Войти | VK"
        ],
        "bodyKeywords": [
          "вконтакте",
          "войти в аккаунт",
          "зарегистрироваться",
          "восстановить пароль",
          "новости",
          "сообщения",
          "друзья"
        ],
        "urgencyKeywords": [
          "ваш аккаунт будет удалён",
          "немедленно подтвердите",
          "аккаунт заблокирован",
          "нарушение правил",
          "срочно войдите"
        ]
      },

      "weights": {
        "domainMatch": 40,
        "selectorMatch": 30,
        "keywordMatch": 25,
        "urgencySignals": 15
      },

      "threshold": 55,

      "meta": {
        "addedVersion": "1.1.0",
        "lastVerified": "2025-12-05",
        "verificationNotes": "Проверено на login.vk.com"
      }
    },

    {
      "id": "yandex",
      "name": "Яндекс",
      "category": "tech",
      "icon": "🔍",
      
      "domains": {
        "legitimate": [
          "yandex.ru",
          "yandex.com",
          "passport.yandex.ru",
          "passport.yandex.com",
          "mail.yandex.ru",
          "disk.yandex.ru",
          "login.yandex.ru"
        ],
        "patterns": [
          "yandex\\.(ru|com|kz|ua|by|uz)$",
          "^passport\\.yandex",
          "^login\\.yandex",
          "^mail\\.yandex",
          "^disk\\.yandex"
        ],
        "suspiciousPatterns": [
          "yandex-[a-z0-9]+\\.",
          "[a-z0-9]*yandex[a-z0-9]*\\.(online|site|xyz|top|club|info)",
          "yandex\\.(online|site|xyz|top)",
          "[a-z0-9-]*yandex[a-z0-9-]*\\.(tk|ml|ga|cf)",
          "яндекс\\."
        ]
      },

      "selectors": {
        "loginForms": [
          "form[action*='passport']",
          "form[action*='auth']",
          "form[action*='login']",
          "input[name='login']",
          "input[name='passwd']",
          "input[type='password']",
          "#passp-field-login",
          "#passp-field-passwd",
          "[class*='passp']",
          "[class*='auth']"
        ],
        "brandElements": [
          "img[alt*='Яндекс']",
          "img[alt*='Yandex']",
          "img[src*='yandex']",
          "[class*='yandex']",
          "[class*='header-logo']",
          "svg[class*='logo']"
        ],
        "securityIndicators": [
          "[class*='secure']",
          "[class*='passp']",
          "[class*='protected']"
        ]
      },

      "keywords": {
        "titleKeywords": [
          "Яндекс",
          "Яндекс ID",
          "Яндекс Паспорт",
          "Yandex",
          "Авторизация — Яндекс"
        ],
        "bodyKeywords": [
          "яндекс id",
          "яндекс паспорт",
          "войдите в аккаунт",
          "почта",
          "диск",
          "маркет",
          "войти"
        ],
        "urgencyKeywords": [
          "ваш аккаунт заблокирован",
          "немедленно подтвердите",
          "подозрительная активность",
          "срочно войдите",
          "изменение пароля"
        ]
      },

      "weights": {
        "domainMatch": 40,
        "selectorMatch": 35,
        "keywordMatch": 25,
        "urgencySignals": 15
      },

      "threshold": 60,

      "meta": {
        "addedVersion": "1.1.0",
        "lastVerified": "2025-12-05",
        "verificationNotes": "Проверено на passport.yandex.ru"
      }
    },

    {
      "id": "tbank",
      "name": "Т-Банк (Тинькофф)",
      "category": "banking",
      "icon": "💳",
      
      "domains": {
        "legitimate": [
          "tinkoff.ru",
          "www.tinkoff.ru",
          "t-bank.ru",
          "www.t-bank.ru",
          "login.tinkoff.ru",
          "secure.tinkoff.ru"
        ],
        "patterns": [
          "tinkoff\\.ru$",
          "t-bank\\.ru$",
          "^login\\.tinkoff",
          "^secure\\.tinkoff",
          "^www\\.tinkoff"
        ],
        "suspiciousPatterns": [
          "tinkoff-[a-z0-9]+\\.",
          "t-?bank-[a-z0-9]+\\.",
          "[a-z0-9]*tinkoff[a-z0-9]*\\.(online|site|xyz|top|club|info)",
          "tinkoff\\.(online|site|xyz|top)",
          "[a-z0-9-]*tinkoff[a-z0-9-]*\\.(tk|ml|ga|cf)",
          "тинькофф\\.",
          "т-банк\\."
        ]
      },

      "selectors": {
        "loginForms": [
          "form[action*='login']",
          "form[action*='auth']",
          "input[name='login']",
          "input[name='password']",
          "input[type='password']",
          "[class*='login']",
          "[class*='auth']",
          "[class*='sign-in']"
        ],
        "brandElements": [
          "img[alt*='Тинькофф']",
          "img[alt*='Т-Банк']",
          "img[alt*='Tinkoff']",
          "img[src*='tinkoff']",
          "[class*='tinkoff']",
          "[class*='header-logo']",
          "svg[class*='logo']"
        ],
        "securityIndicators": [
          "[class*='secure']",
          "[class*='protected']",
          "[class*='2fa']",
          "[class*='confirm']"
        ]
      },

      "keywords": {
        "titleKeywords": [
          "Тинькофф",
          "Т-Банк",
          "Tinkoff",
          "T-Bank",
          "Тинькофф Банк"
        ],
        "bodyKeywords": [
          "тинькофф",
          "т-банк",
          "личный кабинет",
          "вход в систему",
          "перевод",
          "кредит",
          "вклад",
          "инвестиции"
        ],
        "urgencyKeywords": [
          "срочно подтвердите",
          "ваш счёт заблокирован",
          "подозрительная операция",
          "немедленно войдите",
          "кредит одобрен — подтвердите"
        ]
      },

      "weights": {
        "domainMatch": 40,
        "selectorMatch": 35,
        "keywordMatch": 25,
        "urgencySignals": 15
      },

      "threshold": 60,

      "meta": {
        "addedVersion": "1.2.0",
        "lastVerified": "2025-12-10",
        "verificationNotes": "Проверено на login.tinkoff.ru"
      }
    }
  ]
}
```

---

## Обоснование структуры данных

### Почему веса именно такие?

| Метрика | Вес | Обоснование |
|---|---|---|
| `domainMatch` | 40 | Домен — самый надёжный индикатор. Фишинг всегда использует подложный домен. Вес наибольший |
| `selectorMatch` | 35 | Селекторы — второй по надёжности признак. Фишинговые сайты часто копируют HTML-структуру оригинала |
| `keywordMatch` | 25 | Ключевые слова могут совпасть случайно. Вес ниже, но всё ещё значимый |
| `urgencySignals` | 15 | Дополнительный бонус — фишинг часто использует «срочные» формулировки. Не основной, но усиливающий признак |

> **Примечание**: Сумма весов трёх основных метрик (40+35+25 = 100) даёт максимальный базовый score. `urgencySignals` — это **бонус**, который может добавить до 15 баллов сверх, поднимая итоговый score максимум до **115** (что обрезается до 100). Это важно для **усиления обнаружения** страниц, которые похожи на фишинг, но не дотягивают до threshold по основным метрикам.

### Почему threshold = 60?

- Для одного метрики: максимум 40 баллов (domain) — **не достигает** 60 → False Positive минимален
- Для двух метрик: 40 + 35 = 75 → **превышает** 60 → уверенное выявление
- Для трёх метрик: 100 → максимальная уверенность

Это означает: расширение сигнализирует о фишинге **только если совпали минимум две метрики**, что снижает количество ложных срабатываний.

### Версионирование

Формат `version` следует **SemVer** (Semantic Versioning):
- **Major** (1.x.x): изменение структуры rules.json (backward-incompatible)
- **Minor** (x.3.x): добавление нового сервиса
- **Patch** (x.x.0): исправление существующих правил


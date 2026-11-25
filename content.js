// =================================================================
// 💾 ТВОЙ ОРИГИНАЛЬНЫЙ КОД НАЧИНАЕТСЯ СЛЕДУЮЩЕЙ СТРОКОЙ (БЕЗ ИЗМЕНЕНИЙ)
// =================================================================


(function() {
    'use strict';

    function getNeonColorFromName(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const neonPalette = [
            '#00f2fe', '#b5179e', '#ff007f', '#ffcc00', 
            '#00ff66', '#9b59b6', '#3498db', '#f1c40f', 
            '#e67e22', '#1abc9c', '#ff3366', '#33ccff'
        ];
        return neonPalette[Math.abs(hash) % neonPalette.length];
    }

    function applyHokageCore() {
        chrome.storage.local.get([
            'custom_bg_url', 
            'blur-toggle', 
            'nick-mode',
            'ui-color', 
            'anim-style'
        ], function (res) {
            if (!res) return;

            const html = document.documentElement;
            if (!html) return;

            html.setAttribute('data-hokage-ready', 'true');
            if (res['blur-toggle']) html.setAttribute('data-hokage-blur', res['blur-toggle']);
            if (res['ui-color']) html.setAttribute('data-hokage-color', res['ui-color']);
            if (res['anim-style']) html.setAttribute('data-hokage-anim', res['anim-style']);

            // 1. Применение кастомного фона
            const pageWrapper = document.querySelector('.p-pageWrapper');
            if (pageWrapper) {
                if (res.custom_bg_url) {
                    pageWrapper.style.backgroundImage = `url('${res.custom_bg_url}')`;
                    pageWrapper.style.backgroundRepeat = 'no-repeat';
                    pageWrapper.style.backgroundSize = 'cover';
                    pageWrapper.style.backgroundPosition = 'center center';
                    pageWrapper.style.backgroundAttachment = 'fixed';
                    document.body.style.background = 'transparent';
                    const mainBody = document.querySelector('.p-body-main');
                    if (mainBody) mainBody.style.background = 'transparent';
                } else {
                    pageWrapper.style.backgroundImage = '';
                }
            }

            // 2. Обработка цветов никнеймов
            const nickMode = res['nick-mode'] || 'random';
            const userSpans = document.querySelectorAll('.username span, .username a, a[data-xf-init="member-tooltip"] span, a[data-xf-init="member-tooltip"]');

            const colorMap = {
                'purpur': '#b5179e',
                'золот': '#ffcc00',
                'мятн': '#00ff66',
                'голуб': '#00f2fe',
                'красн': '#ff3333'
            };

            userSpans.forEach(el => {
                // Пропускаем твой профиль с короной
                if (el.closest('[data-user-id="3018759"]') || (el.href && el.href.includes('3018759/'))) return;

                // Защита админов, лидеров и окрашенных групп от форума
                const hasAdminColor = el.style.color || el.getAttribute('style')?.includes('color');
                const hasGradient = el.getAttribute('style')?.includes('background-image') || el.getAttribute('style')?.includes('clip');
                const isGroupColored = el.classList.contains('username--colored') || el.classList.contains('username--staff') || el.classList.contains('username--admin');

                if (hasAdminColor || hasGradient || isGroupColored) {
                    return;
                }

                const userName = el.innerText ? el.innerText.trim() : '';
                if (!userName) return;

                if (nickMode === 'off') {
                    // Возвращаем стандартные свойства
                    el.style.removeProperty('color');
                    el.style.removeProperty('text-shadow');
                } else if (nickMode === 'random') {
                    // Уникальный неон для каждого обычного игрока
                    const randomNeon = getNeonColorFromName(userName);
                    el.style.setProperty('color', randomNeon, 'important');
                    el.style.setProperty('text-shadow', `0 0 6px ${randomNeon}`, 'important');
                } else {
                    // Выбранный одиночный цвет из меню
                    const targetColor = colorMap[nickMode] || '#00f2fe';
                    el.style.setProperty('color', targetColor, 'important');
                    el.style.setProperty('text-shadow', `0 0 6px ${targetColor}`, 'important');
                }
            });

            // 3. Отступы и адаптивные фиксы
            const styleFix = document.createElement('style');
            styleFix.innerHTML = `
                .node-body, .structItem, .block-body, .message-inner {
                    padding-left: 24px !important;
                    box-sizing: border-box !important;
                }
                .node-icon, .structItem-cell--icon {
                    padding-left: 12px !important;
                }
            `;
            const oldFix = document.getElementById('hokage-final-fix');
            if (oldFix) oldFix.remove();
            styleFix.id = 'hokage-final-fix';
            document.head.appendChild(styleFix);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyHokageCore);
    } else {
        applyHokageCore();
    }

    chrome.storage.onChanged.addListener(function(changes, areaName) {
        if (areaName === 'local') {
            applyHokageCore();
        }
    });
})();
 
(function() {
    'use strict';

    // Функция поиска даты создания темы на странице
    function getTopicCreationTime() {
        // Ищем элемент с датой на форумах XenForo
        const timeElement = document.querySelector('time.u-dt, time[data-time], .p-body-header time');
        if (timeElement) {
            // Если есть точный timestamp в атрибуте
            const timestamp = timeElement.getAttribute('data-time');
            if (timestamp) {
                return parseInt(timestamp, 10) * 1000; // переводим в миллисекунды
            }
            // Иначе парсим из текста datetime
            const datetimeAttr = timeElement.getAttribute('datetime');
            if (datetimeAttr) {
                return new Date(datetimeAttr).getTime();
            }
        }
        return null;
    }

    // Создаем элемент таймера в правом верхнем углу
    function createTimerElement() {
        if (document.getElementById('br-topic-timer')) return;

        const timerHTML = `
            <div id="br-topic-timer" class="br-timer-container">
                <div class="br-timer-icon">⏳</div>
                <div class="br-timer-content">
                    <span class="br-timer-label">ЖИЗНЬ ТЕМЫ (72Ч)</span>
                    <span id="br-timer-display" class="br-timer-clock">Загрузка...</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', timerHTML);
    }

    // Стили для таймера
    function injectStyles() {
        if (document.getElementById('br-timer-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'br-timer-styles';
        style.textContent = `
            .br-timer-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 18px;
                background: rgba(18, 18, 24, 0.75);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                font-family: 'Montserrat', 'Segoe UI', Roboto, sans-serif;
                color: #ffffff;
                user-select: none;
            }
            .br-timer-icon {
                font-size: 1.2rem;
            }
            .br-timer-content {
                display: flex;
                flex-direction: column;
            }
            .br-timer-label {
                font-size: 9px;
                font-weight: 700;
                letter-spacing: 1.5px;
                color: #a0a0b0;
                text-transform: uppercase;
            }
            .br-timer-clock {
                font-size: 15px;
                font-weight: 800;
                letter-spacing: 1px;
                color: #ffffff;
            }
        `;
        document.head.appendChild(style);
    }

    // Основная логика отсчета
    function initTimer() {
        const creationTime = getTopicCreationTime();
        const display = document.getElementById('br-timer-display');
        
        if (!creationTime || !display) {
            if (display) display.textContent = "Дата не найдена";
            return;
        }

        // 72 часа в миллисекундах
        const lifetimeMs = 72 * 60 * 60 * 1000;
        const expirationTime = creationTime + lifetimeMs;

        function update() {
            const now = new Date().getTime();
            const timeLeft = expirationTime - now;

            if (timeLeft <= 0) {
                display.textContent = "00:00:00 (Срок вышел)";
                display.style.color = "#ff4d4d";
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            const pad = (n) => String(n).padStart(2, '0');
            display.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        }

        update();
        setInterval(update, 1000);
    }

    // Запуск после загрузки страницы
    window.addEventListener('DOMContentLoaded', () => {
        injectStyles();
        createTimerElement();
        initTimer();
    });
    
    // На случай если страница уже загружена
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        injectStyles();
        createTimerElement();
        initTimer();
    }
})();

// === ПРИМЕНЕНИЕ НОВЫХ ВИЗУАЛЬНЫХ ФИШЕК (В КОНЕЦ CONTENT.JS) ===
(function() {
  function applyExtraVisuals() {
    chrome.storage.local.get(['glass-alpha', 'custom-cursor'], function(res) {
      if (!res) return;
      const html = document.documentElement;
      if (!html) return;
      html.setAttribute('data-hokage-alpha', res['glass-alpha'] || 'default');
      html.setAttribute('data-hokage-cursor', res['custom-cursor'] || 'off');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyExtraVisuals);
  } else {
    applyExtraVisuals();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && (changes['glass-alpha'] || changes['custom-cursor'])) {
      applyExtraVisuals();
    }
  });
})();

// === ПРИМЕНЕНИЕ РЕЖИМА ДЛЯ ОБЗОРОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function applyReviewMode() {
    chrome.storage.local.get(['review-mode'], function(res) {
      const html = document.documentElement;
      if (html) html.setAttribute('data-hokage-review', (res && res['review-mode']) || 'off');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyReviewMode);
  } else {
    applyReviewMode();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes['review-mode']) {
      applyReviewMode();
    }
  });
})();

// === ПРИМЕНЕНИЕ КОНТРОЛЯ СЕРОСТИ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function applyGrayControl() {
    chrome.storage.local.get(['gray-control'], function(res) {
      const html = document.documentElement;
      if (html) html.setAttribute('data-hokage-gray', (res && res['gray-control']) || 'default');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyGrayControl);
  } else {
    applyGrayControl();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes['gray-control']) {
      applyGrayControl();
    }
  });
})();

// === АВТО-ОЧИСТКА СЕРОГО БЛОКА НАД ПОДВАЛОМ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function fixBottomGrayBlock() {
    chrome.storage.local.get(['gray-control'], function(res) {
      const mode = (res && res['gray-control']) || 'default';
      
      // Ищем блок с текстом "Побольше о проекте?" и поднимаемся к его серому родителю
      const headings = document.querySelectorAll('h3, .block-minorHeader, .block-header');
      headings.forEach(h => {
        if (h.innerText && (h.innerText.includes('Побольше о проекте') || h.innerText.includes('Быстрая навигация'))) {
          let parent = h.parentElement;
          // Поднимаемся на 4 уровня вверх до широкой серой полосы
          for (let i = 0; i < 5; i++) {
            if (!parent || parent === document.body) break;
            if (mode === 'ghost') {
              parent.style.setProperty('background', 'transparent', 'important');
              parent.style.setProperty('background-color', 'transparent', 'important');
              parent.style.setProperty('border', 'none', 'important');
              parent.style.setProperty('box-shadow', 'none', 'important');
            } else if (mode === 'glass') {
              parent.style.setProperty('background', 'rgba(12, 14, 22, 0.35)', 'important');
              parent.style.setProperty('background-color', 'rgba(12, 14, 22, 0.35)', 'important');
              parent.style.setProperty('border-top', '1px solid var(--neon-color, #ff3333)', 'important');
            } else {
              parent.style.removeProperty('background');
              parent.style.removeProperty('background-color');
              parent.style.removeProperty('border');
              parent.style.removeProperty('box-shadow');
            }
            parent = parent.parentElement;
          }
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixBottomGrayBlock);
  } else {
    fixBottomGrayBlock();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes['gray-control']) {
      fixBottomGrayBlock();
    }
  });
})();

// === КРАСИВОЕ ВЫРАВНИВАНИЕ ТРЁХ НИЖНИХ КАРТОЧЕК (В КОНЕЦ CONTENT.JS) ===
(function() {
  function beautifyBottomCards() {
    chrome.storage.local.get(['gray-control'], function(res) {
      const mode = (res && res['gray-control']) || 'default';
      if (mode === 'default') return;

      const headings = document.querySelectorAll('h3, .block-minorHeader, .block-header');
      let cards = [];

      headings.forEach(h => {
        const txt = h.innerText || '';
        if (txt.includes('Побольше о проекте') || txt.includes('Быстрая навигация') || txt.includes('Меню пользователя')) {
          // Находим саму карточку (обычно это 2-й или 3-й родитель от заголовка)
          const card = h.closest('.block-container') || h.parentElement?.parentElement;
          if (card && !cards.includes(card)) {
            cards.push(card);
          }
        }
      });

      if (cards.length > 0) {
        // Выравниваем общий контейнер в ровный ряд одинаковой высоты
        const rowContainer = cards[0].parentElement;
        if (rowContainer) {
          rowContainer.style.setProperty('display', 'flex', 'important');
          rowContainer.style.setProperty('align-items', 'stretch', 'important');
          rowContainer.style.setProperty('gap', '16px', 'important');
        }

        cards.forEach(card => {
          card.style.setProperty('flex', '1', 'important');
          card.style.setProperty('display', 'flex', 'important');
          card.style.setProperty('flex-direction', 'column', 'important');
          card.style.setProperty('background', 'rgba(12, 14, 22, 0.45)', 'important');
          card.style.setProperty('backdrop-filter', 'blur(8px)', 'important');
          card.style.setProperty('border', '1px solid var(--neon-color, #ff3333)', 'important');
          card.style.setProperty('border-radius', '12px', 'important');
          card.style.setProperty('padding', '14px', 'important');
          card.style.setProperty('margin', '0', 'important');

          // Убираем все кривые внутренние рамки внутри каждой из 3 карточек
          const innerBlocks = card.querySelectorAll('div, ul, li, p');
          innerBlocks.forEach(el => {
            el.style.setProperty('border', 'none', 'important');
            el.style.setProperty('box-shadow', 'none', 'important');
            el.style.setProperty('background', 'transparent', 'important');
          });
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', beautifyBottomCards);
  } else {
    beautifyBottomCards();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes['gray-control']) {
      beautifyBottomCards();
    }
  });
})();

// === ПРИМЕНЕНИЕ СТИЛЯ ЗАГОЛОВКА ТЕМЫ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function applyTitleStyle() {
    chrome.storage.local.get(['title-style'], function(res) {
      const html = document.documentElement;
      if (html) html.setAttribute('data-hokage-title', (res && res['title-style']) || 'default');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTitleStyle);
  } else {
    applyTitleStyle();
  }

  chrome.storage.onChanged.addListener(function(changes, areaName) {
    if (areaName === 'local' && changes['title-style']) {
      applyTitleStyle();
    }
  });
})();

// === ЗАЩИТА ЭМОДЗИ В ЗАГОЛОВКЕ ОТ ПЕРЕКРАШИВАНИЯ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function fixTitleEmojis() {
    const titleEl = document.querySelector('.p-title-value');
    if (!titleEl || titleEl.dataset.emojiFixed) return;
    titleEl.dataset.emojiFixed = 'true';

    // Проходим по текстовым узлам внутри заголовка и оборачиваем эмодзи в span
    const walker = document.createTreeWalker(titleEl, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      if (!node.parentElement.closest('.label')) {
        textNodes.push(node);
      }
    }

    const emojiRegex = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)/gu;
    textNodes.forEach(tNode => {
      if (emojiRegex.test(tNode.nodeValue)) {
        const span = document.createElement('span');
        span.innerHTML = tNode.nodeValue.replace(emojiRegex, '<span class="hokage-emoji">$1</span>');
        tNode.replaceWith(...span.childNodes);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixTitleEmojis);
  } else {
    fixTitleEmojis();
  }
})();

// === ИЗОЛЯЦИЯ ТЕКСТА ЗАГОЛОВКА ОТ СМАЙЛИКОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function splitTitleTextAndEmojis() {
    const titleEl = document.querySelector('.p-title-value');
    if (!titleEl || titleEl.dataset.hokageSplit === 'done') return;
    titleEl.dataset.hokageSplit = 'done';

    const walker = document.createTreeWalker(titleEl, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while (n = walker.nextNode()) {
      if (!n.parentElement.closest('.label, [class*="label"]')) {
        nodes.push(n);
      }
    }

    const emojiRegex = /([\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}](?:\uFE0F|\u200D[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])?)/gu;

    nodes.forEach(textNode => {
      const parts = textNode.nodeValue.split(emojiRegex);
      if (parts.length > 1) {
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (!part) return;
          if (emojiRegex.test(part)) {
            const em = document.createElement('span');
            em.className = 'hokage-clean-emoji';
            em.textContent = part;
            frag.appendChild(em);
          } else {
            const txt = document.createElement('span');
            txt.className = 'hokage-gradient-text';
            txt.textContent = part;
            frag.appendChild(txt);
          }
        });
        textNode.replaceWith(frag);
      } else if (textNode.nodeValue.trim().length > 0) {
        const txt = document.createElement('span');
        txt.className = 'hokage-gradient-text';
        txt.textContent = textNode.nodeValue;
        textNode.replaceWith(txt);
      }
    });
  }

  setTimeout(splitTitleTextAndEmojis, 150);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', splitTitleTextAndEmojis);
  } else {
    splitTitleTextAndEmojis();
  }
})();

// === ВОЗВРАТ БАННЕРОВ ПРОФИЛЕЙ У ВСЕХ ПОЛЬЗОВАТЕЛЕЙ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function restoreProfileBanners() {
    const banners = document.querySelectorAll('.memberTooltip-header[style*="background-image"], .memberHeader-main[style*="background-image"], [class*="Banner"][style*="background-image"]');
    banners.forEach(el => {
      const inlineStyle = el.getAttribute('style') || '';
      const match = inlineStyle.match(/background-image\s*:\s*(url\([^)]+\))/i);
      if (match && match[1]) {
        el.style.setProperty('background-image', match[1], 'important');
        el.style.setProperty('background-size', 'cover', 'important');
        el.style.setProperty('background-position', 'center center', 'important');
      }
    });
  }

  // Следим за появлением всплывающих карточек при наведении на любого игрока
  const observer = new MutationObserver(restoreProfileBanners);
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  restoreProfileBanners();
})();

// === ДВИЖОК РЕАЛИСТИЧНОЙ АТМОСФЕРЫ И СУГРОБОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, raf, timer, mode = 'off', items = new Array(), splashes = new Array(), banks = new Array();
  let m = { x: -999, y: -999, vx: 0, vy: 0, lx: -999, ly: -999 };

  const neon = () => getComputedStyle(document.documentElement).getPropertyValue('--neon-color').trim() || '#00f2fe';

  function init() {
    if (cv) return;
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '99999' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; scan(); } };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scan, { passive: true });
    resize();
  }

  function scan() {
    if (mode !== 'snow-real' && mode !== 'rain-real') return;
    const els = document.querySelectorAll('.structItem-title a, .node-title a, .p-title-value, .block-header');
    const next = new Array();
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 30 && r.height > 5 && r.top > 35 && r.top < window.innerHeight - 10) {
        let b = banks.find(x => x.el === el);
        const cols = Math.ceil(r.width / 4);
        if (!b || b.h.length !== cols) b = { el, l: r.left, t: r.top, w: r.width, h: new Array(cols).fill(0) };
        else { b.l = r.left; b.t = r.top; b.w = r.width; }
        next.push(b);
      }
    });
    banks = next;
  }

  window.addEventListener('mousemove', e => {
    if (mode === 'off') return;
    m.vx = e.clientX - m.lx; m.vy = e.clientY - m.ly;
    m.x = m.lx = e.clientX; m.y = m.ly = e.clientY;
  }, { passive: true });

  function loop() {
    if (!ctx || !cv || mode === 'off') return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const col = neon();

    // 1. Сугробы для реалистичного снега (мягко сдуваются при движении курсора)
    if (mode === 'snow-real') {
      banks.forEach(b => {
        if (Math.abs(m.y - b.t) < 42 && m.x >= b.l - 35 && m.x <= b.l + b.w + 35) {
          const c = Math.floor((m.x - b.l) / 4);
          for (let i = c - 14; i <= c + 14; i++) {
            if (i >= 0 && i < b.h.length && b.h.at(i) > 0.3) {
              const cur = b.h.at(i);
              const blow = cur * (1 - Math.abs(i - c) / 14) * 0.38;
              b.h.splice(i, 1, Math.max(0, cur - blow));
              if (Math.random() < 0.3) {
                items.push({ x: b.l + i * 4, y: b.t - cur, z: 0.8, vy: -1.8 - Math.random(), vx: m.vx * 0.25 + (Math.random() - 0.5) * 3.5, a: 0, sp: 0.04, tmp: true });
              }
            }
          }
        }
        // Сглаживание профиля сугроба для естественных плавных горок
        for (let i = 1; i < b.h.length - 1; i++) b.h.splice(i, 1, (b.h.at(i - 1) + b.h.at(i) * 2 + b.h.at(i + 1)) / 4);
        if (b.h.some(v => v > 0.3)) {
          ctx.save(); ctx.beginPath(); ctx.moveTo(b.l, b.t + 1);
          b.h.forEach((v, i) => ctx.lineTo(b.l + i * 4, b.t - v));
          ctx.lineTo(b.l + b.w, b.t + 1); ctx.closePath();
          const g = ctx.createLinearGradient(0, b.t - 10, 0, b.t + 2);
          g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(180,225,255,0.75)');
          ctx.fillStyle = g; ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(200,240,255,0.6)'; ctx.fill(); ctx.restore();
        }
      });
    }

    // 2. Брызги от капель дождя на темах
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes.at(i);
      s.x += s.vx; s.y += s.vy; s.vy += 0.25; s.life -= 0.06;
      if (s.life <= 0) { splashes.splice(i, 1); continue; }
      ctx.save(); ctx.globalAlpha = s.life * 0.7; ctx.fillStyle = '#d6ecff';
      ctx.beginPath(); ctx.arc(s.x, s.y, 1.1, 0, 6.28); ctx.fill(); ctx.restore();
    }

    // 3. Отрисовка частиц
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items.at(i);
      p.a += p.sp;

      if (mode === 'rain-real' || mode === 'stars') { p.x += p.vx; p.y += p.vy; }
      else if (mode === 'bokeh') { p.x += Math.cos(p.a) * 0.4 + p.vx; p.y += Math.sin(p.a * 0.8) * 0.3 - 0.3; }
      else { p.x += p.vx + Math.sin(p.a) * (0.4 + p.z * 0.5); p.y += p.vy; }

      // Реакция снега и светлячков на движение мышки
      if (mode === 'snow-real' || mode === 'bokeh') {
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
        if (d < 85) { const f = (85 - d) / 85; p.vx += (dx / (d || 1)) * f * 0.9 + m.vx * 0.05; p.vy += (dy / (d || 1)) * f * 0.6; }
        p.vx *= 0.96;
        if (mode === 'snow-real' && p.vy < 0.7 + p.z * 1.4) p.vy += 0.04;
      }

      // Столкновение с темами (оседание снега или брызги дождя)
      let hit = false;
      if ((mode === 'snow-real' || mode === 'rain-real') && p.vy > 0 && !p.tmp) {
        for (const b of banks) {
          if (p.x >= b.l && p.x <= b.l + b.w && Math.abs(p.y - b.t) < 5) {
            if (mode === 'snow-real') {
              const idx = Math.floor((p.x - b.l) / 4);
              if (idx >= 0 && idx < b.h.length && b.h.at(idx) < 9) {
                b.h.splice(idx, 1, b.h.at(idx) + (0.3 + p.z * 0.4));
                hit = true;
              }
            } else if (mode === 'rain-real' && Math.random() < 0.35) {
              splashes.push({ x: p.x, y: b.t, vx: (Math.random() - 0.5) * 2.5, vy: -Math.random() * 2 - 1, life: 1 });
              hit = true;
            }
            break;
          }
        }
      }

      if (hit || p.y > cv.height + 25 || (mode === 'bokeh' && p.y < -40)) {
        if (p.tmp) { items.splice(i, 1); continue; }
        p.y = mode === 'bokeh' ? cv.height + 30 : -15;
        p.x = Math.random() * (cv.width + 120) - 60;
        if (mode === 'snow-real') { p.vx = (Math.random() - 0.5) * 0.5; p.vy = 0.7 + p.z * 1.4; }
      }

      ctx.save();
      if (mode === 'snow-real') {
        const r = 1.2 + p.z * 2.4;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `rgba(255,255,255,${0.5 + p.z * 0.45})`);
        g.addColorStop(1, 'rgba(220,240,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.28); ctx.fill();
      } else if (mode === 'rain-real') {
        ctx.globalAlpha = 0.25 + p.z * 0.25; ctx.strokeStyle = '#cce6ff'; ctx.lineWidth = 0.8 + p.z * 0.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 1.2, p.y + 10 + p.z * 10); ctx.stroke();
      } else if (mode === 'bokeh') {
        const r = 8 + p.z * 18;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, col); g.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.15 + p.z * 0.2; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.28); ctx.fill();
      } else if (mode === 'sakura') {
        ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.scale(1, Math.sin(p.a * 1.5));
        ctx.globalAlpha = 0.65; ctx.fillStyle = '#ff99c2';
        ctx.beginPath(); ctx.ellipse(0, 0, 5 + p.z * 3, 3 + p.z * 1.5, 0, 0, 6.28); ctx.fill();
      } else if (mode === 'stars') {
        const g = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 8, p.y - p.vy * 8);
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8); ctx.stroke();
      }
      ctx.restore();
    }
    m.vx *= 0.8; m.vy *= 0.8;
    raf = requestAnimationFrame(loop);
  }

  function start(next) {
    mode = next || 'off';
    cancelAnimationFrame(raf); clearInterval(timer);
    if (mode === 'off') { if (cv) { cv.remove(); cv = ctx = null; } banks = new Array(); splashes = new Array(); return; }
    init(); scan();
    const cnt = mode === 'snow-real' ? 140 : (mode === 'rain-real' ? 110 : (mode === 'stars' ? 12 : (mode === 'bokeh' ? 35 : 55)));
    items = Array.from({ length: cnt }, () => {
      const z = Math.random();
      return {
        x: Math.random() * (window.innerWidth + 120) - 60, y: Math.random() * window.innerHeight, z,
        vy: mode === 'rain-real' ? (9 + z * 7) : (mode === 'stars' ? (7 + z * 5) : (0.7 + z * 1.4)),
        vx: mode === 'rain-real' ? -1.2 : (mode === 'stars' ? -4.5 : (Math.random() - 0.5) * 0.5),
        a: Math.random() * 6.28, sp: (Math.random() - 0.5) * 0.04
      };
    });
    if (mode === 'snow-real' || mode === 'rain-real') timer = setInterval(scan, 900);
    loop();
  }

  const load = () => chrome.storage.local.get(['weather-effect'], r => start(r?.['weather-effect'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) start(c['weather-effect'].newValue); });
})();

// === ДВИЖОК КИНЕМАТОГРАФИЧНЫХ ЭФФЕКТОВ: ГРОЗА, УГОЛЬКИ, ЛИСТОПАД, СИЯНИЕ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, raf, mode = 'off', items = new Array(), bolt = null, flash = 0, tick = 0;
  let m = { x: -999, y: -999, vx: 0, vy: 0, lx: -999, ly: -999 };

  const activeModes = new Array('storm', 'embers', 'leaves', 'aurora');

  function init() {
    if (cv) return;
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '99998' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; } };
    window.addEventListener('resize', resize);
    resize();
  }

  window.addEventListener('mousemove', e => {
    if (!activeModes.includes(mode)) return;
    m.vx = e.clientX - m.lx; m.vy = e.clientY - m.ly;
    m.x = m.lx = e.clientX; m.y = m.ly = e.clientY;
  }, { passive: true });

  function makeBolt() {
    const pts = new Array();
    let x = Math.random() * cv.width * 0.8 + cv.width * 0.1, y = 0;
    pts.push({ x, y });
    while (y < cv.height * 0.65) {
      x += (Math.random() - 0.5) * 55;
      y += Math.random() * 35 + 15;
      pts.push({ x, y });
    }
    bolt = { pts, alpha: 1 };
    flash = 0.28;
  }

  function loop() {
    if (!ctx || !cv || !activeModes.includes(mode)) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    tick += 0.015;

    // 1. СЕВЕРНОЕ СИЯНИЕ
    if (mode === 'aurora') {
      const shift = (m.x > 0 ? (m.x / cv.width - 0.5) * 80 : 0);
      for (let layer = 0; layer < 3; layer++) {
        ctx.save();
        const g = ctx.createLinearGradient(0, 0, cv.width, cv.height * 0.45);
        if (layer === 0) { g.addColorStop(0, 'rgba(0, 255, 170, 0.16)'); g.addColorStop(0.5, 'rgba(0, 200, 255, 0.14)'); g.addColorStop(1, 'rgba(160, 50, 255, 0.12)'); }
        else if (layer === 1) { g.addColorStop(0, 'rgba(130, 60, 255, 0.12)'); g.addColorStop(0.6, 'rgba(0, 255, 130, 0.15)'); g.addColorStop(1, 'transparent'); }
        else { g.addColorStop(0, 'rgba(0, 240, 255, 0.1)'); g.addColorStop(1, 'rgba(255, 0, 140, 0.08)'); }

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let x = 0; x <= cv.width; x += 40) {
          const wave = Math.sin(x * 0.004 + tick + layer * 1.5) * 45 + Math.cos(x * 0.009 - tick * 0.8) * 25;
          ctx.lineTo(x, 140 + layer * 45 + wave + shift * 0.3);
        }
        ctx.lineTo(cv.width, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // 2. ГРОЗА И МОЛНИИ
    if (mode === 'storm') {
      if (Math.random() < 0.006 && !bolt) makeBolt();
      if (flash > 0) {
        ctx.fillStyle = `rgba(210, 230, 255, ${flash})`;
        ctx.fillRect(0, 0, cv.width, cv.height);
        flash -= 0.03;
      }
      if (bolt) {
        ctx.save();
        ctx.strokeStyle = `rgba(235, 245, 255, ${bolt.alpha})`;
        ctx.lineWidth = 2.2;
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#80caff';
        ctx.beginPath();
        bolt.pts.forEach((pt, idx) => idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
        ctx.restore();
        bolt.alpha -= 0.07;
        if (bolt.alpha <= 0) bolt = null;
      }
    }

    // 3. ЧАСТИЦЫ (ЛИВЕНЬ / ИСКРЫ КОСТРА / ОСЕННИЕ ЛИСТЬЯ)
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items.at(i);
      p.a += p.sp;

      if (mode === 'storm') {
        p.x += p.vx; p.y += p.vy;
        if (p.y > cv.height + 20) { p.y = -20; p.x = Math.random() * (cv.width + 200) - 50; }
        ctx.save();
        ctx.globalAlpha = 0.35 + p.z * 0.3;
        ctx.strokeStyle = '#b8dcff';
        ctx.lineWidth = 1 + p.z * 0.7;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 1.4, p.y + 18 + p.z * 14); ctx.stroke();
        ctx.restore();
      } else if (mode === 'embers') {
        p.x += p.vx + Math.sin(p.a) * 0.9;
        p.y -= p.vy;
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
        if (d < 95) { const f = (95 - d) / 95; p.vx += (dx / (d || 1)) * f * 1.2 + m.vx * 0.06; p.vy += f * 0.5; }
        p.vx *= 0.95;
        if (p.y < -20) { p.y = cv.height + 20; p.x = Math.random() * cv.width; p.vy = 1.2 + p.z * 2.2; }

        ctx.save();
        const r = 1.5 + p.z * 2.8;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
        g.addColorStop(0, '#fff3b0');
        g.addColorStop(0.4, '#ff6d00');
        g.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.5 + Math.sin(p.a * 2) * 0.35;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, 6.28); ctx.fill();
        ctx.restore();
      } else if (mode === 'leaves') {
        p.x += p.vx + Math.sin(p.a) * 1.3;
        p.y += p.vy;
        const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
        if (d < 90) { const f = (90 - d) / 90; p.vx += (dx / (d || 1)) * f * 1.1 + m.vx * 0.06; p.vy -= f * 0.6; }
        p.vx *= 0.96; if (p.vy < 0.8 + p.z) p.vy += 0.03;
        if (p.y > cv.height + 25) { p.y = -25; p.x = Math.random() * cv.width; }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.a);
        ctx.scale(1, Math.cos(p.a * 1.4));
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = p.col;
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(255, 100, 0, 0.3)';
        const s = 6 + p.z * 5;
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.quadraticCurveTo(s, -s * 0.3, 0, s);
        ctx.quadraticCurveTo(-s, -s * 0.3, 0, -s);
        ctx.fill();
        ctx.restore();
      }
    }

    m.vx *= 0.8; m.vy *= 0.8;
    raf = requestAnimationFrame(loop);
  }

  function start(next) {
    mode = next || 'off';
    cancelAnimationFrame(raf);
    if (!activeModes.includes(mode)) {
      if (cv) { cv.remove(); cv = ctx = null; }
      items = new Array(); bolt = null;
      return;
    }
    init();
    const leafCols = new Array('#ff6d00', '#ff9e00', '#e63946', '#d97706');
    const cnt = mode === 'storm' ? 160 : (mode === 'embers' ? 85 : (mode === 'leaves' ? 45 : 0));
    items = Array.from({ length: cnt }, () => {
      const z = Math.random();
      return {
        x: Math.random() * (window.innerWidth + 160) - 80,
        y: Math.random() * window.innerHeight, z,
        vy: mode === 'storm' ? (14 + z * 8) : (mode === 'embers' ? (1.2 + z * 2.2) : (0.8 + z * 1.2)),
        vx: mode === 'storm' ? -3.5 : (Math.random() - 0.5) * 0.8,
        a: Math.random() * 6.28, sp: (Math.random() - 0.5) * 0.04,
        col: leafCols.at(Math.floor(Math.random() * 4))
      };
    });
    loop();
  }

  const load = () => chrome.storage.local.get(['weather-effect'], r => start(r?.['weather-effect'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', load) : load();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) start(c['weather-effect'].newValue); });
})();

// === ФИКС МЕРЦАНИЯ СУГРОБОВ (АВТОНОМНЫЙ ПАТЧ В КОНЕЦ CONTENT.JS) ===
(function() {
  let fixCv, fixCtx, fixRaf, fixTimer, isFixOn = false, snow = new Array(), drifts = new Array();
  let cursor = { x: -999, y: -999, vx: 0, lx: -999 };

  function startFix() {
    if (fixCv) return;
    fixCv = document.createElement('canvas');
    Object.assign(fixCv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100000' });
    document.body.appendChild(fixCv);
    fixCtx = fixCv.getContext('2d');
    const onResize = () => { if (fixCv) { fixCv.width = window.innerWidth; fixCv.height = window.innerHeight; updateDrifts(); } };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', updateDrifts, { passive: true });
    onResize();
  }

  function updateDrifts() {
    if (!isFixOn) return;
    const targets = document.querySelectorAll('.structItem-title a, .node-title a, .p-title-value, .block-header');
    const updated = new Array();
    targets.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 30 && r.height > 5 && r.top > 35 && r.top < window.innerHeight - 10) {
        let d = drifts.find(item => item.el === el);
        const cols = Math.ceil(r.width / 4);
        if (!d || d.h.length !== cols) d = { el, l: r.left, t: r.top, w: r.width, h: new Array(cols).fill(0) };
        else { d.l = r.left; d.t = r.top; d.w = r.width; }
        updated.push(d);
      }
    });
    drifts = updated;
  }

  window.addEventListener('mousemove', e => {
    if (!isFixOn) return;
    cursor.vx = e.clientX - cursor.lx;
    cursor.x = cursor.lx = e.clientX;
    cursor.y = e.clientY;
  }, { passive: true });

  function renderFix() {
    if (!fixCtx || !fixCv || !isFixOn) return;
    fixCtx.clearRect(0, 0, fixCv.width, fixCv.height);

    // Прячем старый мигающий холст, если он есть
    document.querySelectorAll('canvas').forEach(c => {
      if (c !== fixCv && c.style.zIndex === '99999') c.style.display = 'none';
    });

    drifts.forEach(d => {
      if (Math.abs(cursor.y - d.t) < 42 && cursor.x >= d.l - 35 && cursor.x <= d.l + d.w + 35) {
        const c = Math.floor((cursor.x - d.l) / 4);
        for (let i = c - 14; i <= c + 14; i++) {
          if (i >= 0 && i < d.h.length && d.h.at(i) > 0.3) {
            const cur = d.h.at(i);
            const blow = cur * (1 - Math.abs(i - c) / 14) * 0.38;
            d.h.splice(i, 1, Math.max(0, cur - blow));
            if (Math.random() < 0.3) {
              snow.push({ x: d.l + i * 4, y: d.t - cur, z: 0.8, vy: -1.8, vx: cursor.vx * 0.25 + (Math.random() - 0.5) * 3.5, a: 0, tmp: true });
            }
          }
        }
      }

      for (let i = 1; i < d.h.length - 1; i++) d.h.splice(i, 1, (d.h.at(i - 1) + d.h.at(i) * 2 + d.h.at(i + 1)) / 4);

      const peak = Math.max.apply(null, d.h);
      if (peak > 1.3) {
        fixCtx.save();
        fixCtx.globalAlpha = Math.min(1, (peak - 1.3) / 2.5);
        fixCtx.beginPath();
        fixCtx.moveTo(d.l, d.t + 1);
        d.h.forEach((v, i) => fixCtx.lineTo(d.l + i * 4, d.t - Math.max(0, v - 0.9)));
        fixCtx.lineTo(d.l + d.w, d.t + 1);
        fixCtx.closePath();
        const g = fixCtx.createLinearGradient(0, d.t - 10, 0, d.t + 2);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(1, 'rgba(180,225,255,0.75)');
        fixCtx.fillStyle = g;
        fixCtx.fill();
        fixCtx.restore();
      }
    });

    for (let i = snow.length - 1; i >= 0; i--) {
      const p = snow.at(i);
      p.a += 0.03;
      p.x += p.vx + Math.sin(p.a) * (0.4 + p.z * 0.5);
      p.y += p.vy;
      p.vx *= 0.96;
      if (p.vy < 0.7 + p.z * 1.4) p.vy += 0.04;

      let landed = false;
      if (p.vy > 0 && !p.tmp) {
        for (const d of drifts) {
          if (p.x >= d.l && p.x <= d.l + d.w && Math.abs(p.y - d.t) < 5) {
            const idx = Math.floor((p.x - d.l) / 4);
            if (idx >= 0 && idx < d.h.length && d.h.at(idx) < 9) {
              d.h.splice(idx, 1, d.h.at(idx) + (0.35 + p.z * 0.4));
              landed = true;
            }
            break;
          }
        }
      }

      if (landed || p.y > fixCv.height + 20) {
        if (p.tmp) { snow.splice(i, 1); continue; }
        p.y = -15; p.x = Math.random() * fixCv.width;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = 0.7 + p.z * 1.4;
      }

      const r = 1.2 + p.z * 2.4;
      const g = fixCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.5 + p.z * 0.45})`);
      g.addColorStop(1, 'rgba(220,240,255,0)');
      fixCtx.fillStyle = g;
      fixCtx.beginPath();
      fixCtx.arc(p.x, p.y, r, 0, 6.28);
      fixCtx.fill();
    }

    cursor.vx *= 0.8;
    fixRaf = requestAnimationFrame(renderFix);
  }

  function toggleFix(val) {
    isFixOn = (val === 'snow-real');
    cancelAnimationFrame(fixRaf);
    clearInterval(fixTimer);
    if (!isFixOn) {
      if (fixCv) { fixCv.remove(); fixCv = fixCtx = null; }
      drifts = new Array();
      document.querySelectorAll('canvas').forEach(c => { if (c.style.zIndex === '99999') c.style.display = ''; });
      return;
    }
    startFix();
    updateDrifts();
    snow = Array.from({ length: 140 }, () => {
      const z = Math.random();
      return { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, z, vy: 0.7 + z * 1.4, vx: (Math.random() - 0.5) * 0.5, a: Math.random() * 6.28 };
    });
    fixTimer = setInterval(updateDrifts, 900);
    renderFix();
  }

  const check = () => chrome.storage.local.get(['weather-effect'], r => toggleFix(r?.['weather-effect'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) toggleFix(c['weather-effect'].newValue); });
})();

// === ФИНАЛЬНЫЙ ПАТЧ СНЕГА: БЫСТРЫЕ СУГРОБЫ БЕЗ МИГАНИЯ + РАЗЛЁТ СНЕЖИНОК ОТ КУРСОРА ===
(function() {
  let cv, ctx, raf, timer, on = false, snow = new Array(), drifts = new Array();
  let cur = { x: -999, y: -999, vx: 0, vy: 0, lx: -999, ly: -999 };

  function init() {
    if (cv) return;
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100001' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; scan(); } };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scan, { passive: true });
    resize();
  }

  function scan() {
    if (!on) return;
    const els = document.querySelectorAll('.structItem-title a, .node-title a, .p-title-value, .block-header');
    const next = new Array();
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 30 && r.height > 5 && r.top > 35 && r.top < window.innerHeight - 10) {
        let d = drifts.find(item => item.el === el);
        const cols = Math.ceil(r.width / 4);
        if (!d || d.h.length !== cols) d = { el, l: r.left, t: r.top, w: r.width, h: new Array(cols).fill(0) };
        else { d.l = r.left; d.t = r.top; d.w = r.width; }
        next.push(d);
      }
    });
    drifts = next;
  }

  window.addEventListener('mousemove', e => {
    if (!on) return;
    cur.vx = e.clientX - cur.lx; cur.vy = e.clientY - cur.ly;
    cur.x = cur.lx = e.clientX; cur.y = cur.ly = e.clientY;
  }, { passive: true });

  function render() {
    if (!ctx || !cv || !on) return;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Прячем старые снежные слои
    document.querySelectorAll('canvas').forEach(c => {
      if (c !== cv && (c.style.zIndex === '99999' || c.style.zIndex === '100000')) c.style.display = 'none';
    });

    // 1. Сугробы на темах (накапливаются быстро и плавно без мерцания)
    drifts.forEach(d => {
      if (Math.abs(cur.y - d.t) < 45 && cur.x >= d.l - 35 && cur.x <= d.l + d.w + 35) {
        const c = Math.floor((cur.x - d.l) / 4);
        for (let i = c - 14; i <= c + 14; i++) {
          if (i >= 0 && i < d.h.length && d.h.at(i) > 0.2) {
            const val = d.h.at(i);
            const blow = val * (1 - Math.abs(i - c) / 14) * 0.42;
            d.h.splice(i, 1, Math.max(0, val - blow));
            if (Math.random() < 0.35) {
              snow.push({ x: d.l + i * 4, y: d.t - val, z: 0.85, vy: -2 - Math.random(), vx: cur.vx * 0.25 + (Math.random() - 0.5) * 4, a: 0, tmp: true });
            }
          }
        }
      }

      for (let i = 1; i < d.h.length - 1; i++) d.h.splice(i, 1, (d.h.at(i - 1) + d.h.at(i) * 2 + d.h.at(i + 1)) / 4);

      const peak = Math.max.apply(null, d.h);
      if (peak > 0.65) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, (peak - 0.65) / 1.5);
        ctx.beginPath();
        ctx.moveTo(d.l, d.t + 1);
        d.h.forEach((v, i) => ctx.lineTo(d.l + i * 4, d.t - Math.max(0, v - 0.45)));
        ctx.lineTo(d.l + d.w, d.t + 1);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, d.t - 10, 0, d.t + 2);
        g.addColorStop(0, 'rgba(255,255,255,0.96)');
        g.addColorStop(1, 'rgba(180,225,255,0.78)');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
      }
    });

    // 2. Падающие снежинки (разлетаются от движения курсора в воздухе)
    for (let i = snow.length - 1; i >= 0; i--) {
      const p = snow.at(i);
      p.a += 0.03;
      p.x += p.vx + Math.sin(p.a) * (0.4 + p.z * 0.5);
      p.y += p.vy;

      // Отталкивание снежинок от курсора в воздухе
      const dx = p.x - cur.x, dy = p.y - cur.y, dist = Math.hypot(dx, dy);
      if (dist < 90) {
        const force = (90 - dist) / 90;
        p.vx += (dx / (dist || 1)) * force * 1.1 + cur.vx * 0.06;
        p.vy += (dy / (dist || 1)) * force * 0.7 + cur.vy * 0.04;
      }

      p.vx *= 0.95;
      if (p.vy < 0.8 + p.z * 1.4) p.vy += 0.04;

      let landed = false;
      if (p.vy > 0 && !p.tmp) {
        for (const d of drifts) {
          if (p.x >= d.l && p.x <= d.l + d.w && Math.abs(p.y - d.t) < 5) {
            const idx = Math.floor((p.x - d.l) / 4);
            if (idx >= 0 && idx < d.h.length && d.h.at(idx) < 10) {
              const add = 0.75 + p.z * 0.7;
              d.h.splice(idx, 1, d.h.at(idx) + add);
              if (idx > 0) d.h.splice(idx - 1, 1, d.h.at(idx - 1) + add * 0.5);
              if (idx < d.h.length - 1) d.h.splice(idx + 1, 1, d.h.at(idx + 1) + add * 0.5);
              landed = true;
            }
            break;
          }
        }
      }

      if (landed || p.y > cv.height + 20) {
        if (p.tmp) { snow.splice(i, 1); continue; }
        p.y = -15; p.x = Math.random() * cv.width;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = 0.8 + p.z * 1.4;
      }

      const r = 1.3 + p.z * 2.4;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.55 + p.z * 0.45})`);
      g.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 6.28);
      ctx.fill();
    }

    cur.vx *= 0.8; cur.vy *= 0.8;
    raf = requestAnimationFrame(render);
  }

  function toggle(val) {
    on = (val === 'snow-real');
    cancelAnimationFrame(raf);
    clearInterval(timer);
    if (!on) {
      if (cv) { cv.remove(); cv = ctx = null; }
      drifts = new Array();
      document.querySelectorAll('canvas').forEach(c => {
        if (c.style.zIndex === '99999' || c.style.zIndex === '100000') c.style.display = '';
      });
      return;
    }
    init(); scan();
    snow = Array.from({ length: 165 }, () => {
      const z = Math.random();
      return { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, z, vy: 0.8 + z * 1.4, vx: (Math.random() - 0.5) * 0.5, a: Math.random() * 6.28 };
    });
    timer = setInterval(scan, 850);
    render();
  }

  const check = () => chrome.storage.local.get(['weather-effect'], r => toggle(r?.['weather-effect'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) toggle(c['weather-effect'].newValue); });
})();

// === УЛЬТРА-ПЛАВНЫЙ СНЕГ 144 FPS БЕЗ МЕРЦАНИЯ И С ОТСВЕЧИВАНИЕМ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, sprite, raf, timer, on = false, snow = new Array(), drifts = new Array();
  let cur = { x: -999, y: -999, vx: 0, vy: 0, lx: -999, ly: -999 };

  // Создаём единый лёгкий спрайт снежинки в памяти (не грузит видеокарту и процессор)
  function buildSprite() {
    if (sprite) return;
    sprite = document.createElement('canvas');
    sprite.width = 16; sprite.height = 16;
    const sCtx = sprite.getContext('2d');
    const g = sCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.5, 'rgba(225, 245, 255, 0.7)');
    g.addColorStop(1, 'rgba(200, 235, 255, 0)');
    sCtx.fillStyle = g;
    sCtx.fillRect(0, 0, 16, 16);
  }

  function init() {
    if (cv) return;
    buildSprite();
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100002' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; scan(); } };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scan, { passive: true });
    resize();
  }

  function scan() {
    if (!on) return;
    const els = document.querySelectorAll('.structItem-title a, .node-title a, .p-title-value, .block-header');
    const next = new Array();
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 30 && r.height > 5 && r.top > 35 && r.top < window.innerHeight - 10) {
        let d = drifts.find(item => item.el === el);
        const cols = Math.ceil(r.width / 6); // Шаг 6px вместо 4px — в 1.5 раза быстрее FPS
        if (!d || d.h.length !== cols) d = { el, l: r.left, t: r.top, w: r.width, h: new Array(cols).fill(0) };
        else { d.l = r.left; d.t = r.top; d.w = r.width; }
        next.push(d);
      }
    });
    drifts = next;
  }

  window.addEventListener('mousemove', e => {
    if (!on) return;
    cur.vx = e.clientX - cur.lx; cur.vy = e.clientY - cur.ly;
    cur.x = cur.lx = e.clientX; cur.y = cur.ly = e.clientY;
  }, { passive: true });

  function render() {
    if (!ctx || !cv || !on) return;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Прячем все старые снежные слои, чтобы не ели FPS
    document.querySelectorAll('canvas').forEach(c => {
      const z = parseInt(c.style.zIndex || '0', 10);
      if (c !== cv && z >= 99998 && z <= 100001) c.style.display = 'none';
    });

    const neonGlow = getComputedStyle(document.documentElement).getPropertyValue('--neon-color').trim() || '#a8e6ff';

    // 1. Сугробы (без пересглаживания — никакого мерцания + красивое ледяное отсвечивание)
    ctx.save();
    ctx.fillStyle = 'rgba(245, 252, 255, 0.92)';
    ctx.shadowBlur = 10;
    ctx.shadowColor = neonGlow;

    drifts.forEach(d => {
      // Сдувание курсором
      if (Math.abs(cur.y - d.t) < 45 && cur.x >= d.l - 35 && cur.x <= d.l + d.w + 35) {
        const c = Math.floor((cur.x - d.l) / 6);
        for (let i = c - 10; i <= c + 10; i++) {
          if (i >= 0 && i < d.h.length && d.h.at(i) > 0.2) {
            const val = d.h.at(i);
            const blow = val * (1 - Math.abs(i - c) / 10) * 0.4;
            d.h.splice(i, 1, Math.max(0, val - blow));
            if (Math.random() < 0.3 && snow.length < 220) {
              snow.push({ x: d.l + i * 6, y: d.t - val, z: 0.85, vy: -2 - Math.random(), vx: cur.vx * 0.25 + (Math.random() - 0.5) * 4, a: 0, tmp: true });
            }
          }
        }
      }

      // Рисуем только если есть заметный слой снега (плавный порог без скачков)
      let max = 0;
      for (let i = 0; i < d.h.length; i++) if (d.h.at(i) > max) max = d.h.at(i);
      if (max > 0.8) {
        ctx.globalAlpha = Math.min(0.95, (max - 0.8) / 2.0);
        ctx.beginPath();
        ctx.moveTo(d.l, d.t + 1);
        for (let i = 0; i < d.h.length; i++) {
          ctx.lineTo(d.l + i * 6, d.t - Math.max(0, d.h.at(i) - 0.5));
        }
        ctx.lineTo(d.l + d.w, d.t + 1);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.restore();

    // 2. Отрисовка снежинок готовым спрайтом (максимальный FPS)
    for (let i = snow.length - 1; i >= 0; i--) {
      const p = snow.at(i);
      p.a += 0.03;
      p.x += p.vx + Math.sin(p.a) * (0.4 + p.z * 0.5);
      p.y += p.vy;

      const dx = p.x - cur.x, dy = p.y - cur.y, dist = Math.hypot(dx, dy);
      if (dist < 90) {
        const force = (90 - dist) / 90;
        p.vx += (dx / (dist || 1)) * force * 1.1 + cur.vx * 0.06;
        p.vy += (dy / (dist || 1)) * force * 0.7 + cur.vy * 0.04;
      }

      p.vx *= 0.95;
      if (p.vy < 0.8 + p.z * 1.4) p.vy += 0.04;

      let landed = false;
      if (p.vy > 0 && !p.tmp) {
        for (const d of drifts) {
          if (p.x >= d.l && p.x <= d.l + d.w && Math.abs(p.y - d.t) < 5) {
            const idx = Math.floor((p.x - d.l) / 6);
            if (idx >= 0 && idx < d.h.length && d.h.at(idx) < 9) {
              const add = 0.6 + p.z * 0.6;
              d.h.splice(idx, 1, d.h.at(idx) + add);
              if (idx > 0) d.h.splice(idx - 1, 1, d.h.at(idx - 1) + add * 0.6);
              if (idx < d.h.length - 1) d.h.splice(idx + 1, 1, d.h.at(idx + 1) + add * 0.6);
              landed = true;
            }
            break;
          }
        }
      }

      if (landed || p.y > cv.height + 20) {
        if (p.tmp) { snow.splice(i, 1); continue; }
        p.y = -15; p.x = Math.random() * cv.width;
        p.vx = (Math.random() - 0.5) * 0.5; p.vy = 0.8 + p.z * 1.4;
      }

      const sz = 4 + p.z * 6;
      ctx.globalAlpha = 0.55 + p.z * 0.45;
      ctx.drawImage(sprite, p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
    }

    ctx.globalAlpha = 1;
    cur.vx *= 0.8; cur.vy *= 0.8;
    raf = requestAnimationFrame(render);
  }

  function toggle(val) {
    on = (val === 'snow-real');
    cancelAnimationFrame(raf);
    clearInterval(timer);
    if (!on) {
      if (cv) { cv.remove(); cv = ctx = null; }
      drifts = new Array();
      document.querySelectorAll('canvas').forEach(c => {
        const z = parseInt(c.style.zIndex || '0', 10);
        if (z >= 99998 && z <= 100001) c.style.display = '';
      });
      return;
    }
    init(); scan();
    snow = Array.from({ length: 130 }, () => {
      const z = Math.random();
      return { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, z, vy: 0.8 + z * 1.4, vx: (Math.random() - 0.5) * 0.5, a: Math.random() * 6.28 };
    });
    timer = setInterval(scan, 1200);
    render();
  }

  const check = () => chrome.storage.local.get(['weather-effect'], r => toggle(r?.['weather-effect'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) toggle(c['weather-effect'].newValue); });
})();

// === АВТООТВЕТЫ HOKAGE: ЧАСТЬ 1 (БАЗА И КАРКАС) ===
window.hokageTemplates = window.hokageTemplates || new Object();

window.hokageTemplates['🏢 Организации (Одобрено)'] = new Array(
  { title: '✅ Вступление в организацию — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление на вступление проверено и получило статус: [COLOR=rgb(0, 255, 102)]Одобрено[/COLOR].[/SIZE]\n[SIZE=4]Ожидаем вас в здании организации во время собеседования.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '✅ Отчёт на повышение — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваш отчёт на повышение рассмотрен. Все задания выполнены верно.[/SIZE]\n[SIZE=4]Статус отчёта: [COLOR=rgb(0, 255, 102)]Одобрено[/COLOR]. Обратитесь к Лидеру или Заместителю за повышением.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '✅ Перевод в организацию — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление на перевод одобрено. Ждём вас в игре для оформления.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '✅ Восстановление в должности — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление на восстановление одобрено (с потерей одного ранга согласно правилам).[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '✅ Снятие выговора — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша работа на снятие выговора принята. Выговор будет снят.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '✅ Заявка на Старший Состав — Одобрено', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша заявка на пост Старшего Состава допущена до обзвона. Время обзвона будет указано ниже.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено.[/SIZE][/COLOR][/FONT][/B][/CENTER]' }
);

window.hokageTemplates['❌ Организации (Отказано)'] = new Array(
  { title: '❌ Отказ: Не по форме', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: составлено не по форме подачи.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '❌ Отказ: Нет /time на скриншотах', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: отсутствует /time на доказательствах.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '❌ Отказ: Скриншотам более 3-х дней', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: срок действия скриншотов истёк (более 3-х дней).[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '❌ Отказ: Выполнены не все требования', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: выполнены не все пункты для повышения.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '❌ Отказ: Нерабочие ссылки', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: ссылки на доказательства не открываются.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
  { title: '❌ Отказ: Не подходите по критериям', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваше заявление получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: не подходите по минимальным критериям организации.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' }
);
// === АВТООТВЕТЫ HOKAGE: ЧАСТЬ 2 (ЖАЛОБЫ, АДМИНЫ И ЛОГИКА КНОПКИ) ===
(function() {
  const T = window.hokageTemplates;

  T['⚖️ Жалобы на игроков'] = new Array(
    { title: '✅ Жалоба одобрена (Игрок наказан)', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба рассмотрена. Нарушитель получит соответствующее наказание согласно регламенту.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '⏳ Передано Тех. специалисту', tag: 'wait', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба передана техническому специалисту на проверку. Ожидайте вердикта.[/SIZE]\n\n[COLOR=rgb(255, 204, 0)][SIZE=4]На рассмотрении.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Недостаточно доказательств', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]В вашей жалобе недостаточно доказательств для выдачи наказания (требуется полная видеозапись).[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Жалоба не по форме', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба составлена не по форме. Ознакомьтесь с правилами подачи в закрепе раздела.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Нарушений не выявлено', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]По вашим доказательствам нарушений правил сервера со стороны игрока не обнаружено.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Нет /time или обрезано', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]На доказательствах отсутствует /time, либо запись подверглась монтажу.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' }
  );

  T['🛡️ Администрация / Обжалования'] = new Array(
    { title: '⏳ Запрошены доказательства у администратора', tag: 'wait', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Запросил доказательства у администратора. Ожидайте ответа в данной теме.[/SIZE]\n\n[COLOR=rgb(255, 204, 0)][SIZE=4]На рассмотрении.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '✅ Жалоба одобрена (Наказание снято)', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]С администратором будет проведена беседа, ваше наказание будет снято. Приносим извинения.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Наказание выдано верно', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Администратор предоставил доказательства. Наказание выдано верно.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Прошло более 48 часов', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]С момента выдачи наказания прошло более 48 часов. Срок подачи жалобы истёк.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '✅ Обжалование одобрено (Смягчение)', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Администрация готова пойти вам навстречу. Ваше наказание будет снижено или снято.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Обжалование отказано', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]В обжаловании отказано. Данное наказание не подлежит амнистии.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' }
  );

  let activeEd = null, targetNick = 'игрок';

  function detectNick(box) {
    const msg = box.closest('.message, .message-responseRow, .block-row');
    if (msg) {
      const u = msg.querySelector('.username, a[data-xf-init="member-tooltip"]');
      if (u && u.innerText.trim()) return u.innerText.trim();
    }
    const ed = box.querySelector('.fr-element');
    if (ed) {
      const q = ed.querySelector('blockquote[data-quote]');
      if (q && q.getAttribute('data-quote')) return q.getAttribute('data-quote').trim();
    }
    const first = document.querySelector('.message:first-of-type .username, .p-body-header .username');
    return (first && first.innerText.trim()) ? first.innerText.trim() : 'игрок';
  }

  function insertReply(raw) {
    if (!activeEd) return;
    const text = raw.replace(/\{nick\}/g, targetNick);
    const ed = activeEd.querySelector('.fr-element');
    const ta = activeEd.querySelector('textarea');
    if (ed) {
      ed.focus();
      const html = text.split('\n').map(l => `<p>${l || '<br>'}</p>`).join('');
      document.execCommand('insertHTML', false, html);
      ed.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (ta) {
      ta.focus();
      ta.value += (ta.value ? '\n' : '') + text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function openModal() {
    const old = document.getElementById('hokage-rm-overlay');
    if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'hokage-rm-overlay';
    modal.className = 'hokage-reply-modal';
    const cats = Object.keys(T);
    let cur = cats.at(0);

    modal.innerHTML = `<div class="hokage-rm-header"><div class="hokage-rm-title">⚡ БЫСТРЫЕ АВТООТВЕТЫ</div><div class="hokage-rm-nick-badge">Ник: <b>${targetNick}</b></div><button class="hokage-rm-close">✕</button></div><div class="hokage-rm-tabs"></div><div class="hokage-rm-list"></div>`;
    document.body.appendChild(modal);
    modal.querySelector('.hokage-rm-close').onclick = () => modal.remove();

    const tabs = modal.querySelector('.hokage-rm-tabs');
    const list = modal.querySelector('.hokage-rm-list');

    function render(cat) {
      list.innerHTML = '';
      (T[cat] || new Array()).forEach(item => {
        const div = document.createElement('div');
        div.className = 'hokage-rm-item';
        const cls = item.tag === 'ok' ? 'hokage-rm-tag-ok' : (item.tag === 'no' ? 'hokage-rm-tag-no' : 'hokage-rm-tag-wait');
        const prev = item.text.replace(/\[.*?\]/g, '').replace(/\{nick\}/g, targetNick).trim();
        div.innerHTML = `<div class="hokage-rm-item-head"><span class="${cls}">${item.title}</span></div><div class="hokage-rm-item-preview">${prev}</div>`;
        div.onclick = () => { insertReply(item.text); modal.remove(); };
        list.appendChild(div);
      });
    }

    cats.forEach((c, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hokage-rm-tab' + (idx === 0 ? ' active' : '');
      b.textContent = c;
      b.onclick = () => {
        tabs.querySelectorAll('.hokage-rm-tab').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        cur = c; render(c);
      };
      tabs.appendChild(b);
    });
    render(cur);
  }

  function inject() {
    document.querySelectorAll('.fr-box, textarea.input').forEach(el => {
      const box = el.closest('.fr-box') || el.parentElement;
      if (!box || box.dataset.hokageReplyOk) return;
      if (el.tagName === 'TEXTAREA' && box.querySelector('.fr-box')) return;
      box.dataset.hokageReplyOk = '1';

      const bar = document.createElement('div');
      bar.className = 'hokage-reply-bar';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hokage-reply-btn';
      btn.textContent = '⚡ Автоответы';
      btn.onclick = e => { e.preventDefault(); activeEd = box; targetNick = detectNick(box); openModal(); };
      bar.appendChild(btn);
      box.parentNode.insertBefore(bar, box);
    });
  }

  const obs = new MutationObserver(inject);
  if (document.body) { obs.observe(document.body, { childList: true, subtree: true }); inject(); }
  else document.addEventListener('DOMContentLoaded', () => { obs.observe(document.body, { childList: true, subtree: true }); inject(); });
})();
// === АВТООТВЕТЫ: ЖАЛОБЫ НА СОТРУДНИКОВ ОРГАНИЗАЦИЙ (В КОНЕЦ CONTENT.JS) ===
(function() {
  window.hokageTemplates = window.hokageTemplates || new Object();

  window.hokageTemplates['👮 Жалобы на сотрудников'] = new Array(
    { title: '✅ Одобрено: Сотрудник получит выговор', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба на сотрудника была рассмотрена. Сотрудник действительно нарушил устав организации и получит выговор.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '✅ Одобрено: Сотрудник будет уволен', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба рассмотрена. За грубое нарушение устава данный сотрудник будет уволен из организации.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '✅ Одобрено: Увольнение + ЧС фракции', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба рассмотрена. Сотрудник будет уволен и занесён в Чёрный Список организации за грубейшее нарушение правил.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '✅ Одобрено: С сотрудником будет проведена беседа', tag: 'ok', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба рассмотрена. С сотрудником будет проведена строгая профилактическая беседа, при повторном нарушении последует выговор.[/SIZE]\n\n[COLOR=rgb(0, 255, 102)][SIZE=4]Одобрено, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Недостаточно доказательств нарушения', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: предоставлено недостаточно доказательств нарушения со стороны сотрудника.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Жалоба составлена не по форме', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: жалоба составлена не по установленной форме подачи.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Нарушений устава со стороны сотрудника нет', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: действия сотрудника были правомерными, нарушений устава не выявлено.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Это NonRP нарушение (Вам в раздел жалоб на игроков)', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: данное нарушение относится к NonRP правилам сервера. Обратитесь в раздел «Жалобы на игроков» к администрации.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Отсутствует /time или скриншотам более 3-х дней', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: на доказательствах отсутствует /time, либо срок их действия истёк (более 3-х дней).[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' },
    { title: '❌ Отказ: Данный игрок не является нашим сотрудником', tag: 'no', text: '[CENTER][B][FONT=trebuchet ms][SIZE=4]Здравствуйте, уважаемый [COLOR=rgb(0, 242, 254)]{nick}[/COLOR].[/SIZE]\n\n[SIZE=4]Ваша жалоба получает статус: [COLOR=rgb(255, 77, 77)]Отказано[/COLOR]. Причина: указанный игрок не состоит в нашей организации.[/SIZE]\n\n[COLOR=rgb(255, 77, 77)][SIZE=4]Отказано, закрыто.[/SIZE][/COLOR][/FONT][/B][/CENTER]' }
  );
})();

// === УДАЛЕНИЕ ДУБЛЯ КНОПКИ АВТООТВЕТОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  const cleanDupes = () => {
    document.querySelectorAll('form, .message-inner, .block-body').forEach(form => {
      const bars = form.querySelectorAll('.hokage-reply-bar');
      for (let i = 1; i < bars.length; i++) bars.at(i).remove();
    });
  };
  setInterval(cleanDupes, 500);
})();

// === ПРИМЕНЕНИЕ СТИЛЯ ПЛАШЕК РОЛЕЙ (В КОНЕЦ CONTENT.JS) ===
(function() {
  const applyBadges = () => {
    chrome.storage.local.get(['badge-style'], res => {
      const html = document.documentElement;
      if (html) html.setAttribute('data-hokage-badges', (res && res['badge-style']) || 'default');
    });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', applyBadges) : applyBadges();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['badge-style']) applyBadges(); });
})();

// === ДВИЖОК НЕОНОВОГО ШЛЕЙФА КУРСОРА И ФОКУСА ЧТЕНИЯ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, raf, mode = 'off', pts = new Array(), sparks = new Array();

  const getNeon = () => getComputedStyle(document.documentElement).getPropertyValue('--neon-color').trim() || '#00f2fe';

  function init() {
    if (cv) return;
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100005' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; } };
    window.addEventListener('resize', resize);
    resize();
  }

  window.addEventListener('mousemove', e => {
    if (mode === 'off') return;
    if (mode === 'ribbon' || mode === 'focus-ribbon') {
      pts.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (pts.length > 28) pts.shift();
    }
    if (mode === 'sparks') {
      for (let i = 0; i < 2; i++) {
        sparks.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5 - 0.5, life: 1, r: Math.random() * 2 + 1 });
      }
    }
  }, { passive: true });

  function loop() {
    if (!ctx || !cv || mode === 'off') return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const col = getNeon();

    if ((mode === 'ribbon' || mode === 'focus-ribbon') && pts.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowBlur = 12;
      ctx.shadowColor = col;
      for (let i = 1; i < pts.length; i++) {
        const p1 = pts.at(i - 1), p2 = pts.at(i);
        ctx.beginPath();
        ctx.strokeStyle = col;
        ctx.globalAlpha = p2.life * 0.75;
        ctx.lineWidth = p2.life * 4.5;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
      for (let i = pts.length - 1; i >= 0; i--) {
        pts.at(i).life -= 0.045;
        if (pts.at(i).life <= 0) pts.splice(i, 1);
      }
    }

    if (mode === 'sparks') {
      ctx.save();
      ctx.fillStyle = col;
      ctx.shadowBlur = 10;
      ctx.shadowColor = col;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks.at(i);
        s.x += s.vx; s.y += s.vy; s.life -= 0.035;
        if (s.life <= 0) { sparks.splice(i, 1); continue; }
        ctx.globalAlpha = s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.life, 0, 6.28);
        ctx.fill();
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  }

  function applyTrail(val) {
    mode = val || 'off';
    const html = document.documentElement;
    if (html) html.setAttribute('data-hokage-trail', mode);
    cancelAnimationFrame(raf);
    if (mode === 'off') {
      if (cv) { cv.remove(); cv = ctx = null; }
      pts = new Array(); sparks = new Array();
      return;
    }
    init();
    loop();
  }

  const check = () => chrome.storage.local.get(['cursor-trail'], r => applyTrail(r?.['cursor-trail'] || 'off'));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['cursor-trail']) applyTrail(c['cursor-trail'].newValue); });
})();

// === МГНОВЕННОЕ ПРИМЕНЕНИЕ СТИЛЯ КАРТОЧЕК ТЕМ (В КОНЕЦ CONTENT.JS) ===
(function() {
  const applyCardStyle = () => {
    chrome.storage.local.get(['topic-card-style'], r => {
      const html = document.documentElement;
      if (html) html.setAttribute('data-hokage-card', (r && r['topic-card-style']) || 'default');
    });
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', applyCardStyle) : applyCardStyle();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['topic-card-style']) applyCardStyle(); });
})();

// === ОПТИМИЗАЦИЯ СДУВА СНЕГА: УБИРАЕМ ФРИЗЫ ПРИ ДВИЖЕНИИ КУРСОРА (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, sprite, raf, timer, on = false, flakes = new Array(), banks = new Array();
  let cur = { x: -999, y: -999, vx: 0, lx: -999 };

  function makeSprite() {
    if (sprite) return;
    sprite = document.createElement('canvas');
    sprite.width = 12; sprite.height = 12;
    const s = sprite.getContext('2d');
    const g = s.createRadialGradient(6, 6, 0, 6, 6, 6);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, 'rgba(220,240,255,0)');
    s.fillStyle = g;
    s.fillRect(0, 0, 12, 12);
  }

  function init() {
    if (cv) return;
    makeSprite();
    cv = document.createElement('canvas');
    Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: '100005' });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; scan(); } };
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', scan, { passive: true });
    resize();
  }

  function scan() {
    if (!on) return;
    const next = new Array();
    document.querySelectorAll('.structItem-title a, .node-title a, .p-title-value').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 30 && r.top > 35 && r.top < window.innerHeight - 10) {
        let b = banks.find(x => x.el === el);
        const cols = Math.ceil(r.width / 8); // Увеличенный шаг 8px снижает нагрузку вдвое
        if (!b || b.h.length !== cols) b = { el, l: r.left, t: r.top, w: r.width, h: new Array(cols).fill(0) };
        else { b.l = r.left; b.t = r.top; b.w = r.width; }
        next.push(b);
      }
    });
    banks = next;
  }

  window.addEventListener('mousemove', e => {
    if (!on) return;
    cur.vx = e.clientX - cur.lx;
    cur.x = cur.lx = e.clientX;
    cur.y = e.clientY;
  }, { passive: true });

  function loop() {
    if (!ctx || !cv || !on) return;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Прячем старые тормозящие слои снега
    document.querySelectorAll('canvas').forEach(c => {
      const z = parseInt(c.style.zIndex || '0', 10);
      if (c !== cv && z >= 99998 && z <= 100004) c.style.display = 'none';
    });

    // 1. Сугробы и жёсткий лимит на вылетающие при сдуве снежинки
    ctx.fillStyle = 'rgba(245, 252, 255, 0.9)';
    banks.forEach(b => {
      if (Math.abs(cur.y - b.t) < 40 && cur.x >= b.l - 30 && cur.x <= b.l + b.w + 30) {
        const c = Math.floor((cur.x - b.l) / 8);
        for (let i = c - 7; i <= c + 7; i++) {
          if (i >= 0 && i < b.h.length && b.h.at(i) > 0.25) {
            const val = b.h.at(i);
            b.h.splice(i, 1, val * 0.55);
            // Спавним пыль только если общее число частиц меньше 150
            if (flakes.length < 150 && Math.random() < 0.25) {
              flakes.push({ x: b.l + i * 8, y: b.t - val, z: 0.8, vy: -1.8, vx: cur.vx * 0.2 + (Math.random() - 0.5) * 3, a: 0, tmp: true });
            }
          }
        }
      }

      let max = 0;
      for (let i = 0; i < b.h.length; i++) if (b.h.at(i) > max) max = b.h.at(i);
      if (max > 0.8) {
        ctx.globalAlpha = Math.min(0.95, (max - 0.8) / 2);
        ctx.beginPath();
        ctx.moveTo(b.l, b.t + 1);
        for (let i = 0; i < b.h.length; i++) ctx.lineTo(b.l + i * 8, b.t - Math.max(0, b.h.at(i) - 0.5));
        ctx.lineTo(b.l + b.w, b.t + 1);
        ctx.fill();
      }
    });

    // 2. Отрисовка частиц без тяжёлой математики квадратных корней
    for (let i = flakes.length - 1; i >= 0; i--) {
      const p = flakes.at(i);
      p.a += 0.03;
      p.x += p.vx + Math.sin(p.a) * 0.5;
      p.y += p.vy;

      // Быстрая проверка расстояния без Math.hypot
      const dx = p.x - cur.x, dy = p.y - cur.y;
      if (dx > -80 && dx < 80 && dy > -80 && dy < 80) {
        p.vx += dx * 0.025 + cur.vx * 0.04;
      }

      p.vx *= 0.94;
      if (p.vy < 0.8 + p.z * 1.3) p.vy += 0.04;

      let hit = false;
      if (p.vy > 0 && !p.tmp) {
        for (const b of banks) {
          if (p.x >= b.l && p.x <= b.l + b.w && Math.abs(p.y - b.t) < 5) {
            const idx = Math.floor((p.x - b.l) / 8);
            if (idx >= 0 && idx < b.h.length && b.h.at(idx) < 8) {
              b.h.splice(idx, 1, b.h.at(idx) + 0.65);
              hit = true;
            }
            break;
          }
        }
      }

      if (hit || p.y > cv.height + 15) {
        if (p.tmp) { flakes.splice(i, 1); continue; }
        p.y = -10; p.x = Math.random() * cv.width;
        p.vx = 0; p.vy = 0.8 + p.z * 1.3;
      }

      const sz = 4 + p.z * 5;
      ctx.globalAlpha = 0.6 + p.z * 0.4;
      ctx.drawImage(sprite, p.x - sz * 0.5, p.y - sz * 0.5, sz, sz);
    }

    ctx.globalAlpha = 1;
    cur.vx *= 0.8;
    raf = requestAnimationFrame(loop);
  }

  function start(val) {
    on = (val === 'snow-real');
    cancelAnimationFrame(raf);
    clearInterval(timer);
    if (!on) {
      if (cv) { cv.remove(); cv = ctx = null; }
      banks = new Array();
      return;
    }
    init(); scan();
    flakes = Array.from({ length: 110 }, () => {
      const z = Math.random();
      return { x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, z, vy: 0.8 + z * 1.3, vx: 0, a: Math.random() * 6.28 };
    });
    timer = setInterval(scan, 1300);
    loop();
  }

  const check = () => chrome.storage.local.get(['weather-effect'], r => start(r?.['weather-effect']));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => { if (a === 'local' && c['weather-effect']) start(c['weather-effect'].newValue); });
})();

// === ПРИМЕНЕНИЕ ПЕРСОНАЛЬНОГО ЦВЕТА И ПЕРЕЛИВА СВОЕГО НИКА (В КОНЕЦ CONTENT.JS) ===
(function() {
  function extractUserId(url) {
    if (!url) return '';
    // Вытаскиваем цифры ID из ссылки вида .../members/name.3018759/ или просто числа
    const match = url.match(/\.(\d+)\/?/) || url.match(/(\d{4,})/);
    return match ? match.at(1) : '';
  }

  function applyMyNickStyle() {
    chrome.storage.local.get(['hk-my-profile-url', 'hk-my-nick-style'], res => {
      const styleMode = (res && res['hk-my-nick-style']) || 'off';
      const userId = extractUserId(res && res['hk-my-profile-url']);

      // Снимаем старые классы, если режим выключен или ссылка пустая
      document.querySelectorAll('.hk-personal-nick').forEach(el => {
        el.className = el.className.replace(/\bhk-nick-[a-z-]+\b/g, '').replace('hk-personal-nick', '').trim();
      });

      if (!userId || styleMode === 'off') return;

      // Ищем все ссылки на твой профиль по data-user-id или href
      const selectors = `a[data-user-id="${userId}"], a[href*=".${userId}/"], a[href$=".${userId}"]`;
      document.querySelectorAll(selectors).forEach(link => {
        // Игнорируем аватарки, применяем только к текстовому нику
        if (link.classList.contains('avatar') || link.querySelector('img')) return;

        const target = link.querySelector('span') || link;
        target.classList.add('hk-personal-nick', 'hk-nick-' + styleMode);
      });
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', applyMyNickStyle) : applyMyNickStyle();
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === 'local' && (c['hk-my-profile-url'] || c['hk-my-nick-style'])) applyMyNickStyle();
  });

  // Отслеживаем подгрузку новых сообщений без перезагрузки
  new MutationObserver(applyMyNickStyle).observe(document.documentElement, { childList: true, subtree: true });
})();

// === ОТКЛЮЧЕНИЕ СТАРОГО АВТО-ЖЁЛТОГО НИКА: УПРАВЛЕНИЕ СТРОГО ЧЕРЕЗ МЕНЮ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function syncNickOverride() {
    chrome.storage.local.get(['hk-my-profile-url', 'hk-my-nick-style'], res => {
      const styleMode = (res && res['hk-my-nick-style']) || 'off';
      const rawUrl = (res && res['hk-my-profile-url']) || '';
      const match = rawUrl.match(/\.(\d+)\/?/) || rawUrl.match(/(\d{4,})/);
      const userId = match ? match.at(1) : '';

      // Очищаем старые инлайн-градиенты со ссылок профиля, если они остались от старой версии
      document.querySelectorAll('a[data-user-id="3018759"], a[href*=".3018759"]').forEach(link => {
        if (link.classList.contains('avatar') || link.querySelector('img')) return;
        const target = link.querySelector('span') || link;
        if (!userId || styleMode === 'off') {
          target.style.removeProperty('background');
          target.style.removeProperty('background-image');
          target.style.removeProperty('-webkit-background-clip');
          target.style.removeProperty('-webkit-text-fill-color');
          target.style.removeProperty('animation');
        }
      });
    });
  }

  setInterval(syncNickOverride, 400);
})();

// === ЖЕЛЕЗНЫЙ ПЛАВНЫЙ ПЕРЕЛИВ ГРАДИЕНТА НИКА (В КОНЕЦ CONTENT.JS) ===
(function() {
  let pos = 0;
  let dir = 1;

  function animateGradNicks() {
    const nicks = document.querySelectorAll('.hk-personal-nick[class*="hk-nick-grad-"]');
    if (nicks.length > 0) {
      pos += 0.8 * dir;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0)   { pos = 0;   dir = 1; }

      const bgPos = pos.toFixed(1) + '% 50%';
      for (let i = 0; i < nicks.length; i++) {
        nicks.item(i).style.setProperty('background-position', bgPos, 'important');
      }
    }
    requestAnimationFrame(animateGradNicks);
  }

  requestAnimationFrame(animateGradNicks);
})();

// === ПРИМЕНЕНИЕ АКТИВНОГО РЕДУКСА НА ФОРУМЕ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function syncReduxAttr() {
    chrome.storage.local.get(['hk-active-redux'], r => {
      const rdx = (r && r['hk-active-redux']) || 'off';
      if (document.documentElement) {
        document.documentElement.setAttribute('data-hokage-redux', rdx);
      }
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', syncReduxAttr) : syncReduxAttr();
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === 'local' && c['hk-active-redux']) syncReduxAttr();
  });
})();

// === ДВИЖОК 4 ЭКСКЛЮЗИВНЫХ ЭФФЕКТОВ (FORTUNA, VILLIAN, MADK1D, ТЁМНЫЙ ПРИНЦ) (В КОНЕЦ CONTENT.JS) ===
(function() {
  let cv, ctx, raf, mode = 'off', parts = new Array(), boltTimer = 0, boltAlpha = 0, boltPts = new Array();

  function setupCanvas() {
    if (cv) return;
    cv = document.createElement('canvas');
    Object.assign(cv.style, {
      position: 'fixed', inset: '0', width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: '100006'
    });
    document.body.appendChild(cv);
    ctx = cv.getContext('2d');
    const resize = () => { if (cv) { cv.width = window.innerWidth; cv.height = window.innerHeight; } };
    window.addEventListener('resize', resize);
    resize();
  }

  function makeBolt() {
    boltPts = new Array();
    let x = Math.random() * cv.width;
    let y = 0;
    boltPts.push({ x, y });
    while (y < cv.height * 0.75) {
      x += (Math.random() - 0.5) * 70;
      y += 25 + Math.random() * 35;
      boltPts.push({ x, y });
    }
    boltAlpha = 1;
  }

  function loop() {
    if (!ctx || !cv || mode === 'off') return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    document.documentElement.setAttribute('data-hokage-artist-fx', mode);

    if (mode === 'fortuna-blood') {
      // Кровавый дождь (Fortuna 812)
      ctx.strokeStyle = 'rgba(255, 25, 55, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < parts.length; i++) {
        const p = parts.at(i);
        p.x -= 2.2; p.y += p.vy;
        if (p.y > cv.height) { p.y = -20; p.x = Math.random() * (cv.width + 100); }
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + 18);
      }
      ctx.stroke();
    } else if (mode === 'villian-lightning') {
      // Тёмные фиолетовые молнии + парящие руны/искры (Villian)
      boltTimer++;
      if (boltTimer > 130 && Math.random() < 0.04) {
        makeBolt();
        boltTimer = 0;
      }
      if (boltAlpha > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(210, 120, 255, ${boltAlpha})`;
        ctx.shadowColor = '#b5179e';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < boltPts.length; i++) {
          const pt = boltPts.at(i);
          i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
        boltAlpha -= 0.045;
      }
      ctx.fillStyle = 'rgba(199, 125, 255, 0.65)';
      for (let i = 0; i < parts.length; i++) {
        const p = parts.at(i);
        p.a += 0.02; p.x += Math.sin(p.a) * 0.6; p.y -= p.vy * 0.35;
        if (p.y < -10) { p.y = cv.height + 10; p.x = Math.random() * cv.width; }
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.28); ctx.fill();
      }
    } else if (mode === 'madk1d-cyber') {
      // Цифровые падающие биты 0/1 (Madk1d)
      ctx.font = 'bold 11px monospace';
      for (let i = 0; i < parts.length; i++) {
        const p = parts.at(i);
        p.y += p.vy * 0.55;
        if (p.y > cv.height) { p.y = -15; p.x = Math.random() * cv.width; }
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 0, 128, 0.6)' : 'rgba(0, 242, 254, 0.65)';
        ctx.fillText(p.ch, p.x, p.y);
      }
    } else if (mode === 'prince-ash') {
      // Медленный серебряно-платиновый пепел (Тёмный Принц)
      for (let i = 0; i < parts.length; i++) {
        const p = parts.at(i);
        p.a += 0.02; p.x += Math.sin(p.a) * 0.8; p.y += p.vy * 0.3;
        if (p.y > cv.height) { p.y = -10; p.x = Math.random() * cv.width; }
        ctx.fillStyle = 'rgba(226, 232, 240, 0.75)';
        ctx.fillRect(p.x, p.y, p.sz, p.sz * 0.6);
      }
    }

    raf = requestAnimationFrame(loop);
  }

  function startArtistEffect(val) {
    const valid = new Array('fortuna-blood', 'villian-lightning', 'madk1d-cyber', 'prince-ash');
    cancelAnimationFrame(raf);
    if (!valid.includes(val)) {
      mode = 'off';
      document.documentElement.removeAttribute('data-hokage-artist-fx');
      if (cv) { cv.remove(); cv = ctx = null; }
      return;
    }
    mode = val;
    setupCanvas();
    const count = mode === 'fortuna-blood' ? 95 : 65;
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: 6 + Math.random() * 6,
      a: Math.random() * 6.28,
      sz: 2.5 + Math.random() * 2.5,
      ch: Math.random() > 0.5 ? '1' : '0'
    }));
    loop();
  }

  const check = () => chrome.storage.local.get(['weather-effect'], r => startArtistEffect(r?.['weather-effect']));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', check) : check();
  chrome.storage.onChanged.addListener((c, a) => {
    if (a === 'local' && c['weather-effect']) startArtistEffect(c['weather-effect'].newValue);
  });
})();

// === КОНСТРУКТОР ЛИЧНЫХ ШАБЛОНОВ В ОКНЕ АВТООТВЕТОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function hookCustomTemplates() {
    const modal = document.getElementById('hk-rm');
    if (!modal || modal.dataset.hkCustomReady) return;
    modal.dataset.hkCustomReady = '1';

    const tabsBar = modal.querySelector('.hokage-rm-tabs');
    const listBox = modal.querySelector('.hokage-rm-list');
    const headerEl = modal.querySelector('.hokage-rm-header');
    if (!tabsBar || !listBox) return;

    // Достаём ник из заголовка окна автоответов
    const headText = headerEl ? headerEl.innerText : '';
    const nickMatch = headText.match(/\(([^)]+)\)/);
    const currentNick = nickMatch ? nickMatch.at(1) : 'игрок';

    // Создаём вкладку "⭐ Мои шаблоны"
    const myTab = document.createElement('button');
    myTab.type = 'button';
    myTab.className = 'hokage-rm-tab';
    myTab.textContent = '⭐ Мои шаблоны';
    tabsBar.appendChild(myTab);

    function insertTextToEditor(rawText) {
      const box = document.querySelector('.fr-box');
      const ed = box ? box.querySelector('.fr-element') : null;
      if (ed) {
        ed.focus();
        const finalHtml = rawText
          .replace(/\{nick\}/g, currentNick)
          .split('\n')
          .map(line => `<p>${line || '<br>'}</p>`)
          .join('');
        document.execCommand('insertHTML', false, finalHtml);
      }
      modal.remove();
    }

    function renderMyTemplates() {
      modal.querySelectorAll('.hokage-rm-tab').forEach(t => t.classList.remove('active'));
      myTab.classList.add('active');
      listBox.innerHTML = '';

      // Кнопка открытия формы создания нового шаблона
      const addToggle = document.createElement('button');
      addToggle.type = 'button';
      addToggle.className = 'hk-custom-tpl-save';
      addToggle.style.marginBottom = '8px';
      addToggle.textContent = '➕ Создать новый свой шаблон';
      listBox.appendChild(addToggle);

      const formBox = document.createElement('div');
      formBox.className = 'hk-custom-tpl-form';
      formBox.style.display = 'none';
      formBox.innerHTML = `
        <input type="text" class="hk-custom-tpl-input" id="hk-new-tpl-title" placeholder="Название (например: ✅ Перевод одобрен)">
        <select class="hk-custom-tpl-select" id="hk-new-tpl-tag">
          <option value="ok">🟢 Зелёный (Одобрено)</option>
          <option value="no">🔴 Красный (Отказано)</option>
          <option value="wait">🟡 Жёлтый (На рассмотрении)</option>
        </select>
        <textarea class="hk-custom-tpl-area" id="hk-new-tpl-text" placeholder="Текст ответа (используй {nick} для автоподстановки ника игрока)..."></textarea>
        <button type="button" class="hk-custom-tpl-save" id="hk-save-new-tpl">💾 Сохранить шаблон</button>
      `;
      listBox.appendChild(formBox);

      addToggle.onclick = () => {
        formBox.style.display = formBox.style.display === 'none' ? 'flex' : 'none';
      };

      formBox.querySelector('#hk-save-new-tpl').onclick = () => {
        const titleVal = formBox.querySelector('#hk-new-tpl-title').value.trim();
        const tagVal = formBox.querySelector('#hk-new-tpl-tag').value;
        const textVal = formBox.querySelector('#hk-new-tpl-text').value.trim();
        if (!titleVal || !textVal) return;

        chrome.storage.local.get(['hk_custom_replies'], res => {
          const saved = (res && Array.isArray(res.hk_custom_replies)) ? res.hk_custom_replies : new Array();
          saved.push({ id: Date.now(), title: titleVal, tag: tagVal, text: textVal });
          chrome.storage.local.set({ hk_custom_replies: saved }, renderMyTemplates);
        });
      };

      // Выводим список сохранённых пользовательских шаблонов
      chrome.storage.local.get(['hk_custom_replies'], res => {
        const saved = (res && Array.isArray(res.hk_custom_replies)) ? res.hk_custom_replies : new Array();
        if (saved.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'text-align:center; color:#889; font-size:12px; padding:16px;';
          empty.textContent = 'У тебя пока нет своих шаблонов. Нажми кнопку выше, чтобы создать первый!';
          listBox.appendChild(empty);
          return;
        }

        saved.forEach(item => {
          const card = document.createElement('div');
          card.className = 'hokage-rm-item';
          card.innerHTML = `
            <button type="button" class="hk-custom-del-btn" title="Удалить">🗑️ Удалить</button>
            <div class="hokage-rm-tag-${item.tag}">${item.title}</div>
            <div style="font-size:11px; color:#9aa0b2; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</div>
          `;

          card.querySelector('.hk-custom-del-btn').onclick = e => {
            e.stopPropagation();
            const updated = saved.filter(x => x.id !== item.id);
            chrome.storage.local.set({ hk_custom_replies: updated }, renderMyTemplates);
          };

          card.onclick = () => insertTextToEditor(item.text);
          listBox.appendChild(card);
        });
      });
    }

    myTab.addEventListener('click', renderMyTemplates);
  }

  new MutationObserver(hookCustomTemplates).observe(document.documentElement, { childList: true, subtree: true });
})();

// === УНИВЕРСАЛЬНЫЙ КОНСТРУКТОР ЛИЧНЫХ ШАБЛОНОВ ДЛЯ ОКНА БЫСТРЫХ АВТООТВЕТОВ (В КОНЕЦ CONTENT.JS) ===
(function() {
  function hookCustomRepliesUniversal() {
    // Ищем открытое окно по тексту "БЫСТРЫЕ АВТООТВЕТЫ"
    const headers = Array.from(document.querySelectorAll('div, span, b, h3'));
    const titleEl = headers.find(el => el.children.length === 0 && /БЫСТРЫЕ АВТООТВЕТЫ/i.test(el.textContent || ''));
    if (!titleEl) return;

    // Поднимаемся до корневого контейнера модального окна
    let modal = titleEl.parentElement;
    while (modal && modal !== document.body && modal.offsetHeight < 250) {
      modal = modal.parentElement;
    }
    if (!modal || modal.dataset.hkCustomAttached) return;
    modal.dataset.hkCustomAttached = '1';

    // Ищем любую существующую кнопку вкладки ("Жалобы на сотрудников" или "Организации")
    const allBtns = Array.from(modal.querySelectorAll('button, div[role="button"], span'));
    const refTab = allBtns.find(b => b.children.length === 0 && /Жалобы на сотрудников|Организации \(Одобрено\)/i.test(b.textContent || ''));
    if (!refTab || !refTab.parentElement) return;

    const tabsBar = refTab.parentElement;

    // Ищем контейнер со списком карточек шаблонов
    const cards = Array.from(modal.querySelectorAll('div')).filter(d => /Вступление в организацию|Отчёт на повышение|Здравствуйте, уважаемый/i.test(d.textContent || '') && d.offsetHeight > 35 && d.offsetHeight < 130);
    const listBox = cards.length > 0 ? cards.at(0).parentElement : null;
    if (!listBox) return;

    // Вытаскиваем ник из плашки "Ник: ..."
    const nickNode = Array.from(modal.querySelectorAll('div, span, input')).find(el => /Ник:/i.test(el.textContent || el.value || ''));
    let currentNick = 'игрок';
    if (nickNode) {
      const raw = (nickNode.value || nickNode.textContent || '').replace(/Ник:/i, '').trim();
      if (raw) currentNick = raw;
    }

    // Клонируем родную вкладку, чтобы дизайн совпал на 100%
    const myTab = refTab.cloneNode(true);
    myTab.classList.remove('active');
    myTab.textContent = '⭐ Мои шаблоны';
    tabsBar.appendChild(myTab);

    function insertTextToEditor(rawText) {
      const box = document.querySelector('.fr-box');
      const ed = box ? box.querySelector('.fr-element') : null;
      if (ed) {
        ed.focus();
        const finalHtml = rawText
          .replace(/\{nick\}/g, currentNick)
          .split('\n')
          .map(line => `<p>${line || '<br>'}</p>`)
          .join('');
        document.execCommand('insertHTML', false, finalHtml);
      }
      // Нажимаем крестик закрытия окна
      const closeBtn = Array.from(modal.querySelectorAll('button, span, div')).find(el => el.children.length === 0 && /^[✕×xX]$/.test((el.textContent || '').trim()));
      if (closeBtn) closeBtn.click();
      else modal.remove();
    }

    function renderMyTemplates() {
      Array.from(tabsBar.children).forEach(t => {
        t.classList.remove('active');
        t.style.borderColor = '';
      });
      myTab.classList.add('active');
      myTab.style.borderColor = 'var(--neon-color, #ffcc00)';

      listBox.innerHTML = '';

      const addToggle = document.createElement('button');
      addToggle.type = 'button';
      addToggle.className = 'hk-custom-tpl-save';
      addToggle.style.marginBottom = '10px';
      addToggle.textContent = '➕ Создать новый свой шаблон';
      listBox.appendChild(addToggle);

      const formBox = document.createElement('div');
      formBox.className = 'hk-custom-tpl-form';
      formBox.style.display = 'none';
      formBox.innerHTML = `
        <input type="text" class="hk-custom-tpl-input" id="hk-new-tpl-title" placeholder="Название (например: ✅ Перевод одобрен)">
        <select class="hk-custom-tpl-select" id="hk-new-tpl-tag">
          <option value="ok">🟢 Зелёный (Одобрено)</option>
          <option value="no">🔴 Красный (Отказано)</option>
          <option value="wait">🟡 Жёлтый (На рассмотрении)</option>
        </select>
        <textarea class="hk-custom-tpl-area" id="hk-new-tpl-text" placeholder="Текст ответа (используй {nick} для автоподстановки ника игрока)..."></textarea>
        <button type="button" class="hk-custom-tpl-save" id="hk-save-new-tpl">💾 Сохранить шаблон</button>
      `;
      listBox.appendChild(formBox);

      addToggle.onclick = () => {
        formBox.style.display = formBox.style.display === 'none' ? 'flex' : 'none';
      };

      formBox.querySelector('#hk-save-new-tpl').onclick = () => {
        const titleVal = formBox.querySelector('#hk-new-tpl-title').value.trim();
        const tagVal = formBox.querySelector('#hk-new-tpl-tag').value;
        const textVal = formBox.querySelector('#hk-new-tpl-text').value.trim();
        if (!titleVal || !textVal) return;

        chrome.storage.local.get(['hk_custom_replies'], res => {
          const saved = (res && Array.isArray(res.hk_custom_replies)) ? res.hk_custom_replies : new Array();
          saved.push({ id: Date.now(), title: titleVal, tag: tagVal, text: textVal });
          chrome.storage.local.set({ hk_custom_replies: saved }, renderMyTemplates);
        });
      };

      chrome.storage.local.get(['hk_custom_replies'], res => {
        const saved = (res && Array.isArray(res.hk_custom_replies)) ? res.hk_custom_replies : new Array();
        if (saved.length === 0) {
          const empty = document.createElement('div');
          empty.style.cssText = 'text-align:center; color:#889; font-size:12px; padding:16px;';
          empty.textContent = 'У тебя пока нет своих шаблонов. Нажми кнопку выше, чтобы создать первый!';
          listBox.appendChild(empty);
          return;
        }

        saved.forEach(item => {
          const card = document.createElement('div');
          card.style.cssText = 'background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:9px; padding:10px 14px; margin-bottom:8px; cursor:pointer;';
          const colorMap = { ok: '#00ff66', no: '#ff4d4d', wait: '#ffcc00' };
          card.innerHTML = `
            <button type="button" class="hk-custom-del-btn" title="Удалить">🗑️ Удалить</button>
            <div style="color:${colorMap[item.tag] || '#fff'}; font-weight:700; font-size:13px;">${item.title}</div>
            <div style="font-size:11.5px; color:#9aa0b2; margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</div>
          `;

          card.querySelector('.hk-custom-del-btn').onclick = e => {
            e.stopPropagation();
            const updated = saved.filter(x => x.id !== item.id);
            chrome.storage.local.set({ hk_custom_replies: updated }, renderMyTemplates);
          };

          card.onclick = () => insertTextToEditor(item.text);
          listBox.appendChild(card);
        });
      });
    }

    myTab.addEventListener('click', renderMyTemplates);
  }

  new MutationObserver(hookCustomRepliesUniversal).observe(document.documentElement, { childList: true, subtree: true });
})();

// === ЖЕЛЕЗНЫЙ ПЛАВНЫЙ ПЕРЕЛИВ ВНУТРИ ОСТРОВКОВ ТЕМ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let wave = 0;
  let step = 0.25;

  function animateTopicWaves() {
    const mode = document.documentElement ? document.documentElement.getAttribute('data-hokage-card') : '';
    if (mode && mode.startsWith('flow-')) {
      wave += step;
      if (wave >= 100) { wave = 100; step = -0.25; }
      if (wave <= 0)   { wave = 0;   step = 0.25; }

      const pos = wave.toFixed(1) + '% 50%';
      const cards = document.querySelectorAll('.structItem, .node, .message');
      for (let i = 0; i < cards.length; i++) {
        cards.item(i).style.setProperty('background-position', pos, 'important');
      }
    }
    requestAnimationFrame(animateTopicWaves);
  }

  requestAnimationFrame(animateTopicWaves);
})();

// === ОБЛЕГЧЁННЫЙ ПЛАВНЫЙ ПЕРЕЛИВ ВНУТРИ ОСТРОВКОВ ТЕМ (В КОНЕЦ CONTENT.JS) ===
(function() {
  let wave = 0;
  let step = 0.6;
  let skip = 0;

  function animateTopicWaves() {
    skip++;
    if (skip % 3 === 0) {
      const mode = document.documentElement ? document.documentElement.getAttribute('data-hokage-card') : '';
      if (mode && mode.startsWith('flow-')) {
        wave += step;
        if (wave >= 100) { wave = 100; step = -0.6; }
        if (wave <= 0)   { wave = 0;   step = 0.6; }

        const pos = wave.toFixed(1) + '% 50%';
        const cards = document.querySelectorAll('.structItem, .node, .message');
        for (let i = 0; i < cards.length; i++) {
          cards.item(i).style.setProperty('background-position', pos, 'important');
        }
      }
    }
    requestAnimationFrame(animateTopicWaves);
  }

  requestAnimationFrame(animateTopicWaves);
})();

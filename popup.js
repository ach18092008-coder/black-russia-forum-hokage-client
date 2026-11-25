document.addEventListener('DOMContentLoaded', function () {
  const bgFileInput = document.getElementById('bg-file-input');
  const fileNameInfo = document.getElementById('file-name-info');
  const blurToggleSelect = document.getElementById('blur-toggle');
  const nickModeSelect = document.getElementById('nick-mode');
  const uiColorSelect = document.getElementById('ui-color');
  const animStyleSelect = document.getElementById('anim-style');
  const saveBtn = document.getElementById('save-btn');
  const resetBgBtn = document.getElementById('reset-bg-btn');
  const statusMsg = document.getElementById('status');

  let base64ImageString = "";

  // Подгружаем действующие настройки из локального хранилища
  chrome.storage.local.get(['custom_bg_url', 'blur-toggle', 'nick-mode', 'ui-color', 'anim-style'], function (res) {
    if (!res) return;
    if (res.custom_bg_url) {
      base64ImageString = res.custom_bg_url;
      fileNameInfo.innerText = "📁 Изображение загружено";
      fileNameInfo.style.display = "block";
    }
    if (res['blur-toggle']) blurToggleSelect.value = res['blur-toggle'];
    if (res['nick-mode']) nickModeSelect.value = res['nick-mode'];
    if (res['ui-color']) uiColorSelect.value = res['ui-color'];
    if (res['anim-style']) animStyleSelect.value = res['anim-style'];
  });

  bgFileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    fileNameInfo.innerText = `⏳ Загрузка: ${file.name}...`;
    fileNameInfo.style.display = "block";

    const reader = new FileReader();
    reader.onload = function (event) {
      base64ImageString = event.target.result;
      fileNameInfo.innerText = `✅ Выбран файл: ${file.name}`;
    };
    reader.readAsDataURL(file);
  });

  // Применение настроек и автоматическое обновление страницы форума
  saveBtn.addEventListener('click', function () {
    const config = {
      custom_bg_url: base64ImageString,
      'blur-toggle': blurToggleSelect.value,
      'nick-mode': nickModeSelect.value,
      'ui-color': uiColorSelect.value,
      'anim-style': animStyleSelect.value
    };

    chrome.storage.local.set(config, function () {
      statusMsg.innerText = '⚡ Настройки применены!';
      statusMsg.style.display = 'block';

      // Автоматически обновляем активную вкладку, если она открыта на форуме
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('forum.blackrussia.online')) {
          chrome.tabs.reload(tabs[0].id);
        }
      });

      setTimeout(() => { statusMsg.style.display = 'none'; }, 2000);
    });
  });

  resetBgBtn.addEventListener('click', function () {
    base64ImageString = "";
    bgFileInput.value = "";
    fileNameInfo.style.display = "none";
    chrome.storage.local.set({ custom_bg_url: '' }, function () {
      statusMsg.innerText = '📂 Фон сброшен!';
      statusMsg.style.display = 'block';

      // Обновляем вкладку при сбросе фона
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url && tabs[0].url.includes('forum.blackrussia.online')) {
          chrome.tabs.reload(tabs[0].id);
        }
      });

      setTimeout(() => { statusMsg.style.display = 'none'; }, 2000);
    });
  });
});

// === ДОПОЛНИТЕЛЬНЫЕ ВИЗУАЛЬНЫЕ НАСТРОЙКИ (В КОНЕЦ POPUP.JS) ===
(function() {
  const extraKeys = ['glass-alpha', 'custom-cursor'];
  chrome.storage.local.get(extraKeys, function(res) {
    if (!res) return;
    extraKeys.forEach(key => {
      const el = document.getElementById(key);
      if (el && res[key]) el.value = res[key];
    });
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      const extraConfig = {};
      extraKeys.forEach(key => {
        const el = document.getElementById(key);
        if (el) extraConfig[key] = el.value;
      });
      chrome.storage.local.set(extraConfig);
    });
  }
})();

// === СОХРАНЕНИЕ РЕЖИМА ДЛЯ ОБЗОРОВ (В КОНЕЦ POPUP.JS) ===
(function() {
  const reviewSelect = document.getElementById('review-mode');
  if (!reviewSelect) return;

  chrome.storage.local.get(['review-mode'], function(res) {
    if (res && res['review-mode']) reviewSelect.value = res['review-mode'];
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      chrome.storage.local.set({ 'review-mode': reviewSelect.value });
    });
  }
})();

// === СОХРАНЕНИЕ КОНТРОЛЯ СЕРОСТИ (В КОНЕЦ POPUP.JS) ===
(function() {
  const graySelect = document.getElementById('gray-control');
  if (!graySelect) return;

  chrome.storage.local.get(['gray-control'], function(res) {
    if (res && res['gray-control']) graySelect.value = res['gray-control'];
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      chrome.storage.local.set({ 'gray-control': graySelect.value });
    });
  }
})();

// === СОХРАНЕНИЕ СТИЛЯ ЗАГОЛОВКА ТЕМЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  const titleSelect = document.getElementById('title-style');
  if (!titleSelect) return;

  chrome.storage.local.get(['title-style'], function(res) {
    if (res && res['title-style']) titleSelect.value = res['title-style'];
  });

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', function() {
      chrome.storage.local.set({ 'title-style': titleSelect.value });
    });
  }
})();

// === МЕНЮ РЕАЛИСТИЧНОЙ АТМОСФЕРЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  const saveBtn = document.getElementById('save-btn');
  if (!saveBtn || document.getElementById('weather-effect')) return;

  const sec = document.createElement('div');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="label">❄️ Реалистичная атмосфера</div>
    <select id="weather-effect">
      <option value="off">Выключено</option>
      <option value="snow-real">❄️ Снег + Сугробы (Сдуваются курсором)</option>
      <option value="rain-real">🌧️ Дождь с брызгами на темах</option>
      <option value="bokeh">✨ Неоновые светлячки (Боке в цвет темы)</option>
      <option value="sakura">🌸 Реалистичная сакура на ветру</option>
      <option value="stars">🌌 Ночной звездопад</option>
    </select>
  `;
  saveBtn.parentNode.insertBefore(sec, saveBtn);

  const sel = document.getElementById('weather-effect');
  chrome.storage.local.get(['weather-effect'], res => {
    if (res && res['weather-effect']) sel.value = res['weather-effect'];
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({ 'weather-effect': sel.value });
  });
})();

// === ДОБАВЛЕНИЕ КИНЕМАТОГРАФИЧНЫХ РЕЖИМОВ ПОГОДЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  const sel = document.getElementById('weather-effect');
  if (!sel) return;

  const extra = new Array(
    { v: 'storm', t: '⚡ Гроза + Ливень и Молнии' },
    { v: 'embers', t: '🔥 Искры костра и тлеющий пепел' },
    { v: 'leaves', t: '🍁 Осенний листопад (Реагирует на мышь)' },
    { v: 'aurora', t: '🌌 Северное сияние (Перелив вверху)' }
  );

  extra.forEach(item => {
    if (!sel.querySelector(`option[value="${item.v}"]`)) {
      const opt = document.createElement('option');
      opt.value = item.v;
      opt.textContent = item.t;
      sel.appendChild(opt);
    }
  });

  chrome.storage.local.get(['weather-effect'], res => {
    if (res && res['weather-effect']) sel.value = res['weather-effect'];
  });
})();

// === ДОБАВЛЕНИЕ ПЛАВНОГО ПРИБЛИЖЕНИЯ И БЛИКА В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  const animSelect = document.getElementById('anim-style');
  if (!animSelect) return;

  const extraAnims = new Array(
    { v: 'smooth-zoom', t: '🔍 Плавное приближение (Без дёрганья)' },
    { v: 'shine-zoom', t: '✨ Приближение + Белый блик по стеклу' }
  );

  extraAnims.forEach(item => {
    if (!animSelect.querySelector(`option[value="${item.v}"]`)) {
      const opt = document.createElement('option');
      opt.value = item.v;
      opt.textContent = item.t;
      animSelect.appendChild(opt);
    }
  });

  chrome.storage.local.get(['anim-style'], res => {
    if (res && res['anim-style']) animSelect.value = res['anim-style'];
  });
})();

// === МЕНЮ СТЕКЛЯННЫХ ПЛАШЕК РОЛЕЙ (В КОНЕЦ POPUP.JS) ===
(function() {
  const saveBtn = document.getElementById('save-btn');
  if (!saveBtn || document.getElementById('badge-style')) return;

  const sec = document.createElement('div');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="label">🪪 Плашки ролей под аватаркой</div>
    <select id="badge-style">
      <option value="default">Стандартные (Как на форуме)</option>
      <option value="glass-capsule">💎 Стеклянные неоновые капсулы</option>
    </select>
  `;
  saveBtn.parentNode.insertBefore(sec, saveBtn);

  const sel = document.getElementById('badge-style');
  chrome.storage.local.get(['badge-style'], res => {
    if (res && res['badge-style']) sel.value = res['badge-style'];
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.local.set({ 'badge-style': sel.value });
  });
})();

// === НОВЫЕ СТЕКЛЯННЫЕ ЭФФЕКТЫ И ШЛЕЙФ КУРСОРА В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  const graySel = document.getElementById('gray-control');
  if (graySel) {
    const newGlass = new Array(
      { v: 'frost', t: '🔮 Матовый лёд (Сильное размытие)' },
      { v: 'obsidian', t: '🌌 Тёмный обсидиан (Зеркальный глянец)' },
      { v: 'holo', t: '🌈 Голографическое стекло (Перелив)' },
      { v: 'cyber', t: '⚡ Кибер-сетка (Микро-карбон + Неон)' }
    );
    newGlass.forEach(item => {
      if (!graySel.querySelector(`option[value="${item.v}"]`)) {
        const opt = document.createElement('option');
        opt.value = item.v;
        opt.textContent = item.t;
        graySel.appendChild(opt);
      }
    });
    chrome.storage.local.get(['gray-control'], r => { if (r && r['gray-control']) graySel.value = r['gray-control']; });
  }

  const saveBtn = document.getElementById('save-btn');
  if (!saveBtn || document.getElementById('cursor-trail')) return;

  const sec = document.createElement('div');
  sec.className = 'section';
  sec.innerHTML = `
    <div class="label">✨ Шлейф курсора и фокус чтения</div>
    <select id="cursor-trail">
      <option value="off">Выключено</option>
      <option value="ribbon">☄️ Неоновая лента за курсором</option>
      <option value="sparks">🎇 Россыпь неоновых искр</option>
      <option value="focus-ribbon">📖 Фокус чтения поста + Неоновая лента</option>
    </select>
  `;
  saveBtn.parentNode.insertBefore(sec, saveBtn);

  const trailSel = document.getElementById('cursor-trail');
  chrome.storage.local.get(['cursor-trail'], r => { if (r && r['cursor-trail']) trailSel.value = r['cursor-trail']; });
  saveBtn.addEventListener('click', () => { chrome.storage.local.set({ 'cursor-trail': trailSel.value }); });
})();

// === ДОБАВЛЕНИЕ 4 НОВЫХ ЭФФЕКТОВ НАВЕДЕНИЯ НА ТЕМЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  const animSel = document.getElementById('anim-style');
  if (!animSel) return;

  const moreAnims = new Array(
    { v: 'neon-bar', t: '🌊 Всплытие + Неоновая полоса слева' },
    { v: 'cyber-slide', t: '⚡ Плавный выезд вправо + Двойной блик' },
    { v: 'levitate', t: '🔮 Левитация с дышащим ореолом' },
    { v: 'laser-border', t: '💎 Подъём + Лазерные линии сверху и снизу' }
  );

  moreAnims.forEach(item => {
    if (!animSel.querySelector(`option[value="${item.v}"]`)) {
      const opt = document.createElement('option');
      opt.value = item.v;
      opt.textContent = item.t;
      animSel.appendChild(opt);
    }
  });

  chrome.storage.local.get(['anim-style'], r => { if (r && r['anim-style']) animSel.value = r['anim-style']; });
})();

// === СОВРЕМЕННЫЙ ВКЛАДОЧНЫЙ ИНТЕРФЕЙС ДЛЯ POPUP (В КОНЕЦ POPUP.JS) ===
(function() {
  function buildTabbedPopup() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || document.getElementById('hokage-popup-tabs')) return;

    // 1. Внедряем стильный тёмно-неоновый дизайн для вкладок
    const style = document.createElement('style');
    style.textContent = `
      body {
        width: 380px !important;
        min-height: 440px !important;
        max-height: 560px !important;
        display: flex !important;
        flex-direction: column !important;
        background: radial-gradient(circle at top right, #161b2e 0%, #0b0d14 100%) !important;
        color: #fff !important;
        padding: 14px !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      #hokage-popup-tabs {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
        margin-bottom: 12px;
        background: rgba(255, 255, 255, 0.04);
        padding: 5px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;
      }
      .hk-tab-btn {
        background: transparent;
        border: 1px solid transparent;
        color: #9aa0b2;
        padding: 7px 4px;
        border-radius: 7px;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s ease;
        text-align: center;
        white-space: nowrap;
      }
      .hk-tab-btn:hover {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.06);
      }
      .hk-tab-btn.active {
        background: rgba(0, 242, 254, 0.14);
        border-color: #00f2fe;
        color: #ffffff;
        box-shadow: 0 0 12px rgba(0, 242, 254, 0.3);
      }
      #hokage-tab-viewport {
        flex: 1;
        overflow-y: auto;
        padding-right: 4px;
        margin-bottom: 12px;
      }
      #hokage-tab-viewport::-webkit-scrollbar {
        width: 4px;
      }
      #hokage-tab-viewport::-webkit-scrollbar-thumb {
        background: rgba(0, 242, 254, 0.4);
        border-radius: 4px;
      }
      .hk-tab-pane {
        display: none;
        animation: hkFadeIn 0.25s ease;
      }
      .hk-tab-pane.active {
        display: block;
      }
      @keyframes hkFadeIn {
        from { opacity: 0; transform: translateY(4px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .section {
        background: rgba(255, 255, 255, 0.035) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 10px !important;
        padding: 10px 12px !important;
        margin-bottom: 10px !important;
        transition: border-color 0.2s ease !important;
      }
      .section:hover {
        border-color: rgba(0, 242, 254, 0.4) !important;
      }
      #save-btn {
        flex-shrink: 0 !important;
        width: 100% !important;
        margin-top: auto !important;
        box-shadow: 0 0 15px rgba(0, 242, 254, 0.35) !important;
      }
    `;
    document.head.appendChild(style);

    // 2. Создаём панель вкладок и контейнер контента
    const tabsBar = document.createElement('div');
    tabsBar.id = 'hokage-popup-tabs';

    const viewport = document.createElement('div');
    viewport.id = 'hokage-tab-viewport';

    const tabDefs = new Array(
      { id: 'style',   label: '🎨 Стиль' },
      { id: 'effects', label: '✨ Эффекты' },
      { id: 'weather', label: '❄️ Погода' },
      { id: 'other',   label: '🛡️ Прочее' }
    );

    const panes = new Object();
    tabDefs.forEach((t, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'hk-tab-btn' + (idx === 0 ? ' active' : '');
      btn.textContent = t.label;
      btn.dataset.target = t.id;

      const pane = document.createElement('div');
      pane.className = 'hk-tab-pane' + (idx === 0 ? ' active' : '');
      pane.id = 'hk-pane-' + t.id;

      btn.onclick = () => {
        tabsBar.querySelectorAll('.hk-tab-btn').forEach(b => b.classList.remove('active'));
        viewport.querySelectorAll('.hk-tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        pane.classList.add('active');
      };

      tabsBar.appendChild(btn);
      viewport.appendChild(pane);
      panes[t.id] = pane;
    });

    // Вставляем вкладки перед первой секцией, а вьюпорт перед кнопкой сохранения
    const allSections = Array.from(document.querySelectorAll('.section'));
    if (allSections.length > 0) {
      allSections.at(0).parentNode.insertBefore(tabsBar, allSections.at(0));
    }
    saveBtn.parentNode.insertBefore(viewport, saveBtn);

    // 3. Умное распределение всех твоих секций по нужным разделам
    allSections.forEach(sec => {
      const text = (sec.innerText || '').toLowerCase();
      const html = sec.innerHTML || '';

      if (html.includes('weather-effect') || text.includes('атмосфера')) {
        panes.weather.appendChild(sec);
      } else if (
        html.includes('anim-style') ||
        html.includes('title-style') ||
        html.includes('badge-style') ||
        html.includes('custom-cursor') ||
        html.includes('cursor-trail') ||
        text.includes('подлёт') ||
        text.includes('заголовка') ||
        text.includes('плашки') ||
        text.includes('курсор') ||
        text.includes('шлейф')
      ) {
        panes.effects.appendChild(sec);
      } else if (
        html.includes('nick-mode') ||
        html.includes('review-mode') ||
        text.includes('ник') ||
        text.includes('обзор')
      ) {
        panes.other.appendChild(sec);
      } else {
        // Фон, размытие, цвет рамок, прозрачность и контроль серости идут в "Стиль"
        panes.style.appendChild(sec);
      }
    });
  }

  // Запускаем с небольшой задержкой, чтобы все предыдущие скрипты успели создать свои секции
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(buildTabbedPopup, 60));
  } else {
    setTimeout(buildTabbedPopup, 60);
  }
})();

// === ПРИМЕНЕНИЕ НАСТРОЕК БЕЗ ПЕРЕЗАГРУЗКИ СТРАНИЦЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  // 1. Блокируем принудительную перезагрузку вкладки форума
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.reload = function() {};
    }
  } catch (e) {}

  // 2. Красивое подтверждение прямо на кнопке сохранения
  function attachInstantFeedback() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || saveBtn.dataset.instantHooked) return;
    saveBtn.dataset.instantHooked = 'true';

    const origText = saveBtn.textContent || 'Применить настройки';

    saveBtn.addEventListener('click', function() {
      saveBtn.textContent = '✅ Применено мгновенно!';
      saveBtn.style.setProperty('background', 'linear-gradient(90deg, #00c853, #00e676)', 'important');
      saveBtn.style.setProperty('color', '#0b0d14', 'important');

      setTimeout(() => {
        saveBtn.textContent = origText;
        saveBtn.style.removeProperty('background');
        saveBtn.style.removeProperty('color');
      }, 1400);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachInstantFeedback);
  } else {
    attachInstantFeedback();
  }
})();

// === ДОБАВЛЕНИЕ ВЫБОРА СТИЛЯ КАРТОЧЕК ТЕМ В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addTopicStyleOption() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || document.getElementById('topic-card-style')) return;

    const sec = document.createElement('div');
    sec.className = 'section';
    sec.innerHTML = `
      <div class="label">🃏 Стиль карточек тем и разделов</div>
      <select id="topic-card-style">
        <option value="default">💎 Стекло (Текущий стандарт)</option>
        <option value="capsule">⚡ Неоновые капсулы (Отдельные блоки)</option>
        <option value="cyber-left">🎯 Кибер-акцент (Полоса слева + Градиент)</option>
        <option value="double-vip">🔮 Двойной VIP-контур</option>
        <option value="minimal-line">🌌 Минимализм (Только нижняя нить)</option>
        <option value="dark-carbon">🔥 Глубокий карбон (Верхний блик)</option>
      </select>
    `;

    // Кладём сразу во вкладку "Стиль", если вкладки уже созданы
    const stylePane = document.getElementById('hk-pane-style');
    if (stylePane) {
      stylePane.appendChild(sec);
    } else {
      saveBtn.parentNode.insertBefore(sec, saveBtn);
    }

    const sel = document.getElementById('topic-card-style');
    chrome.storage.local.get(['topic-card-style'], r => {
      if (r && r['topic-card-style']) sel.value = r['topic-card-style'];
    });

    saveBtn.addEventListener('click', () => {
      chrome.storage.local.set({ 'topic-card-style': sel.value });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addTopicStyleOption, 90));
  } else {
    setTimeout(addTopicStyleOption, 90);
  }
})();

// === ДОБАВЛЕНИЕ БЕСЦВЕТНОГО РЕЖИМА РАМОК В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  const colorSel = document.getElementById('ui-color');
  if (!colorSel || colorSel.querySelector('option[value="none"]')) return;

  const opt = document.createElement('option');
  opt.value = 'none';
  opt.textContent = '🤍 Бесцветный (Без рамок и неона)';
  colorSel.appendChild(opt);

  chrome.storage.local.get(['ui-color'], res => {
    if (res && res['ui-color'] === 'none') colorSel.value = 'none';
  });
})();

// === ДОБАВЛЕНИЕ СТИЛЯ LIQUID GLASS (IOS) В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addLiquidGlassOption() {
    const cardSel = document.getElementById('topic-card-style');
    if (!cardSel || cardSel.querySelector('option[value="liquid-glass"]')) return;

    const opt = document.createElement('option');
    opt.value = 'liquid-glass';
    opt.textContent = '💧 Liquid Glass (Жидкое стекло iOS)';
    cardSel.insertBefore(opt, cardSel.firstChild);

    chrome.storage.local.get(['topic-card-style'], r => {
      if (r && r['topic-card-style']) cardSel.value = r['topic-card-style'];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addLiquidGlassOption, 150));
  } else {
    setTimeout(addLiquidGlassOption, 150);
  }
})();

// === ДОБАВЛЕНИЕ ПРЯМОГО УВЕЛИЧЕНИЯ НА ТЕБЯ В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addDirectZoomOption() {
    const animSel = document.getElementById('anim-style');
    if (!animSel || animSel.querySelector('option[value="direct-zoom"]')) return;

    const opt = document.createElement('option');
    opt.value = 'direct-zoom';
    opt.textContent = '🎯 Прямое увеличение на тебя (Без сдвигов)';
    animSel.insertBefore(opt, animSel.firstChild);

    chrome.storage.local.get(['anim-style'], r => {
      if (r && r['anim-style']) animSel.value = r['anim-style'];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addDirectZoomOption, 160));
  } else {
    setTimeout(addDirectZoomOption, 160);
  }
})();

// === НАСТРОЙКА ПЕРСОНАЛЬНОГО ЦВЕТА И ПЕРЕЛИВА СВОЕГО НИКА (В КОНЕЦ POPUP.JS) ===
(function() {
  function initPersonalNickUI() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || document.getElementById('hk-my-profile-url')) return;

    const sec = document.createElement('div');
    sec.className = 'section';
    sec.innerHTML = `
      <div class="label">👑 Ссылка на твой профиль (для личного ника)</div>
      <input type="text" id="hk-my-profile-url" placeholder="https://blackrussia.online..."
             style="width:100%; background:#141824; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:7px; padding:7px; font-size:12px; box-sizing:border-box; margin-bottom:8px;">
      <div class="label">🎨 Цвет или перелив твоего ника</div>
      <select id="hk-my-nick-style" style="width:100%; background:#141824; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:7px; padding:7px; font-size:12px;">
        <option value="off">По умолчанию (Как у всех)</option>
        <optgroup label="Однотонные цвета">
          <option value="solid-cyan">💎 Неоновый голубой</option>
          <option value="solid-gold">👑 Королевский золотой</option>
          <option value="solid-red">🔥 Алый неон</option>
          <option value="solid-purple">🔮 Пурпурный неон</option>
          <option value="solid-mint">🌿 Ярко-мятный</option>
          <option value="solid-white">⚪ Чистый белый с ореолом</option>
        </optgroup>
        <optgroup label="Анимированные переливы">
          <option value="grad-dark-silver">🌑 Серо-чёрный перелив (Obsidian)</option>
          <option value="grad-gold-wave">✨ Перелив жидкого золота</option>
          <option value="grad-cyber">🌌 Неоновый перелив (Голубой + Пурпур)</option>
          <option value="grad-fire">🔥 Огненный перелив (Алый + Золото)</option>
          <option value="grad-rgb">🌈 Плавный RGB-перелив</option>
        </optgroup>
      </select>
    `;

    // Кладём во вкладку "Прочее", если есть вкладки, иначе перед кнопкой сохранения
    const otherPane = document.getElementById('hk-pane-other') || document.getElementById('pane-other');
    if (otherPane) {
      otherPane.appendChild(sec);
    } else {
      saveBtn.parentNode.insertBefore(sec, saveBtn);
    }

    const urlInp = document.getElementById('hk-my-profile-url');
    const styleSel = document.getElementById('hk-my-nick-style');

    chrome.storage.local.get(['hk-my-profile-url', 'hk-my-nick-style'], res => {
      if (res && res['hk-my-profile-url']) urlInp.value = res['hk-my-profile-url'];
      if (res && res['hk-my-nick-style']) styleSel.value = res['hk-my-nick-style'];
    });

    saveBtn.addEventListener('click', () => {
      chrome.storage.local.set({
        'hk-my-profile-url': urlInp.value.trim(),
        'hk-my-nick-style': styleSel.value
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initPersonalNickUI, 120));
  } else {
    setTimeout(initPersonalNickUI, 120);
  }
})();

// === ДОБАВЛЕНИЕ БОЛЬШЕ ЦВЕТОВ И ПЕРЕЛИВОВ ДЛЯ ЛИЧНОГО НИКА (В КОНЕЦ POPUP.JS) ===
(function() {
  function expandNickColors() {
    const sel = document.getElementById('hk-my-nick-style');
    if (!sel || sel.querySelector('option[value="grad-black-red"]')) return;

    const groups = sel.querySelectorAll('optgroup');
    const solidGroup = groups.item(0);
    const gradGroup = groups.item(1);

    if (solidGroup) {
      solidGroup.insertAdjacentHTML('beforeend', `
        <option value="solid-pink">🌸 Неоновый розовый (Hot Pink)</option>
        <option value="solid-blue">🌊 Глубокий синий (Cobalt)</option>
        <option value="solid-orange">🍊 Огненный оранжевый</option>
        <option value="solid-lime">🍋 Яркий лайм (Electric Lime)</option>
        <option value="solid-peach">🍑 Персиково-коралловый</option>
      `);
    }

    if (gradGroup) {
      gradGroup.insertAdjacentHTML('beforeend', `
        <option value="grad-black-red">🩸 Чёрно-алый перелив (Black & Crimson)</option>
        <option value="grad-black-purple">🟣 Чёрно-фиолетовый перелив (Amethyst)</option>
        <option value="grad-ice-white">❄️ Ледяной перелив (Arctic Ice)</option>
        <option value="grad-matrix">📟 Перелив Матрица (Dark Emerald)</option>
        <option value="grad-sunset">🌇 Закат в Майами (Pink & Gold)</option>
      `);
    }

    chrome.storage.local.get(['hk-my-nick-style'], r => {
      if (r && r['hk-my-nick-style']) sel.value = r['hk-my-nick-style'];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(expandNickColors, 160));
  } else {
    setTimeout(expandNickColors, 160);
  }
})();

// === ЧИСТАЯ ВКЛАДКА «🔥 РЕДУКСЫ» БЕЗ НАЛОЖЕНИЯ НА ДРУГИЕ ВКЛАДКИ (В КОНЕЦ POPUP.JS) ===
(function() {
  function setupCleanReduxTab() {
    const saveBtn = document.getElementById('save-btn');
    if (!saveBtn || document.getElementById('hk-redux-tab-btn')) return;

    const allBtns = Array.from(document.querySelectorAll('button, div[role="tab"], .tab-btn, .hk-tab'));
    const refBtn = allBtns.find(b => /прочее|стиль|погода|эффекты/i.test(b.textContent || ''));
    if (!refBtn || !refBtn.parentNode) return;

    const tabBar = refBtn.parentNode;

    // Уменьшаем отступы и шрифт кнопок вкладок, чтобы 5 вкладок влезли ровно
    tabBar.style.cssText += '; display:flex !important; gap:3px !important; justify-content:space-between !important;';
    Array.from(tabBar.children).forEach(b => {
      b.style.cssText += '; padding:6px 5px !important; font-size:10.5px !important; flex:1 !important; text-align:center !important; white-space:nowrap !important;';
    });

    const reduxBtn = refBtn.cloneNode(true);
    reduxBtn.id = 'hk-redux-tab-btn';
    reduxBtn.classList.remove('active');
    reduxBtn.textContent = '🔥 Редуксы';
    tabBar.appendChild(reduxBtn);

    const pane = document.createElement('div');
    pane.id = 'hk-pane-redux';
    pane.style.cssText = 'display:none !important; margin-top:8px;';

    pane.innerHTML = `
      <div style="font-size:11px; color:#9aa0b2; margin-bottom:8px;">
        Выбери <b>Redux-пак</b>: включает уникальную атмосферу, эффекты, шрифты и перелив ника.
      </div>

      <div class="hk-rdx-card" data-redux="fortuna" style="background:linear-gradient(135deg, rgba(190,0,25,0.32), rgba(10,12,18,0.95)); border:1px solid #ff2a4b; border-radius:10px; padding:9px 11px; margin-bottom:7px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="color:#ff4d6d; font-size:12.5px;">🩸 FORTUNA 812 REDUX</b>
          <span class="hk-rdx-status" style="font-size:10px; padding:2px 7px; border-radius:6px; background:rgba(255,42,75,0.25); color:#ff8fa3;">Выбрать</span>
        </div>
        <div style="font-size:10.5px; color:#ccc; margin-top:3px;">Кровавая виньетка • Пульс неона • Чёрно-алый ник • Пепел</div>
      </div>

      <div class="hk-rdx-card" data-redux="villian" style="background:linear-gradient(135deg, rgba(114,9,183,0.32), rgba(10,12,18,0.95)); border:1px solid #b5179e; border-radius:10px; padding:9px 11px; margin-bottom:7px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="color:#e0aaff; font-size:12.5px;">🦇 VILLIAN REDUX</b>
          <span class="hk-rdx-status" style="font-size:10px; padding:2px 7px; border-radius:6px; background:rgba(181,23,158,0.25); color:#e0aaff;">Выбрать</span>
        </div>
        <div style="font-size:10.5px; color:#ccc; margin-top:3px;">Аметистовый туман • Чёрно-фиолетовый ник • Искры</div>
      </div>

      <div class="hk-rdx-card" data-redux="madk1d" style="background:linear-gradient(135deg, rgba(0,242,254,0.26), rgba(10,12,18,0.95)); border:1px solid #00f2fe; border-radius:10px; padding:9px 11px; margin-bottom:7px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="color:#00f2fe; font-size:12.5px;">⚡ MADK1D REDUX</b>
          <span class="hk-rdx-status" style="font-size:10px; padding:2px 7px; border-radius:6px; background:rgba(0,242,254,0.25); color:#90e0ef;">Выбрать</span>
        </div>
        <div style="font-size:10.5px; color:#ccc; margin-top:3px;">RGB-глитч заголовков • Кибер-рамки • Ливень и лента</div>
      </div>

      <div class="hk-rdx-card" data-redux="prince" style="background:linear-gradient(135deg, rgba(226,232,240,0.24), rgba(10,12,18,0.96)); border:1px solid #e2e8f0; border-radius:10px; padding:9px 11px; margin-bottom:8px; cursor:pointer;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <b style="color:#f8fafc; font-size:12.5px;">👑 ТЁМНЫЙ ПРИНЦ REDUX</b>
          <span class="hk-rdx-status" style="font-size:10px; padding:2px 7px; border-radius:6px; background:rgba(255,255,255,0.18); color:#fff;">Выбрать</span>
        </div>
        <div style="font-size:10.5px; color:#ccc; margin-top:3px;">Холодное серебро • Серо-чёрный ник • Стекло и сугробы</div>
      </div>

      <button id="hk-redux-off-btn" type="button" style="width:100%; padding:8px; background:rgba(255,77,77,0.18); border:1px solid #ff4d4d; color:#ff8fa3; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer;">
        🔄 Отключить редукс (Вернуть ручные настройки)
      </button>
    `;

    saveBtn.parentNode.insertBefore(pane, saveBtn);

    // Ищем все родные секции/панели настроек в окне
    const nativeContainers = Array.from(saveBtn.parentNode.children).filter(el =>
      el !== tabBar && el !== pane && el !== saveBtn &&
      !el.id.includes('reset') && el.tagName === 'DIV' && el.offsetTop > 30
    );

    reduxBtn.addEventListener('click', () => {
      Array.from(tabBar.children).forEach(b => b.classList.remove('active'));
      reduxBtn.classList.add('active');
      nativeContainers.forEach(c => { c.style.setProperty('display', 'none', 'important'); });
      pane.style.setProperty('display', 'block', 'important');
    });

    Array.from(tabBar.children).forEach(otherBtn => {
      if (otherBtn === reduxBtn) return;
      otherBtn.addEventListener('click', () => {
        reduxBtn.classList.remove('active');
        pane.style.setProperty('display', 'none', 'important');
        nativeContainers.forEach(c => { c.style.removeProperty('display'); });
      });
    });

    function markActive(name) {
      pane.querySelectorAll('.hk-rdx-card').forEach(card => {
        const st = card.querySelector('.hk-rdx-status');
        if (card.dataset.redux === name) {
          card.style.boxShadow = '0 0 16px rgba(255,255,255,0.4)';
          if (st) st.textContent = '✅ АКТИВЕН';
        } else {
          card.style.boxShadow = 'none';
          if (st) st.textContent = 'Выбрать';
        }
      });
    }

    chrome.storage.local.get(['hk-active-redux'], r => markActive((r && r['hk-active-redux']) || 'off'));

    pane.querySelectorAll('.hk-rdx-card').forEach(card => {
      card.addEventListener('click', () => {
        const rdx = card.dataset.redux;
        const packs = new Object();
        packs.fortuna = { 'ui-color': 'red', 'gray-control': 'ghost', 'topic-card-style': 'capsule', 'hk-my-nick-style': 'grad-black-red', 'weather-effect': 'embers', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.villian = { 'ui-color': 'purple', 'gray-control': 'ghost', 'topic-card-style': 'cyber-left', 'hk-my-nick-style': 'grad-black-purple', 'weather-effect': 'embers', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };
        packs.madk1d  = { 'ui-color': 'cyan', 'gray-control': 'ghost', 'topic-card-style': 'double-vip', 'hk-my-nick-style': 'grad-cyber', 'weather-effect': 'rain-real', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.prince  = { 'ui-color': 'none', 'gray-control': 'ghost', 'topic-card-style': 'liquid-glass', 'hk-my-nick-style': 'grad-dark-silver', 'weather-effect': 'snow-real', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };

        const cfg = packs[rdx];
        if (!cfg) return;
        cfg['hk-active-redux'] = rdx;
        chrome.storage.local.set(cfg, () => markActive(rdx));
      });
    });

    document.getElementById('hk-redux-off-btn').addEventListener('click', () => {
      chrome.storage.local.set({ 'hk-active-redux': 'off' }, () => markActive('off'));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(setupCleanReduxTab, 220));
  } else {
    setTimeout(setupCleanReduxTab, 220);
  }
})();

// === ДОБАВЛЕНИЕ 4 НОВЫХ ЭФФЕКТОВ ПОД АРТИСТОВ В МЕНЮ И РЕДУКСЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addArtistEffects() {
    const weatherSel = document.getElementById('weather-effect');
    if (weatherSel && !weatherSel.querySelector('option[value="fortuna-blood"]')) {
      weatherSel.insertAdjacentHTML('beforeend', `
        <option value="fortuna-blood">🩸 Кровавый дождь (Fortuna 812)</option>
        <option value="villian-lightning">🦇 Тёмные молнии (Villian)</option>
        <option value="madk1d-cyber">⚡ Цифровые биты и Глитч (Madk1d)</option>
        <option value="prince-ash">👑 Серебряный пепел (Тёмный Принц)</option>
      `);
      chrome.storage.local.get(['weather-effect'], r => {
        if (r && r['weather-effect']) weatherSel.value = r['weather-effect'];
      });
    }

    // Обновляем логику клика по карточкам редуксов, чтобы они ставили эти новые эффекты
    document.querySelectorAll('.hk-rdx-card').forEach(card => {
      card.onclick = () => {
        const rdx = card.dataset.redux;
        const packs = new Object();
        packs.fortuna = { 'ui-color': 'red', 'gray-control': 'ghost', 'topic-card-style': 'capsule', 'hk-my-nick-style': 'grad-black-red', 'weather-effect': 'fortuna-blood', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.villian = { 'ui-color': 'purple', 'gray-control': 'ghost', 'topic-card-style': 'cyber-left', 'hk-my-nick-style': 'grad-black-purple', 'weather-effect': 'villian-lightning', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };
        packs.madk1d  = { 'ui-color': 'cyan', 'gray-control': 'ghost', 'topic-card-style': 'double-vip', 'hk-my-nick-style': 'grad-cyber', 'weather-effect': 'madk1d-cyber', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.prince  = { 'ui-color': 'none', 'gray-control': 'ghost', 'topic-card-style': 'liquid-glass', 'hk-my-nick-style': 'grad-dark-silver', 'weather-effect': 'prince-ash', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };

        const cfg = packs[rdx];
        if (!cfg) return;
        cfg['hk-active-redux'] = rdx;

        chrome.storage.local.set(cfg, () => {
          document.querySelectorAll('.hk-rdx-card').forEach(c => {
            const st = c.querySelector('.hk-rdx-status');
            if (c.dataset.redux === rdx) {
              c.style.boxShadow = '0 0 16px rgba(255,255,255,0.4)';
              if (st) st.textContent = '✅ АКТИВЕН';
            } else {
              c.style.boxShadow = 'none';
              if (st) st.textContent = 'Выбрать';
            }
          });
        });
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addArtistEffects, 260));
  } else {
    setTimeout(addArtistEffects, 260);
  }
})();

// === ДОБАВЛЕНИЕ РЕЖИМА «3D-ПОДЛЁТ НА ТЕБЯ» В МЕНЮ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addFlyZoomOption() {
    const animSel = document.getElementById('anim-style');
    if (!animSel || animSel.querySelector('option[value="fly-towards"]')) return;

    const opt = document.createElement('option');
    opt.value = 'fly-towards';
    opt.textContent = '🚀 3D-Подлёт на тебя (Плавный вылет)';
    animSel.insertBefore(opt, animSel.firstChild);

    chrome.storage.local.get(['anim-style'], r => {
      if (r && r['anim-style']) animSel.value = r['anim-style'];
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addFlyZoomOption, 190));
  } else {
    setTimeout(addFlyZoomOption, 190);
  }
})();

// === ЖИВЫЕ ПЕРЕЛИВЫ ВНУТРИ ОСТРОВКОВ ТЕМ + ВШИВАНИЕ В РЕДУКСЫ (В КОНЕЦ POPUP.JS) ===
(function() {
  function addTopicFlowStyles() {
    const cardSel = document.getElementById('topic-card-style');
    if (cardSel && !cardSel.querySelector('option[value="flow-red-black"]')) {
      cardSel.insertAdjacentHTML('beforeend', `
        <optgroup label="🌊 Живые переливы внутри тем">
          <option value="flow-red-black">🩸 Красно-чёрный перелив (Fortuna)</option>
          <option value="flow-gray-black">🌑 Серо-чёрный перелив (Obsidian)</option>
          <option value="flow-purple-black">🦇 Фиолетово-чёрный перелив (Villian)</option>
          <option value="flow-cyan-black">⚡ Кибер-чёрный перелив (Madk1d)</option>
          <option value="flow-gold-black">👑 Золото-чёрный перелив (Royal)</option>
        </optgroup>
      `);
      chrome.storage.local.get(['topic-card-style'], r => {
        if (r && r['topic-card-style']) cardSel.value = r['topic-card-style'];
      });
    }

    // Обновляем редуксы, чтобы каждый автоматически включал свой перелив внутри тем
    document.querySelectorAll('.hk-rdx-card').forEach(card => {
      card.onclick = () => {
        const rdx = card.dataset.redux;
        const packs = new Object();
        packs.fortuna = { 'ui-color': 'red', 'gray-control': 'ghost', 'topic-card-style': 'flow-red-black', 'hk-my-nick-style': 'grad-black-red', 'weather-effect': 'fortuna-blood', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.villian = { 'ui-color': 'purple', 'gray-control': 'ghost', 'topic-card-style': 'flow-purple-black', 'hk-my-nick-style': 'grad-black-purple', 'weather-effect': 'villian-lightning', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };
        packs.madk1d  = { 'ui-color': 'cyan', 'gray-control': 'ghost', 'topic-card-style': 'flow-cyan-black', 'hk-my-nick-style': 'grad-cyber', 'weather-effect': 'madk1d-cyber', 'cursor-trail': 'ribbon', 'badge-style': 'glass-capsule' };
        packs.prince  = { 'ui-color': 'none', 'gray-control': 'ghost', 'topic-card-style': 'flow-gray-black', 'hk-my-nick-style': 'grad-dark-silver', 'weather-effect': 'prince-ash', 'cursor-trail': 'sparks', 'badge-style': 'glass-capsule' };

        const cfg = packs[rdx];
        if (!cfg) return;
        cfg['hk-active-redux'] = rdx;

        chrome.storage.local.set(cfg, () => {
          document.querySelectorAll('.hk-rdx-card').forEach(c => {
            const st = c.querySelector('.hk-rdx-status');
            if (c.dataset.redux === rdx) {
              c.style.boxShadow = '0 0 16px rgba(255,255,255,0.4)';
              if (st) st.textContent = '✅ АКТИВЕН';
            } else {
              c.style.boxShadow = 'none';
              if (st) st.textContent = 'Выбрать';
            }
          });
        });
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addTopicFlowStyles, 300));
  } else {
    setTimeout(addTopicFlowStyles, 300);
  }
})();

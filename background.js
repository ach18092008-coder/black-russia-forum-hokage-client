chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "askGemini") {
    
    // Подтягиваем ключ, который ввел сам пользователь в настройках
    chrome.storage.local.get(['user_gemini_key'], function(res) {
      var apiKey = (res && res.user_gemini_key) ? res.user_gemini_key.trim() : "";
      
      if (!apiKey) {
        sendResponse({ success: false, text: "Ошибка: Укажите ваш личный API-ключ Gemini в меню расширения!" });
        return;
      }

      const url = `https://googleapis.com{apiKey}`;
      const systemInstruction = "Ты — продвинутый ИИ-модератор форума Black Russia. Твоя задача — генерировать официальные, строго структурированные и вежливые ответы для игроков на их жалобы, апелляции или отчеты. Используй терминологию CRMP (Nick_Name, DM, SK, ТК, ЕПП, Администрация). Пиши кратко, по делу и профессионально.";

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: request.prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.7
          }
        })
      })
      .then(response => {
        if (!response.ok) throw new Error("Неверный ключ или лимиты ИИ исчерпаны.");
        return response.json();
      })
      .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          sendResponse({ success: true, text: data.candidates[0].content.parts[0].text });
        } else {
          sendResponse({ success: false, text: "Ошибка: Получен пустой или некорректный ответ от ИИ." });
        }
      })
      .catch(error => {
        sendResponse({ success: false, text: "Ошибка: " + error.message });
      });
    });

    return true; // Держит канал связи открытым для асинхронного ответа fetch
  }
});

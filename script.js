document.addEventListener('DOMContentLoaded', () => {
  // ========== Element References ==========
  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");
  const messagesContainer = document.getElementById("messagesContainer");
  const clearBtn = document.querySelector(".clear-btn");
  const sendBtn = document.getElementById("sendBtn");
  const voiceBtn = document.getElementById("voiceBtn");
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggleSidebar');
  const modeBtns = document.querySelectorAll('.mode-btn');

  // ========== State Management ==========
  let currentMode = 'chat';
  let isProcessing = false;
  let isListening = false;

  // ========== Initial welcome message ==========
  appendMessage("bot", "Hello, I am MY,personal AI assistant created by MIKISA (MIKO). How can I help you today?");

  // ========== Toggle Sidebar ==========
  function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    const toggleIcon = toggleSidebarBtn.querySelector('i');
    toggleIcon.classList.toggle('fa-chevron-left');
    toggleIcon.classList.toggle('fa-chevron-right');
  }
  toggleSidebarBtn.addEventListener('click', toggleSidebar);

  // ========== Change Mode Styling ==========
  function changeMode(mode) {
    currentMode = mode;
    modeBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.mode === mode) btn.classList.add('active');
    });

    messageInput.placeholder = `Ask me anything in ${mode} mode...`;
    const inputWrapper = document.querySelector('.input-wrapper');
    const gradients = {
      chat: 'linear-gradient(to right, #6366f1, #8b5cf6)',
      create: 'linear-gradient(to right, #10b981, #059669)',
      analyze: 'linear-gradient(to right, #f59e0b, #d97706)'
    };
    inputWrapper.style.background = gradients[mode] || gradients.chat;
  }
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => changeMode(btn.dataset.mode));
  });

  // ========== Submit Message ==========
  messageForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMessage = messageInput.value.trim();
    if (userMessage === "" || isProcessing) return;

    appendMessage("user", userMessage);
    messageInput.value = "";
    showTypingAnimation();
    isProcessing = true;

    try {
      const botReply = await getBotReply(userMessage);
      removeTypingAnimation();
      appendMessage("bot", botReply);
    } catch (error) {
      console.error("Error:", error);
      removeTypingAnimation();
      appendMessage("bot", "Sorry, I could not process your request. Please try again later.");
    } finally {
      isProcessing = false;
    }
  });

  // ========== Append Message with Typewriter Effect for Bot ==========
  function appendMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.innerHTML = `<div class="message-bubble">${sender === 'user' ? text : '<span class="typing-placeholder"></span>'}</div>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    if (sender === 'bot') {
      const typingPlaceholder = messageDiv.querySelector('.typing-placeholder');
      applyTypewriterEffect(typingPlaceholder, text);
    }
  }

  function applyTypewriterEffect(element, text) {
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        element.textContent = text.substring(0, i + 1);
        i++;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      } else {
        clearInterval(interval);
      }
    }, 20);
  }

  // ========== Typing Animation ==========
  function showTypingAnimation() {
    const typingDiv = document.createElement("div");
    typingDiv.classList.add("message", "bot", "typing");
    typingDiv.innerHTML = `<div class="message-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function removeTypingAnimation() {
    const typing = messagesContainer.querySelector(".typing");
    if (typing) typing.remove();
  }

  // ========== Bot Reply from Gemini API ==========
  const predefinedResponses = {
    "Who are you?": "I am MY.",
    "Who created you?": "I was created by Mikias, also known as Maiko."
  };

  if (predefinedResponses[userMessage]) {
    return predefinedResponses[userMessage];
  }


  async function getBotReply(userMessage) {
    const API_KEY = "AIzaSyBjTNLLlkAiTEYinmfREes63K1Ql2vc26I"; // Replace with your actual API key
    const MODEL = "gemini-2.0-flash";

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }],
            generationConfig: { maxOutputTokens: 200 } // Adjust as needed
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API Error:", errorData);
        return "Sorry, there was an issue communicating with the AI.";
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received.";
    } catch (error) {
      console.error("Error fetching Gemini response:", error);
      return "Sorry, I encountered an error processing your request.";
    }
  }

  // ========== Clear Chat ==========
  clearBtn.addEventListener("click", () => {
    messagesContainer.innerHTML = "";
    appendMessage("bot", "Chat cleared. How can I help you now?");
  });

  // ========== Voice Input (Web Speech API) ==========
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener("click", () => {
      recognition.start();
      voiceBtn.classList.add('listening');
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      messageInput.value = transcript;
      voiceBtn.classList.remove('listening');
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      voiceBtn.classList.remove('listening');
    };
  } else {
    voiceBtn.disabled = true;
    voiceBtn.title = "Voice recognition not supported in this browser.";
  }

  // ========== Handle Resize for Sidebar (Optional) ==========
  function handleResize() {
    if (window.innerWidth <= 768) {
      sidebar.classList.add('collapsed');
    } else {
      sidebar.classList.remove('collapsed');
    }
  }
  handleResize();
  window.addEventListener('resize', handleResize);
});
let recognition;
let isSpeaking = false;

function speak(text, callback) {
  const codeLike = /[`{};()<>=\[\]\/\\]|function|var|const|let|<.+?>/i;
  const isCode = text.includes("```") || codeLike.test(text) || text.split("\n").length > 6;
  if (isCode) {
    callback?.();
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  let wait = 0;
  function trySpeak() {
    const voices = synth.getVoices();
    if (!voices.length) {
      if (wait++ < 10) return setTimeout(trySpeak, 250);
      else {
        alert("⚠️ No voices available.");
        callback?.();
        return;
      }
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voices.find(v => v.lang.startsWith("en")) || voices[0];
    utter.lang = utter.voice.lang;
    utter.pitch = 1;
    utter.rate = 1;

    utter.onend = () => {
      isSpeaking = false;
      callback?.();
    };

    isSpeaking = true;
    synth.speak(utter);
  }

  trySpeak();
}

function appendMessage(text, isUser = false) {
  const msg = document.createElement("div");
  msg.className = `message ${isUser ? 'user' : 'bot'}`;
  msg.innerText = text;
  document.getElementById("chat-history").appendChild(msg);
  document.getElementById("chat-history").scrollTop = document.getElementById("chat-history").scrollHeight;
}

async function sendQuery(query) {
  appendMessage(`👤 You: ${query}`, true);
  stopRecognition();

  // Check for local browser commands
  if (handleLocalCommand(query)) {
    appendMessage("🤖 Jarvis: Command executed.");
    speak("Command executed", () => startRecognition());
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    const responseText = data.response;
    appendMessage(`🤖 Jarvis: ${responseText}`);
    speak(responseText, () => {
      if (!isSpeaking) startRecognition();
    });
  } catch (err) {
    appendMessage("❌ Failed to get response from server.");
    startRecognition();
  }
}

function handleLocalCommand(query) {
  const q = query.toLowerCase();
  if (q.startsWith("open ")) {
    const target = q.replace("open ", "").trim();
    if (target.includes("google")) {
      window.open("https://www.google.com", "_blank");
      return true;
    }
    if (target.includes("youtube")) {
      window.open("https://www.youtube.com", "_blank");
      return true;
    }
    if (target.includes("facebook")) {
      window.open("https://www.facebook.com", "_blank");
      return true;
    }
    if (target.includes("notes")) {
      fetch("http://localhost:5000/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: "notepad" })
      });
      return true;
    }
  }
  if (q.startsWith("search for ")) {
    const topic = q.replace("search for ", "").trim();
    window.open(`https://www.google.com/search?q=${encodeURIComponent(topic)}`, "_blank");
    return true;
  }
  if (q.startsWith("search youtube for ")) {
    const topic = q.replace("search youtube for ", "").trim();
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`, "_blank");
    return true;
  }
  return false;
}

function startRecognition() {
  if (!("webkitSpeechRecognition" in window)) return;
  if (isSpeaking) return;

  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    document.getElementById("listening-indicator").style.display = 'flex';
  };

  recognition.onend = () => {
    document.getElementById("listening-indicator").style.display = 'none';
    if (!isSpeaking) setTimeout(startRecognition, 800);
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    sendQuery(transcript);
  };

  recognition.onerror = function (event) {
    appendMessage("❌ Error: " + event.error);
    setTimeout(startRecognition, 2000);
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.onstart = null;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.onresult = null;
    recognition.stop();
    recognition = null;
  }
  document.getElementById("listening-indicator").style.display = 'none';
}

window.onload = () => {
  window.speechSynthesis.cancel();
  startRecognition();
};
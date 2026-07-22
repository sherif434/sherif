```javascript
const orb = document.getElementById('orb');
const statusText = document.getElementById('status-text');
const liveText = document.getElementById('live-text');

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'ar-SA';
recognition.continuous = true;
recognition.interimResults = true;

let isListening = false;

orb.onclick = () => {
    if (!isListening) {
        recognition.start();
        isListening = true;
        orb.classList.add('listening');
        statusText.innerText = "أنا أسمعك الآن...";
    }
};

recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
    }
    
    liveText.innerText = transcript;
    const command = transcript.toLowerCase();

    // منطق الأوامر القوي
    if (command.includes("افتح")) {
        if (command.includes("يوتيوب")) window.open("https://www.youtube.com", "_blank");
        if (command.includes("جوجل")) window.open("https://www.google.com", "_blank");
        if (command.includes("فيس")) window.open("https://www.facebook.com", "_blank");
        if (command.includes("واتس")) window.open("https://web.whatsapp.com", "_blank");
        if (command.includes("شات")) window.open("https://chatgpt.com", "_blank");
        if (command.includes("تيك")) window.open("https://www.tiktok.com", "_blank");
    }
    
    if (command.includes("ابحث عن")) {
        const query = command.split("ابحث عن")[1];
        window.open(`https://www.google.com/search?q=${query}`, "_blank");
    }

    if (command.includes("تحديث")) location.reload();
};

recognition.onend = () => {
    if (isListening) recognition.start(); // استمرار العمل في الخلفية
};

recognition.onerror = (err) => {
    console.error("خطأ صوّتي:", err.error);
    if(err.error === 'not-allowed') alert("فعل الميكروفون من القفل فوق!");
};
```
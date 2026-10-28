(() => {
  const layer = document.getElementById("heartsLayer");
  const heartButton = document.getElementById("heartButton");
  const surpriseButton = document.getElementById("surpriseButton");
  const surpriseMessage = document.getElementById("surpriseMessage");
  const prayerButton = document.getElementById("prayerButton");
  const extraPrayer = document.getElementById("extraPrayer");

  function sendHearts(count = 16) {
    if (!layer) return;
    const symbols = ["♥", "♡", "❤", "✦"];
    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      heart.style.left = (4 + Math.random() * 92) + "%";
      heart.style.fontSize = (14 + Math.random() * 19) + "px";
      heart.style.animationDelay = (Math.random() * 0.9) + "s";
      heart.style.animationDuration = (2.5 + Math.random() * 1.8) + "s";
      layer.appendChild(heart);
      heart.addEventListener("animationend", () => heart.remove(), { once: true });
    }
  }

  heartButton?.addEventListener("click", () => sendHearts(24));

  surpriseButton?.addEventListener("click", () => {
    const isHidden = surpriseMessage.hidden;
    surpriseMessage.hidden = !isHidden;
    surpriseButton.textContent = isHidden ? "اقفل المفاجأة ♡" : "اضغط هنا لمفاجأة صغيرة ✨";
    if (isHidden) sendHearts(28);
  });

  prayerButton?.addEventListener("click", () => {
    const isHidden = extraPrayer.hidden;
    extraPrayer.hidden = !isHidden;
    prayerButton.textContent = isHidden ? "إخفاء الدعوة ♡" : "دعوة أخرى من القلب ♡";
  });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  });
})();
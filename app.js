const promptEl = document.getElementById("prompt");
const charCount = document.getElementById("charCount");
const aspect = document.getElementById("aspect");
const duration = document.getElementById("duration");
const formatBadge = document.getElementById("formatBadge");
const generate = document.getElementById("generate");
const previewContent = document.getElementById("previewContent");
const loader = document.getElementById("loader");
const download = document.getElementById("download");
const newVideo = document.getElementById("newVideo");
const historyEl = document.getElementById("history");
const clearHistory = document.getElementById("clearHistory");

let selectedStyle = "Cinematic";
let history = JSON.parse(localStorage.getItem("aiVideoHistory") || "[]");

promptEl.addEventListener("input", () => {
  if (promptEl.value.length > 1000) promptEl.value = promptEl.value.slice(0, 1000);
  charCount.textContent = promptEl.value.length;
});

aspect.addEventListener("change", () => formatBadge.textContent = aspect.value);

document.querySelectorAll(".style").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".style").forEach(x => x.classList.remove("active"));
    btn.classList.add("active");
    selectedStyle = btn.dataset.style;
  });
});

function renderHistory() {
  if (!history.length) {
    historyEl.innerHTML = '<div class="empty">No generated videos yet.</div>';
    return;
  }
  historyEl.innerHTML = history.map((item, i) => `
    <article class="history-card">
      <div class="thumb">✦</div>
      <div class="info">
        <p>${escapeHtml(item.prompt)}</p>
        <small>${item.style} • ${item.aspect} • ${item.duration}s</small>
      </div>
    </article>
  `).join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

generate.addEventListener("click", () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    promptEl.focus();
    promptEl.style.borderColor = "#e05b78";
    setTimeout(() => promptEl.style.borderColor = "", 900);
    return;
  }

  loader.classList.remove("hidden");
  previewContent.classList.add("hidden");
  generate.disabled = true;
  generate.textContent = "Generating...";

  // Placeholder until Phase 2 connects a real AI video API.
  setTimeout(() => {
    loader.classList.add("hidden");
    previewContent.classList.remove("hidden");
    previewContent.innerHTML = `
      <div class="play-icon">✓</div>
      <h2>Frontend is working</h2>
      <p>Next step: connect a real AI video model.</p>
    `;
    generate.disabled = false;
    generate.innerHTML = '<span class="spark">✦</span> Generate video';

    history.unshift({prompt, style:selectedStyle, aspect:aspect.value, duration:duration.value});
    history = history.slice(0, 9);
    localStorage.setItem("aiVideoHistory", JSON.stringify(history));
    renderHistory();
  }, 1200);
});

newVideo.addEventListener("click", () => {
  promptEl.value = "";
  charCount.textContent = "0";
  previewContent.classList.remove("hidden");
  loader.classList.add("hidden");
  previewContent.innerHTML = `
    <div class="play-icon">▶</div>
    <h2>Your video will appear here</h2>
    <p>Enter a prompt and press Generate.</p>
  `;
  download.disabled = true;
  promptEl.focus();
});

clearHistory.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("aiVideoHistory");
  renderHistory();
});

renderHistory();

import { Client, handle_file } from "https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js";

const SPACE = "zerogpu-aoti/wan2-2-fp8da-aoti-faster";
const promptEl = document.getElementById("prompt");
const charCount = document.getElementById("charCount");
const imageInput = document.getElementById("imageInput");
const uploadTitle = document.getElementById("uploadTitle");
const uploadHint = document.getElementById("uploadHint");
const imagePreview = document.getElementById("imagePreview");
const duration = document.getElementById("duration");
const steps = document.getElementById("steps");
const generate = document.getElementById("generate");
const previewContent = document.getElementById("previewContent");
const loader = document.getElementById("loader");
const loaderTitle = document.getElementById("loaderTitle");
const loaderDetail = document.getElementById("loaderDetail");
const videoOutput = document.getElementById("videoOutput");
const download = document.getElementById("download");
const newVideo = document.getElementById("newVideo");
const statusText = document.getElementById("statusText");
const historyEl = document.getElementById("history");
const clearHistory = document.getElementById("clearHistory");

let history = JSON.parse(localStorage.getItem("aiVideoHistory") || "[]");
let selectedFile = null;

promptEl.addEventListener("input", () => charCount.textContent = promptEl.value.length);

imageInput.addEventListener("change", () => {
  selectedFile = imageInput.files?.[0] || null;
  if (!selectedFile) return;
  imagePreview.src = URL.createObjectURL(selectedFile);
  imagePreview.classList.remove("hidden");
  uploadTitle.textContent = selectedFile.name;
  uploadHint.textContent = "Image ready";
});

function renderHistory() {
  if (!history.length) {
    historyEl.innerHTML = '<div class="empty">No generated videos yet.</div>';
    return;
  }
  historyEl.innerHTML = history.map(item => `
    <article class="history-card">
      <div class="thumb">✦</div>
      <div class="info">
        <p>${escapeHtml(item.prompt)}</p>
        <small>Wan 2.2 • ${item.duration}s • ${item.date}</small>
      </div>
    </article>
  `).join("");
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function getVideoUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value.url) return value.url;
  if (value.path) {
    if (value.path.startsWith("http")) return value.path;
    return `https://zerogpu-aoti-wan2-2-fp8da-aoti-faster.hf.space/file=${encodeURIComponent(value.path)}`;
  }
  return null;
}

async function getEndpoint(app) {
  const api = await app.view_api();
  const names = Object.keys(api.named_endpoints || {});
  const match = names.find(name => name.toLowerCase().includes("generate_video"));
  if (!match) throw new Error("Could not find the video-generation endpoint.");
  return match;
}

generate.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!selectedFile) {
    statusText.textContent = "Please upload an image first.";
    imageInput.click();
    return;
  }
  if (!prompt) {
    statusText.textContent = "Please describe the motion you want.";
    promptEl.focus();
    return;
  }

  generate.disabled = true;
  loader.classList.remove("hidden");
  previewContent.classList.add("hidden");
  videoOutput.classList.add("hidden");
  download.classList.add("disabled");
  loaderTitle.textContent = "Connecting to Wan 2.2...";
  loaderDetail.textContent = "The free ZeroGPU may take a moment to wake up.";
  statusText.textContent = "Submitting your job to the free GPU...";

  try {
    const app = await Client.connect(SPACE);
    const endpoint = await getEndpoint(app);

    loaderTitle.textContent = "Generating your video...";
    loaderDetail.textContent = "Wan 2.2 is animating your image. Please keep this tab open.";

    const negative = "blurry, low quality, distorted, deformed, static, subtitles, text, watermark, bad hands, extra fingers";
    const seed = Math.floor(Math.random() * 2147483647);

    const job = app.submit(endpoint, [
      handle_file(selectedFile),
      prompt,
      Number(steps.value),
      negative,
      Number(duration.value),
      1,
      1,
      seed,
      true
    ]);

    for await (const message of job) {
      if (message.type === "status") {
        if (message.position != null) {
          loaderDetail.textContent = `Queue position: ${message.position}. The free GPU will start when available.`;
        }
      }
      if (message.type === "data") {
        const url = getVideoUrl(message.data?.[0]);
        if (url) {
          videoOutput.src = url;
          videoOutput.classList.remove("hidden");
          previewContent.classList.add("hidden");
          download.href = url;
          download.classList.remove("disabled");
          download.download = "ai-video.mp4";
        }
      }
    }

    const result = await job.result();
    const finalUrl = getVideoUrl(result?.data?.[0]);
    if (!finalUrl) throw new Error("The AI finished, but no video URL was returned.");

    videoOutput.src = finalUrl;
    videoOutput.classList.remove("hidden");
    previewContent.classList.add("hidden");
    download.href = finalUrl;
    download.classList.remove("disabled");
    statusText.textContent = "Video generated successfully.";

    history.unshift({
      prompt,
      duration: duration.value,
      date: new Date().toLocaleString()
    });
    history = history.slice(0, 9);
    localStorage.setItem("aiVideoHistory", JSON.stringify(history));
    renderHistory();

  } catch (error) {
    console.error(error);
    statusText.textContent = `Generation failed: ${error.message || error}`;
    loaderTitle.textContent = "Generation failed";
    loaderDetail.textContent = "Try again in a moment. Free ZeroGPU can be busy or quota-limited.";
    previewContent.classList.remove("hidden");
    previewContent.innerHTML = `
      <div class="play-icon">!</div>
      <h2>Generation failed</h2>
      <p>${escapeHtml(error.message || "Please try again.")}</p>
    `;
  } finally {
    loader.classList.add("hidden");
    generate.disabled = false;
    generate.innerHTML = '<span class="spark">✦</span> Generate real AI video';
  }
});

newVideo.addEventListener("click", () => {
  selectedFile = null;
  imageInput.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  uploadTitle.textContent = "Click to upload an image";
  uploadHint.textContent = "PNG, JPG or WebP";
  promptEl.value = "";
  charCount.textContent = "0";
  videoOutput.pause();
  videoOutput.removeAttribute("src");
  videoOutput.load();
  videoOutput.classList.add("hidden");
  previewContent.classList.remove("hidden");
  previewContent.innerHTML = '<div class="play-icon">▶</div><h2>Your video will appear here</h2><p>Upload an image and describe the motion.</p>';
  download.classList.add("disabled");
  download.href = "#";
  statusText.textContent = "Ready for a new video.";
});

clearHistory.addEventListener("click", () => {
  history = [];
  localStorage.removeItem("aiVideoHistory");
  renderHistory();
});

renderHistory();

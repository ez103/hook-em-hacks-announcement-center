const STORAGE_KEY = "hook-em-hacks-announcements-v1";
const form = document.querySelector("#announcement-form");
const titleInput = document.querySelector("#announcement-title");
const messageInput = document.querySelector("#announcement-message");
const status = document.querySelector("#status");
const postStatus = document.querySelector("#post-status");
let announcements = [];

function loadAnnouncements() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved) || !saved.every(item =>
      item && typeof item.title === "string" && typeof item.message === "string" &&
      typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt))
    )) throw new Error("Invalid saved announcements");
    announcements = saved;
  } catch {
    status.textContent = "Saved announcements couldn’t be loaded. Check that browser storage is available before posting.";
  }
}

function renderAnnouncements() {
  const feed = document.querySelector("#announcements");
  feed.replaceChildren();
  const sorted = [...announcements].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  for (const announcement of sorted) {
    const article = document.createElement("article");
    article.className = "announcement panel";
    const time = document.createElement("time");
    time.dateTime = announcement.createdAt;
    time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(announcement.createdAt));
    const title = document.createElement("h3");
    title.textContent = announcement.title;
    const message = document.createElement("p");
    message.textContent = announcement.message;
    article.append(time, title, message);
    feed.append(article);
  }
  document.querySelector("#announcement-count").textContent = announcements.length;
  document.querySelector("#empty-state").hidden = announcements.length > 0;
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    const isOrganizer = button.dataset.view === "organizer";
    document.querySelectorAll("[data-view]").forEach(option => {
      option.setAttribute("aria-pressed", String(option === button));
    });
    document.querySelector("#organizer-panel").hidden = !isOrganizer;
    document.querySelector("#content-layout").classList.toggle("organizer", isOrganizer);
  });
});

[titleInput, messageInput].forEach(input => {
  input.addEventListener("input", () => input.setCustomValidity(""));
});

form.addEventListener("submit", event => {
  event.preventDefault();
  for (const input of [titleInput, messageInput]) {
    input.setCustomValidity(input.value.trim() ? "" : "Please enter more than just spaces.");
  }
  if (!form.reportValidity()) return;
  const next = [{ title: titleInput.value.trim(), message: messageInput.value.trim(), createdAt: new Date().toISOString() }, ...announcements];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    postStatus.textContent = "Your announcement couldn’t be saved. Browser storage may be full or unavailable. Your draft is still here.";
    return;
  }
  announcements = next;
  renderAnnouncements();
  form.reset();
  postStatus.textContent = "Announcement posted.";
  titleInput.focus();
});

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY || event.key === null) {
    loadAnnouncements();
    renderAnnouncements();
  }
});

loadAnnouncements();
renderAnnouncements();

// Animate while scrolling, then let the dog rest when scrolling stops.
const codingDog = document.querySelector(".coding-dog");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let scrollRestTimer;
window.addEventListener("scroll", () => {
  if (reducedMotion.matches) return;
  codingDog.classList.add("is-scrolling");
  clearTimeout(scrollRestTimer);
  scrollRestTimer = setTimeout(() => codingDog.classList.remove("is-scrolling"), 500);
}, { passive: true });

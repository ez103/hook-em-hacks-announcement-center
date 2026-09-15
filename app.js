const STORAGE_KEY = "hook-em-hacks-announcements-v1";
const form = document.querySelector("#announcement-form");
const titleInput = document.querySelector("#announcement-title");
const messageInput = document.querySelector("#announcement-message");
const categoryInput = document.querySelector("#announcement-category");
const customCategoryInput = document.querySelector("#custom-category");
const priorityInput = document.querySelector("#announcement-priority");
const priorities = ["Normal", "Important", "Urgent"];
const status = document.querySelector("#status");
const postStatus = document.querySelector("#post-status");
let announcements = [];
let editingId = null;
let isOrganizer = false;
const cancelEdit = document.querySelector("#cancel-edit");

function loadAnnouncements() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved) || !saved.every(item =>
      item && typeof item.title === "string" && typeof item.message === "string" &&
      typeof item.createdAt === "string" && Number.isFinite(Date.parse(item.createdAt))
    )) throw new Error("Invalid saved announcements");
    // Announcements saved before categories and priorities default to General / Normal.
    announcements = saved.map((item, index) => ({
      ...item,
      id: typeof item.id === "string" ? item.id : `legacy-${item.createdAt}-${index}`,
      category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : "General",
      priority: priorities.includes(item.priority) ? item.priority : "Normal"
    }));
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
    const metadata = document.createElement("div");
    metadata.className = "announcement-metadata";
    const category = document.createElement("span");
    const categoryStyle = ["Logistics", "Workshops", "Food", "General"].includes(announcement.category)
      ? announcement.category.toLowerCase() : "custom";
    category.className = `announcement-badge category-${categoryStyle}`;
    category.textContent = announcement.category;
    const priority = document.createElement("span");
    priority.className = `announcement-badge priority-${announcement.priority.toLowerCase()}`;
    priority.textContent = announcement.priority;
    metadata.append(category, priority);
    article.append(time, metadata, title, message);
    if (isOrganizer) {
      const actions = document.createElement("div");
      actions.className = "announcement-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "secondary-button";
      edit.textContent = "Edit";
      edit.setAttribute("aria-label", `Edit ${announcement.title}`);
      edit.addEventListener("click", () => startEditing(announcement));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "secondary-button delete-button";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", `Delete ${announcement.title}`);
      remove.addEventListener("click", () => deleteAnnouncement(announcement));
      actions.append(edit, remove);
      article.append(actions);
    }
    feed.append(article);
  }
  document.querySelector("#announcement-count").textContent = announcements.length;
  document.querySelector("#empty-state").hidden = announcements.length > 0;
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => {
    isOrganizer = button.dataset.view === "organizer";
    document.querySelectorAll("[data-view]").forEach(option => {
      option.setAttribute("aria-pressed", String(option === button));
    });
    document.querySelector("#organizer-panel").hidden = !isOrganizer;
    document.querySelector("#content-layout").classList.toggle("organizer", isOrganizer);
    renderAnnouncements();
  });
});

function syncCustomCategory() {
  const isOther = categoryInput.value === "Other";
  document.querySelector("#custom-category-field").hidden = !isOther;
  customCategoryInput.disabled = !isOther;
  customCategoryInput.required = isOther;
  customCategoryInput.setCustomValidity("");
}

categoryInput.addEventListener("change", syncCustomCategory);
syncCustomCategory();

function resetComposer() {
  editingId = null;
  form.reset();
  [titleInput, messageInput, customCategoryInput].forEach(input => input.setCustomValidity(""));
  syncCustomCategory();
  document.querySelector("#composer-title").textContent = "New announcement";
  form.querySelector("[type=submit]").textContent = "Post announcement ↗";
  cancelEdit.hidden = true;
}

function startEditing(announcement) {
  resetComposer();
  editingId = announcement.id;
  titleInput.value = announcement.title;
  messageInput.value = announcement.message;
  const standardCategories = ["Logistics", "Workshops", "Food", "General"];
  categoryInput.value = standardCategories.includes(announcement.category) ? announcement.category : "Other";
  customCategoryInput.value = categoryInput.value === "Other" ? announcement.category : "";
  priorityInput.value = announcement.priority;
  syncCustomCategory();
  document.querySelector("#composer-title").textContent = "Edit announcement";
  form.querySelector("[type=submit]").textContent = "Save changes";
  cancelEdit.hidden = false;
  postStatus.textContent = "";
  titleInput.focus();
}

cancelEdit.addEventListener("click", () => {
  resetComposer();
  postStatus.textContent = "Edit canceled.";
  titleInput.focus();
});

function saveAnnouncements(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    postStatus.textContent = "Changes couldn’t be saved. Browser storage may be full or unavailable. Please try again.";
    return false;
  }
  announcements = next;
  renderAnnouncements();
  return true;
}

function deleteAnnouncement(announcement) {
  if (!window.confirm(`Delete “${announcement.title}”? This cannot be undone.`)) return;
  if (!saveAnnouncements(announcements.filter(item => item.id !== announcement.id))) return;
  if (editingId === announcement.id) resetComposer();
  postStatus.textContent = "Announcement deleted.";
  titleInput.focus();
}

[titleInput, messageInput, customCategoryInput].forEach(input => {
  input.addEventListener("input", () => input.setCustomValidity(""));
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const requiredInputs = [titleInput, messageInput];
  if (categoryInput.value === "Other") requiredInputs.push(customCategoryInput);
  for (const input of requiredInputs) {
    input.setCustomValidity(input.value.trim() ? "" : "Please enter more than just spaces.");
  }
  if (!form.reportValidity()) return;
  const existing = editingId === null ? null : announcements.find(item => item.id === editingId);
  if (editingId !== null && !existing) {
    postStatus.textContent = "This announcement was removed in another tab. Cancel editing to create a new announcement.";
    return;
  }
  const announcement = {
    id: existing ? existing.id : `post-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: titleInput.value.trim(),
    message: messageInput.value.trim(),
    category: categoryInput.value === "Other" ? customCategoryInput.value.trim() : categoryInput.value,
    priority: priorityInput.value,
    createdAt: existing ? existing.createdAt : new Date().toISOString()
  };
  const next = existing
    ? announcements.map(item => item.id === editingId ? announcement : item)
    : [announcement, ...announcements];
  if (!saveAnnouncements(next)) return;
  resetComposer();
  postStatus.textContent = existing ? "Announcement updated." : "Announcement posted.";
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

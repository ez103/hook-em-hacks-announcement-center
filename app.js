const STORAGE_KEY = "hook-em-hacks-announcements-v1";
const READ_STORAGE_KEY = "hook-em-hacks-read-v1";
// Demo posts in chronological order; the feed displays newest first.
const SAMPLE_ANNOUNCEMENTS = [
  {
    id: "sample-jane-street",
    title: "Jane Street Tabling Information",
    message: "One of our sponsors, Jane Street, will be tabling this Saturday near the room 1.067 at the Gates-Dell Complex (GDC) building. Come to meet recruiters, learn about their company, and grab some swag!",
    category: "General",
    priority: "Normal",
    createdAt: "2023-01-20T10:00:00-06:00"
  },
  {
    id: "sample-registration",
    title: "Registration Reminder",
    message: "Please remember to complete the following forms for each member of your team:\n\n1. Liability waiver (sign and email)\n2. Photo release waiver (sign and email)\n3. Hacker information form (Google Form)\n\nThis is due next Friday, January 27 at 11:59 p.m.!",
    category: "Logistics",
    priority: "Important",
    createdAt: "2023-01-21T09:00:00-06:00"
  },
  {
    id: "sample-evacuation",
    title: "DANGER NOTIFICATION: Evacuate the GDC Now",
    message: "Part of the 6th floor of the GDC has collapsed due to a major water leak, and the building is slowly crumbling as the water spreads. Please evacuate the building NOW. If you are trapped in the 6th floor, hold tight and do not make major movements. Rescue operations are underway and emergency workers will come take you out to safety.",
    category: "Logistics",
    priority: "Urgent",
    createdAt: "2023-01-28T14:00:00-06:00"
  },
  {
    id: "sample-donuts",
    title: "Free Donuts on Speedway",
    message: "We are excited to be giving out free donuts in front of the Gregory Gym on speedway! Make sure to submit your feedback form to be able to claim this donut for yourself.",
    category: "Food",
    priority: "Normal",
    createdAt: "2023-01-29T10:00:00-06:00"
  },
  {
    id: "sample-results",
    title: "Hackathon Results Update",
    message: "We will be delaying the release of our Hackathon results by 3 days. Simply put, our judges are overwhelmed by all the impressive projects y'all built, and they need more time to evaluate and sort out placings. Please watch your email for the new YouTube live link that we will post shortly.",
    category: "General",
    priority: "Important",
    createdAt: "2023-01-30T15:00:00-06:00"
  }
];
const categoryFilter = document.querySelector("#category-filter");
let readIds = new Set();
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
    const stored = localStorage.getItem(STORAGE_KEY);
    // Seed only a new browser store. An empty saved array means posts were deleted.
    const saved = stored === null ? SAMPLE_ANNOUNCEMENTS : JSON.parse(stored);
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
    if (stored === null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
      } catch {
        status.textContent = "Sample announcements are displayed, but couldn’t be saved. Check your browser storage.";
      }
    }
  } catch {
    status.textContent = "Saved announcements couldn’t be loaded. Check that browser storage is available before posting.";
  }
}

function loadReadStatus() {
  try {
    const saved = JSON.parse(localStorage.getItem(READ_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved) || !saved.every(id => typeof id === "string")) throw new Error("Invalid read status");
    readIds = new Set(saved);
  } catch {
    status.textContent = "Saved read status couldn’t be loaded. Check your browser storage.";
  }
}

function toggleRead(announcement) {
  const next = new Set(readIds);
  if (next.has(announcement.id)) next.delete(announcement.id);
  else next.add(announcement.id);
  try {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    status.textContent = "Read status couldn’t be saved. Please check your browser storage and try again.";
    return;
  }
  readIds = next;
  renderAnnouncements();
  // Restore keyboard focus after replacing the feed.
  const buttons = document.querySelectorAll("[data-read-id]");
  [...buttons].find(button => button.dataset.readId === announcement.id)?.focus();
}

function renderCategoryFilter() {
  const selected = categoryFilter.value;
  const categories = [...new Set(["Logistics", "Workshops", "Food", "General", ...announcements.map(item => item.category)])];
  categoryFilter.replaceChildren();
  for (const category of ["", ...categories]) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category || "All categories";
    categoryFilter.append(option);
  }
  categoryFilter.value = categories.includes(selected) ? selected : "";
  categoryFilter.hidden = isOrganizer;
}

categoryFilter.addEventListener("change", renderAnnouncements);

function renderAnnouncements() {
  renderCategoryFilter();
  const feed = document.querySelector("#announcements");
  feed.replaceChildren();
  const visible = announcements.filter(item => isOrganizer || !categoryFilter.value || item.category === categoryFilter.value);
  const sorted = [...visible].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  for (const announcement of sorted) {
    const article = document.createElement("article");
    article.className = "announcement panel";
    const isRead = readIds.has(announcement.id);
    if (!isOrganizer) article.classList.add(isRead ? "is-read" : "is-unread");
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
    priority.textContent = `Priority Level: ${announcement.priority}`;
    metadata.append(category, priority);
    const header = document.createElement("div");
    header.className = "announcement-header";
    header.append(time, metadata);
    article.append(header, title, message);
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
    } else {
      const actions = document.createElement("div");
      actions.className = "announcement-actions read-actions";
      const readLabel = document.createElement("span");
      readLabel.className = "read-status";
      readLabel.textContent = isRead ? "Read" : "Unread";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "secondary-button";
      toggle.dataset.readId = announcement.id;
      toggle.textContent = isRead ? "Mark as unread" : "Mark as read";
      toggle.setAttribute("aria-label", `${toggle.textContent}: ${announcement.title}`);
      toggle.addEventListener("click", () => toggleRead(announcement));
      actions.append(readLabel, toggle);
      header.append(actions);
    }
    feed.append(article);
  }
  const unreadCount = announcements.filter(item => !readIds.has(item.id)).length;
  document.querySelector("#announcement-count").hidden = isOrganizer;
  document.querySelector("#announcement-count").textContent = `${unreadCount} unread`;
  document.querySelector("#announcement-count").title = "Unread announcements across all categories";
  document.querySelector("#empty-state").hidden = visible.length > 0;
  document.querySelector("#empty-state p").textContent = announcements.length && !isOrganizer && categoryFilter.value
    ? "No announcements in this category." : "No announcements yet.";
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
  if (event.key === READ_STORAGE_KEY || event.key === null) {
    loadReadStatus();
    renderAnnouncements();
  }
});

loadAnnouncements();
loadReadStatus();
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

/* script.js
   Dynamic Quote Generator with:
   - LocalStorage & SessionStorage
   - JSON Import/Export
   - Category Filtering
   - Server Sync Simulation + Conflict Resolution
   - Mock API POST for new quotes
*/

const STORAGE_KEY = "dynamicQuotes_v3";
const LAST_VIEWED_KEY = "lastViewedQuote_v3";
const LAST_FILTER_KEY = "selectedCategory_v3";
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API endpoint

const defaultQuotes = [
  { id: 1, text: "The best way to predict the future is to create it.", category: "Motivation", updatedAt: Date.now() },
  { id: 2, text: "Learning never exhausts the mind.", category: "Education", updatedAt: Date.now() },
  { id: 3, text: "Simplicity is the ultimate sophistication.", category: "Philosophy", updatedAt: Date.now() },
  { id: 4, text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming", updatedAt: Date.now() }
];

let quotes = [];
let syncStatusEl;

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const categorySelect = document.getElementById("categorySelect");
const quoteContainer = document.getElementById("quoteContainer");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");

// -----------------------------
// 🟢 Status Display
// -----------------------------
function createSyncStatus() {
  syncStatusEl = document.createElement("div");
  syncStatusEl.id = "syncStatus";
  syncStatusEl.style = "margin-top: 15px; font-size: 14px; color: #555;";
  syncStatusEl.textContent = "Status: Idle";
  document.body.appendChild(syncStatusEl);
}

function updateSyncStatus(message, color = "#555") {
  if (syncStatusEl) {
    syncStatusEl.textContent = `Status: ${message}`;
    syncStatusEl.style.color = color;
  }
}

// -----------------------------
// 💾 Local Storage Helpers
// -----------------------------
function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

function loadQuotes() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      quotes = JSON.parse(stored);
      if (!Array.isArray(quotes)) throw new Error("Invalid format");
    } catch {
      quotes = [...defaultQuotes];
      saveQuotes();
    }
  } else {
    quotes = [...defaultQuotes];
    saveQuotes();
  }
}

// -----------------------------
// 🏷️ Category Handling
// -----------------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))].sort();

  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categorySelect.innerHTML = '<option value="all">All</option>';

  categories.forEach(cat => {
    const opt1 = document.createElement("option");
    opt1.value = cat;
    opt1.textContent = cat;
    categoryFilter.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = cat;
    opt2.textContent = cat;
    categorySelect.appendChild(opt2);
  });

  const lastFilter = localStorage.getItem(LAST_FILTER_KEY);
  if (lastFilter && [...categoryFilter.options].some(o => o.value === lastFilter)) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

// -----------------------------
// 💬 Display Quotes
// -----------------------------
function displayQuotes(quotesToShow = quotes) {
  quoteContainer.innerHTML = "";
  if (quotesToShow.length === 0) {
    quoteContainer.textContent = "No quotes available for this category.";
    return;
  }
  quotesToShow.forEach(q => {
    const div = document.createElement("div");
    div.className = "quote-item";
    div.innerHTML = `
      <p>"${q.text}"</p>
      <small>[${q.category}]</small>
    `;
    quoteContainer.appendChild(div);
  });
}

// -----------------------------
// 🎲 Random Quote
// -----------------------------
function showRandomQuote() {
  let filtered = quotes;
  const selectedCategory = categorySelect.value;
  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }
  const random = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${random.text}" — [${random.category}]`;
  sessionStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(random));
}

// -----------------------------
// 🔍 Filter Quotes
// -----------------------------
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LAST_FILTER_KEY, selected);
  const filtered =
    selected === "all" ? quotes : quotes.filter(q => q.category === selected);
  displayQuotes(filtered);
}

// -----------------------------
// ➕ Add Quote
// -----------------------------
function createAddQuoteForm() {
  const form = document.createElement("div");
  form.className = "add-quote-form";
  form.innerHTML = `
    <h2>Add a New Quote</h2>
    <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
    <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
    <button id="addQuoteBtn">Add Quote</button>
  `;
  document.body.appendChild(form);
  document.getElementById("addQuoteBtn").addEventListener("click", addQuote);
}

async function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please fill both fields.");

  const newQuote = { id: Date.now(), text, category, updatedAt: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  displayQuotes();

  // 🛰️ Send to Mock API (POST)
  try {
    updateSyncStatus("Posting to server...", "blue");
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newQuote),
    });
    const result = await response.json();
    console.log("Posted to server:", result);
    updateSyncStatus("Quote sent to server ✅", "green");
  } catch (err) {
    console.error("Error posting quote:", err);
    updateSyncStatus("Failed to post ❌", "red");
  }

  alert("Quote added locally and sent to server!");
}

// -----------------------------
// 📤 Export / Import
// -----------------------------
function exportToJson() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes_export.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid format");
      imported.forEach(q => quotes.push({ ...q, updatedAt: Date.now() }));
      saveQuotes();
      populateCategories();
      displayQuotes();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing file.");
    }
  };
  reader.readAsText(file);
}

// -----------------------------
// 🛰️ Server Sync
// -----------------------------
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    const serverQuotes = data.slice(0, 5).map((p, i) => ({
      id: p.id,
      text: p.title,
      category: ["Motivation", "Philosophy", "Education", "Programming"][i % 4],
      updatedAt: Date.now()
    }));

    return serverQuotes;
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
}

async function syncWithServer() {
  updateSyncStatus("Syncing with server...", "blue");
  try {
    const serverQuotes = await fetchQuotesFromServer();

    // Conflict resolution: server version wins
    serverQuotes.forEach(sq => {
      const idx = quotes.findIndex(q => q.id === sq.id);
      if (idx >= 0) {
        quotes[idx] = sq;
        console.warn("Conflict resolved (server wins):", sq);
      } else {
        quotes.push(sq);
      }
    });

    saveQuotes();
    populateCategories();
    displayQuotes();
    updateSyncStatus("Synced successfully ✅", "green");
  } catch (err) {
    console.error(err);
    updateSyncStatus("Sync failed ❌", "red");
  }
}

// -----------------------------
// 🚀 Initialization
// -----------------------------
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  createSyncStatus();
  displayQuotes();
  showRandomQuote();
  setInterval(syncWithServer, 30000); // auto-sync every 30s
}

// -----------------------------
// 🎧 Event Listeners
// -----------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJson);
importFileInput.addEventListener("change", importFromJsonFile);
categoryFilter.addEventListener("change", filterQuotes);

init();

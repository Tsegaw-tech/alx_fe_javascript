/* script.js
   Dynamic Quote Generator with:
   - LocalStorage & SessionStorage
   - JSON Import/Export
   - Category Filtering
   - Server Sync Simulation + Conflict Resolution
*/

const STORAGE_KEY = "dynamicQuotes_v4";
const LAST_VIEWED_KEY = "lastViewedQuote_v4";
const LAST_FILTER_KEY = "selectedCategory_v4";
const SERVER_URL = "https://jsonplaceholder.typicode.com/posts"; // mock API

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
// Sync Status Indicator
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
// LocalStorage Helpers
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
// Category Dropdown Handling
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
// Display Quotes
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
// Random Quote Display
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
// Filter Quotes
// -----------------------------
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(LAST_FILTER_KEY, selected);
  const filtered =
    selected === "all" ? quotes : quotes.filter(q => q.category === selected);
  displayQuotes(filtered);
}

// -----------------------------
// Add Quote Form
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

function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();
  if (!text || !category) return alert("Please fill both fields.");

  const newQuote = { id: Date.now(), text, category, updatedAt: Date.now() };
  quotes.push(newQuote);
  saveQuotes();
  populateCategories();
  displayQuotes();
  alert("Quote added locally!");
  postQuoteToServer(newQuote); // post new quote to server
}

// -----------------------------
// Export / Import JSON
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
// Server Sync & Conflict Resolution
// -----------------------------
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    const data = await response.json();

    // Convert server data to quote format
    return data.slice(0, 5).map((p, i) => ({
      id: p.id,
      text: p.title,
      category: ["Motivation", "Philosophy", "Education", "Programming"][i % 4],
      updatedAt: Date.now()
    }));
  } catch (err) {
    console.error("Error fetching quotes from server:", err);
    return [];
  }
}

async function postQuoteToServer(quote) {
  try {
    await fetch(SERVER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(quote)
    });
    console.log("Quote posted to server:", quote);
  } catch (err) {
    console.error("Failed to post quote:", err);
  }
}

// Main sync function
async function syncQuotes() {
  updateSyncStatus("Syncing...", "blue");
  try {
    const serverQuotes = await fetchQuotesFromServer();
    let conflicts = 0;

    serverQuotes.forEach(sq => {
      const idx = quotes.findIndex(q => q.id === sq.id);
      if (idx >= 0) {
        quotes[idx] = sq; // server wins
        conflicts++;
      } else {
        quotes.push(sq);
      }
    });

    saveQuotes();
    populateCategories();
    displayQuotes();

    if (conflicts > 0) {
      showNotification(`Quotes synced with server! ${conflicts} conflict(s) resolved ✅`, "orange");
    } else {
      showNotification("Quotes synced with server! ✅", "green");
    }
    updateSyncStatus("Idle", "#555");
  } catch (err) {
    console.error(err);
    showNotification("Sync failed ❌", "red");
    updateSyncStatus("Sync failed ❌", "red");
  }
}


// -----------------------------
// Initialization
// -----------------------------
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();
  createSyncStatus();
  displayQuotes();
  showRandomQuote();

  // Periodic sync every 30 seconds
  setInterval(syncQuotes, 30000);
}

// -----------------------------
// Event Listeners
// -----------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJson);
importFileInput.addEventListener("change", importFromJsonFile);
categoryFilter.addEventListener("change", filterQuotes);

init();

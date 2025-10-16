/* script.js
   Dynamic Quote Generator with:
   - Advanced DOM Manipulation
   - LocalStorage & SessionStorage
   - JSON Import/Export
   - Category Filtering System
*/

// -----------------------------
// Constants & Defaults
// -----------------------------
const STORAGE_KEY = "dynamicQuotes_v2";
const LAST_VIEWED_KEY = "lastViewedQuote_v2";
const LAST_FILTER_KEY = "selectedCategory_v2";

const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Simplicity is the ultimate sophistication.", category: "Philosophy" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

// -----------------------------
// State
// -----------------------------
let quotes = [];

// -----------------------------
// DOM Elements
// -----------------------------
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const categorySelect = document.getElementById("categorySelect");
const quoteContainer = document.getElementById("quoteContainer");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");

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
    } catch (e) {
      console.warn("Invalid quotes in storage, loading defaults.");
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

  // Populate both dropdowns
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

  // Restore last selected filter
  const lastFilter = localStorage.getItem(LAST_FILTER_KEY);
  if (lastFilter && [...categoryFilter.options].some(o => o.value === lastFilter)) {
    categoryFilter.value = lastFilter;
    filterQuotes();
  }
}

// -----------------------------
// Quote Display & Random
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

  // Save last viewed in sessionStorage
  sessionStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(random));
}

function showLastViewedIfExists() {
  const last = sessionStorage.getItem(LAST_VIEWED_KEY);
  if (last) {
    try {
      const q = JSON.parse(last);
      if (q.text && q.category) {
        quoteDisplay.textContent = `"${q.text}" — [${q.category}]`;
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

// -----------------------------
// Filtering Logic
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
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  const text = textInput.value.trim();
  const category = categoryInput.value.trim();

  if (!text || !category) {
    alert("Please fill in both the quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  displayQuotes();

  textInput.value = "";
  categoryInput.value = "";

  alert("Quote added successfully!");
}

// -----------------------------
// JSON Import / Export
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
      if (!Array.isArray(imported)) throw new Error("Invalid JSON format");

      imported.forEach(q => {
        if (q.text && q.category) quotes.push(q);
      });

      saveQuotes();
      populateCategories();
      displayQuotes();

      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Error importing JSON file. Please check the format.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// -----------------------------
// Initialization
// -----------------------------
function init() {
  loadQuotes();
  populateCategories();
  createAddQuoteForm();

  if (!showLastViewedIfExists()) showRandomQuote();

  displayQuotes();
}

// -----------------------------
// Event Listeners
// -----------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
exportBtn.addEventListener("click", exportToJson);
importFileInput.addEventListener("change", importFromJsonFile);
categoryFilter.addEventListener("change", filterQuotes);

// -----------------------------
// Start App
// -----------------------------
init();

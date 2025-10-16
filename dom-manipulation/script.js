/* script.js
   Adds: localStorage persistence, sessionStorage last viewed, JSON import/export,
   dynamic add-quote form creation, categories & random quote display.
*/

// Local storage key
const STORAGE_KEY = "dynamicQuotes_v1";
const LAST_VIEWED_KEY = "lastViewedQuote_v1";

// Default quotes (used only if localStorage is empty)
const defaultQuotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Simplicity is the ultimate sophistication.", category: "Philosophy" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

// State
let quotes = [];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");
const exportBtn = document.getElementById("exportBtn");
const importFileInput = document.getElementById("importFile");

// -------------------------------
// Storage helpers
// -------------------------------
function saveQuotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (err) {
    console.error("Failed to save quotes to localStorage:", err);
  }
}

function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      quotes = [...defaultQuotes];
      saveQuotes();
    } else {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // validate objects minimally
        quotes = parsed.filter(q => q && typeof q.text === "string" && typeof q.category === "string");
      } else {
        quotes = [...defaultQuotes];
      }
    }
  } catch (err) {
    console.error("Failed to load quotes from localStorage:", err);
    quotes = [...defaultQuotes];
  }
}

// -------------------------------
// Category population
// -------------------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))].sort();
  categorySelect.innerHTML = `<option value="all">All</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// -------------------------------
// Show random (or last viewed) quote
// -------------------------------
function showRandomQuote() {
  let filtered = quotes;
  const selectedCategory = categorySelect.value;
  if (selectedCategory && selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const q = filtered[randomIndex];
  displayQuote(q);

  // Save last viewed in sessionStorage (session-only)
  try {
    sessionStorage.setItem(LAST_VIEWED_KEY, JSON.stringify(q));
  } catch (err) {
    // sessionStorage may be disabled in some contexts
    console.warn("Could not set sessionStorage for last viewed quote:", err);
  }
}

function displayQuote(q) {
  quoteDisplay.textContent = `"${q.text}" — [${q.category}]`;
}

// Try to load last viewed from session and display it instead of random
function showLastViewedIfExists() {
  try {
    const raw = sessionStorage.getItem(LAST_VIEWED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.text && parsed.category) {
        displayQuote(parsed);
        return true;
      }
    }
  } catch (err) {
    // ignore parse errors
  }
  return false;
}

// -------------------------------
// Dynamic Add Quote Form (createAddQuoteForm)
// -------------------------------
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.classList.add("add-quote-form");
  formContainer.style.marginTop = "24px";

  const title = document.createElement("h2");
  title.textContent = "Add a New Quote";

  const inputText = document.createElement("input");
  inputText.type = "text";
  inputText.id = "newQuoteText";
  inputText.placeholder = "Enter a new quote";
  inputText.style.marginRight = "8px";
  inputText.style.width = "320px";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";
  inputCategory.style.marginRight = "8px";

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  formContainer.appendChild(title);
  formContainer.appendChild(inputText);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addBtn);

  // Append before the script tag area (end of body)
  document.body.appendChild(formContainer);
}

// -------------------------------
// Add Quote logic
// -------------------------------
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const catInput = document.getElementById("newQuoteCategory");
  if (!textInput || !catInput) {
    alert("Form inputs not found.");
    return;
  }

  const text = textInput.value.trim();
  const category = catInput.value.trim();

  if (text === "" || category === "") {
    alert("Please fill in both the quote text and the category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  // clear inputs
  textInput.value = "";
  catInput.value = "";

  alert("New quote added successfully!");
}

// -------------------------------
// Export to JSON
// -------------------------------
function exportToJson() {
  try {
    const dataStr = JSON.stringify(quotes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const filename = `quotes_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export quotes. See console for details.");
  }
}

// -------------------------------
// Import from JSON File input
// -------------------------------
function importFromJsonFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const parsed = JSON.parse(evt.target.result);

      if (!Array.isArray(parsed)) {
        alert("Invalid JSON format: expected an array of quotes.");
        return;
      }

      // Validate items and collect valid ones
      const valid = [];
      parsed.forEach((item, idx) => {
        if (item && typeof item.text === "string" && typeof item.category === "string") {
          valid.push({ text: item.text.trim(), category: item.category.trim() });
        } else {
          console.warn("Invalid quote skipped at index", idx, item);
        }
      });

      if (valid.length === 0) {
        alert("No valid quotes found in the imported file.");
        return;
      }

      // Option: avoid exact duplicate entries (same text and category)
      const existingSet = new Set(quotes.map(q => `${q.text}||${q.category}`));
      let addedCount = 0;
      valid.forEach(q => {
        const key = `${q.text}||${q.category}`;
        if (!existingSet.has(key)) {
          quotes.push(q);
          existingSet.add(key);
          addedCount++;
        }
      });

      saveQuotes();
      populateCategories();

      alert(`Import complete. ${addedCount} new quote(s) added.`);
    } catch (err) {
      console.error("Failed to parse imported JSON:", err);
      alert("Failed to import JSON file. Make sure it is valid JSON with an array of {text, category} objects.");
    }
  };

  reader.onerror = function (err) {
    console.error("File read error:", err);
    alert("Error reading file.");
  };

  reader.readAsText(file);
}

// -------------------------------
// Wiring UI & Init
// -------------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
categorySelect.addEventListener("change", showRandomQuote);
exportBtn.addEventListener("click", exportToJson);
importFileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (file) importFromJsonFile(file);

  // reset input so same file can be re-selected later if needed
  importFileInput.value = "";
});

// Initialize
function init() {
  loadQuotes();
  populateCategories();

  // If a last viewed quote exists in sessionStorage, show it. Otherwise show random.
  const shownLast = showLastViewedIfExists();
  if (!shownLast) showRandomQuote();

  createAddQuoteForm();
}

init();

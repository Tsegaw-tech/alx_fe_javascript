// Initial Quotes Array
let quotes = [
  { text: "The best way to predict the future is to create it.", category: "Motivation" },
  { text: "Learning never exhausts the mind.", category: "Education" },
  { text: "Simplicity is the ultimate sophistication.", category: "Philosophy" },
  { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
];

// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categorySelect = document.getElementById("categorySelect");

// ------------------------------
// Step 1: Populate Categories
// ------------------------------
function populateCategories() {
  const categories = [...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = `<option value="all">All</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// ------------------------------
// Step 2: Show Random Quote
// ------------------------------
function showRandomQuote() {
  let filteredQuotes = quotes;
  const selectedCategory = categorySelect.value;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category === selectedCategory);
  }

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];
  quoteDisplay.textContent = `"${randomQuote.text}" — [${randomQuote.category}]`;
}

// ------------------------------
// Step 3: Create Add Quote Form Dynamically
// ------------------------------
function createAddQuoteForm() {
  const formContainer = document.createElement("div");
  formContainer.classList.add("add-quote-form");

  const title = document.createElement("h2");
  title.textContent = "Add a New Quote";

  const inputText = document.createElement("input");
  inputText.type = "text";
  inputText.id = "newQuoteText";
  inputText.placeholder = "Enter a new quote";

  const inputCategory = document.createElement("input");
  inputCategory.type = "text";
  inputCategory.id = "newQuoteCategory";
  inputCategory.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";
  addBtn.addEventListener("click", addQuote);

  // Append elements
  formContainer.appendChild(title);
  formContainer.appendChild(inputText);
  formContainer.appendChild(inputCategory);
  formContainer.appendChild(addBtn);

  // Add form to the body (below everything else)
  document.body.appendChild(formContainer);
}

// ------------------------------
// Step 4: Add Quote Logic
// ------------------------------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text === "" || category === "") {
    alert("Please fill in both fields!");
    return;
  }

  quotes.push({ text, category });

  // Refresh categories
  populateCategories();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  alert("New quote added successfully!");
}

// ------------------------------
// Step 5: Event Listeners & Init
// ------------------------------
newQuoteBtn.addEventListener("click", showRandomQuote);
categorySelect.addEventListener("change", showRandomQuote);

// Initialize App
populateCategories();
showRandomQuote();
createAddQuoteForm();

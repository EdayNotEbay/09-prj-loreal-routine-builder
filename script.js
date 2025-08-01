/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const selectedProductsList = document.getElementById("selectedProductsList");
const productSearch = document.getElementById("productSearch");

/* Store selected products by id */
let selectedProductIds = [];
let allProducts = [];

/* Track current category and search query */
let currentCategory = "";
let currentSearch = "";

/* Load selected products from localStorage */
function loadSelectedProductsFromStorage() {
  const stored = localStorage.getItem("selectedProductIds");
  if (stored) {
    try {
      selectedProductIds = JSON.parse(stored);
    } catch {
      selectedProductIds = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify(selectedProductIds)
  );
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards with checkbox */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div class="product-card" data-id="${product.id}">
      <!-- Checkbox for selecting product -->
      <input 
        type="checkbox" 
        class="select-checkbox"
        style="position:absolute;top:10px;left:10px;z-index:2;"
        ${selectedProductIds.includes(product.id) ? "checked" : ""}
        aria-label="Select ${product.name}"
      >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Add event listeners for checkboxes
  document
    .querySelectorAll(".product-card .select-checkbox")
    .forEach((checkbox, idx) => {
      const productId = products[idx].id;
      checkbox.addEventListener("click", (e) => {
        e.stopPropagation();
        if (checkbox.checked) {
          if (!selectedProductIds.includes(productId)) {
            selectedProductIds.push(productId);
          }
        } else {
          selectedProductIds = selectedProductIds.filter(
            (id) => id !== productId
          );
        }
        saveSelectedProductsToStorage();
        renderSelectedProducts();
        displayProducts(products); // update checkboxes
      });
    });
}

/* Render selected products in selectedProductsList */
function renderSelectedProducts() {
  const selectedProducts = allProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="product-card selected-card" data-id="${product.id}">
        <!-- Blue checkbox (always checked) -->
        <input 
          type="checkbox" 
          checked 
          disabled
          class="selected-checkbox"
          style="position:absolute;top:10px;left:10px;z-index:2;"
        >
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
        </div>
        <!-- Remove button now sits below product info -->
        <button class="remove-btn">
          Remove
        </button>
      </div>
    `
    )
    .join("");

  // Add event listeners for remove buttons
  document
    .querySelectorAll(".selected-card .remove-btn")
    .forEach((btn, idx) => {
      const productId = selectedProducts[idx].id;
      btn.addEventListener("click", () => {
        selectedProductIds = selectedProductIds.filter(
          (id) => id !== productId
        );
        saveSelectedProductsToStorage();
        renderSelectedProducts();
        displayProducts(
          allProducts.filter(
            (product) => product.category === categoryFilter.value
          )
        );
      });
    });

  // Add "Clear All" button above Generate Routine button
  let clearBtn = document.getElementById("clearSelectedBtn");
  const generateBtn = document.getElementById("generateRoutine");
  if (selectedProducts.length > 0) {
    if (!clearBtn) {
      clearBtn = document.createElement("button");
      clearBtn.id = "clearSelectedBtn";
      clearBtn.textContent = "Clear All";
      clearBtn.className = "remove-btn";
      clearBtn.style.background = "#e74c3c";
      clearBtn.style.marginTop = "10px";
      clearBtn.style.position = "static";
      clearBtn.style.width = "100%";
      clearBtn.style.maxWidth = "180px";
      clearBtn.style.left = "unset";
      clearBtn.style.transform = "unset";
      clearBtn.style.bottom = "unset";
      clearBtn.style.display = "block";
      clearBtn.style.zIndex = "2";
      clearBtn.addEventListener("click", () => {
        selectedProductIds = [];
        saveSelectedProductsToStorage();
        renderSelectedProducts();
        displayProducts(
          allProducts.filter(
            (product) => product.category === categoryFilter.value
          )
        );
      });
      // Insert clearBtn above generateBtn
      if (generateBtn) {
        generateBtn.parentElement.insertBefore(clearBtn, generateBtn);
      }
    }
  } else {
    if (clearBtn) {
      clearBtn.remove();
    }
  }
}

// Helper function: filter products by category and search
function getFilteredProducts() {
  let filtered = allProducts;
  if (currentCategory) {
    filtered = filtered.filter(
      (product) => product.category === currentCategory
    );
  }
  if (currentSearch) {
    const query = currentSearch.toLowerCase();
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
    );
  }
  return filtered;
}

// Update products display based on filters
function updateProductsDisplay() {
  displayProducts(getFilteredProducts());
}

// Listen for category changes
categoryFilter.addEventListener("change", async (e) => {
  allProducts = await loadProducts();
  currentCategory = e.target.value;
  updateProductsDisplay();
});

// Listen for search input changes (real-time)
productSearch.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  updateProductsDisplay();
});

/* Initial load: fetch all products for selection logic */
loadProducts().then((products) => {
  allProducts = products;
  loadSelectedProductsFromStorage();
  renderSelectedProducts();
  updateProductsDisplay();
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

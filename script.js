/* Wait for DOM to be fully loaded before running scripts */
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, starting app...");

  /* Get references to DOM elements */
  const categoryFilter = document.getElementById("categoryFilter");
  const productsContainer = document.getElementById("productsContainer");
  const chatWindow = document.getElementById("chatWindow");
  const chatForm = document.getElementById("chatForm");
  const selectedProductsList = document.getElementById("selectedProductsList");
  const productSearch = document.getElementById("productSearch");
  const productModal = document.getElementById("productModal");

  /* Check if all elements exist */
  if (
    !categoryFilter ||
    !productsContainer ||
    !productSearch ||
    !productModal
  ) {
    console.error("Some required DOM elements are missing!");
    return;
  }

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

  /* Load product data from JSON file (only once) */
  async function loadProducts() {
    try {
      const response = await fetch("products.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.products;
    } catch (error) {
      console.error("Failed to load products:", error);
      return [];
    }
  }

  /* Filter products by category and search */
  function getFilteredProducts() {
    let filtered = allProducts;

    // Only filter by category if one is actually selected (not empty string)
    if (currentCategory && currentCategory !== "") {
      filtered = filtered.filter(
        (product) => product.category === currentCategory
      );
    }

    // Filter by search query if one exists
    if (currentSearch && currentSearch.trim() !== "") {
      const query = currentSearch.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          (product.description &&
            product.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  /* Display products in the grid */
  function displayProducts(products) {
    // Show different placeholders based on current state
    if (!products || products.length === 0) {
      // If user is searching but no results
      if (currentSearch && currentSearch.trim() !== "") {
        productsContainer.innerHTML = `
          <div class="placeholder-message">
            No products found matching "${currentSearch}". Try a different search term.
          </div>
        `;
      }
      // If user selected a category but no products found
      else if (currentCategory && currentCategory !== "") {
        productsContainer.innerHTML = `
          <div class="placeholder-message">
            No products found in the "${currentCategory}" category.
          </div>
        `;
      }
      // Default state - no category selected and no search
      else {
        productsContainer.innerHTML = `
          <div class="placeholder-message">
            Select a category above or use the search field to find products
          </div>
        `;
      }
      return;
    }

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
          // Re-display current filtered products to update checkboxes
          updateProductsDisplay();
        });
      });

    // Modal open logic for product cards
    document.querySelectorAll(".product-card").forEach((card, idx) => {
      card.addEventListener("click", (e) => {
        // Don't open modal if clicking checkbox
        if (e.target.classList.contains("select-checkbox")) return;
        showProductModal(products[idx]);
      });
    });
  }

  /* Show product modal with all info */
  function showProductModal(product) {
    if (!productModal) return;

    productModal.innerHTML = `
      <div class="modal-content" tabindex="0">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p><span class="modal-label">Brand:</span> ${product.brand}</p>
        <p><span class="modal-label">Category:</span> ${product.category}</p>
        <p><span class="modal-label">Description:</span></p>
        <p>${product.description}</p>
      </div>
    `;
    productModal.style.display = "flex";
    const modalContent = productModal.querySelector(".modal-content");
    if (modalContent) modalContent.focus();
  }

  /* Hide product modal when clicking outside modal-content */
  productModal.addEventListener("click", function (e) {
    if (e.target === productModal) {
      productModal.style.display = "none";
      productModal.innerHTML = "";
    }
  });

  /* Render selected products in selectedProductsList */
  function renderSelectedProducts() {
    if (!selectedProductsList) return;

    const selectedProducts = allProducts.filter((p) =>
      selectedProductIds.includes(p.id)
    );
    selectedProductsList.innerHTML = selectedProducts
      .map(
        (product) => `
        <div class="product-card selected-card" data-id="${product.id}">
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
          updateProductsDisplay();
        });
      });

    // Modal open logic for selected product cards
    document.querySelectorAll(".selected-card").forEach((card, idx) => {
      card.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("remove-btn") ||
          e.target.classList.contains("selected-checkbox")
        )
          return;
        showProductModal(selectedProducts[idx]);
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
          updateProductsDisplay();
        });
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

  // Helper function to call OpenAI API with selected products
  async function generateRoutineWithOpenAI(selectedProducts) {
    // Build a beginner-friendly message for the API
    const productList = selectedProducts
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} (${p.brand}) - ${p.category}: ${p.description}`
      )
      .join("\n");

    // The messages array for OpenAI's API
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful skincare and beauty routine assistant. Give a simple, step-by-step routine using only the products provided. Explain why each product is used and keep it beginner-friendly.",
      },
      {
        role: "user",
        content: `Here are the products I selected:\n${productList}\n\nPlease create a personalized routine for me using only these products.`,
      },
    ];

    // Show loading message in chat
    chatWindow.innerHTML = `<div>Generating your routine...</div>`;

    // Check for API key before making the request
    if (typeof apiKey === "undefined" || apiKey === "YOUR_OPENAI_API_KEY") {
      chatWindow.innerHTML = `<div>
        Error: OpenAI API key is missing or not set.<br>
        Please add your API key in <code>secrets.js</code>.<br>
        <span style="color:#e74c3c;">401 Unauthorized</span>
      </div>`;
      return;
    }

    try {
      // Make the API call using fetch and async/await
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 500,
          }),
        }
      );

      // If the API key is invalid, show a helpful error
      if (response.status === 401) {
        chatWindow.innerHTML = `<div>
          Error: Unauthorized (401).<br>
          Your OpenAI API key may be invalid, expired, or not allowed for this endpoint.<br>
          Please check your API key in <code>secrets.js</code>.
        </div>`;
        return;
      }

      const data = await response.json();

      // Check if we got a valid response
      if (
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        // Display the routine in the chat window
        chatWindow.innerHTML = `<div>${data.choices[0].message.content.replace(
          /\n/g,
          "<br>"
        )}</div>`;
      } else {
        chatWindow.innerHTML = `<div>Sorry, I couldn't generate a routine. Please try again.</div>`;
      }
    } catch (error) {
      // Show error message in chat
      chatWindow.innerHTML = `<div>Error: ${error.message}</div>`;
    }
  }

  // Listen for "Generate Routine" button click
  const generateBtn = document.getElementById("generateRoutine");
  if (generateBtn) {
    generateBtn.addEventListener("click", async function () {
      // Get selected products
      const selectedProducts = allProducts.filter((p) =>
        selectedProductIds.includes(p.id)
      );
      if (selectedProducts.length === 0) {
        chatWindow.innerHTML = `<div>Please select at least one product before generating a routine.</div>`;
        return;
      }
      // Call OpenAI API and show routine
      await generateRoutineWithOpenAI(selectedProducts);
    });
  }

  /* Update products display based on current filters */
  function updateProductsDisplay() {
    const filteredProducts = getFilteredProducts();
    console.log("Filtered products:", filteredProducts.length);
    displayProducts(filteredProducts);
  }

  /* Listen for category changes */
  categoryFilter.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    console.log("Category changed to:", currentCategory);
    updateProductsDisplay();
  });

  /* Listen for search input changes (real-time) */
  productSearch.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    console.log("Search changed to:", currentSearch);
    updateProductsDisplay();
  });

  /* Initial load: fetch all products and set up the app */
  loadProducts().then((products) => {
    allProducts = products;
    console.log("Loaded products:", allProducts.length);
    if (allProducts.length > 0) {
      console.log(
        "Sample product categories:",
        allProducts.slice(0, 5).map((p) => p.category)
      );
    }
    loadSelectedProductsFromStorage();
    renderSelectedProducts();
    // Show initial placeholder
    updateProductsDisplay();
  });

  /* Chat form submission handler - placeholder for OpenAI integration */
  if (chatForm) {
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (chatWindow) {
        chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
      }
    });
  }
});

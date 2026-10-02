// Flatten all products from the provided nested dataset.
const products = [];

storeData.categories.forEach(category => {
  category.subcategories.forEach(subcategory => {
    subcategory.products.forEach(product => {
      products.push(product);
    });
  });
});

const cart = new Map();
let undoStack = [];
let redoStack = [];
let operationHistory = [];

const productsBox = document.getElementById("products");
const cartItemsBox = document.getElementById("cartItems");
const itemCountBox = document.getElementById("itemCount");
const cartTotalBox = document.getElementById("cartTotal");
const historyBox = document.getElementById("history");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

function money(value) {
  return "₹" + value.toLocaleString("en-IN");
}

function getCartState() {
  return [...cart.entries()].map(([id, quantity]) => ({ id, quantity }));
}

function restoreCart(state) {
  cart.clear();

  state.forEach(item => {
    cart.set(item.id, item.quantity);
  });
}

function saveState(actionText) {
  undoStack.push({
    cart: getCartState(),
    actionText: actionText
  });

  redoStack = [];
  operationHistory.push(actionText);

  if (operationHistory.length > 8) {
    operationHistory.shift();
  }

  updateUI();
}

function addToCart(productId) {
  const oldState = getCartState();
  const quantity = cart.get(productId) || 0;

  cart.set(productId, quantity + 1);

  undoStack.push({
    cart: oldState,
    actionText: "Added " + findProduct(productId).name
  });

  redoStack = [];
  addHistory("Added " + findProduct(productId).name);
  updateUI();
}

function findProduct(productId) {
  return products.find(product => product.id === productId);
}

function changeQuantity(productId, change) {
  const product = findProduct(productId);
  const oldState = getCartState();
  const currentQuantity = cart.get(productId) || 0;
  const newQuantity = currentQuantity + change;

  if (newQuantity <= 0) {
    cart.delete(productId);
    addHistory("Removed " + product.name);
  } else {
    cart.set(productId, newQuantity);
    addHistory("Changed quantity: " + product.name);
  }

  undoStack.push({
    cart: oldState,
    actionText: "Changed quantity: " + product.name
  });

  redoStack = [];
  updateUI();
}

function removeFromCart(productId) {
  const product = findProduct(productId);
  const oldState = getCartState();

  cart.delete(productId);

  undoStack.push({
    cart: oldState,
    actionText: "Removed " + product.name
  });

  redoStack = [];
  addHistory("Removed " + product.name);
  updateUI();
}

function addHistory(text) {
  operationHistory.push(text);

  if (operationHistory.length > 8) {
    operationHistory.shift();
  }
}

function undo() {
  if (undoStack.length === 0) return;

  redoStack.push({
    cart: getCartState(),
    actionText: undoStack[undoStack.length - 1].actionText
  });

  const previousState = undoStack.pop();
  restoreCart(previousState.cart);
  addHistory("Undo: " + previousState.actionText);
  updateUI();
}

function redo() {
  if (redoStack.length === 0) return;

  undoStack.push({
    cart: getCartState(),
    actionText: redoStack[redoStack.length - 1].actionText
  });

  const nextState = redoStack.pop();
  restoreCart(nextState.cart);
  addHistory("Redo: " + nextState.actionText);
  updateUI();
}

function renderProducts() {
  productsBox.innerHTML = products.map(product => `
    <article class="product-card">
      <h3>${product.name}</h3>
      <p>${product.brand}</p>
      <p>⭐ ${product.rating}</p>
      <p class="price">${money(product.price)}</p>
      <button onclick="addToCart('${product.id}')">Add to Cart</button>
    </article>
  `).join("");
}

function renderCart() {
  if (cart.size === 0) {
    cartItemsBox.innerHTML = '<p class="empty">Your cart is empty.</p>';
    return;
  }

  cartItemsBox.innerHTML = [...cart.entries()].map(([id, quantity]) => {
    const product = findProduct(id);

    return `
      <div class="cart-row">
        <div>
          <h4>${product.name}</h4>
          <small>${money(product.price)} × ${quantity}</small>
          <br>
          <button class="remove" onclick="removeFromCart('${id}')">Remove</button>
        </div>

        <div class="quantity">
          <button onclick="changeQuantity('${id}', -1)">−</button>
          <strong>${quantity}</strong>
          <button onclick="changeQuantity('${id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join("");
}

function renderSummary() {
  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach((quantity, id) => {
    const product = findProduct(id);
    totalItems += quantity;
    totalPrice += product.price * quantity;
  });

  itemCountBox.textContent = totalItems + " items";
  cartTotalBox.textContent = money(totalPrice);
}

function renderHistory() {
  historyBox.innerHTML = operationHistory.length === 0
    ? "<li>No operations yet</li>"
    : operationHistory.map(item => `<li>✓ ${item}</li>`).join("");
}

function updateUI() {
  renderCart();
  renderSummary();
  renderHistory();

  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
}

undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

renderProducts();
updateUI();

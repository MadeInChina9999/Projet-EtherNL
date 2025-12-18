// Gestion du défilement lisse pour les ancres internes
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", href);
    } else {
      // si l'ancre n'existe pas sur la page courante,
      // redirige vers la page d'accueil + fragment pour y scroller
      e.preventDefault();
      window.location.href = "index.html" + href;
    }
  });
});

// Make the hero clickable and keyboard accessible (opens data-href in a new tab)
(function () {
  const hero = document.querySelector('.hero[role="link"][data-href]');
  if (!hero) return;

  hero.addEventListener("click", function (e) {
    // ignore clicks on inner interactive elements (links/buttons/inputs)
    if (e.target.closest("a, button, input, textarea")) return;
    const href = hero.getAttribute("data-href");
    if (href) window.open(href, "_blank");
  });

  hero.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const href = hero.getAttribute("data-href");
      if (href) window.open(href, "_blank");
    }
  });
})();

/* ---------- Cart sidebar behavior & inventory rendering ---------- */
(function () {
  const cartButton = document.getElementById("cart-button");
  const cartSidebar = document.getElementById("cart-sidebar");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartClose = document.getElementById("cart-close");
  const cartItemsEl = document.getElementById("cart-items");
  const cartEmptyEl = document.getElementById("cart-empty");
  const cartTotalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (!cartSidebar) return; // no cart on this page

  const CART_KEY = "ethernl_cart";
  let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

  function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function formatPrice(cents) {
    // Formatage du prix : accepte un nombre en euros (décimal) ou en cents
    // et retourne une chaîne avec deux décimales suivie du symbole euro.
    return (Math.round(cents * 100) / 100).toFixed(2) + " €";
  }

  // Rendu visuel du panier dans la sidebar
  // - Vide la liste actuelle
  // - Affiche un message si le panier est vide
  // - Pour chaque article, crée l'élément DOM correspondant et attache les handlers (qty, remove)
  // - Met à jour le total et le badge du bouton panier
  function renderCart() {
    cartItemsEl.innerHTML = "";
    if (!cart || cart.length === 0) {
      cartEmptyEl.style.display = "block";
      cartTotalEl.textContent = "0,00 €";
      // clear cart button badge when empty
      if (cartButton) {
        cartButton.removeAttribute("data-count");
        cartButton.setAttribute("aria-label", "Ouvrir le panier");
      }
      return;
    }
    cartEmptyEl.style.display = "none";

    let total = 0;
    cart.forEach((item, index) => {
      total += item.price * (item.qty || 1);

      const li = document.createElement("li");
      li.className = "cart-item";

      li.innerHTML = `
        <img src="${item.image || "images/bg1.jpg"}" alt="${item.name}">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-price">${formatPrice(item.price)}</div>
        </div>
        <div class="item-actions">
          <button class="qty-dec" data-index="${index}" aria-label="Réduire la quantité">-</button>
          <input class="qty" type="text" value="${
            item.qty || 1
          }" size="2" readonly>
          <button class="qty-inc" data-index="${index}" aria-label="Augmenter la quantité">+</button>
          <button class="remove" data-index="${index}" aria-label="Supprimer">✕</button>
        </div>`;

      cartItemsEl.appendChild(li);
    });

    cartTotalEl.textContent = formatPrice(total);

    // update cart button badge with total quantity
    const totalQty = cart.reduce((s, i) => s + (i.qty || 1), 0);
    if (cartButton) {
      if (totalQty > 0) {
        cartButton.dataset.count = totalQty;
        cartButton.setAttribute(
          "aria-label",
          `Ouvrir le panier — ${totalQty} article${totalQty > 1 ? "s" : ""}`
        );
      } else {
        cartButton.removeAttribute("data-count");
        cartButton.setAttribute("aria-label", "Ouvrir le panier");
      }
    }

    // attach actions
    cartItemsEl.querySelectorAll(".qty-inc").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.currentTarget.dataset.index);
        cart[i].qty = (cart[i].qty || 1) + 1;
        saveCart();
      });
    });
    cartItemsEl.querySelectorAll(".qty-dec").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.currentTarget.dataset.index);
        cart[i].qty = Math.max(1, (cart[i].qty || 1) - 1);
        saveCart();
      });
    });
    cartItemsEl.querySelectorAll(".remove").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const i = Number(e.currentTarget.dataset.index);
        cart.splice(i, 1);
        saveCart();
      });
    });
  }

  // Ouvre la sidebar du panier et place le focus sur le premier élément actionnable
  function openCart() {
    cartOverlay.classList.remove("hidden");
    cartSidebar.setAttribute("aria-hidden", "false");
    if (cartButton) cartButton.setAttribute("aria-expanded", "true");
    renderCart();
    // focus sur le premier élément actionnable pour les utilisateurs clavier
    const focusable = cartSidebar.querySelector(
      "button, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable) focusable.focus();
  }

  // Ferme la sidebar du panier et remet l'état ARIA
  function closeCart() {
    cartOverlay.classList.add("hidden");
    cartSidebar.setAttribute("aria-hidden", "true");
    if (cartButton) cartButton.setAttribute("aria-expanded", "false");
  }

  if (cartButton) cartButton.addEventListener("click", openCart);
  cartOverlay.addEventListener("click", closeCart);
  cartClose.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      cartSidebar.getAttribute("aria-hidden") === "false"
    )
      closeCart();
  });

  // click handler for checkout (checkout flow is simulated)
  checkoutBtn.addEventListener("click", () => {
    if (!cart || cart.length === 0) {
      alert("Votre panier est vide.");
      return;
    }
    // placeholder behavior - integrate with checkout flow
    alert(`Commande simulée — total : ${cartTotalEl.textContent}`);
    cart = [];
    saveCart();
    closeCart();
  });

  // small tactile feedback for pointer devices (adds pressed class briefly)
  if (checkoutBtn && window.PointerEvent) {
    const addPressed = () => checkoutBtn.classList.add("is-pressed");
    const removePressed = () => checkoutBtn.classList.remove("is-pressed");
    checkoutBtn.addEventListener("pointerdown", addPressed);
    checkoutBtn.addEventListener("pointerup", removePressed);
    checkoutBtn.addEventListener("pointerleave", removePressed);
    checkoutBtn.addEventListener("pointercancel", removePressed);
  }

  // Point d'entrée public : ajoute un article au panier
  // Utilisé par les boutons "Précommander" et potentiellement par d'autres scripts
  // Paramètre attendu : { id, name, price, qty, image }
  window.addToCart = function (item) {
    const existing = cart.find((i) => i.id && item.id && i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
    } else {
      cart.push(Object.assign({ qty: 1 }, item));
    }
    saveCart();
    openCart();
  };

  // initial render
  renderCart();

  // Attach précommander buttons (site-wide) to add product to cart
  document.querySelectorAll(".precommander").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      const id = btn.dataset.id || btn.getAttribute("href") || btn.dataset.name;
      const name =
        btn.dataset.name ||
        (btn.closest(".section-article") &&
          btn
            .closest(".section-article")
            .querySelector(".section-article-titre")
            ?.textContent?.trim()) ||
        "Produit";
      const price = Number(btn.dataset.price) || 0;
      const image =
        btn.dataset.img ||
        btn.dataset.image ||
        (btn.closest(".section-article") &&
          (btn
            .closest(".section-article")
            .querySelector(".soda")
            ?.style.getPropertyValue("--url")
            ?.replace(/^url\(['\"]?|['\"]?\)$/g, "") ||
            btn
              .closest(".section-article")
              .querySelector("img")
              ?.getAttribute("src"))) ||
        "images/bg1.jpg";
      window.addToCart({ id, name, price, image });
      // visual feedback on the button: temporarily show 'Ajouté' and change style
      try {
        const prevHTML = btn.innerHTML;
        btn.classList.add("is-added");
        btn.disabled = true;
        btn.innerHTML = "<span>Ajouté ✓</span>";
        setTimeout(() => {
          btn.classList.remove("is-added");
          btn.disabled = false;
          btn.innerHTML = prevHTML;
        }, 900);
      } catch (err) {
        console.warn("precommander feedback failed", err);
      }
    });
  });
})();

const menuHamburger = document.querySelector(".menu-hamburger")
        const navLinks = document.querySelector(".menu-navigation")
 
        menuHamburger.addEventListener('click',()=>{
        navLinks.classList.toggle('mobile-menu')
        })

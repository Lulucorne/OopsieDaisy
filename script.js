// Change this to your backend URL
const BACKEND_BASE = 'https://your-backend.example.com';

// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Filter chips
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('.products .card');
chips.forEach(chip => {
  chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const tag = chip.dataset.filter;
    cards.forEach(card => {
      const tags = card.getAttribute('data-tags') || '';
      const show = tag === 'all' || tags.includes(tag);
      card.style.display = show ? '' : 'none';
    });
  });
});

// Cart
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const checkoutBtn = document.getElementById('checkoutBtn');

let cart = [];

function openCart(){ cartDrawer.classList.add('open'); cartDrawer.setAttribute('aria-hidden','false'); }
function closeCart(){ cartDrawer.classList.remove('open'); cartDrawer.setAttribute('aria-hidden','true'); }

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

function formatMoney(n){ return `$${n.toFixed(2)}`; }

function renderCart(){
  cartItems.innerHTML = '';
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div>
        <div style="font-weight:800">${item.name}</div>
        <div class="qty">
          <button aria-label="Decrease quantity">−</button>
          <span>${item.qty}</span>
          <button aria-label="Increase quantity">+</button>
          <button style="margin-left:.5rem" aria-label="Remove">Remove</button>
        </div>
      </div>
      <div>${formatMoney(item.price * item.qty)}</div>
    `;
    const [decBtn, incBtn, removeBtn] = row.querySelectorAll('button');
    decBtn.addEventListener('click', () => updateQty(item.id, item.qty - 1));
    incBtn.addEventListener('click', () => updateQty(item.id, item.qty + 1));
    removeBtn.addEventListener('click', () => removeItem(item.id));
    cartItems.appendChild(row);
  });
  cartSubtotal.textContent = formatMoney(subtotal);
  cartCount.textContent = cart.reduce((a,c)=>a+c.qty,0);
  checkoutBtn.disabled = cart.length === 0;
}

function addToCart(product){
  const existing = cart.find(i => i.id === product.id);
  if(existing){ existing.qty += 1; } else { cart.push({...product, qty: 1}); }
  renderCart();
  openCart();
}

function updateQty(id, qty){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  if(qty <= 0){ removeItem(id); return; }
  item.qty = qty;
  renderCart();
}

function removeItem(id){
  cart = cart.filter(i => i.id !== id);
  renderCart();
}

document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      img: btn.dataset.img
    };
    addToCart(product);
  });
});

// Placeholder forms
document.getElementById('newsletterForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  alert('Newsletter joined. Replace with a real service later.');
});
document.getElementById('contactForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  alert('Message sent. Wire this later.');
});

// Auth UI
const loginLink = document.getElementById('loginLink');
const logoutBtn = document.getElementById('logoutBtn');

loginLink.addEventListener('click', (e)=>{
  e.preventDefault();
  window.location.href = `${BACKEND_BASE}/auth/login`;
});
logoutBtn.addEventListener('click', async ()=>{
  await fetch(`${BACKEND_BASE}/auth/logout`, { method:'POST', credentials:'include' });
  location.reload();
});

async function checkMe() {
  try {
    const r = await fetch(`${BACKEND_BASE}/api/me`, { credentials:'include' });
    if (!r.ok) throw new Error('not authed');
    const data = await r.json();
    document.body.classList.add('authed');
    logoutBtn.hidden = false;
    loginLink.hidden = true;

    const el = document.querySelector('.logo');
    if (el && data?.user?.username) el.insertAdjacentHTML('beforeend', `<span style="margin-left:.5rem;font-size:.9rem;">Hi, ${data.user.username}</span>`);
  } catch(e) {}
}
checkMe();

// Checkout button
checkoutBtn.addEventListener('click', async ()=>{
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  const r = await fetch(`${BACKEND_BASE}/api/checkout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart, total: subtotal })
  });
  const data = await r.json();
  if (!r.ok) {
    alert('Payment error: ' + (data?.detail?.message || data?.error || 'unknown'));
    return;
  }
  alert('Payment ok. Transaction ' + data.txnId);
  cart = [];
  renderCart();
});

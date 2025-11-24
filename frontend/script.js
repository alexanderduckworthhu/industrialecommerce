function formatPrice(p, cur) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur || 'USD' }).format(Number(p))
}

function getCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
}

function setCart(c) {
  localStorage.setItem('cart', JSON.stringify(c))
  document.getElementById('cartCount').textContent = String(c.reduce((a,b)=>a + (b.quantity||1), 0))
}

async function loadCategories() {
  const sel = document.getElementById('category')
  const res = await fetch('/api/categories')
  const cats = await res.json()
  sel.innerHTML = '<option value="">All</option>' + cats.map(c => `<option value="${encodeURIComponent(c.name)}">${c.name}</option>`).join('')
}

async function loadCatalog() {
  const status = document.getElementById('status')
  const grid = document.getElementById('grid')
  const cartView = document.getElementById('cartView')
  cartView.style.display = 'none'
  grid.style.display = 'grid'
  try {
    const sel = document.getElementById('category')
    const q = sel.value ? `?category=${encodeURIComponent(sel.value)}` : ''
    const res = await fetch('/api/products' + q)
    if (!res.ok) throw new Error('bad')
    const products = await res.json()
    status.textContent = `Loaded ${products.length} products`
    grid.innerHTML = ''
    for (const p of products) {
      const card = document.createElement('div')
      card.className = 'card'

      const pad = document.createElement('div')
      pad.className = 'pad'

      const name = document.createElement('div')
      name.textContent = p.name
      name.style.fontWeight = '600'

      const cat = document.createElement('div')
      cat.textContent = p.category || ''
      cat.className = 'muted'

      const price = document.createElement('div')
      price.textContent = formatPrice(p.price, p.currency)
      price.className = 'price'

      const view = document.createElement('a')
      view.href = `#product-${p.id}`
      view.textContent = 'View details'
      view.className = 'btn'
      view.addEventListener('click', async (e) => {
        e.preventDefault()
        await showProduct(p.id)
      })

      const add = document.createElement('a')
      add.href = `#add-${p.id}`
      add.textContent = 'Add to cart'
      add.className = 'btn'
      add.addEventListener('click', (e) => {
        e.preventDefault()
        const cart = getCart()
        const idx = cart.findIndex(i => i.product_id === p.id)
        if (idx >= 0) cart[idx].quantity += 1
        else cart.push({ product_id: p.id, name: p.name, price: p.price, currency: p.currency, quantity: 1 })
        setCart(cart)
      })

      pad.append(name, cat, price, view, add)
      card.append(pad)
      grid.appendChild(card)
    }
  } catch (e) {
    status.textContent = 'Failed to load catalog'
  }
}

async function showProduct(id) {
  const status = document.getElementById('status')
  const grid = document.getElementById('grid')
  const cartView = document.getElementById('cartView')
  try {
    const res = await fetch(`/api/products/${id}`)
    if (!res.ok) throw new Error('bad')
    const p = await res.json()
    status.textContent = 'Product details'
    grid.innerHTML = ''
    cartView.style.display = 'none'
    const card = document.createElement('div')
    card.className = 'panel'

    const name = document.createElement('h2')
    name.textContent = p.name

    const desc = document.createElement('p')
    desc.textContent = p.description

    const price = document.createElement('div')
    price.textContent = formatPrice(p.price, p.currency)
    price.style.fontWeight = '600'

    const add = document.createElement('a')
    add.href = '#'
    add.textContent = 'Add to cart'
    add.className = 'btn'
    add.addEventListener('click', (e) => {
      e.preventDefault()
      const cart = getCart()
      const idx = cart.findIndex(i => i.product_id === p.id)
      if (idx >= 0) cart[idx].quantity += 1
      else cart.push({ product_id: p.id, name: p.name, price: p.price, currency: p.currency, quantity: 1 })
      setCart(cart)
    })

    const back = document.createElement('a')
    back.href = '#'
    back.textContent = 'Back to catalog'
    back.className = 'btn'
    back.addEventListener('click', async (e) => {
      e.preventDefault()
      await loadCatalog()
    })

    card.append(name, desc, price, add, back)
    grid.appendChild(card)
  } catch (e) {
    status.textContent = 'Failed to load product'
  }
}

async function showCart() {
  const status = document.getElementById('status')
  const grid = document.getElementById('grid')
  const cartView = document.getElementById('cartView')
  const list = document.getElementById('cartItems')
  const cart = getCart()
  grid.style.display = 'none'
  cartView.style.display = 'block'
  status.textContent = `Cart (${cart.reduce((a,b)=>a+b.quantity,0)} items)`
  list.innerHTML = ''
  let total = 0
  for (const it of cart) {
    const row = document.createElement('div')
    row.textContent = `${it.name} × ${it.quantity} — ${formatPrice(Number(it.price) * it.quantity, it.currency)}`
    list.appendChild(row)
    total += Number(it.price) * it.quantity
  }
  const sum = document.createElement('div')
  sum.style.fontWeight = '600'
  sum.textContent = `Total: ${formatPrice(total, cart[0]?.currency || 'USD')}`
  list.appendChild(sum)
}

async function checkout() {
  const name = document.getElementById('customerName').value.trim()
  const email = document.getElementById('customerEmail').value.trim()
  const company = document.getElementById('customerCompany').value.trim()
  const phone = document.getElementById('customerPhone').value.trim()
  const address1 = document.getElementById('customerAddress1').value.trim()
  const address2 = document.getElementById('customerAddress2').value.trim()
  const city = document.getElementById('customerCity').value.trim()
  const country = document.getElementById('customerCountry').value.trim()
  const cart = getCart()
  if (!name || !email || cart.length === 0) return
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer: { name, email, company, phone, address1, address2, city, country }, items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity })) })
  })
  if (!res.ok) {
    alert('Checkout failed')
    return
  }
  const order = await res.json()
  await showPayment(order)
}

window.addEventListener('DOMContentLoaded', async () => {
  setCart(getCart())
  await loadCategories()
  await loadCatalog()
  document.getElementById('category').addEventListener('change', loadCatalog)
  document.getElementById('cartBtn').addEventListener('click', async (e) => { e.preventDefault(); await showCart() })
  document.getElementById('backBtn').addEventListener('click', async (e) => { e.preventDefault(); await loadCatalog() })
  document.getElementById('checkoutBtn').addEventListener('click', async (e) => { e.preventDefault(); await checkout() })
  const browseBtn = document.getElementById('browseBtn')
  if (browseBtn) browseBtn.addEventListener('click', async (e) => { e.preventDefault(); await loadCatalog() })
})
async function showPayment(order) {
  const grid = document.getElementById('grid')
  const cartView = document.getElementById('cartView')
  const paymentView = document.getElementById('paymentView')
  grid.style.display = 'none'
  cartView.style.display = 'none'
  paymentView.style.display = 'block'
  const payBtn = document.getElementById('payBtn')
  const cancelBtn = document.getElementById('cancelPayBtn')
  const handler = async (e) => {
    e.preventDefault()
    const amount = order.total
    const res = await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.id, amount, method: 'card' })
    })
    if (!res.ok) { alert('Payment failed'); return }
    localStorage.removeItem('cart')
    setCart([])
    alert(`Payment successful for Order #${order.id}`)
    paymentView.style.display = 'none'
    await loadCatalog()
  }
  const cancelHandler = async (e) => { e.preventDefault(); paymentView.style.display = 'none'; await loadCatalog() }
  payBtn.onclick = handler
  cancelBtn.onclick = cancelHandler
}
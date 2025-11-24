import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pkg from 'pg'

dotenv.config()

const { Pool } = pkg

const app = express()
app.use(cors())
app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'dit312'
})

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch (e) {
    res.status(500).json({ status: 'error' })
  }
})

app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM categories ORDER BY name')
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.get('/products', async (req, res) => {
  try {
    const { category, category_id } = req.query
    let sql = `
      SELECT p.id, p.name, p.description, p.price, p.currency, p.image_url,
             c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
    `
    const params = []
    if (category_id) {
      params.push(Number(category_id))
      sql += ' WHERE p.category_id = $1'
    } else if (category) {
      params.push(String(category))
      sql += ' WHERE c.name = $1'
    }
    sql += ' ORDER BY p.id'
    const result = await pool.query(sql, params)
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.get('/products/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad id' })
    const result = await pool.query(`
      SELECT p.id, p.name, p.description, p.price, p.currency, p.image_url,
             c.name AS category
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = $1
    `, [id])
    if (result.rows.length === 0) return res.status(404).json({ error: 'not found' })
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.post('/orders', async (req, res) => {
  const { customer, items } = req.body || {}
  const c = customer || {}
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'invalid payload' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const productIds = items.map(i => Number(i.product_id)).filter(Number.isFinite)
    if (productIds.length !== items.length) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'invalid product ids' })
    }
    const { rows: products } = await client.query(
      'SELECT id, price, currency FROM products WHERE id = ANY($1::int[])',
      [productIds]
    )
    if (products.length !== items.length) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'product not found' })
    }
    const byId = new Map(products.map(p => [p.id, p]))
    let total = 0
    for (const it of items) {
      const p = byId.get(Number(it.product_id))
      const qty = Number(it.quantity) || 1
      total += Number(p.price) * qty
    }
    const currency = products[0].currency
    let customerId = null
    if (c && c.email) {
      const { rows: existing } = await client.query('SELECT id FROM customers WHERE email = $1', [String(c.email)])
      if (existing.length > 0) {
        customerId = existing[0].id
        await client.query(
          'UPDATE customers SET name = COALESCE($1, name), company = COALESCE($2, company), address1 = COALESCE($3, address1), address2 = COALESCE($4, address2), city = COALESCE($5, city), country = COALESCE($6, country), phone = COALESCE($7, phone) WHERE id = $8',
          [c.name || null, c.company || null, c.address1 || null, c.address2 || null, c.city || null, c.country || null, c.phone || null, customerId]
        )
      } else {
        const { rows: created } = await client.query(
          'INSERT INTO customers (name, email, company, address1, address2, city, country, phone) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
          [c.name || '', String(c.email), c.company || null, c.address1 || null, c.address2 || null, c.city || null, c.country || null, c.phone || null]
        )
        customerId = created[0].id
      }
    }
    const { rows: orderRows } = await client.query(
      'INSERT INTO orders (customer_id, customer_name, total) VALUES ($1, $2, $3) RETURNING id, created_at',
      [customerId, c.name || null, total]
    )
    const orderId = orderRows[0].id
    for (const it of items) {
      const p = byId.get(Number(it.product_id))
      const qty = Number(it.quantity) || 1
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, currency) VALUES ($1, $2, $3, $4, $5)',
        [orderId, Number(it.product_id), qty, p.price, p.currency]
      )
    }
    await client.query('COMMIT')
    res.status(201).json({ id: orderId, total, currency })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'failed' })
  } finally {
    client.release()
  }
})

app.get('/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad id' })
    const { rows: orders } = await pool.query('SELECT o.id, o.customer_name, o.total, o.created_at, o.customer_id, c.name, c.email, c.company, c.city, c.country FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = $1', [id])
    if (orders.length === 0) return res.status(404).json({ error: 'not found' })
    const { rows: items } = await pool.query(`
      SELECT oi.product_id, oi.quantity, oi.unit_price, oi.currency, p.name
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1
    `, [id])
    res.json({ order: orders[0], items })
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

app.post('/payments', async (req, res) => {
  try {
    const { order_id, amount, method } = req.body || {}
    const oid = Number(order_id)
    const amt = Number(amount)
    if (!Number.isFinite(oid) || !Number.isFinite(amt)) return res.status(400).json({ error: 'invalid payload' })
    const { rows: orders } = await pool.query('SELECT id, total FROM orders WHERE id = $1', [oid])
    if (orders.length === 0) return res.status(404).json({ error: 'order not found' })
    const status = 'success'
    const { rows } = await pool.query(
      'INSERT INTO payments (order_id, amount, status, method) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [oid, amt, status, method || null]
    )
    res.status(201).json({ payment_id: rows[0].id, status })
  } catch (e) {
    res.status(500).json({ error: 'failed' })
  }
})

const port = parseInt(process.env.API_PORT || '3000', 10)
app.listen(port, () => {})
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  image_url TEXT,
  category_id INTEGER REFERENCES categories(id)
);

INSERT INTO categories (name) VALUES
('Industrial Robots'),
('CNC Machines'),
('3D Printers'),
('Automated Conveyors')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, currency, image_url, category_id) VALUES
('RX-200 Robotic Arm', '6-axis industrial robotic arm with 10kg payload, 0.02mm repeatability.', 24500.00, 'USD', 'https://images.unsplash.com/photo-1581091017204-9c7c49f2ef66?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='Industrial Robots')),
('CNC Pro X7', 'High-precision 3-axis CNC milling machine for metal and composites.', 39999.00, 'USD', 'https://images.unsplash.com/photo-1581094651189-0af8fa4f1f5f?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='CNC Machines')),
('PrintForge 500', 'Industrial FDM 3D printer with 500x500x500 build volume and heated chamber.', 12999.00, 'USD', 'https://images.unsplash.com/photo-1558431382-836b341b79ef?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='3D Printers')),
('FlexConveyor A1', 'Modular automated conveyor system with smart sensors and speed control.', 8900.00, 'USD', 'https://images.unsplash.com/photo-1581091016008-0c4fbb3b87a6?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='Automated Conveyors'))
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, currency, image_url, category_id) VALUES
('Atlas 12 Robot', 'Compact 12kg payload robot with integrated vision system.', 28500.00, 'USD', 'https://images.unsplash.com/photo-1581092332380-2d7a4e5b7c9f?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='Industrial Robots')),
('Titan CNC T12', '12-axis CNC for complex aerospace parts and precision tooling.', 89999.00, 'USD', 'https://images.unsplash.com/photo-1581093691824-1de73f2cf9d2?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='CNC Machines')),
('SteelMill S5', 'Heavy-duty CNC for steel fabrication with coolant and enclosure.', 55999.00, 'USD', 'https://images.unsplash.com/photo-1581093588421-8be95f66a7cd?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='CNC Machines')),
('NovaPrint X1', 'Industrial SLA 3D printer for ultra-fine resin parts.', 25999.00, 'USD', 'https://images.unsplash.com/photo-1581093587902-8a2c40c3ca80?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='3D Printers')),
('LineFlow Pro', 'High-speed conveyor optimized for packaging and assembly lines.', 14900.00, 'USD', 'https://images.unsplash.com/photo-1581093588564-0c0e2c9e9a66?q=80&w=1600&auto=format&fit=crop', (SELECT id FROM categories WHERE name='Automated Conveyors'))
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL,
  method TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id);
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com o banco — usa variável de ambiente injetada pelo Compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tenta conectar e criar as tabelas com retry (depends_on não garante que o banco está pronto)
async function initDB(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS cardapio (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          descricao TEXT,
          preco NUMERIC(10,2) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pedidos (
          id SERIAL PRIMARY KEY,
          cliente TEXT NOT NULL,
          item_id INTEGER REFERENCES cardapio(id),
          item_nome TEXT NOT NULL,
          status TEXT DEFAULT 'pendente',
          criado_em TIMESTAMP DEFAULT NOW()
        );

        INSERT INTO cardapio (nome, descricao, preco)
        SELECT * FROM (VALUES
          ('X-Burguer', 'Pão, carne, queijo e alface', 18.90),
          ('X-Bacon', 'Pão, carne, bacon crocante e queijo', 22.50),
          ('Fritas Grandes', 'Porção grande de batata frita crocante', 12.00),
          ('Refrigerante', 'Lata 350ml (Coca, Guaraná ou Sprite)', 7.00),
          ('Milk-shake', 'Chocolate, morango ou baunilha - 400ml', 16.00)
        ) AS v(nome, descricao, preco)
        WHERE NOT EXISTS (SELECT 1 FROM cardapio);
      `);
      console.log("✅ Banco inicializado com sucesso!");
      return;
    } catch (err) {
      console.log(`⏳ Tentativa ${i + 1}/${retries} — banco ainda não está pronto: ${err.message}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.error("❌ Não foi possível conectar ao banco após várias tentativas.");
  process.exit(1);
}

// ── ROTAS ────────────────────────────────────────────────────────────────────

// GET /cardapio — lista todos os itens do cardápio
app.get("/cardapio", async (req, res) => {
  const result = await pool.query("SELECT * FROM cardapio ORDER BY id");
  res.json(result.rows);
});

// GET /pedidos — lista todos os pedidos
app.get("/pedidos", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM pedidos ORDER BY criado_em DESC"
  );
  res.json(result.rows);
});

// POST /pedidos — cria um novo pedido
app.post("/pedidos", async (req, res) => {
  const { cliente, item_id, item_nome } = req.body;
  if (!cliente || !item_id || !item_nome) {
    return res.status(400).json({ erro: "cliente, item_id e item_nome são obrigatórios" });
  }
  const result = await pool.query(
    "INSERT INTO pedidos (cliente, item_id, item_nome) VALUES ($1, $2, $3) RETURNING *",
    [cliente, item_id, item_nome]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH /pedidos/:id — atualiza o status de um pedido (ex: pendente → pronto)
app.patch("/pedidos/:id", async (req, res) => {
  const { status } = req.body;
  const result = await pool.query(
    "UPDATE pedidos SET status = $1 WHERE id = $2 RETURNING *",
    [status, req.params.id]
  );
  res.json(result.rows[0]);
});

// ── START ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend rodando na porta ${PORT}`);
  });
});

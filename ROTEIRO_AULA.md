# Aula: Docker Compose na Prática
## Sistema de Pedidos — Lanchonete do Zé

---

## Estrutura do projeto

```
lanchonete/
├── backend/
│   ├── index.js          ← API Node/Express
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── index.html        ← Interface HTML/JS 
│   └── Dockerfile
├── docker-compose.yml            ← arquivo em branco para preencher
```

---

## Roteiro da aula

### 1.Contexto do problema

> "A lanchonete quer digitalizar os pedidos.
> O cliente acessa o site, vê o cardápio, escolhe o item e faz o pedido.
> O cozinheiro vê os pedidos chegando e atualiza o status."

Mostra o `index.html` no browser (abrir o arquivo diretamente, sem Docker ainda) e deixa claro que ele não funciona, a lista de itens dá erro porque não tem backend.

---

### 2. Problema de subir tudo manualmente

Mostra nos slides todo esse código que seria necessário rodar manualmente, tanto nós quanto todo mundo que fosse executar, todas as vezes. Se a ordem estiver errada o backend não conecta com o banco:

Criamos manualmente uma rede para comunicação entre containers e um volume para persistência dos dados.
```bash
docker network create lanchonete-net
docker volume create dados_postgres
```

Subir o banco:
```bash
docker run -d --name db --network lanchonete-net \
  -e POSTGRES_USER=lanchonete \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=pedidos \
  -v dados_postgres:/var/lib/postgresql/data \
  postgres:15
```


Subir o backend:

```bash
docker run -d --name backend --network lanchonete-net \
  -e DATABASE_URL=postgres://lanchonete:senha123@db:5432/pedidos \
  -p 8080:8080 lanchonete-backend
```


Subir o frontend:

```bash
docker run -d --name frontend --network lanchonete-net \
  -p 3000:80 lanchonete-frontend
```

---

### 3. Introdução ao Docker Compose
Agora vamos resolver esse problema com um único arquivo: docker-compose.yml.
A ideia do Compose é declarar toda a aplicação em um único lugar, descrevendo serviços, redes e volumes de forma estruturada.
Apresenta o docker-compose.yml em branco para ir preenchendo.

Pede para todo mundo abrir o `docker-compose.TEMPLATE.yml` no VS Code.

---

### 4. Preenche o `db` 

Aqui usamos uma imagem pronta. Não estamos construindo nada, apenas executando uma versão já disponível do Postgres: 
```yaml
db:
  image: postgres:15
```

Essas variáveis inicializam o banco automaticamente quando o container é criado:
```yaml
  environment:
    - POSTGRES_USER=lanchonete
    - POSTGRES_PASSWORD=senha123
    - POSTGRES_DB=pedidos
```
O volume garante persistência dos dados. Mesmo que o container seja removido, os dados continuam existindo:
```yaml
  volumes:
    - dados_postgres:/var/lib/postgresql/data
```

O healthcheck verifica se o banco está realmente pronto para conexões. Isso é diferente de apenas “o container estar rodando”:
```yaml
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U lanchonete"]
    interval: 5s
    retries: 5
```

**Pergunta:** "Por que isso? O `depends_on` não já garante a ordem?"
→ `depends_on` garante que o *container* iniciou, não que o Postgres está *pronto* para conexões.
  Sem o healthcheck, o backend tenta conectar e leva `connection refused`.
  (mostrar o retry no `index.js` do backend como alternativa de código)

---

### 5. Preenche o `backend`

Aqui usamos build porque estamos criando a imagem a partir de um Dockerfile local:
```yaml
backend:
  build: ./backend
```

"Qual a diferença entre `build` e `image`?"
→ `image`: usa uma imagem pronta do Docker Hub.
→ `build`: constrói uma imagem local a partir do `Dockerfile`.


O formato é sempre HOST:CONTAINER. Isso significa que acessamos o backend pelo navegador em localhost:8080:
```yaml
  ports:
    - "8080:8080"
```

O ponto mais importante aqui é o uso de db como host.
Dentro do Docker Compose, todos os serviços estão na mesma rede interna, e o nome do serviço funciona como um DNS automático:
```yaml
  environment:
    - DATABASE_URL=postgres://lanchonete:senha123@db:5432/pedidos
```

Isso garante que o backend só inicie quando o banco estiver realmente pronto para receber conexões.
```yaml
  depends_on:
    db:
      condition: service_healthy
```

 `depends_on: db` vs `depends_on: db: condition: service_healthy`.
→ Sem `condition`: sobe na ordem certa, mas não espera o banco estar pronto.
→ Com `condition: service_healthy`: só sobe quando o healthcheck do db passar.

---

### 6. Preenche o `frontend`

O frontend é servido por um servidor web interno na porta 80. Externamente, acessamos pela porta 3000.
O depends_on  apenas define ordem de inicialização. O frontend depende do backend estar iniciado, mas não necessariamente pronto:
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:80"
  depends_on:
    - backend
```
---

### 7. Seção `volumes`

Aqui declaramos o volume nomeado. Ele é gerenciado pelo Docker e não depende do ciclo de vida dos containers:
```yaml
volumes:
  dados_postgres:
```
---

### 8. Subindo a aplicação

Esse comando: constrói imagens,cria containers, configura rede automaticamente, sobe todos os serviços: 
```bash
docker compose up --build
```

```bash
docker compose ps
```

Abre o browser em `http://localhost:3000`, faz um pedido ao vivo com a sala,
e atualiza o status de "pendente" para "preparando" e depois "pronto".

---

### 9. Demonstra o volume 

```bash
docker compose down
docker compose up -d
```

Abre o browser de novo — os pedidos ainda estão lá.

"Por que os dados continuam?"
→ O volume `dados_postgres` não é removido pelo `down`.
  Só seria removido com `docker compose down -v`.

---

## Resumo dos conceitos cobertos

| Conceito | Onde apareceu |
|---|---|
| `image` vs `build` | db usa image, backend/frontend usam build |
| `environment` | configs do banco e DATABASE_URL do backend |
| `ports` (HOST:CONTAINER) | backend 8080:8080, frontend 3000:80 |
| `volumes` | persistência dos dados do Postgres |
| `depends_on` + `healthcheck` | backend só sobe quando o banco está pronto |
| Networks internas | `@db` na DATABASE_URL, nome de serviço funciona dentro da rede |
| `docker compose up --build` | constrói e sobe tudo |
| `docker compose down` | remove containers mas preserva volumes |
| `docker compose down -v` | remove tudo, inclusive volumes |

---

## Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver só os logs do backend
docker compose logs -f backend

# Ver containers rodando
docker compose ps

# Parar tudo (mantém volumes)
docker compose down

# Parar tudo E apagar dados
docker compose down -v

# Reconstruir só o backend
docker compose up --build backend
```

![Logo do Docker Compose](https://miro.medium.com/v2/resize:fit:1400/0*yKUZfT6P10SAIWNy.jpg)

# 📖 Aula Docker Compose - 2ºG
## Integrantes:
- Davi do Nascimento Costa
- Erick Santos Silva
- João Pedro Araujo de Souza
- Mariana Marrão Ferreira Felis
- Rahquel Korzh Emidio
- Samuel Pimenta Hironimus

## O que é o Docker Compose?
O Docker Compose é uma ferramenta que permite definir e gerenciar aplicativos multi-contêineres. 
Ele utiliza um arquivo YAML para configurar os serviços, redes e volumes necessários para a aplicação. 
Com o Docker Compose, é possível iniciar, parar e gerenciar todos os contêineres de uma aplicação com um único comando, 
facilitando o desenvolvimento e a implantação de aplicativos complexos.

Com o Compose é possível definir um ambiente de desenvolvimento completo, 
incluindo bancos de dados, servidores web e outros serviços necessários para a aplicação.
Além disso, o Docker Compose é útil para criar ambientes de teste e produção consistentes, 
garantindo que a aplicação funcione da mesma forma em diferentes ambientes.


## O que o Compose resolve?
A configuração de processos Docker que são executados em conjunto para criar um ambiente de desenvolvimento
ou produção pode ser complexa e propensa a erros.
Como no caso que vamos mostrar em breve, seria necessário que cada dev executasse os comandos para criar a rede, o volume, 
o contêiner do banco de dados, o contêiner do backend e o contêiner do frontend,
tudo em uma ordem específica, e isso pode levar a erros de configuração, 
como esquecer de criar a rede ou o volume, ou configurar as variáveis de ambiente incorretamente.

Se um dev novo entrar na equipe, ele precisa saber todos os comandos e a ordem específica de execução para montar os ambientes.

Exemplo de configuração manual sem Docker Compose:

```bash
docker network create lanchonete-net
docker volume create dados_postgres
docker run -d --name db --network lanchonete-net \
  -e POSTGRES_USER=lanchonete \
  -e POSTGRES_PASSWORD=senha123 \
  -e POSTGRES_DB=pedidos \
  -v dados_postgres:/var/lib/postgresql/data \
  postgres:15
docker run -d --name backend --network lanchonete-net \
  -e DATABASE_URL=postgres://lanchonete:senha123@db:5432/pedidos \
  -p 8080:8080 lanchonete-backend
docker run -d --name frontend --network lanchonete-net \
  -p 3000:80 lanchonete-frontend
```

Com um arquivo `docker-compose.yml`, podemos definir todos esses serviços, redes e volumes de forma declarativa,
e iniciar a aplicação com um único comando `docker-compose up`, garantindo que tudo seja configurado corretamente e de forma consistente em todos os ambientes. 
Isso torna o processo de desenvolvimento e implantação muito mais fácil e menos propenso a erros, além de melhorar a colaboração entre os membros da equipe.

## Estrutura YAML
### O que é um arquivo YAML?
YAML (YAML Ain't Markup Language) é um formato de serialização de dados legível por humanos, usado para configurar arquivos e armazenar dados. 
Ele é amplamente utilizado em aplicações de software, incluindo o Docker Compose, para definir a configuração de serviços, redes e volumes de forma clara e concisa. 
O YAML é fácil de ler e escrever, tornando-o uma escolha popular para arquivos de configuração.

### Como o YAML é estruturado?
O YAML é estruturado em uma hierarquia de chaves e valores, onde as chaves são seguidas por dois pontos
e os valores podem ser strings, números, listas ou outros objetos. 

Os níveis de hierarquia são indicados por indentação feita com espaços (não use tabulações). 
Geralmente, cada nível de hierarquia é representado por dois espaços, 
mas isso pode variar dependendo da preferência do desenvolvedor.
## Exemplo de arquivo `docker-compose.yaml`:

```yaml
version: "3.9"

services:
  frontend:
    image: frontend-app
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    image: backend-app
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://postgres:postgres@db:5432/appdb
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=appdb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Principais comandos do Docker Compose
- Subir contêineres (modo interativo): docker compose up
- Subir em background: docker compose up -d
- Parar e remover recursos: docker compose down
- Ver serviços ativos: docker compose ps 
- Ver logs: docker compose logs (use -f para seguir)
- Reconstruir imagens e subir: docker compose up --build

## Benefícios do Docker Compose
- Organização: Toda a infraestrutura em um único arquivo.
- Produtividade: Menos tempo de configuração e execução.
- Automação: Criação de contêineres, redes, volumes e dependências.
- Facilidade: Qualquer pessoa do time sobe o ambiente com poucos comandos.

# Vamos praticar!
Roteiro da prática: [ROTEIRO_AULA.md](https://github.com/marianamarrao/docker-compose-aula/blob/7dccca450d244001d9efc38087d84c271c777396/ROTEIRO_AULA.md)
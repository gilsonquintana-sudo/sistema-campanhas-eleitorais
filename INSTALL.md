# 🚀 Guia de Instalação - Sistema de Campanhas Eleitorais

## Pré-requisitos

- Node.js 18+
- Docker & Docker Compose
- Git
- PostgreSQL 15+ (ou use Docker)
- Redis (ou use Docker)
- Google Maps API Key (para funcionalidade de mapas)

## 📋 Instalação Rápida com Docker

### 1. Clone o repositório

```bash
git clone https://github.com/gilsonquintana-sudo/sistema-campanhas-eleitorais.git
cd sistema-campanhas-eleitorais
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure:
- `JWT_SECRET` - Gere uma chave segura
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Sua chave do Google Maps
- Senhas do banco de dados

### 3. Inicie com Docker Compose

```bash
docker-compose up -d
```

Este comando iniciará:
- PostgreSQL
- Redis
- Backend (Node.js)
- Frontend (Next.js)

### 4. Acesse a aplicação

```
Frontend: http://localhost:3000
Backend: http://localhost:5000
API Docs: http://localhost:5000/api/docs
```

### 5. Login com credenciais padrão

```
Email: gilsonquintana@gmail.com
Senha: 307768
Nível: ADMIN MASTER
```

## 🔧 Instalação Manual (sem Docker)

### Backend

```bash
cd backend
npm install

# Configure o banco de dados
DATABASE_URL="postgresql://user:password@localhost:5432/campanhas_eleitorais" npm run migrate

# Inicie o servidor
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🗄️ Configuração do Banco de Dados

### Com Docker

Já está configurado no `docker-compose.yml`

### Manual

```bash
# Conecte ao PostgreSQL
psql -U campanhas_user -d campanhas_eleitorais

# Execute as migrations
cd backend
npm run migrate
```

## 🔐 Primeira Execução

1. O sistema criará automaticamente o usuário ADMIN MASTER
2. Todos os dados de exemplo serão importados
3. Verifique os logs para confirmação

## 🐛 Troubleshooting

### Porta 5000 já em uso
```bash
lsof -i :5000
kill -9 <PID>
```

### Erro de conexão com banco de dados
```bash
# Verifique se PostgreSQL está rodando
docker-compose logs postgres

# Reinicie os containers
docker-compose restart postgres backend
```

### Redis não conecta
```bash
# Reinicie Redis
docker-compose restart redis
```

## 📦 Variáveis de Ambiente

Veja `.env.example` para todas as variáveis disponíveis.

## 🚀 Produção

Para deployar em produção:

```bash
# Build das imagens
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Inicie em produção
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📚 Próximos Passos

- Leia [API.md](./API.md) para documentação da API
- Leia [DATABASE.md](./DATABASE.md) para esquema do banco
- Leia [ARCHITECTURE.md](./ARCHITECTURE.md) para arquitetura técnica

## 💡 Dicas

- Use `npm run dev` para desenvolvimento com hot reload
- Use `npm test` para executar testes
- Use `npm run lint` para verificar código
- Verifique logs com `docker-compose logs -f backend`

---

**Precisa de ajuda?** Abra uma issue no repositório.

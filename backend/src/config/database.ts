import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 
  'postgresql://campanhas_user:secure_password_123@localhost:5432/campanhas_eleitorais';

const pool = new Pool({
  connectionString,
  max: 20,
  min: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões', err);
  process.exit(-1);
});

export default pool;

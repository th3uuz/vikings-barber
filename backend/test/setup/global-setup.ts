import './load-env.js';
import { execSync } from 'node:child_process';
import pg from 'pg';

/**
 * Prepara o banco de teste antes da suíte: cria o banco se ainda não existir e
 * aplica as migrations pendentes. Cada arquivo de teste limpa as tabelas que usa.
 */
export default async function setup() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!/test/i.test(database)) {
    throw new Error(
      `Por segurança, os testes e2e só rodam num banco com "test" no nome (atual: "${database}").`,
    );
  }

  await createDatabaseIfMissing(url, database);

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}

async function createDatabaseIfMissing(url: URL, database: string) {
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database.replaceAll('"', '""')}"`);
    }
  } finally {
    await client.end();
  }
}

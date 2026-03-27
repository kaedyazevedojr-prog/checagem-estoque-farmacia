/**
 * Abstração de persistência do estoque.
 * - Local (desenvolvimento): lê/escreve em estoque.json
 * - Vercel (produção): lê/escreve via Vercel Blob
 *
 * A variável BLOB_READ_WRITE_TOKEN define qual modo usar.
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ESTOQUE_FILE = join(__dirname, '..', 'estoque.json');
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function readEstoque() {
  if (USE_BLOB) {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: 'estoque.json', limit: 1 });
    if (!blobs.length) return { inventory: [], updatedAt: null };
    const res = await fetch(blobs[0].url);
    return res.json();
  }

  if (!existsSync(ESTOQUE_FILE)) return { inventory: [], updatedAt: null };
  return JSON.parse(await readFile(ESTOQUE_FILE, 'utf-8'));
}

export async function writeEstoque(data) {
  const body = JSON.stringify(data);

  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    await put('estoque.json', body, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return;
  }

  await writeFile(ESTOQUE_FILE, body);
}

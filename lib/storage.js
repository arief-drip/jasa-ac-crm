// Storage abstraction — uses Vercel Blob in production, local JSON in dev
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(process.cwd(), 'data.json');
const BLOB_NAME = 'crm-data.json';

const defaultData = { entries: [], nextId: 1 };

// Local file helpers
function readLocal() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return { ...defaultData, entries: [] };
}

function writeLocal(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Vercel Blob helpers
async function readBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://blob.vercel-storage.com/${BLOB_NAME}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      return JSON.parse(await res.text());
    }
  } catch (e) { /* ignore */ }
  return null;
}

async function writeBlob(data) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  try {
    await fetch(`https://blob.vercel-storage.com/${BLOB_NAME}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-vercel-blob-cache-control': 'no-cache',
      },
      body: JSON.stringify(data),
    });
  } catch (e) { /* ignore */ }
}

// Detect environment
const isVercel = !!process.env.VERCEL;
const useBlob = isVercel && !!process.env.BLOB_READ_WRITE_TOKEN;

// Public API
async function getEntries() {
  if (useBlob) {
    const data = await readBlob();
    return data?.entries || [];
  }
  return readLocal().entries || [];
}

async function saveEntries(entries) {
  if (useBlob) {
    const existing = await readBlob() || { ...defaultData };
    existing.entries = entries;
    await writeBlob(existing);
  } else {
    const data = readLocal();
    data.entries = entries;
    writeLocal(data);
  }
}

async function addEntry(entry) {
  const entries = await getEntries();
  const maxId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) : 0;

  const newEntry = {
    id: maxId + 1,
    ...entry,
    sudahDihubungi: false,
    fixOrder: false,
    dealHarga: null,
    spekWeb: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  entries.push(newEntry);
  await saveEntries(entries);
  return newEntry;
}

async function updateEntry(id, updates) {
  const entries = await getEntries();
  const idx = entries.findIndex(e => e.id === id);
  if (idx === -1) return null;

  entries[idx] = {
    ...entries[idx],
    ...updates,
    id: entries[idx].id,
    createdAt: entries[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  await saveEntries(entries);
  return entries[idx];
}

async function deleteEntry(id) {
  const entries = await getEntries();
  const filtered = entries.filter(e => e.id !== id);
  await saveEntries(filtered);
  return true;
}

module.exports = { getEntries, addEntry, updateEntry, deleteEntry };

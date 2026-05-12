// Storage abstraction — uses /tmp/data.json on Vercel, local JSON in dev
const fs = require('fs');
const path = require('path');

const DEVEL_DATA_FILE = path.join(process.cwd(), 'data.json');
const PROD_DATA_FILE = '/tmp/crm-data.json';

const isVercel = !!process.env.VERCEL;
const DATA_FILE = isVercel ? PROD_DATA_FILE : DEVEL_DATA_FILE;

const defaultData = { entries: [], nextId: 1 };

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
    // Seed from repo data.json if on Vercel and /tmp doesn't exist yet
    if (isVercel && fs.existsSync(DEVEL_DATA_FILE)) {
      const seed = JSON.parse(fs.readFileSync(DEVEL_DATA_FILE, 'utf-8'));
      writeData(seed);
      return seed;
    }
  } catch (e) {
    console.error('Storage read error:', e.message);
  }
  return { ...defaultData, entries: [] };
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function getEntries() {
  return readData().entries || [];
}

async function saveEntries(entries) {
  const data = readData();
  data.entries = entries;
  writeData(data);
}

async function addEntry(entry) {
  const data = readData();
  const id = data.nextId || (data.entries.length > 0 ? Math.max(...data.entries.map(e => e.id)) + 1 : 1);
  
  const newEntry = {
    id,
    ...entry,
    sudahDihubungi: false,
    fixOrder: false,
    dealHarga: null,
    spekWeb: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  data.entries.push(newEntry);
  data.nextId = id + 1;
  writeData(data);
  return newEntry;
}

async function updateEntry(id, updates) {
  const data = readData();
  const idx = data.entries.findIndex(e => e.id === id);
  if (idx === -1) return null;

  data.entries[idx] = {
    ...data.entries[idx],
    ...updates,
    id: data.entries[idx].id,
    createdAt: data.entries[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  writeData(data);
  return data.entries[idx];
}

async function deleteEntry(id) {
  const data = readData();
  data.entries = data.entries.filter(e => e.id !== id);
  writeData(data);
  return true;
}

module.exports = { getEntries, addEntry, updateEntry, deleteEntry };

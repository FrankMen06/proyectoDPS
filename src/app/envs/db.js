import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'db.json');
const IS_VERCEL = !!process.env.VERCEL; // en Vercel el FS es read-only en runtime

const defaultShape = { users: [], projects: [], tasks: [], sessions: [], notifications: [] };

// Caché en memoria (sirve para Vercel)
let MEMORY_DB = null;

function readFileDB() {
    try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...defaultShape, ...parsed };
    } catch {
        return { ...defaultShape };
    }
}

function writeFileDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getDB() {
    if (IS_VERCEL) {
        if (!MEMORY_DB) MEMORY_DB = readFileDB(); // lee una vez del archivo (build time)
        return MEMORY_DB;
    }
    return readFileDB();
}

function setDB(data) {
    if (IS_VERCEL) {
        MEMORY_DB = data; // solo memoria
    } else {
        writeFileDB(data); // escribe en disco cuando estás local
    }
}

export function list(collection) {
    const db = getDB();
    return db[collection] || [];
}

export function getById(collection, id) {
    const items = list(collection);
    return items.find((i) => String(i.id) === String(id)) || null;
}

export function create(collection, item) {
    const db = getDB();
    const items = db[collection] || [];
    items.push(item);
    db[collection] = items;
    setDB(db);
    return item;
}

export function patch(collection, id, updates) {
    const db = getDB();
    const items = db[collection] || [];
    const idx = items.findIndex((i) => String(i.id) === String(id));
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates };
    db[collection] = items;
    setDB(db);
    return items[idx];
}

export function replace(collection, id, newObj) {
    const db = getDB();
    const items = db[collection] || [];
    const idx = items.findIndex((i) => String(i.id) === String(id));
    if (idx === -1) return null;
    items[idx] = newObj;
    db[collection] = items;
    setDB(db);
    return items[idx];
}

export function remove(collection, id) {
    const db = getDB();
    const items = db[collection] || [];
    const exists = items.some((i) => String(i.id) === String(id));
    db[collection] = items.filter((i) => String(i.id) !== String(id));
    setDB(db);
    return exists;
}

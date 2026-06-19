import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "..", "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error(`Error reading collection ${collection}:`, error);
    return [];
  }
};

const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing collection ${collection}:`, error);
    return false;
  }
};

export const jsonDb = {
  find: (collection, query = {}) => {
    const items = readCollection(collection);
    // Simple filter support if query object has properties
    return items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findById: (collection, id) => {
    const items = readCollection(collection);
    return items.find(item => item._id === id || item.id === id);
  },

  insert: (collection, doc) => {
    const items = readCollection(collection);
    const newDoc = {
      _id: crypto.randomUUID(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || new Date().toISOString(),
    };
    items.push(newDoc);
    writeCollection(collection, items);
    return newDoc;
  },

  findByIdAndUpdate: (collection, id, updateData) => {
    const items = readCollection(collection);
    let updatedItem = null;
    
    const newItems = items.map(item => {
      if (item._id === id || item.id === id) {
        updatedItem = {
          ...item,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem) {
      writeCollection(collection, newItems);
    }
    return updatedItem;
  },

  findByIdAndDelete: (collection, id) => {
    const items = readCollection(collection);
    const itemToDelete = items.find(item => item._id === id || item.id === id);
    if (!itemToDelete) return null;

    const newItems = items.filter(item => item._id !== id && item.id !== id);
    writeCollection(collection, newItems);
    return itemToDelete;
  }
};

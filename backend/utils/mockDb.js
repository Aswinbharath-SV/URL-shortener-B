import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/db.json');

// Ensure database directory and file exist
const ensureDb = () => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
      dbPath,
      JSON.stringify({ users: [], urls: [], clicks: [], workspaces: [] }, null, 2),
      'utf8'
    );
  }
};

export const readDb = () => {
  ensureDb();
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { users: [], urls: [], clicks: [], workspaces: [] };
  }
};

export const writeDb = (data) => {
  ensureDb();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write mock database to disk:', err.message);
  }
};

// Generates 24-character hexadecimal MongoDB-like ObjectId strings
const generateId = () => {
  const chars = 'abcdef0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

// Decorate returned database objects with Mongoose methods
const decorateObject = (obj) => {
  if (!obj) return null;
  const decorated = { ...obj };

  // 1. Emulate .save()
  decorated.save = async function () {
    const store = readDb();
    let collectionName = null;
    if (store.users.some((u) => u._id === this._id)) collectionName = 'users';
    else if (store.urls.some((u) => u._id === this._id)) collectionName = 'urls';
    else if (store.clicks.some((u) => u._id === this._id)) collectionName = 'clicks';
    else if (store.workspaces?.some((u) => u._id === this._id)) collectionName = 'workspaces';

    if (collectionName) {
      this.updatedAt = new Date().toISOString();
      const index = store[collectionName].findIndex((item) => item._id === this._id);
      if (index !== -1) {
        const plainData = { ...this };
        // Strip decorators before saving to JSON file
        delete plainData.save;
        delete plainData.comparePassword;
        store[collectionName][index] = plainData;
        writeDb(store);
      }
    }
    return this;
  };

  // 2. Emulate .comparePassword(password) for user records
  if (decorated.password) {
    decorated.comparePassword = async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    };
  }

  return decorated;
};

// Core query engine logic
const matchQuery = (item, query) => {
  if (!query) return true;

  for (const [key, value] of Object.entries(query)) {
    if (key === '$or') {
      const anyMatch = value.some((subQuery) => matchQuery(item, subQuery));
      if (!anyMatch) return false;
    } else if (value && typeof value === 'object') {
      if ('$regex' in value) {
        const flags = value.$options || '';
        const regex = new RegExp(value.$regex, flags);
        if (!regex.test(item[key] || '')) return false;
      } else if ('$in' in value) {
        const list = value.$in.map(String);
        if (!list.includes(String(item[key]))) return false;
      } else if ('$gte' in value) {
        const limitDate = new Date(value.$gte);
        const itemDate = new Date(item[key]);
        if (itemDate < limitDate) return false;
      }
    } else {
      if (String(item[key]) !== String(value)) return false;
    }
  }
  return true;
};

// Chainable mock Mongoose Query class
class MockQuery {
  constructor(data, isArray = false) {
    this.data = data;
    this.isArray = isArray;
  }

  select(fields) {
    if (this.data) {
      if (this.isArray) {
        this.data = this.data.map((item) => this._applySelect(item, fields));
      } else {
        this.data = this._applySelect(this.data, fields);
      }
    }
    return this;
  }

  _applySelect(item, fields) {
    const copy = { ...item };
    if (fields === '-password') {
      delete copy.password;
    }
    return copy;
  }

  sort(sortOptions) {
    if (this.isArray && this.data && sortOptions) {
      const [key, order] = Object.entries(sortOptions)[0];
      this.data.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (key === 'createdAt' || key === 'timestamp') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }
        if (valA < valB) return order === 1 ? -1 : 1;
        if (valA > valB) return order === 1 ? 1 : -1;
        return 0;
      });
    }
    return this;
  }

  skip(num) {
    if (this.isArray && this.data && typeof num === 'number') {
      this.data = this.data.slice(num);
    }
    return this;
  }

  limit(num) {
    if (this.isArray && this.data && typeof num === 'number') {
      this.data = this.data.slice(0, num);
    }
    return this;
  }

  then(onfulfilled, onrejected) {
    let result = this.data;
    if (result && !this.isArray) {
      result = decorateObject(result);
    } else if (result && this.isArray) {
      result = result.map(decorateObject);
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this.then().catch(onrejected);
  }
}

// 1. Mock User model interface
export const mockUser = {
  findOne: (query) => {
    const store = readDb();
    const found = store.users.find((u) => u.email === query.email?.toLowerCase());
    return new MockQuery(found || null);
  },

  findById: (id) => {
    const store = readDb();
    const found = store.users.find((u) => u._id === String(id));
    return new MockQuery(found || null);
  },

  create: async (data) => {
    const store = readDb();
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = {
      _id: generateId(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      currentWorkspaceId: null,
      companyName: data.companyName || '',
      jobTitle: data.jobTitle || '',
      monthlyVolume: data.monthlyVolume || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.users.push(newUser);
    writeDb(store);
    return decorateObject(newUser);
  }
};

// 2. Mock Url model interface
export const mockUrl = {
  findOne: (query) => {
    const store = readDb();
    const found = store.urls.find((item) => matchQuery(item, query));
    return new MockQuery(found || null);
  },

  find: (query) => {
    const store = readDb();
    const found = store.urls.filter((item) => matchQuery(item, query));
    return new MockQuery(found, true);
  },

  countDocuments: async (query) => {
    const store = readDb();
    const found = store.urls.filter((item) => matchQuery(item, query));
    return found.length;
  },

  create: async (data) => {
    const store = readDb();
    const newUrl = {
      _id: generateId(),
      originalUrl: data.originalUrl,
      shortCode: data.shortCode,
      customAlias: data.customAlias,
      qrCodeDataUrl: data.qrCodeDataUrl,
      title: data.title,
      description: data.description,
      userId: String(data.userId),
      workspaceId: data.workspaceId ? String(data.workspaceId) : null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      clicksCount: 0,
      qrClicksCount: 0,
      qrBrandLogo: data.qrBrandLogo || '',
      qrColor: data.qrColor || '#6366f1',
      password: data.password || '',
      expiresAt: data.expiresAt || null,
      clickLimit: (data.clickLimit !== undefined && data.clickLimit !== null && data.clickLimit !== '') ? Number(data.clickLimit) : null,
      fallbackUrl: data.fallbackUrl || '',
      utmSource: data.utmSource || '',
      utmMedium: data.utmMedium || '',
      utmCampaign: data.utmCampaign || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.urls.push(newUrl);
    writeDb(store);
    return decorateObject(newUrl);
  },

  findOneAndDelete: async (query) => {
    const store = readDb();
    const index = store.urls.findIndex((item) => matchQuery(item, query));
    if (index !== -1) {
      const [deleted] = store.urls.splice(index, 1);
      writeDb(store);
      return decorateObject(deleted);
    }
    return null;
  }
};

// 3. Mock Click model interface
export const mockClick = {
  create: async (data) => {
    const store = readDb();
    const newClick = {
      _id: generateId(),
      urlId: String(data.urlId),
      timestamp: new Date().toISOString(),
      ip: data.ip,
      browser: data.browser || 'Unknown',
      device: data.device || 'Desktop',
      os: data.os || 'Unknown',
      country: data.country || 'Unknown',
      region: data.region || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || 'Unknown',
      isp: data.isp || 'Unknown',
      referer: data.referer || 'Direct',
      utmSource: data.utmSource || 'Direct',
      utmMedium: data.utmMedium || 'None',
      utmCampaign: data.utmCampaign || 'None',
      isSuspicious: data.isSuspicious || false,
      threatType: data.threatType || 'none',
      isQrScan: data.isQrScan || false
    };
    store.clicks.push(newClick);
    writeDb(store);
    return decorateObject(newClick);
  },

  deleteMany: async (query) => {
    const store = readDb();
    const initialLength = store.clicks.length;
    store.clicks = store.clicks.filter((item) => !matchQuery(item, query));
    writeDb(store);
    return { deletedCount: initialLength - store.clicks.length };
  },

  find: (query) => {
    const store = readDb();
    const found = store.clicks.filter((item) => matchQuery(item, query));
    return new MockQuery(found, true);
  },

  aggregate: async (pipeline) => {
    const store = readDb();
    let currentData = [...store.clicks];

    for (const stage of pipeline) {
      const operator = Object.keys(stage)[0];
      const operatorVal = stage[operator];

      if (operator === '$match') {
        currentData = currentData.filter((item) => matchQuery(item, operatorVal));
      } else if (operator === '$group') {
        const idField = operatorVal._id;
        const groups = {};

        for (const item of currentData) {
          let key;
          if (typeof idField === 'string' && idField.startsWith('$')) {
            key = item[idField.substring(1)];
          } else if (typeof idField === 'object' && idField !== null) {
            // Emulate daily trends format date parsing
            if (idField.$dateToString) {
              const dateField = idField.$dateToString.date.substring(1);
              const dateVal = item[dateField];
              key = dateVal ? dateVal.split('T')[0] : 'N/A';
            }
          }

          key = key || 'Unknown';
          if (!groups[key]) {
            groups[key] = 0;
          }
          groups[key]++;
        }

        currentData = Object.entries(groups).map(([k, v]) => ({
          _id: k,
          clicks: v,
          count: v
        }));
      } else if (operator === '$sort') {
        const [sortKey, sortOrder] = Object.entries(operatorVal)[0];
        currentData.sort((a, b) => {
          let valA = a[sortKey];
          let valB = b[sortKey];
          if (valA < valB) return sortOrder === 1 ? -1 : 1;
          if (valA > valB) return sortOrder === 1 ? 1 : -1;
          return 0;
        });
      } else if (operator === '$limit') {
        currentData = currentData.slice(0, operatorVal);
      }
    }

    return currentData;
  }
};

// 4. Mock Workspace model interface
export const mockWorkspace = {
  findOne: (query) => {
    const store = readDb();
    if (!store.workspaces) store.workspaces = [];
    const found = store.workspaces.find((item) => matchQuery(item, query));
    return new MockQuery(found || null);
  },

  find: (query) => {
    const store = readDb();
    if (!store.workspaces) store.workspaces = [];
    const found = store.workspaces.filter((item) => matchQuery(item, query));
    return new MockQuery(found, true);
  },

  findById: (id) => {
    const store = readDb();
    if (!store.workspaces) store.workspaces = [];
    const found = store.workspaces.find((item) => item._id === String(id));
    return new MockQuery(found || null);
  },

  create: async (data) => {
    const store = readDb();
    if (!store.workspaces) store.workspaces = [];
    const newWorkspace = {
      _id: generateId(),
      name: data.name,
      ownerId: String(data.ownerId),
      members: data.members ? data.members.map(m => ({ userId: String(m.userId), role: m.role })) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.workspaces.push(newWorkspace);
    writeDb(store);
    return decorateObject(newWorkspace);
  },

  findOneAndDelete: async (query) => {
    const store = readDb();
    if (!store.workspaces) store.workspaces = [];
    const index = store.workspaces.findIndex((item) => matchQuery(item, query));
    if (index !== -1) {
      const [deleted] = store.workspaces.splice(index, 1);
      writeDb(store);
      return decorateObject(deleted);
    }
    return null;
  }
};

// Generic proxy factory for dynamic model routing
export const createModelProxy = (modelName, realModel, mockModel) => {
  return new Proxy(realModel, {
    get(target, prop, receiver) {
      if (process.env.USE_MOCK_DB === 'true') {
        return mockModel[prop];
      }
      return Reflect.get(target, prop, receiver);
    }
  });
};

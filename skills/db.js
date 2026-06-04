// Shared IndexedDB singleton — imported by script.js and all skill modules.
// ES module semantics guarantee this runs once; every importer shares the same db.
const DB_NAME    = 'webbrain';
const DB_VERSION = 3;

export const db = await new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = ({ target: { result: d } }) => {
    for (const [name, opts] of [
      ['facts',  { keyPath: 'id', autoIncrement: true }],
      ['chats',  { keyPath: 'id', autoIncrement: true }],
      ['todos',  { keyPath: 'id', autoIncrement: true }],
    ]) {
      if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, opts);
    }
    if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
  };
  req.onsuccess = ({ target: { result } }) => resolve(result);
  req.onerror   = ({ target: { error  } }) => reject(error);
});

// ── Transaction primitives ────────────────────────────────────────────────────
export const txGet    = (store, key)        => new Promise((res, rej) => { const r = db.transaction(store, 'readonly').objectStore(store).get(key);          r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const txPut    = (store, value, key) => new Promise((res, rej) => { const os = db.transaction(store, 'readwrite').objectStore(store); const r = key !== undefined ? os.put(value, key) : os.put(value); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const txAdd    = (store, value)      => new Promise((res, rej) => { const r = db.transaction(store, 'readwrite').objectStore(store).add(value);         r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const txDelete = (store, key)        => new Promise((res, rej) => { const r = db.transaction(store, 'readwrite').objectStore(store).delete(key);        r.onsuccess = () => res();         r.onerror = () => rej(r.error); });
export const txAll    = (store)             => new Promise((res, rej) => { const r = db.transaction(store, 'readonly').objectStore(store).getAll();             r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export const txClear  = (store)             => new Promise((res, rej) => { const r = db.transaction(store, 'readwrite').objectStore(store).clear();             r.onsuccess = () => res();         r.onerror = () => rej(r.error); });

// ── Facts ─────────────────────────────────────────────────────────────────────
export const getFacts   = ()     => txAll('facts');
export const addFact    = text   => txAdd('facts', { text, created: Date.now() });
export const deleteFact = id     => txDelete('facts', id);
export const clearFacts = ()     => txClear('facts');

// ── Todos ─────────────────────────────────────────────────────────────────────
export const getTodos       = ()           => txAll('todos');
export const addTodo        = text         => txAdd('todos', { text, done: false, created: Date.now() });
export const setTodoDone    = (id, done)   => txGet('todos', id).then(t => txPut('todos', { ...t, done }));
export const deleteTodo     = id           => txDelete('todos', id);
export const clearDoneTodos = async () => {
  const done = (await getTodos()).filter(t => t.done);
  await Promise.all(done.map(t => txDelete('todos', t.id)));
};

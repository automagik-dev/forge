import { openDB } from 'idb';

const dbPromise = openDB('keyval-store', 1, {
    upgrade(db) {
        db.createObjectStore('keyval');
    },
});

export async function get(key: string) {
    return (await dbPromise).get('keyval', key);
}
export async function set(key: string, val: any) {
    return (await dbPromise).put('keyval', val, key);
}
export async function del(key: string) {
    return (await dbPromise).delete('keyval', key);
}
export async function clear() {
    return (await dbPromise).clear('keyval');
}
export async function keys() {
    return (await dbPromise).getAllKeys('keyval');
}
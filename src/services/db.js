import { db } from '../../firebase.js';
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, where
} from 'firebase/firestore';

const COL = 'notebooks';

/* ── Real-time listener ──────────────────────────────────────────
   Subscribes to all notebooks owned by `uid`.
   Returns an unsubscribe function.
   ────────────────────────────────────────────────────────────── */
export function subscribeNotebooks(uid, onChange) {
  const q = query(collection(db, COL), where('owner_id', '==', uid));
  return onSnapshot(q, snap => {
    onChange(snap.docs.map(d => ({ ...d.data() })));
  });
}

/* ── Create / Update ─────────────────────────────────────────── */
export async function upsertNotebook(uid, notebook) {
  const ref = doc(db, COL, notebook.id);
  await setDoc(ref, { ...notebook, owner_id: uid });
}

/* ── Delete ──────────────────────────────────────────────────── */
export async function removeNotebook(notebookId) {
  await deleteDoc(doc(db, COL, notebookId));
}

/* ── Data cleanup for AI requests ───────────────────────────────
   Strips system/Firestore fields (owner_id, shareRole, shareToken)
   from the entire object tree before sending to an LLM API.
   ────────────────────────────────────────────────────────────── */
const AI_STRIP = new Set(['owner_id', 'shareRole', 'shareToken']);

export function cleanForAI(obj) {
  if (Array.isArray(obj)) return obj.map(cleanForAI);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([k]) => !AI_STRIP.has(k))
        .map(([k, v]) => [k, cleanForAI(v)])
    );
  }
  return obj;
}

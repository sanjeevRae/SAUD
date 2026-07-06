import { createPrivateKey, createSign } from 'crypto';
import type { Product } from '@/data/products';

type Primitive = string | number | boolean | null;
type JsonValue = Primitive | JsonValue[] | { [key: string]: JsonValue };

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

const tokenUrl = 'https://oauth2.googleapis.com/token';
const scope = 'https://www.googleapis.com/auth/datastore';
const adminFetchTimeoutMs = Number(process.env.FIRESTORE_ADMIN_TIMEOUT_MS ?? 5000);
let cachedToken: { value: string; expiresAt: number } | null = null;

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function requiredEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY.');
  }

  return { projectId, clientEmail, privateKey, databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)' };
}

function adminSignal() {
  return AbortSignal.timeout(adminFetchTimeoutMs);
}

async function getAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const { clientEmail, privateKey } = requiredEnv();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope,
    aud: tokenUrl,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(createPrivateKey(privateKey));
  const assertion = `${unsigned}.${base64url(signature)}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    signal: adminSignal(),
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) throw new Error('Failed to authenticate with Google service account.');
  const payload = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { value: payload.access_token, expiresAt: Date.now() + payload.expires_in * 1000 };
  return payload.access_token;
}

function toFirestoreValue(value: JsonValue | undefined): FirestoreValue | undefined {
  if (value === undefined) return undefined;
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(item => toFirestoreValue(item)).filter(Boolean) as FirestoreValue[] } };
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)]).filter(([, item]) => Boolean(item)),
      ) as Record<string, FirestoreValue>,
    },
  };
}

function productFields(product: Product) {
  const entries = Object.entries(product).filter(([key, value]) => key !== 'id' && value !== undefined) as [string, JsonValue][];
  return Object.fromEntries(entries.map(([key, value]) => [key, toFirestoreValue(value)]));
}

function baseUrl() {
  const { projectId, databaseId } = requiredEnv();
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/products`;
}

export async function createProduct(product: Product) {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}?documentId=${encodeURIComponent(product.id)}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: adminSignal(),
    body: JSON.stringify({ fields: productFields(product) }),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function updateProduct(product: Product) {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}/${encodeURIComponent(product.id)}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: adminSignal(),
    body: JSON.stringify({ fields: productFields(product) }),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function deleteProduct(id: string) {
  const token = await getAccessToken();
  const response = await fetch(`${baseUrl()}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    signal: adminSignal(),
  });
  if (!response.ok) throw new Error(await response.text());
}
type PlainRecord = Record<string, JsonValue | undefined>;

type QueryFilter = {
  field: string;
  op?: 'EQUAL';
  value: JsonValue;
};

export function toPlainFields(data: PlainRecord) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, toFirestoreValue(value as JsonValue)]),
  );
}

function documentsBaseUrl(collectionPath: string) {
  const { projectId, databaseId } = requiredEnv();
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionPath}`;
}

function fromFirestoreValue(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue ?? 0);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(fromFirestoreValue);
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields).map(([key, item]) => [key, fromFirestoreValue(item)]));
  return undefined;
}

function docId(name: string) {
  return name.split('/').pop() || name;
}

export async function listDocuments<T extends PlainRecord>(collectionPath: string) {
  const token = await getAccessToken();
  const documents: { name: string; fields?: Record<string, FirestoreValue> }[] = [];
  let pageToken = '';

  do {
    const url = new URL(documentsBaseUrl(collectionPath));
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: adminSignal() });
    if (!response.ok) throw new Error(await response.text());

    const payload = await response.json() as {
      documents?: { name: string; fields?: Record<string, FirestoreValue> }[];
      nextPageToken?: string;
    };
    documents.push(...(payload.documents ?? []));
    pageToken = payload.nextPageToken || '';
  } while (pageToken);

  return documents.map(document => ({
    id: docId(document.name),
    ...Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)])),
  })) as unknown as T[];
}

export async function queryDocuments<T extends PlainRecord>(collectionPath: string, filters: QueryFilter[]) {
  const token = await getAccessToken();
  const { projectId, databaseId } = requiredEnv();

  const buildFieldFilter = (filter: QueryFilter) => ({
    fieldFilter: {
      field: { fieldPath: filter.field },
      op: filter.op || 'EQUAL',
      value: toFirestoreValue(filter.value as JsonValue),
    },
  });

  const structuredQuery = filters.length === 1
    ? {
        from: [{ collectionId: collectionPath.split('/').pop() || collectionPath }],
        where: buildFieldFilter(filters[0]),
      }
    : {
        from: [{ collectionId: collectionPath.split('/').pop() || collectionPath }],
        where: {
          compositeFilter: {
            op: 'AND',
            filters: filters.map(buildFieldFilter),
          },
        },
      };

  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: adminSignal(),
    body: JSON.stringify({ structuredQuery }),
  });

  if (!response.ok) throw new Error(await response.text());
  const payload = await response.json() as Array<{ document?: { name: string; fields?: Record<string, FirestoreValue> } }>;
  return payload
    .filter(item => item.document)
    .map(item => ({
      id: docId(item.document!.name),
      ...Object.fromEntries(Object.entries(item.document!.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)])),
    })) as unknown as T[];
}

export async function saveDocument(collectionPath: string, id: string, data: PlainRecord) {
  const token = await getAccessToken();
  const response = await fetch(`${documentsBaseUrl(collectionPath)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    signal: adminSignal(),
    body: JSON.stringify({ fields: toPlainFields(data) }),
  });
  if (!response.ok) throw new Error(await response.text());
}

export async function removeDocument(collectionPath: string, id: string) {
  const token = await getAccessToken();
  const response = await fetch(`${documentsBaseUrl(collectionPath)}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
    signal: adminSignal(),
  });
  if (!response.ok) throw new Error(await response.text());
}
export async function getDocument<T extends PlainRecord>(collectionPath: string, id: string) {
  const token = await getAccessToken();
  const response = await fetch(`${documentsBaseUrl(collectionPath)}/${encodeURIComponent(id)}`, {
    headers: { authorization: `Bearer ${token}` },
    signal: adminSignal(),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await response.text());
  const document = await response.json() as { name: string; fields?: Record<string, FirestoreValue> };
  return {
    id: docId(document.name),
    ...Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, fromFirestoreValue(value)])),
  } as unknown as T;
}

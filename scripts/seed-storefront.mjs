import { readFile } from 'fs/promises';
import path from 'path';
import { createPrivateKey, createSign } from 'crypto';
import ts from 'typescript';
import vm from 'vm';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  return readFile(envPath, 'utf8').then(text => {
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const index = line.indexOf('=');
      if (index === -1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      process.env[key] ||= value;
    }
  });
}

async function loadStoreData() {
  const file = await readFile(path.join(process.cwd(), 'src/data/products.ts'), 'utf8');
  const output = ts.transpileModule(file, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const productModule = { exports: {} };
  const sandbox = { exports: productModule.exports, module: productModule };
  vm.runInNewContext(output, sandbox, { filename: 'products.ts' });
  return sandbox.module.exports;
}

const tokenUrl = 'https://oauth2.googleapis.com/token';
const scope = 'https://www.googleapis.com/auth/datastore';
let accessToken;

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

async function getAccessToken() {
  if (accessToken) return accessToken;
  const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify({ iss: clientEmail, scope, aud: tokenUrl, exp: now + 3600, iat: now }))}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(createPrivateKey(privateKey)))}`;
  const response = await fetch(tokenUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }) });
  if (!response.ok) throw new Error(`Google auth failed: ${await response.text()}`);
  accessToken = (await response.json()).access_token;
  return accessToken;
}

function toFirestoreValue(value) {
  if (value === undefined || value === '') return undefined;
  if (value === null) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue).filter(Boolean) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toFirestoreValue(item)]).filter(([, item]) => Boolean(item))) } };
}

function fields(data) {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => key !== 'id' && value !== undefined).map(([key, value]) => [key, toFirestoreValue(value)]));
}

function firestoreUrl(collectionPath, id) {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${collectionPath}/${encodeURIComponent(id)}`;
}

async function saveDocument(collectionPath, id, data) {
  const token = await getAccessToken();
  const response = await fetch(firestoreUrl(collectionPath, id), { method: 'PATCH', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ fields: fields(data) }) });
  if (!response.ok) throw new Error(`Firestore save failed ${collectionPath}/${id}: ${await response.text()}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isLocalAsset(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

async function uploadLocalAsset(assetPath, cache) {
  if (!isLocalAsset(assetPath)) return assetPath;
  if (cache.has(assetPath)) return cache.get(assetPath);
  const cloudName = requireEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
  const uploadPreset = requireEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  const clean = assetPath.replace(/^\//, '');
  const buffer = await readFile(path.join(process.cwd(), 'public', clean));
  const ext = path.extname(clean).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mime }), path.basename(clean));
  form.append('upload_preset', uploadPreset);
  form.append('folder', 'chitratech-shop/seed');
  form.append('public_id', clean.replace(/\.[^.]+$/, '').replace(/[\\/]/g, '-'));
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: form });
    if (response.ok) {
      const url = (await response.json()).secure_url;
      cache.set(assetPath, url);
      await sleep(250);
      return url;
    }

    const body = await response.text();
    if (attempt === 4) throw new Error(`Cloudinary upload failed ${assetPath}: ${body}`);
    await sleep(1000 * attempt);
  }

  throw new Error(`Cloudinary upload failed ${assetPath}`);
}

const imageFields = new Set(['image', 'images', 'avatar', 'ogImage']);

async function uploadImages(item, cache) {
  const entries = await Promise.all(Object.entries(item).map(async ([key, value]) => {
    if (!imageFields.has(key)) return [key, value];
    if (isLocalAsset(value)) return [key, await uploadLocalAsset(value, cache)];
    if (Array.isArray(value)) return [key, await Promise.all(value.map(entry => isLocalAsset(entry) ? uploadLocalAsset(entry, cache) : entry))];
    return [key, value];
  }));
  return Object.fromEntries(entries);
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function writeCollection(collectionPath, items) {
  for (const item of items) await saveDocument(collectionPath, String(item.id), item);
}

await loadEnv();
const { products, collections, categories, testimonials } = await loadStoreData();
const cache = new Map();

const hero = [{ id: 'hero-main', eyebrow: 'New Season', title: 'Unleash Your Best Look with ChitraTech Shop Signatures', description: 'Discover refined everyday pieces, seasonal staples, and fashion-forward essentials.', image: '/hero_collage_01.jpg', primaryLabel: 'Shop Now', primaryHref: '/main-product', secondaryLabel: 'Learn More', secondaryHref: '#collection', enabled: true }];
const richProducts = products.map(product => ({ ...product, seoTitle: product.seoTitle || `${product.name} | ChitraTech Shop`, seoDescription: product.seoDescription || product.description, seoKeywords: product.seoKeywords || [product.category, 'ChitraTech Shop', 'fashion'], ogImage: product.ogImage || product.image, canonicalPath: product.canonicalPath || `/product/${product.id}` }));

async function uploadAll(items) {
  const uploaded = [];
  for (const item of items) uploaded.push(await uploadImages(item, cache));
  return uploaded;
}

const uploadedProducts = await uploadAll(richProducts);
const uploadedHero = await uploadAll(hero);
const uploadedCollections = await uploadAll(collections.map(item => ({ ...item, linkHref: item.linkHref || '/main-product?collection=' + slug(item.title) }))); 
const uploadedCategories = await uploadAll(categories.map((item, index) => ({ id: slug(item.name), order: index + 1, ...item, linkHref: item.linkHref || '/main-product?category=' + encodeURIComponent(item.name) }))); 
const uploadedTestimonials = await uploadAll(testimonials);
const uploadedFeatured = uploadedProducts.slice(0, 8).map((item, index) => ({ ...item, enabled: true, featuredOrder: index + 1 }));

await writeCollection('products', uploadedProducts);
await writeCollection('homepage/heroBanners/items', uploadedHero);
await writeCollection('homepage/featuredProducts/items', uploadedFeatured);
await writeCollection('homepage/collections/items', uploadedCollections);
await writeCollection('categories', uploadedCategories);
await writeCollection('testimonials', uploadedTestimonials);

console.log(JSON.stringify({ ok: true, uploadedAssets: cache.size, counts: { products: uploadedProducts.length, hero: uploadedHero.length, featuredProducts: uploadedFeatured.length, collections: uploadedCollections.length, categories: uploadedCategories.length, testimonials: uploadedTestimonials.length } }, null, 2));








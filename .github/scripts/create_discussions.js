#!/usr/bin/env node

/**
 * Idempotent script to ensure discussion categories exist and create a welcome discussion.
 * Uses GitHub REST API via global fetch (Node 18+).
 *
 * Env:
 *   GITHUB_REPOSITORY (owner/repo) required
 *   GITHUB_TOKEN required (can be GITHUB_TOKEN from Actions or a PAT with repo scope)
 *   INPUT_CATEGORIES optional - comma separated list
 *   INPUT_WELCOME_TITLE optional
 *   INPUT_WELCOME_BODY optional
 *
 * Exits non-zero on unexpected API errors so workflow fails.
 */

const OWNER_REPO = process.env.GITHUB_REPOSITORY;
const TOKEN = process.env.GITHUB_TOKEN;

if (!OWNER_REPO) {
  console.error('ERROR: GITHUB_REPOSITORY is not set (expected "owner/repo")');
  process.exit(2);
}
if (!TOKEN) {
  console.error('ERROR: GITHUB_TOKEN is not set');
  process.exit(2);
}

const [owner, repo] = OWNER_REPO.split('/');
if (!owner || !repo) {
  console.error('ERROR: GITHUB_REPOSITORY must be in "owner/repo" format');
  process.exit(2);
}

const DEFAULT_CATEGORIES = ['Q&A', 'How-to', 'Show & Tell', 'Ideas', 'Announcements'];
const categoriesInput = (process.env.INPUT_CATEGORIES || DEFAULT_CATEGORIES.join(','))
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const welcomeTitle = process.env.INPUT_WELCOME_TITLE || 'Welcome to Discussions — ecpay-einvoice-b2c-node';
const welcomeBody = process.env.INPUT_WELCOME_BODY || [
  'Welcome to the official Discussions for the ecpay-einvoice-b2c-node SDK!',
  '',
  'Please use the appropriate category when creating a new discussion:',
  '',
  '- Q&A: Ask usage questions and troubleshooting',
  '- How-to: Integration questions and implementation examples',
  '- Show & Tell: Share projects or integrations',
  '- Ideas: Feature requests or proposals',
  '- Announcements: Release notes or important news',
  '',
  'Before opening a new thread, please search existing discussions.',
  '',
  'Security issues: do NOT post publicly — see SECURITY.md for private reporting instructions.'
].join('\n');

const API_BASE = 'https://api.github.com';
const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json'
};

async function apiRequest(method, path, body) {
  const url = `${API_BASE}${path}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // ignore parse error, json remains null
  }
  if (!res.ok) {
    const msg = json && json.message ? json.message : `HTTP ${res.status}`;
    const err = new Error(`GitHub API ${method} ${path} failed: ${msg}`);
    err.status = res.status;
    err.response = json || text;
    throw err;
  }
  return json;
}

async function listCategories() {
  // GET /repos/{owner}/{repo}/discussions/categories
  const resp = await apiRequest('GET', `/repos/${owner}/${repo}/discussions/categories`);
  // API returns { categories: [...] } or array; normalize to array
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.categories)) return resp.categories;
  return [];
}

async function createCategory(name, description = '') {
  // POST /repos/{owner}/{repo}/discussions/categories
  const body = { name, description };
  const resp = await apiRequest('POST', `/repos/${owner}/${repo}/discussions/categories`, body);
  // resp might be { category: {...} } or {...}
  return resp?.category || resp;
}

async function listDiscussions(per_page = 100) {
  // GET /repos/{owner}/{repo}/discussions
  return await apiRequest('GET', `/repos/${owner}/${repo}/discussions?per_page=${per_page}`);
}

async function createDiscussion(title, bodyText, category_id) {
  // POST /repos/{owner}/{repo}/discussions
  const payload = { title, body: bodyText, category_id };
  const resp = await apiRequest('POST', `/repos/${owner}/${repo}/discussions`, payload);
  // resp may be wrapped
  return resp?.discussion || resp;
}

async function pinDiscussion(discussion_number) {
  try {
    await apiRequest('PUT', `/repos/${owner}/${repo}/discussions/${discussion_number}/pin`);
    return true;
  } catch (err) {
    // pin can fail due to permissions; don't fail the whole job
    console.warn('Warning: pinning discussion failed (may require extra permissions):', err.message || err);
    return false;
  }
}

async function ensureCategories(names) {
  console.log('Ensuring discussion categories:', names);
  const existing = await listCategories();
  const map = new Map(existing.map(c => [c.name, c]));
  for (const name of names) {
    if (map.has(name)) {
      console.log(`✓ Category "${name}" already exists (ID: ${map.get(name).id})`);
      continue;
    }
    try {
      console.log(`Creating category "${name}"...`);
      const created = await createCategory(name, `Category ${name} (created by setup-discussions workflow)`);
      if (created && created.id) {
        console.log(`✓ Created category "${name}" (ID: ${created.id})`);
        map.set(name, created);
      } else {
        console.warn(`⚠ Created category but couldn't parse id for "${name}":`, created);
      }
    } catch (err) {
      console.error(`✗ Failed to create category "${name}":`, err.message || err);
      // continue attempting others
    }
  }
  return map;
}

async function ensureWelcomeDiscussion(categoryMap, desiredOrder) {
  // choose Announcements if present, otherwise first available
  let catId = null;
  if (categoryMap.has('Announcements')) {
    catId = categoryMap.get('Announcements').id;
  } else {
    for (const n of desiredOrder) {
      if (categoryMap.has(n)) {
        catId = categoryMap.get(n).id;
        break;
      }
    }
  }
  if (!catId) throw new Error('No category available to create welcome discussion');

  // check existing discussions
  const discussions = await listDiscussions(100);
  const list = Array.isArray(discussions) ? discussions : (discussions?.data || []);
  if (list.find(d => d.title === welcomeTitle)) {
    console.log('Welcome discussion already exists; skipping creation.');
    return { created: false };
  }

  console.log(`Creating welcome discussion in category id ${catId}...`);
  const created = await createDiscussion(welcomeTitle, welcomeBody, catId);
  if (!created) throw new Error('Unexpected response when creating discussion');
  const number = created.number || created.id || created.node_id;
  if (created.number) {
    await pinDiscussion(created.number);
  } else {
    console.warn('Created discussion but cannot determine numeric number for pinning.');
  }
  console.log('Created welcome discussion:', created.html_url || created.url || created);
  return { created: true, discussion: created };
}

async function main() {
  try {
    console.log('Repository:', `${owner}/${repo}`);
    console.log('Desired categories:', categoriesInput.join(', '));
    const categoryMap = await ensureCategories(categoriesInput);
    const res = await ensureWelcomeDiscussion(categoryMap, categoriesInput);
    console.log('--- SUMMARY ---');
    for (const [name, cat] of categoryMap) {
      console.log(`- ${name}: id=${cat.id}`);
    }
    if (res && res.discussion) {
      console.log('Welcome discussion URL:', res.discussion.html_url || res.discussion.url);
    }
    process.exit(0);
  } catch (err) {
    console.error('ERROR: setup-discussions failed:', err.message || err);
    if (err.response) {
      console.error('API response:', JSON.stringify(err.response, null, 2));
    }
    process.exit(3);
  }
}

main();
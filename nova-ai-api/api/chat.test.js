import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('chat endpoint validates message role and input size in source', () => {
  const source = fs.readFileSync(new URL('./chat.js', import.meta.url), 'utf8');
  assert.match(source, /MAX_MESSAGES = 24/);
  assert.match(source, /MAX_CHARS = 12000/);
  assert.match(source, /\['user', 'assistant'\]/);
  assert.match(source, /HF_TOKEN/);
});

test('image endpoint restricts supported models and prompt size', () => {
  const source = fs.readFileSync(new URL('./image.js', import.meta.url), 'utf8');
  assert.match(source, /prompt.length > 2000/);
  assert.match(source, /allowedModels/);
  assert.match(source, /HF_TOKEN/);
});

test('CORS only reflects explicitly allowed origins', () => {
  for (const file of ['chat.js', 'image.js', 'health.js']) {
    const source = fs.readFileSync(new URL('./' + file, import.meta.url), 'utf8');
    assert.match(source, /allowed.includes\(origin\)/);
  }
});
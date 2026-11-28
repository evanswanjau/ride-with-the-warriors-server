import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');

describe('Node version pins', () => {
  it('.nvmrc, package.json engines and CI all name the same major', () => {
    const nvmrc = read('.nvmrc').trim();
    const engines = JSON.parse(read('package.json')).engines.node as string;
    const ci = /node-version:\s*(\d+)/.exec(read('.github/workflows/ci.yml'))?.[1];
    expect(nvmrc).toBe('22');
    expect(engines).toBe(`${nvmrc}.x`);
    expect(ci).toBe(nvmrc);
  });
});

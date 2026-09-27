import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const expectedDomain = (await readFile(join(root, 'CNAME'), 'utf8')).trim()
const [index, fallback, artifactDomain] = await Promise.all([
  readFile(join(root, 'dist', 'index.html'), 'utf8'),
  readFile(join(root, 'dist', '404.html'), 'utf8'),
  readFile(join(root, 'dist', 'CNAME'), 'utf8'),
])
if (expectedDomain !== 'artemis.realgar.ch' || artifactDomain.trim() !== expectedDomain) throw new Error('The built artifact is missing the expected custom-domain CNAME.')
if (!index.includes('<div id="root">') || fallback !== index) throw new Error('The built Pages artifact is missing its SPA shell or matching 404.html fallback.')
console.log(`Verified dist/index.html, matching dist/404.html, and dist/CNAME for ${expectedDomain}.`)

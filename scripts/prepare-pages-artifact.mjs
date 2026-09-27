import { copyFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const domain = (await readFile(join(root, 'CNAME'), 'utf8')).trim()
if (domain !== 'artemis.realgar.ch') throw new Error('Root CNAME does not match the configured production host.')

const distribution = join(root, 'dist')
const index = await readFile(join(distribution, 'index.html'), 'utf8')
if (!index.includes('<div id="root">')) throw new Error('The Vite build does not contain the React mount point.')

await copyFile(join(distribution, 'index.html'), join(distribution, '404.html'))
await copyFile(join(root, 'CNAME'), join(distribution, 'CNAME'))
console.log(`Prepared GitHub Pages artifact for ${domain} with the SPA fallback.`)

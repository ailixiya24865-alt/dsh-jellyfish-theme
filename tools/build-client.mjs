/**
 * Build the shipped client bundle for @local/jellyfish-theme.
 *
 * Reads `client.tpl.js`, the editable authoring source (it holds the
 * `__DSH_BACKDROP_DATA_URI__` placeholder), and writes `client.js`, the file the
 * Harness client loader executes:
 *   - the placeholder is replaced with the artwork's base64 data URI;
 *   - `__DSH_BUILD_STAMP__` is replaced with the bundle version, which busts the
 *     client module generation so an updated bundle really reloads;
 *   - `package.json`'s version is bumped (patch) and both locale files get it in
 *     their descriptions, so a rebuilt bundle is visibly a new version.
 *
 * Run: node tools/build-client.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = p => readFileSync(join(root, p), 'utf8')
const write = (p, s) => writeFileSync(join(root, p), s, 'utf8')

const pkg = JSON.parse(read('package.json'))
const [major, minor, patch] = pkg.version.split('.').map(Number)
const version = `${major}.${minor}.${patch + 1}`

const base64 = readFileSync(join(root, 'assets', 'backdrop.jpg')).toString('base64')
const source = read('client.tpl.js')

if (!source.includes('__DSH_BACKDROP_DATA_URI__')) throw new Error('client.tpl.js lost its backdrop placeholder')
if (!source.includes('__DSH_BUILD_STAMP__')) throw new Error('client.tpl.js lost its build-stamp placeholder')

write('client.js', source
  .replaceAll('__DSH_BACKDROP_DATA_URI__', `data:image/jpeg;base64,${base64}`)
  .replaceAll('__DSH_BUILD_STAMP__', version))

pkg.version = version
write('package.json', `${JSON.stringify(pkg, null, 2)}\n`)

for (const locale of ['en', 'zh']) {
  const file = `locale/${locale}.json`
  const dict = JSON.parse(read(file))
  dict.meta.description = dict.meta.description.replace(/(?:（v[\d.]+）| \(v[\d.]+\))?$/, '') + ` (v${version})`
  write(file, `${JSON.stringify(dict, null, 2)}\n`)
}

console.log(`built @local/jellyfish-theme v${version}: client.js ${read('client.js').length} bytes`)

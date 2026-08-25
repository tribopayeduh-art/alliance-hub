import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const root = process.cwd();
const publicDir = resolve(root, 'public');
const required = [
  'assets/games/block-win/cover.webp',
  'assets/games/zumbla/cover.webp',
  'assets/games/gen-dino/cover.webp',
  'zumbla/app/index.html',
  'gen-dino/index.html',
  'assets/sounds/section-change.mp3',
];

const failures = required.filter((file) => !existsSync(join(publicDir, file)));

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const caseMap = new Map();
for (const file of walk(publicDir)) {
  const path = relative(publicDir, file).replaceAll('\\', '/');
  const folded = path.toLowerCase();
  if (caseMap.has(folded) && caseMap.get(folded) !== path) {
    failures.push(`conflito entre ${caseMap.get(folded)} e ${path}`);
  }
  caseMap.set(folded, path);

  if (statSync(file).size === 0) failures.push(`${path} está vazio`);
}

const textExtensions = new Set(['.ts', '.tsx', '.js', '.css', '.html', '.json']);
const sourceRoots = [resolve(root, 'src'), publicDir];
const assetPattern = /["'(]\/((?:assets|game-covers|zumbla|gen-dino)\/[^"')?#]+\.(?:png|jpe?g|webp|svg|gif|woff2?|mp3))/gi;

for (const sourceRoot of sourceRoots) {
  for (const file of walk(sourceRoot)) {
    if (!textExtensions.has(extname(file).toLowerCase())) continue;
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(assetPattern)) {
      if (!existsSync(join(publicDir, match[1]))) {
        failures.push(`${relative(root, file)} referencia arquivo ausente: /${match[1]}`);
      }
    }
  }
}

if (failures.length) {
  console.error('\nFalha na validação dos assets dos jogos:');
  [...new Set(failures)].forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Assets validados: ${caseMap.size} arquivos públicos, sem ausências ou conflitos de caixa.`);

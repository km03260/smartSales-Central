/**
 * Génère une paire de clés RSA (private.pem + public.pem) pour la signature des licences JWT.
 * Usage: node src/utils/generateKeys.js
 */
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const keysDir = join(__dirname, '../../keys');

async function generate() {
  if (!existsSync(keysDir)) {
    mkdirSync(keysDir, { recursive: true });
  }

  const { publicKey, privateKey } = await generateKeyPair('RS256', {
    modulusLength: 2048,
    extractable: true,
  });

  const privatePem = await exportPKCS8(privateKey);
  const publicPem = await exportSPKI(publicKey);

  writeFileSync(join(keysDir, 'private.pem'), privatePem);
  writeFileSync(join(keysDir, 'public.pem'), publicPem);

  console.log('RSA key pair generated in ./keys/');
  console.log('  - private.pem (keep secret, server only)');
  console.log('  - public.pem  (embed in mobile app for offline verification)');
}

generate().catch(console.error);

import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { readFileSync } from 'fs';
import { randomBytes } from 'crypto';

function buildApkPublicUrl(app) {
  if (!app?.apkFileName || !app?.code) return '';
  const base = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '');
  const path = `/uploads/apps/${app.code}/${app.apkFileName}`;
  return base ? `${base}${path}` : path;
}

let privateKey = null;
let publicKey = null;

/**
 * Charge les clés RSA depuis les fichiers PEM.
 */
async function loadKeys() {
  if (!privateKey) {
    const privatePem = readFileSync(process.env.LICENSE_PRIVATE_KEY_PATH, 'utf-8');
    privateKey = await importPKCS8(privatePem, 'RS256');
  }
  if (!publicKey) {
    const publicPem = readFileSync(process.env.LICENSE_PUBLIC_KEY_PATH, 'utf-8');
    publicKey = await importSPKI(publicPem, 'RS256');
  }
}

/**
 * Génère un code d'activation unique : {appCode}-XXXX-XXXX-XXXX
 * @param {string} appCode - Code de l'application (ex: "SS", "SE", "SA")
 */
export function generateLicenseKey(appCode = 'SS') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // pas de 0/O/1/I pour éviter confusion
  const segment = () => {
    let s = '';
    for (let i = 0; i < 4; i++) {
      s += chars[randomBytes(1)[0] % chars.length];
    }
    return s;
  };
  return `${appCode}-${segment()}-${segment()}-${segment()}`;
}

/**
 * Signe un JWT de licence contenant toute la config nécessaire à l'app mobile.
 *
 * Priorité des valeurs envoyées :
 *  - syncServiceUrl / syncServiceUrlLocal / apiKey : si la licence est rattachée
 *    à un SyncServiceDeployment, on prend les valeurs du déploiement. Sinon on
 *    retombe sur les champs legacy de la licence.
 *  - databases : tableau des bases WaveSoft accessibles à cette licence.
 *    Chacune contient { name, label, isDefault }. Le mobile utilise la base
 *    isDefault par défaut, l'utilisateur peut en changer via les Préférences.
 *  - databaseName : mis pour rétro-compat : nom de la base par défaut (= header
 *    X-Database initial). Résolu par le SyncService via la section "Databases"
 *    du appsettings.json.
 */
export async function signLicenseToken(license, company, appCode) {
  await loadKeys();

  const deployment = license.deployment;
  if (!deployment) {
    throw new Error('Licence sans déploiement — impossible de signer le JWT');
  }

  // Aplatir les instances + bases pour le mobile.
  // Payload allégé : pas de credentials SQL (ceux-ci restent côté serveur dans appsettings.json).
  const instances = (license.instances || []).map(inst => ({
    key: inst.key,
    label: inst.label || inst.key,
    isDefault: !!inst.isDefault,
    databases: (inst.databases || []).map(d => ({
      name: d.name,
      label: d.label || d.name,
      isDefault: !!d.isDefault,
    })),
  }));

  const defaultInstance = instances.find(i => i.isDefault) || instances[0] || null;
  const defaultDb = defaultInstance
    ? (defaultInstance.databases.find(d => d.isDefault) || defaultInstance.databases[0] || null)
    : null;

  const app = license.app;

  const token = await new SignJWT({
    clientId: company.id,
    companyName: company.legalName,
    appCode: appCode || 'SS',
    syncServiceUrl: deployment.publicUrl,
    syncServiceUrlLocal: deployment.localUrl || '',
    instances,
    defaultInstanceKey: defaultInstance?.key || '',
    defaultDatabaseName: defaultDb?.name || '',
    apiKey: deployment.apiKey,
    mobileAdminPassword: deployment.mobileAdminPassword || '',
    maxDevices: license.maxDevices,
    features: license.features,
    plan: license.plan,
    isBlocked: license.isBlocked || false,
    // Infos de mise à jour de l'app mobile
    appLatestVersion: app?.apkVersion || '',
    appApkUrl: buildApkPublicUrl(app),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime(license.expiresAt)
    .setSubject(license.id)
    .setIssuer('customapps')
    .sign(privateKey);

  return token;
}

/**
 * Vérifie un JWT de licence (utilisé pour le heartbeat).
 * Accepte les deux issuers pour rétro-compatibilité avec les JWT émis avant le rebranding.
 */
export async function verifyLicenseToken(token) {
  await loadKeys();
  const { payload } = await jwtVerify(token, publicKey, {
    issuer: ['customapps', 'smartsales-central'],
  });
  return payload;
}

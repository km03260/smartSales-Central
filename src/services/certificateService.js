import forge from 'node-forge';
import { randomBytes } from 'crypto';

/**
 * Génère un certificat X.509 auto-signé + le PFX associé.
 *
 * @param {Object} opts
 * @param {string[]} opts.hostnames  IPs et DNS à inclure dans le SAN (min 1)
 * @param {number}   [opts.validityYears=10]
 * @param {string}   [opts.password]  Mot de passe PFX. Auto-généré si absent.
 * @param {string}   [opts.commonName] CN (défaut = premier hostname)
 *
 * @returns {{ pfxBase64: string, password: string, hostnames: string[],
 *            validFrom: Date, validUntil: Date }}
 */
export function generateSelfSignedPfx({ hostnames, validityYears = 10, password, commonName }) {
  if (!hostnames?.length) {
    throw new Error('Au moins un hostname (IP ou DNS) est requis');
  }

  const cleanHosts = hostnames
    .map((h) => String(h).trim())
    .filter(Boolean);

  if (cleanHosts.length === 0) {
    throw new Error('Hostnames vides après nettoyage');
  }

  const pfxPassword = password || randomBytes(18).toString('base64').replace(/[+/=]/g, '').slice(0, 24);
  const cn = commonName || cleanHosts[0];

  // Génération paire RSA 2048
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Création du certificat
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(15));

  const now = new Date();
  const notAfter = new Date(now);
  notAfter.setFullYear(notAfter.getFullYear() + validityYears);

  cert.validity.notBefore = now;
  cert.validity.notAfter = notAfter;

  const attrs = [
    { name: 'commonName', value: cn },
    { name: 'organizationName', value: 'SmartSales' },
    { shortName: 'OU', value: 'SyncService' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // SAN : détection IP vs DNS
  // type 2 = DNS, type 7 = IP (8 octets pour IPv4 dans node-forge)
  const altNames = cleanHosts.map((h) => {
    const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
    return isIp ? { type: 7, ip: h } : { type: 2, value: h };
  });

  cert.setExtensions([
    { name: 'basicConstraints', cA: false },
    {
      name: 'keyUsage',
      digitalSignature: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
    },
    { name: 'subjectAltName', altNames },
    { name: 'subjectKeyIdentifier' },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Export PKCS#12 (.pfx)
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], pfxPassword, {
    algorithm: '3des',
    friendlyName: cn,
  });
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  const pfxBase64 = forge.util.encode64(p12Der);

  return {
    pfxBase64,
    password: pfxPassword,
    hostnames: cleanHosts,
    validFrom: now,
    validUntil: notAfter,
  };
}

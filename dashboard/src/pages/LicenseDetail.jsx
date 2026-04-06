import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Ban, RefreshCw, Smartphone, Save } from 'lucide-react';

export default function LicenseDetail() {
  const { id } = useParams();
  const [license, setLicense] = useState(null);
  const [renewDate, setRenewDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getLicense(id).then(setLicense).catch(console.error);
  useEffect(() => { load(); }, [id]);

  const handleRevoke = async () => {
    if (!confirm('Révoquer cette licence ? Tous les appareils seront désactivés.')) return;
    await api.revokeLicense(id);
    load();
  };

  const handleRenew = async () => {
    if (!renewDate) return alert('Sélectionnez une date');
    await api.renewLicense(id, { expiresAt: renewDate });
    setRenewDate('');
    load();
  };

  const handleDeactivateDevice = async (deviceId) => {
    if (!confirm('Désactiver cet appareil ?')) return;
    await api.deactivateDevice(id, deviceId);
    load();
  };

  if (!license) return <div className="text-gray-500">Chargement...</div>;

  const isExpired = new Date(license.expiresAt) < new Date();

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/licenses" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{license.licenseKey}</h1>
          <p className="text-sm text-gray-500">{license.company?.name} &mdash; {license.company?.legalName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos licence */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations</h2>
          <dl className="space-y-3">
            {[
              { label: 'Plan', value: license.plan, capitalize: true },
              { label: 'URL SyncService', value: license.syncServiceUrl },
              { label: 'Max appareils', value: license.maxDevices },
              { label: 'Features', value: Array.isArray(license.features) ? license.features.join(', ') : '' },
              { label: 'Début', value: new Date(license.startsAt).toLocaleDateString('fr-FR') },
              { label: 'Expiration', value: new Date(license.expiresAt).toLocaleDateString('fr-FR') },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm text-gray-500">{label}</dt>
                <dd className={`text-sm font-medium text-gray-900 ${capitalize ? 'capitalize' : ''}`}>{value}</dd>
              </div>
            ))}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Statut</dt>
              <dd>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  !license.isActive ? 'bg-red-100 text-red-700' :
                  isExpired ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {!license.isActive ? 'Révoquée' : isExpired ? 'Expirée' : 'Active'}
                </span>
              </dd>
            </div>
          </dl>

          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
            {license.isActive && (
              <button onClick={handleRevoke}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-medium cursor-pointer">
                <Ban size={16} /> Révoquer
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={handleRenew}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer">
                <RefreshCw size={14} /> Renouveler
              </button>
            </div>
          </div>
        </div>

        {/* Appareils */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Appareils ({license.devices?.filter(d => d.isActive).length}/{license.maxDevices})
          </h2>
          {license.devices?.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun appareil activé</p>
          ) : (
            <div className="space-y-3">
              {license.devices.map((d) => (
                <div key={d.id} className={`flex items-center justify-between p-3 rounded-lg ${d.isActive ? 'bg-gray-50' : 'bg-gray-100 opacity-50'}`}>
                  <div className="flex items-center gap-3">
                    <Smartphone size={18} className={d.isActive ? 'text-blue-600' : 'text-gray-400'} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.deviceName || d.deviceId}</div>
                      <div className="text-xs text-gray-500">
                        {d.platform} &mdash; Dernier contact : {new Date(d.lastHeartbeat).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  {d.isActive && (
                    <button onClick={() => handleDeactivateDevice(d.deviceId)}
                      className="text-xs text-red-500 hover:text-red-700 cursor-pointer">Désactiver</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

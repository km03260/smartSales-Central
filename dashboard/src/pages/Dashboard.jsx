import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Building2, KeyRound, Smartphone, AlertTriangle } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.getOverview().then(setStats).catch(console.error);
    api.getUsage(30).then(setUsage).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Entreprises" value={stats?.totalCompanies} color="blue" />
        <StatCard icon={KeyRound} label="Licences actives" value={stats?.activeLicenses} color="green" />
        <StatCard icon={Smartphone} label="Appareils actifs" value={stats?.activeDevices} color="purple" />
        <StatCard icon={AlertTriangle} label="Expirent sous 30j" value={stats?.expiringSoon} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité (30 derniers jours)</h2>
        {usage?.events?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {usage.events.map((e) => (
              <div key={e.type} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{e.count}</p>
                <p className="text-sm text-gray-500 capitalize">{e.type.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Aucune activité enregistrée</p>
        )}
      </div>
    </div>
  );
}

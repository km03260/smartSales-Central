import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MessageSquare, Trash2 } from 'lucide-react';

const statusLabels = { new: 'Nouveau', contacted: 'Contacté', closed: 'Fermé' };
const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = () => api.getContacts().then(setContacts).catch(console.error);
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api.updateContact(id, { status });
    load();
  };

  const deleteContact = async (id) => {
    if (!confirm('Supprimer définitivement cette demande ?')) return;
    try {
      await api.deleteContact(id);
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Demandes de contact</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune demande</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contacts.map((c) => (
                <div key={c.id} onClick={() => setSelected(c)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">{c.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                        {statusLabels[c.status]}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                        {c.type}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{c.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Détail */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {selected ? (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{selected.name}</h2>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>{selected.email}</p>
                {selected.phone && <p>{selected.phone}</p>}
                {selected.company && <p className="font-medium">{selected.company}</p>}
              </div>
              <p className="text-sm text-gray-800 mb-4 whitespace-pre-wrap">{selected.message}</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  {['new', 'contacted', 'closed'].map((s) => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selected.status === s
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => deleteContact(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2" />
              <p className="text-sm">Sélectionnez une demande</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

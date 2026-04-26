import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { MessageSquare, Trash2, X } from 'lucide-react';

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
    setSelected((s) => s ? { ...s, status } : s);
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          {contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune demande</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contacts.map((c) => (
                <button key={c.id} type="button" onClick={() => setSelected(c)}
                  className={`w-full text-left p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
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
                  <p className="text-sm text-gray-500 line-clamp-2">{c.message}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Détail — panneau fixe sur lg+, modal plein écran sur mobile */}
        <div className="hidden lg:block bg-white rounded-xl border border-gray-200 p-6">
          {selected ? (
            <ContactDetail
              contact={selected}
              onUpdateStatus={(s) => updateStatus(selected.id, s)}
              onDelete={() => deleteContact(selected.id)}
            />
          ) : (
            <div className="text-center text-gray-400">
              <MessageSquare size={32} className="mx-auto mb-2" />
              <p className="text-sm">Sélectionnez une demande</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal mobile */}
      {selected && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSelected(null)}>
          <div className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Détail de la demande</h2>
              <button onClick={() => setSelected(null)} className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1">
              <ContactDetail
                contact={selected}
                onUpdateStatus={(s) => updateStatus(selected.id, s)}
                onDelete={() => deleteContact(selected.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactDetail({ contact, onUpdateStatus, onDelete }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{contact.name}</h2>
      <div className="space-y-1 text-sm text-gray-600 mb-4">
        <p><a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a></p>
        {contact.phone && <p><a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">{contact.phone}</a></p>}
        {contact.company && <p className="font-medium">{contact.company}</p>}
        <p className="text-xs text-gray-400 pt-1">
          Reçue le {new Date(contact.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
        </p>
      </div>
      <p className="text-sm text-gray-800 mb-4 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">{contact.message}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['new', 'contacted', 'closed'].map((s) => (
            <button key={s} onClick={() => onUpdateStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                contact.status === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {statusLabels[s]}
            </button>
          ))}
        </div>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Supprimer"
        >
          <Trash2 size={14} />
          Supprimer
        </button>
      </div>
    </div>
  );
}

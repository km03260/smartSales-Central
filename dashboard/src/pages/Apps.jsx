import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Package, Upload, Trash2, Download, QrCode, Plus, X, Server, Pencil, ChevronDown, ChevronRight, Save } from 'lucide-react';

const COLORS = [
  { value: 'blue',    label: 'Bleu' },
  { value: 'violet',  label: 'Violet' },
  { value: 'emerald', label: 'Émeraude' },
  { value: 'orange',  label: 'Orange' },
  { value: 'pink',    label: 'Rose' },
  { value: 'cyan',    label: 'Cyan' },
];

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [qrPreview, setQrPreview] = useState(null);
  const [openMarketingId, setOpenMarketingId] = useState(null);

  const load = () =>
    api.getApps().then((data) => { setApps(data); setLoading(false); }).catch(console.error);

  useEffect(() => { load(); }, []);

  const handleApkUpload = async (appId, file, version, releaseNotes) => {
    if (!file) return;
    setUploadingId(appId);
    try { await api.uploadApk(appId, file, version, releaseNotes); await load(); }
    catch (err) { alert(err.message); }
    finally { setUploadingId(null); }
  };
  const handleApkDelete = async (appId) => {
    if (!confirm('Supprimer l\'APK et le QR code associé ?')) return;
    try { await api.deleteApk(appId); await load(); } catch (err) { alert(err.message); }
  };
  const handleBundleUpload = async (appId, file, version) => {
    if (!file) return;
    setUploadingId(appId);
    try { await api.uploadServiceBundle(appId, file, version); await load(); }
    catch (err) { alert(err.message); }
    finally { setUploadingId(null); }
  };
  const handleBundleDelete = async (appId) => {
    if (!confirm('Supprimer le bundle SyncService ?')) return;
    try { await api.deleteServiceBundle(appId); await load(); } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="text-gray-500">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nouvelle application
        </button>
      </div>

      <div className="space-y-4">
        {apps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            uploading={uploadingId === app.id}
            marketingOpen={openMarketingId === app.id}
            onToggleMarketing={() => setOpenMarketingId(openMarketingId === app.id ? null : app.id)}
            onReload={load}
            onUpload={(file, version, releaseNotes) => handleApkUpload(app.id, file, version, releaseNotes)}
            onDeleteApk={() => handleApkDelete(app.id)}
            onShowQr={() => setQrPreview(app)}
            onUploadBundle={(file, version) => handleBundleUpload(app.id, file, version)}
            onDeleteBundle={() => handleBundleDelete(app.id)}
          />
        ))}
      </div>

      {apps.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 text-gray-300" />
          Aucune application. Créez-en une pour commencer.
        </div>
      )}

      {showCreate && <CreateAppModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
      {qrPreview && <QrModal app={qrPreview} onClose={() => setQrPreview(null)} />}
    </div>
  );
}

function AppCard({ app, uploading, marketingOpen, onToggleMarketing, onReload, onUpload, onDeleteApk, onShowQr, onUploadBundle, onDeleteBundle }) {
  const fileRef = useRef(null);
  const bundleRef = useRef(null);
  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [bundleVersion, setBundleVersion] = useState('');
  const hasApk = !!app.apkFileName;
  const hasBundle = !!app.serviceBundlePath;

  const triggerUpload = () => fileRef.current?.click();
  const triggerBundleUpload = () => bundleRef.current?.click();
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file, version, releaseNotes);
    e.target.value = '';
  };
  const onBundleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadBundle(file, bundleVersion);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Package size={20} className="text-blue-600" />
              <h3 className="font-bold text-gray-900">{app.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{app.code}</span>
              {app.slug && <span className="text-xs font-mono px-2 py-0.5 bg-blue-50 text-blue-600 rounded">/apps/{app.slug}</span>}
            </div>
            {app.tagline && <p className="text-sm text-gray-700 italic mb-1">« {app.tagline} »</p>}
            {app.description && <p className="text-sm text-gray-500">{app.description}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {app.totalLicenses ?? 0} licence(s) · {app.features?.length ?? 0} fonctionnalité(s) · {app.pricingPlans?.length ?? 0} plan(s)
            </p>
          </div>
          <button
            onClick={onToggleMarketing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {marketingOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <Pencil size={14} />
            Marketing
          </button>
        </div>

        {hasApk ? (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{app.apkFileName}</div>
                  <div className="text-xs text-gray-500">
                    {app.apkVersion && <span>v{app.apkVersion} · </span>}
                    {app.apkUpdatedAt && <span>{new Date(app.apkUpdatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={onShowQr} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors" title="Voir le QR code">
                  <QrCode size={18} />
                </button>
                <a href={app.apkUrl} download className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors" title="Télécharger">
                  <Download size={18} />
                </a>
                <button onClick={onDeleteApk} className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
              {app.apkReleaseNotes && (
                <div className="mt-2 pt-2 border-t border-green-200 text-xs text-gray-600 whitespace-pre-line">
                  <span className="font-semibold text-gray-700">Notes de version :</span> {app.apkReleaseNotes}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text" value={version} onChange={(e) => setVersion(e.target.value)}
                  placeholder="Nouvelle version (ex: 1.2.3)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={triggerUpload} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  <Upload size={16} />
                  {uploading ? 'Upload...' : 'Remplacer'}
                </button>
              </div>
              <textarea
                value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                placeholder="Notes de version (ce que cette release apporte, une ligne par point)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              Aucun APK uploadé
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text" value={version} onChange={(e) => setVersion(e.target.value)}
                  placeholder="Version (ex: 1.2.3)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={triggerUpload} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Upload size={16} />
                  {uploading ? 'Upload...' : 'Uploader APK'}
                </button>
              </div>
              <textarea
                value={releaseNotes} onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                placeholder="Notes de version (ce que cette release apporte, une ligne par point)"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".apk,application/vnd.android.package-archive" className="hidden" onChange={onFileChange} />

        {/* Service Bundle (SyncService .NET) */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Server size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">SyncService (binaires .NET)</span>
          </div>
          {hasBundle ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">service-bundle.zip</div>
                  <div className="text-xs text-gray-500">
                    {app.serviceBundleVersion && <span>v{app.serviceBundleVersion} · </span>}
                    {app.serviceBundleUpdatedAt && <span>{new Date(app.serviceBundleUpdatedAt).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button onClick={onDeleteBundle} className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors" title="Supprimer">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <input type="text" value={bundleVersion} onChange={(e) => setBundleVersion(e.target.value)} placeholder="Nouvelle version"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={triggerBundleUpload} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  <Upload size={16} /> {uploading ? 'Upload...' : 'Remplacer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                Aucun bundle SyncService. Uploadez le ZIP contenant l'exe + DLLs compilé via <code className="text-xs font-mono bg-gray-100 px-1 rounded">dotnet publish</code>.
              </div>
              <div className="flex gap-2">
                <input type="text" value={bundleVersion} onChange={(e) => setBundleVersion(e.target.value)} placeholder="Version"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={triggerBundleUpload} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Upload size={16} /> {uploading ? 'Upload...' : 'Uploader ZIP'}
                </button>
              </div>
            </div>
          )}
        </div>

        <input ref={bundleRef} type="file" accept=".zip" className="hidden" onChange={onBundleChange} />
      </div>

      {marketingOpen && <MarketingPanel app={app} onReload={onReload} />}
    </div>
  );
}

function MarketingPanel({ app, onReload }) {
  return (
    <div className="border-t border-gray-100 bg-gray-50 p-6 space-y-6">
      <AppMetaEditor app={app} onReload={onReload} />
      <FeaturesEditor app={app} onReload={onReload} />
      <PlansEditor app={app} onReload={onReload} />
    </div>
  );
}

function AppMetaEditor({ app, onReload }) {
  const [form, setForm] = useState({
    slug: app.slug || '',
    tagline: app.tagline || '',
    description: app.description || '',
    longDescription: app.longDescription || '',
    color: app.color || 'blue',
    iconSvgPath: app.iconSvgPath || '',
    order: app.order ?? 0,
    isActive: !!app.isActive,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try { await api.updateApp(app.id, form); await onReload(); }
    catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Identité & description</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Slug (URL)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="custom-sales" />
        <Field label="Ordre" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: Number(v) || 0 })} />
        <Field label="Tagline (hero)" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} placeholder="Vos commerciaux prennent commande..." />
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
          <select value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {COLORS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <Field label="Description courte" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description longue (page produit)</label>
          <textarea rows={4} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Icône — `d` SVG (lucide / heroicons)</label>
          <textarea rows={2} value={form.iconSvgPath} onChange={(e) => setForm({ ...form, iconSvgPath: e.target.value })}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Visible sur le site vitrine
        </label>
      </div>
      <div className="flex justify-end mt-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
          <Save size={16} />
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function FeaturesEditor({ app, onReload }) {
  const [draft, setDraft] = useState({ title: '', description: '', iconSvgPath: '' });

  const add = async () => {
    if (!draft.title) return;
    try {
      await api.createAppFeature(app.id, { ...draft, order: (app.features?.length ?? 0) + 1 });
      setDraft({ title: '', description: '', iconSvgPath: '' });
      await onReload();
    } catch (err) { alert(err.message); }
  };

  const remove = async (featureId) => {
    if (!confirm('Supprimer cette fonctionnalité ?')) return;
    try { await api.deleteAppFeature(app.id, featureId); await onReload(); }
    catch (err) { alert(err.message); }
  };

  const updateField = async (featureId, patch) => {
    try { await api.updateAppFeature(app.id, featureId, patch); await onReload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Fonctionnalités ({app.features?.length ?? 0})</h4>
      <div className="space-y-2 mb-4">
        {(app.features || []).map((f) => (
          <FeatureRow key={f.id} feature={f} onUpdate={(patch) => updateField(f.id, patch)} onDelete={() => remove(f.id)} />
        ))}
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <input type="text" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Titre"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description"
            className="md:col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          <input type="text" value={draft.iconSvgPath} onChange={(e) => setDraft({ ...draft, iconSvgPath: e.target.value })}
            placeholder="Icône SVG path (d=...)"
            className="flex-1 px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={add} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={14} />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ feature, onUpdate, onDelete }) {
  const [title, setTitle] = useState(feature.title);
  const [description, setDescription] = useState(feature.description);
  const dirty = title !== feature.title || description !== feature.description;

  return (
    <div className="flex items-start gap-2 p-2 border border-gray-100 rounded-lg">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre"
          className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
          className="md:col-span-2 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      {dirty && (
        <button onClick={() => onUpdate({ title, description })}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Enregistrer">
          <Save size={14} />
        </button>
      )}
      <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Supprimer">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function PlansEditor({ app, onReload }) {
  const [draft, setDraft] = useState({ name: '', price: '', period: '/mois', featuresText: '', isFeatured: false, ctaLabel: 'Demander une démo' });

  const add = async () => {
    if (!draft.name || !draft.price) return;
    const features = draft.featuresText.split('\n').map(s => s.trim()).filter(Boolean);
    try {
      await api.createAppPlan(app.id, {
        name: draft.name, price: draft.price, period: draft.period,
        features, isFeatured: draft.isFeatured, ctaLabel: draft.ctaLabel,
        order: (app.pricingPlans?.length ?? 0) + 1,
      });
      setDraft({ name: '', price: '', period: '/mois', featuresText: '', isFeatured: false, ctaLabel: 'Demander une démo' });
      await onReload();
    } catch (err) { alert(err.message); }
  };

  const remove = async (planId) => {
    if (!confirm('Supprimer ce plan tarifaire ?')) return;
    try { await api.deleteAppPlan(app.id, planId); await onReload(); }
    catch (err) { alert(err.message); }
  };

  const update = async (planId, patch) => {
    try { await api.updateAppPlan(app.id, planId, patch); await onReload(); }
    catch (err) { alert(err.message); }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 text-sm">Plans tarifaires ({app.pricingPlans?.length ?? 0})</h4>
      <div className="space-y-2 mb-4">
        {(app.pricingPlans || []).map((p) => (
          <PlanRow key={p.id} plan={p} onUpdate={(patch) => update(p.id, patch)} onDelete={() => remove(p.id)} />
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nom (Pro, Starter...)"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="Prix (200 €)"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" value={draft.period} onChange={(e) => setDraft({ ...draft, period: e.target.value })} placeholder="Période (/mois)"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} placeholder="CTA"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <textarea rows={3} value={draft.featuresText} onChange={(e) => setDraft({ ...draft, featuresText: e.target.value })}
          placeholder="Fonctionnalités incluses (1 par ligne)"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={draft.isFeatured} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} />
            Mis en avant (plan recommandé)
          </label>
          <button onClick={add} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={14} />
            Ajouter le plan
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanRow({ plan, onUpdate, onDelete }) {
  const initialFeaturesText = (Array.isArray(plan.features) ? plan.features : []).join('\n');
  const [name, setName]                 = useState(plan.name);
  const [price, setPrice]               = useState(plan.price);
  const [period, setPeriod]             = useState(plan.period || '');
  const [ctaLabel, setCtaLabel]         = useState(plan.ctaLabel || '');
  const [isFeatured, setIsFeatured]     = useState(!!plan.isFeatured);
  const [featuresText, setFeaturesText] = useState(initialFeaturesText);

  const dirty =
    name !== plan.name ||
    price !== plan.price ||
    period !== (plan.period || '') ||
    ctaLabel !== (plan.ctaLabel || '') ||
    isFeatured !== !!plan.isFeatured ||
    featuresText !== initialFeaturesText;

  const save = () => {
    const features = featuresText.split('\n').map(s => s.trim()).filter(Boolean);
    onUpdate({ name, price, period, ctaLabel, isFeatured, features });
  };

  return (
    <div className={`p-3 border rounded-lg ${dirty ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100'}`}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom"
          className="px-2 py-1.5 text-sm font-semibold border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prix"
          className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Période (/mois)"
          className="px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="CTA"
          className="md:col-span-2 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <textarea rows={3} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)}
        placeholder="Fonctionnalités (1 par ligne)"
        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Mis en avant (⭐ recommandé)
        </label>
        <div className="flex items-center gap-1">
          {dirty && (
            <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
              <Save size={12} />
              Enregistrer
            </button>
          )}
          <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Supprimer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function QrModal({ app, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="font-bold text-gray-900 mb-1">{app.name}</h3>
        <p className="text-sm text-gray-500 mb-6">Scanner pour télécharger l'APK</p>
        <div className="flex justify-center mb-4">
          <img src={app.qrcodeUrl} alt="QR Code" className="w-64 h-64" />
        </div>
        <div className="text-xs text-center text-gray-500 break-all bg-gray-50 p-3 rounded-lg">
          {app.apkUrl}
        </div>
      </div>
    </div>
  );
}

function CreateAppModal({ onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await api.createApp({ code, name, slug, description }); onCreated(); }
    catch (err) { alert(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-white rounded-2xl p-8 max-w-md w-full relative" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        <h3 className="font-bold text-gray-900 mb-6">Nouvelle application</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input required maxLength={10} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SS"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="customSales"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="custom-sales (auto si vide)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}

const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
    throw new Error('Non autorisé');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

export const api = {
  // Auth
  login: (body) => request('/admin/auth/login', { method: 'POST', body }),

  // Companies
  getCompanies: () => request('/admin/companies'),
  getCompany: (id) => request(`/admin/companies/${id}`),
  createCompany: (body) => request('/admin/companies', { method: 'POST', body }),
  updateCompany: (id, body) => request(`/admin/companies/${id}`, { method: 'PUT', body }),
  deleteCompany: (id) => request(`/admin/companies/${id}`, { method: 'DELETE' }),
  updateCompanyConfig: (id, body) => request(`/admin/companies/${id}/config`, { method: 'PUT', body }),
  uploadLogo: async (companyId, file) => {
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${API_BASE}/admin/companies/${companyId}/logo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur upload');
    return data;
  },

  // Apps
  getApps: () => request('/admin/apps'),
  createApp: (body) => request('/admin/apps', { method: 'POST', body }),
  updateApp: (id, body) => request(`/admin/apps/${id}`, { method: 'PUT', body }),
  deleteApp: (id) => request(`/admin/apps/${id}`, { method: 'DELETE' }),
  uploadApk: async (appId, file, version) => {
    const token = localStorage.getItem('admin_token');
    const formData = new FormData();
    formData.append('apk', file);
    if (version) formData.append('version', version);
    const res = await fetch(`${API_BASE}/admin/apps/${appId}/apk`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur upload APK');
    return data;
  },
  deleteApk: (appId) => request(`/admin/apps/${appId}/apk`, { method: 'DELETE' }),

  // Licenses
  getLicenses: (appId) => request(`/admin/licenses${appId ? `?appId=${appId}` : ''}`),
  getLicense: (id) => request(`/admin/licenses/${id}`),
  createLicense: (body) => request('/admin/licenses', { method: 'POST', body }),
  updateLicense: (id, body) => request(`/admin/licenses/${id}`, { method: 'PUT', body }),
  revokeLicense: (id) => request(`/admin/licenses/${id}/revoke`, { method: 'POST' }),
  renewLicense: (id, body) => request(`/admin/licenses/${id}/renew`, { method: 'POST', body }),
  blockLicense: (id) => request(`/admin/licenses/${id}/block`, { method: 'POST' }),
  unblockLicense: (id) => request(`/admin/licenses/${id}/unblock`, { method: 'POST' }),
  getLicenseDevices: (id) => request(`/admin/licenses/${id}/devices`),
  deactivateDevice: (licenseId, deviceId) =>
    request(`/admin/licenses/${licenseId}/devices/${deviceId}/deactivate`, { method: 'POST' }),
  getSyncConfig: (id) => request(`/admin/licenses/${id}/sync-config`),
  updateSyncConfig: (id, body) => request(`/admin/licenses/${id}/sync-config`, { method: 'PUT', body }),

  // Deployments (SyncService)
  getDeployments: (companyId) => request(`/admin/deployments${companyId ? `?companyId=${companyId}` : ''}`),
  getDeployment: (id) => request(`/admin/deployments/${id}`),
  createDeployment: (body) => request('/admin/deployments', { method: 'POST', body }),
  updateDeployment: (id, body) => request(`/admin/deployments/${id}`, { method: 'PUT', body }),
  deleteDeployment: (id) => request(`/admin/deployments/${id}`, { method: 'DELETE' }),
  downloadDeploymentAppsettings: async (id) => {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`${API_BASE}/admin/deployments/${id}/appsettings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur téléchargement appsettings.json');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'appsettings.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Analytics
  getOverview: () => request('/admin/analytics/overview'),
  getUsage: (days = 30) => request(`/admin/analytics/usage?days=${days}`),

  // Contacts
  getContacts: () => request('/admin/contacts'),
  getContactsUnreadCount: () => request('/admin/contacts/unread-count'),
  updateContact: (id, body) => request(`/admin/contacts/${id}`, { method: 'PUT', body }),
  deleteContact: (id) => request(`/admin/contacts/${id}`, { method: 'DELETE' }),
};

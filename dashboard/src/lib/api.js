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

  // Analytics
  getOverview: () => request('/admin/analytics/overview'),
  getUsage: (days = 30) => request(`/admin/analytics/usage?days=${days}`),

  // Contacts
  getContacts: () => request('/admin/contacts'),
  updateContact: (id, body) => request(`/admin/contacts/${id}`, { method: 'PUT', body }),
};

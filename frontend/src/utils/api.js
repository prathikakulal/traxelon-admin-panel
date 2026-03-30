// src/utils/api.js
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Global API wrapper to automatically attach the Authorization token from localStorage
 * and handle common errors like 401 Unauthorized.
 */
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Auto-logout on 401
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const logout = () => {
  localStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminAuthed');
  sessionStorage.removeItem('adminProfile');
  window.location.reload(); // Refresh to trigger redirect to login
};

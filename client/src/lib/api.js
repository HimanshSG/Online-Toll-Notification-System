import { apiRequest } from "./queryClient";

async function safeApiRequest(method, url, body) {
  try {
    const res = await apiRequest(method, url, body);
    
    // Handle unauthorized responses
    if (res.status === 401) {
      throw new Error('Session expired - Please login again');
    }

    const contentType = res.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const errorText = await res.text();
      console.error('Non-JSON response:', errorText);
      throw new Error(`Server error: ${res.statusText}`);
    }

    const data = await res.json();
    
    if (!res.ok) {
      const errorMessage = data.error || data.message || `Request failed with status ${res.status}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error [${method} ${url}]:`, error);
    throw new Error(error.message || 'Network request failed');
  }
}

// Enhanced API functions
async function verifyOTP(data) {
  const response = await safeApiRequest('POST', '/api/auth/verify-otp', data);
  localStorage.setItem('sessionActive', 'true');
  return response;
}

async function loginUser(credentials) {
  const response = await safeApiRequest('POST', '/api/auth/login', credentials);
  localStorage.setItem('sessionActive', 'true');
  return response;
}

// Add to existing auth functions
async function logout() {
  const response = await safeApiRequest('GET', '/api/auth/logout');
  return response;
}

// Existing API functions remain the same...

// ===== AUTH SECTION =====
async function registerUser(userData) {
  return safeApiRequest('POST', '/api/auth/register', userData);
}

async function resendOTP(data) {
  return safeApiRequest('POST', '/api/auth/resend-otp', data);
}

async function loginAdmin(credentials) {
  return safeApiRequest('POST', '/api/auth/admin/login', credentials);
}


// ===== USER SECTION =====
async function getUserProfile() {
  return safeApiRequest('GET', '/api/users/profile');
}

async function updateUserProfile(profileData) {
  return safeApiRequest('PUT', '/api/users/profile', profileData);
}

async function updateUserLocation(locationData) {
  return safeApiRequest('PUT', '/api/users/location', locationData);
}

async function rechargeUserBalance(amount) {
  return safeApiRequest('PUT', '/api/users/recharge', { amount });
}

async function getUserNotifications() {
  return safeApiRequest('GET', '/api/users/notifications');
}

const clearUserNotifications = () => {
  return safeApiRequest('DELETE', '/api/users/notifications');
};

// ===== NOTIFICATION SETTINGS =====
async function getNotificationSettings() {
  return safeApiRequest('GET', '/api/users/settings/notifications');
}

async function updateNotificationSettings(settings) {
  return safeApiRequest('PUT', '/api/users/settings/notifications', settings);
}

// ===== TOLL PLAZA SECTION =====
async function getTollPlazas() {
  return safeApiRequest('GET', '/api/toll-plazas');
}

async function getNearbyTollPlazas(location) {
  return safeApiRequest(
    'GET', 
    `/api/toll-plazas/nearby?latitude=${location.latitude}&longitude=${location.longitude}`
  );
}

// ===== ADMIN SECTION =====
async function getAdminTollPlazas(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  return safeApiRequest('GET', `/api/admin/dashboard/toll-plazas?${queryParams}`);
}

async function createTollPlaza(tollData) {
  return safeApiRequest('POST', '/api/admin/dashboard/toll-plazas', tollData);
}

async function updateTollPlaza(id, tollData) {
  return safeApiRequest('PUT', `/api/admin/dashboard/toll-plazas/${id}`, tollData);
}

async function deleteTollPlaza(id) {
  return safeApiRequest('DELETE', `/api/admin/dashboard/toll-plazas/${id}`);
}

async function getAdminUsers(params = {}) {
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== undefined)
  );
  const queryParams = new URLSearchParams(filteredParams).toString();
  return safeApiRequest('GET', `/api/admin/dashboard/users?${queryParams}`);
}

async function updateUserBalance(id, balance) {
  return safeApiRequest('PUT', `/api/admin/dashboard/users/${id}/balance`, {
    fastagBalance: balance
  });
}

async function getAdminNotifications(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  return safeApiRequest('GET', `/api/admin/dashboard/notifications?${queryParams}`);
}

async function getAdminDashboardStats() {
  return safeApiRequest('GET', '/api/admin/dashboard/stats');
}

// ===== SETTINGS SECTION =====
async function getUserSettings() {
  return safeApiRequest('GET', '/api/users/settings');
}

async function saveUserSettings(settings) {
  return safeApiRequest('POST', '/api/users/settings', settings);
}

export {
  verifyOTP,
  loginUser,
  logout,
  registerUser,
  resendOTP,
  loginAdmin,
  getUserProfile,
  updateUserProfile,
  updateUserLocation,
  rechargeUserBalance,
  getUserNotifications,
  clearUserNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  getTollPlazas,
  getNearbyTollPlazas,
  getAdminTollPlazas,
  createTollPlaza,
  updateTollPlaza,
  deleteTollPlaza,
  getAdminUsers,
  updateUserBalance,
  getAdminNotifications,
  getAdminDashboardStats,
  getUserSettings,
  saveUserSettings
};
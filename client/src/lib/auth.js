import { apiRequest } from "./queryClient";

const USER_KEY = 'toll_notify_user';

/**
 * Save current user to localStorage
 */
export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Retrieve current user from localStorage
 */
export function getCurrentUser() {
  try {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.error('Error parsing user data:', e);
    return null;
  }
}

/**
 * Remove user from localStorage
 */
export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}

/**
 * Register a new user
 * @param {Object} userData - { name, email, contactNumber, vehicleNumber, fastagId, password }
 */
export async function register(userData) {
  const response = await apiRequest('POST', '/api/auth/register', userData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  const data = await response.json();
  return data;
}

/**
 * Verify OTP
 * @param {Object} otpData - { userId, otp }
 */
export async function verifyOtp(otpData) {
  const response = await apiRequest('POST', '/api/auth/verify-otp', otpData);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'OTP verification failed');
  }
  const data = await response.json();
  return data;
}

/**
 * Resend OTP
 * @param {Object} data - { userId }
 */
export async function resendOtp(data) {
  const response = await apiRequest('POST', '/api/auth/resend-otp', data);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to resend OTP');
  }
  const result = await response.json();
  return result;
}

/**
 * User login
 * @param {Object} credentials - { email, password }
 */
export async function login(credentials) {
  const response = await apiRequest('POST', '/api/auth/login', credentials);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  const userData = await response.json();
  setCurrentUser({
    ...userData,
    isAdmin: false
  });
  return userData;
}

/**
 * Admin login
 * @param {Object} credentials - { email, password }
 */
export async function loginAdmin(credentials) {
  const response = await apiRequest('POST', '/api/auth/admin/login', credentials);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Admin login failed');
  }
  const adminData = await response.json();
  setCurrentUser({
    ...adminData,
    isAdmin: true
  });
  return adminData;
}

/**
 * Logout user/admin
 */
export async function logout() {
  await apiRequest('GET', '/api/auth/logout');
  clearCurrentUser();
}

/**
 * Is user authenticated?
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}

/**
 * Is user an Admin?
 */
export function isAdmin() {
  const user = getCurrentUser();
  return user?.isAdmin === true;
}

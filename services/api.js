import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://cassowary02.ifn666.com/assessment02/api';

// Token helpers
export async function getToken() {
  return await SecureStore.getItemAsync('authToken');
}

export async function saveToken(token) {
  await SecureStore.setItemAsync('authToken', token);
}

export async function removeToken() {
  await SecureStore.deleteItemAsync('authToken');
}

// Core request helper
async function request(path, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (error) {
    // Distinguish network errors from API errors
    if (error.message === 'Network request failed') {
      throw new Error('Unable to connect. Please check your connection.');
    }
    throw error;
  }
}

// Auth
export async function login(username, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  await saveToken(data.authToken);
  return data;
}

export async function register(username, email, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

// Books
export async function getBooks(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/books${query ? '?' + query : ''}`);
}

export async function getBook(id) {
  return request(`/books/${id}`);
}

export async function createBook(bookData) {
  return request('/books', { method: 'POST', body: JSON.stringify(bookData) });
}

export async function updateBook(id, bookData) {
  return request(`/books/${id}`, { method: 'PUT', body: JSON.stringify(bookData) });
}

export async function deleteBook(id) {
  return request(`/books/${id}`, { method: 'DELETE' });
}

// Reading Logs
export async function getReadingLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/reading-logs${query ? '?' + query : ''}`);
}

export async function getReadingLog(id) {
  return request(`/reading-logs/${id}`);
}

export async function createReadingLog(logData) {
  return request('/reading-logs', { method: 'POST', body: JSON.stringify(logData) });
}

export async function updateReadingLog(id, logData) {
  return request(`/reading-logs/${id}`, { method: 'PUT', body: JSON.stringify(logData) });
}

export async function deleteReadingLog(id) {
  return request(`/reading-logs/${id}`, { method: 'DELETE' });
}

// Shelves
export async function getShelves(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/shelves${query ? '?' + query : ''}`);
}

export async function getShelf(id) {
  return request(`/shelves/${id}`);
}

export async function createShelf(shelfData) {
  return request('/shelves', { method: 'POST', body: JSON.stringify(shelfData) });
}

export async function updateShelf(id, shelfData) {
  return request(`/shelves/${id}`, { method: 'PUT', body: JSON.stringify(shelfData) });
}

export async function deleteShelf(id) {
  return request(`/shelves/${id}`, { method: 'DELETE' });
}

export async function addBookToShelf(shelfId, bookId) {
  return request(`/shelves/${shelfId}/books`, {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
}

export async function removeBookFromShelf(shelfId, bookId) {
  return request(`/shelves/${shelfId}/books/${bookId}`, { method: 'DELETE' });
}

// Reviews
export async function getReviews(bookId) {
  return request(`/books/${bookId}/reviews`);
}

export async function createReview(bookId, reviewData) {
  return request(`/books/${bookId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
}

export async function deleteReview(bookId, reviewId) {
  return request(`/books/${bookId}/reviews/${reviewId}`, { method: 'DELETE' });
}
let currentUserKey = null;

export function sanitizar(email) {
  return email.replace(/[.#$[\]/]/g, '_');
}

export function setCurrentUser(email) {
  currentUserKey = email ? sanitizar(email) : null;
}

export function getCurrentUser() {
  return currentUserKey;
}

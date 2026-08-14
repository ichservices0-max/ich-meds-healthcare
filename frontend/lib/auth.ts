/**
 * Auth helper utilities for token management and JWT decoding
 */

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  iat?: number
  exp?: number
}

/**
 * Get the JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('ICH Meds_token')
}

/**
 * Store the JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ICH Meds_token', token)
}

/**
 * Remove the JWT token from localStorage (logout)
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('ICH Meds_token')
  localStorage.removeItem('ICH Meds_user')
}

/**
 * Decode a JWT payload without verification (client-side only)
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Get the decoded JWT payload (user info) or null if not authenticated
 */
export function getUser(): JWTPayload | null {
  const token = getToken()
  if (!token) return null
  const payload = decodeJWT(token)
  if (!payload) return null
  // Check if token is expired
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    removeToken()
    return null
  }
  return payload
}

/**
 * Store user data in localStorage for quick access
 */
export function setUser(user: JWTPayload): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('ICH Meds_user', JSON.stringify(user))
}

/**
 * Check if the user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return getUser() !== null
}

/**
 * Get user's display name initial for avatar fallback
 */
export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

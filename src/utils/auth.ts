import Cookies from 'js-cookie';

/**
 * Función auxiliar para obtener el token de autenticación de manera consistente
 * Prioriza las cookies pero también revisa localStorage como fallback para retrocompatibilidad
 */
export function getAuthToken(): string | undefined {
  // Primero intentar obtener de cookies (método actual)
  let token = Cookies.get('auth_token');
  
  // Fallback: verificar localStorage para retrocompatibilidad
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('auth_token') || undefined;
    
    // Si encontramos token en localStorage, migrar a cookies
    if (token) {
      Cookies.set('auth_token', token, { 
        expires: 1/3,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      
      // Opcionalmente limpiar localStorage después de migrar
      // localStorage.removeItem('auth_token');
    }
  }
  
  return token;
}

/**
 * Función auxiliar para obtener datos del usuario autenticado
 */
export function getAuthUser() {
  // Primero intentar obtener de cookies
  let userData = Cookies.get('user_data');
  
  // Fallback: verificar localStorage para retrocompatibilidad
  if (!userData && typeof window !== 'undefined') {
    userData = localStorage.getItem('auth_user') || undefined;
    
    // Si encontramos datos en localStorage, migrar a cookies
    if (userData) {
      try {
        const user = JSON.parse(userData);
        Cookies.set('user_data', JSON.stringify(user), {
          expires: 1/3,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        return null;
      }
    }
  }
  
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  
  return null;
}

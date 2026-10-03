import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: agrega JWT a cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('senderia_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: manejo global de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si da 401 en peticiones autenticadas (no en login ni registro), limpiar sesión y redirigir
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('senderia_token');
      localStorage.removeItem('senderia_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth ----
export const authService = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (nombre: string, email: string, password: string) =>
    api.post('/auth/register', { nombre, email, password }),
};

// ---- Destinos ----
export const destinosService = {
  getAll: (params?: { categoria?: string; region?: string }) =>
    api.get('/destinos', { params }),

  getById: (id: string | number) =>
    api.get(`/destinos/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/destinos', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    api.put(`/destinos/${id}`, data),

  delete: (id: string | number) =>
    api.delete(`/destinos/${id}`),
};

// ---- Categorías ----
export const categoriasService = {
  getAll: () => api.get('/categorias'),
  getRegiones: () => api.get('/categorias/regiones'),

  create: (data: { nombre: string; slug: string; descripcion?: string }) =>
    api.post('/categorias', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put(`/categorias/${id}`, data),

  delete: (id: number) =>
    api.delete(`/categorias/${id}`),
};

// ---- Usuarios ----
export const usuariosService = {
  getAll: () => api.get('/usuarios'),

  update: (id: number, data: { rol?: string; nombre?: string }) =>
    api.patch(`/usuarios/${id}`, data),

  delete: (id: number) =>
    api.delete(`/usuarios/${id}`),
};

// ---- Favoritos ----
export const favoritosService = {
  getAll: () => api.get('/favoritos'),

  add: (destino_id: number) =>
    api.post('/favoritos', { destino_id }),

  remove: (favoritoId: number) =>
    api.delete(`/favoritos/${favoritoId}`),
};

export default api;

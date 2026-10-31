import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : '';

export const publicAssetUrl = (path: string): string => `${API_ORIGIN}${path}`;

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
      if (window.location.pathname !== '/login' && window.location.pathname !== '/registro') {
        const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`/login?returnTo=${encodeURIComponent(currentPath)}`);
      }
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
export interface DestinoFiltros {
  categoria: string[];
  region: string[];
}

export interface OpinionDestino {
  id: number;
  puntuacion: number;
  comentario: string | null;
  autor: string;
  created_at: string;
  updated_at: string;
}

export interface OpinionResumen {
  calificacion_promedio: number | null;
  total_opiniones: number;
  opiniones: OpinionDestino[];
}

export const destinosService = {
  // Cada filtro se envía repetido (?region=a&region=b); dentro de un filtro el backend aplica OR y entre filtros AND.
  getAll: (filtros?: Partial<DestinoFiltros>) =>
    api.get('/destinos', { params: filtros, paramsSerializer: { indexes: null } }),

  getById: (id: string | number) =>
    api.get(`/destinos/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post('/destinos', data),

  update: (id: string | number, data: Record<string, unknown>) =>
    api.put(`/destinos/${id}`, data),

  delete: (id: string | number) =>
    api.delete(`/destinos/${id}`),
};

// Las opiniones son públicas para consulta, pero requieren JWT para guardar.
export const opinionesService = {
  getAll: (destinoId: string | number) =>
    api.get<OpinionResumen>(`/destinos/${destinoId}/opiniones`),

  getMine: (destinoId: string | number) =>
    api.get<{ opinion: Omit<OpinionDestino, 'autor'> | null }>(`/destinos/${destinoId}/opinion`),

  save: (destinoId: string | number, data: { puntuacion: number; comentario: string | null }) =>
    api.post(`/destinos/${destinoId}/opiniones`, data),
};

export interface ImagenComunidad {
  id: number;
  autor_nombre: string;
  comentario: string | null;
  created_at: string;
  imagen_url: string;
}

export interface SugerenciaImagenAdmin extends ImagenComunidad {
  destino_id: number;
  destino_nombre: string;
  region_nombre: string;
  categoria_nombre: string;
  mime_type: string;
  tamano_bytes: number;
}

export const sugerenciasImagenesService = {
  getApproved: (destinoId: number) =>
    api.get<{ imagenes: ImagenComunidad[] }>(`/destinos/${destinoId}/imagenes-comunidad`),

  submit: (destinoId: number, formData: FormData) =>
    api.post(`/destinos/${destinoId}/sugerencias-imagenes`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getPending: () =>
    api.get<{ sugerencias: SugerenciaImagenAdmin[] }>('/sugerencias-imagenes'),

  getAdminImage: (suggestionId: number) =>
    api.get<Blob>(`/sugerencias-imagenes/${suggestionId}/archivo`, { responseType: 'blob' }),

  review: (suggestionId: number, estado: 'aprobada' | 'rechazada') =>
    api.patch(`/sugerencias-imagenes/${suggestionId}/revision`, { estado }),
};

// ---- Categorías ----
export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
}

export interface Region {
  id: number;
  nombre: string;
  slug: string;
}

export const categoriasService = {
  getAll: () => api.get<{ categorias: Categoria[] }>('/categorias'),
  getRegiones: () => api.get<{ regiones: Region[] }>('/categorias/regiones'),

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

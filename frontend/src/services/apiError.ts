import axios from 'axios';

interface ApiErrorBody {
  error?: string;
  detalles?: Record<string, string[]>;
}

export const getApiErrorBody = (error: unknown): ApiErrorBody | undefined => {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return undefined;
  return error.response?.data;
};

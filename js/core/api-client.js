// ===== CLIENTE HTTP CENTRALIZADO =====
// Elimina el boilerplate de AbortController/fetch duplicado en bookingAPI y adminAPI.
// Beneficio: cambios globales (headers de auth, timeout, logging) en un solo lugar.

const BACKEND_URL = window.APP_CONFIG?.BACKEND_URL || 'http://localhost:3000';

const apiClient = {
  async request(method, path, body, options) {
    const opts = options || {};
    const url = BACKEND_URL + path;
    const timeout = opts.timeout || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let errorMessage = 'HTTP error! status: 0';

    try {
      const fetchOptions = {
        method: method,
        headers: Object.assign({}, opts.headers || {}),
        signal: controller.signal,
      };
      if (body !== null && body !== undefined) {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        errorMessage = 'HTTP error! status: ' + response.status;
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.message) {
                errorMessage = typeof errorData.message === 'string'
                  ? errorData.message
                  : JSON.stringify(errorData.message);
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
            } catch (jsonErr) {
              errorMessage = errorText;
            }
          }
        } catch (textErr) {
          // response.text() no disponible (ej: en mocks de test), usar mensaje por defecto
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Timeout: La solicitud tardó demasiado tiempo. Por favor verifica tu conexión e intenta nuevamente.');
      }
      throw error;
    }
  },

  get: function(path, options) {
    return this.request('GET', path, null, options);
  },

  post: function(path, body, options) {
    return this.request('POST', path, body, options);
  },

  delete: function(path, options) {
    return this.request('DELETE', path, null, options);
  },
};

window.apiClient = apiClient;

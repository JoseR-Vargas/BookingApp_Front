import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './apiClient.js';
import { APP_CONFIG } from '../config/appConfig.js';

const TIMEOUT_MESSAGE =
  'Timeout: La solicitud tardó demasiado tiempo. Por favor verifica tu conexión e intenta nuevamente.';

// Minimal fetch Response double: `text` is what response.text() resolves to.
function mockResponse({ ok = true, status = 200, json = {}, text = '' } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(json),
    text: vi.fn().mockResolvedValue(text),
  };
}

describe('apiClient', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('request building', () => {
    it('builds the URL as BACKEND_URL + path', async () => {
      fetch.mockResolvedValue(mockResponse());
      await apiClient.get('/api/bookings');
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings`);
    });

    it('POST sends a JSON body and the JSON Content-Type header', async () => {
      fetch.mockResolvedValue(mockResponse());
      const body = { client: { name: 'Ana' }, time: '10:00' };
      await apiClient.post('/api/bookings', body);

      const [, init] = fetch.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify(body));
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });

    it('GET sends no body and no Content-Type header', async () => {
      fetch.mockResolvedValue(mockResponse());
      await apiClient.get('/api/bookings');

      const [, init] = fetch.mock.calls[0];
      expect(init.method).toBe('GET');
      expect(init.body).toBeUndefined();
      expect(init.headers['Content-Type']).toBeUndefined();
    });

    it('DELETE uses the DELETE method with no body', async () => {
      fetch.mockResolvedValue(mockResponse());
      await apiClient.delete('/api/bookings/abc123');

      const [url, init] = fetch.mock.calls[0];
      expect(url).toBe(`${APP_CONFIG.BACKEND_URL}/api/bookings/abc123`);
      expect(init.method).toBe('DELETE');
      expect(init.body).toBeUndefined();
    });

    it('merges custom headers without mutating the caller object', async () => {
      fetch.mockResolvedValue(mockResponse());
      const headers = { Authorization: 'Bearer x' };
      await apiClient.post('/p', { a: 1 }, { headers });

      const [, init] = fetch.mock.calls[0];
      expect(init.headers).toEqual({
        Authorization: 'Bearer x',
        'Content-Type': 'application/json',
      });
      expect(headers).toEqual({ Authorization: 'Bearer x' });
    });

    it('returns the parsed JSON of a successful response', async () => {
      fetch.mockResolvedValue(mockResponse({ json: { ok: 1 } }));
      await expect(apiClient.get('/x')).resolves.toEqual({ ok: 1 });
    });
  });

  describe('error message extraction', () => {
    it('uses errorData.message when it is a string', async () => {
      fetch.mockResolvedValue(
        mockResponse({ ok: false, status: 400, text: JSON.stringify({ message: 'Horario ocupado' }) }),
      );
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('Horario ocupado'));
    });

    it('JSON-stringifies errorData.message when it is not a string', async () => {
      const message = ['name must be a string', 'email must be an email'];
      fetch.mockResolvedValue(
        mockResponse({ ok: false, status: 400, text: JSON.stringify({ message }) }),
      );
      await expect(apiClient.get('/x')).rejects.toThrow(new Error(JSON.stringify(message)));
    });

    it('falls back to errorData.error when there is no message', async () => {
      fetch.mockResolvedValue(
        mockResponse({ ok: false, status: 404, text: JSON.stringify({ error: 'Not Found' }) }),
      );
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('Not Found'));
    });

    it('prefers message over error when both are present', async () => {
      fetch.mockResolvedValue(
        mockResponse({ ok: false, status: 400, text: JSON.stringify({ message: 'm', error: 'e' }) }),
      );
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('m'));
    });

    it('uses the raw text when the body is not JSON', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: false, status: 502, text: 'Bad gateway' }));
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('Bad gateway'));
    });

    it('falls back to "HTTP error! status: <n>" for an empty body', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: false, status: 500, text: '' }));
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('HTTP error! status: 500'));
    });

    it('falls back to the status message for JSON without message/error', async () => {
      fetch.mockResolvedValue(mockResponse({ ok: false, status: 418, text: '{"foo":1}' }));
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('HTTP error! status: 418'));
    });

    it('falls back to the status message when response.text() fails', async () => {
      const response = mockResponse({ ok: false, status: 503 });
      response.text.mockRejectedValue(new Error('no body'));
      fetch.mockResolvedValue(response);
      await expect(apiClient.get('/x')).rejects.toThrow(new Error('HTTP error! status: 503'));
    });

    it('rethrows network errors unchanged', async () => {
      const networkError = new TypeError('Failed to fetch');
      fetch.mockRejectedValue(networkError);
      await expect(apiClient.get('/x')).rejects.toBe(networkError);
    });
  });

  describe('timeout', () => {
    // fetch double that never resolves but rejects with AbortError when aborted.
    function hangingFetch() {
      fetch.mockImplementation((url, init) =>
        new Promise((resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
      );
    }

    it('aborts after the default 10000 ms and throws the Spanish timeout message', async () => {
      vi.useFakeTimers();
      hangingFetch();
      const promise = apiClient.get('/slow');
      const assertion = expect(promise).rejects.toThrow(new Error(TIMEOUT_MESSAGE));

      await vi.advanceTimersByTimeAsync(9999);
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
      await assertion;
    });

    it('honors a custom timeout option', async () => {
      vi.useFakeTimers();
      hangingFetch();
      const promise = apiClient.post('/api/bookings', { a: 1 }, { timeout: 30000 });
      const assertion = expect(promise).rejects.toThrow(new Error(TIMEOUT_MESSAGE));

      await vi.advanceTimersByTimeAsync(29999);
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
      await assertion;
    });

    it('clears the timer once the response arrives (no late abort)', async () => {
      vi.useFakeTimers();
      fetch.mockResolvedValue(mockResponse());
      await apiClient.get('/fast');
      await vi.advanceTimersByTimeAsync(60000);
      expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('socket.io-client', () => ({ io: vi.fn() }));

import { io } from 'socket.io-client';
import { connectBookingSocket } from './realtimeService.js';

let handlers;
let socket;

beforeEach(() => {
  handlers = {};
  socket = {
    on: vi.fn((event, cb) => { handlers[event] = cb; }),
    disconnect: vi.fn(),
  };
  io.mockReset();
  io.mockReturnValue(socket);
  vi.restoreAllMocks();
});

describe('connectBookingSocket', () => {
  it('connects to the given backend URL', () => {
    connectBookingSocket('http://localhost:3000', {});
    expect(io).toHaveBeenCalledWith('http://localhost:3000');
  });

  it('invokes onNewBooking with the payload of the "newBooking" event', () => {
    const onNewBooking = vi.fn();
    connectBookingSocket('http://x', { onNewBooking });
    const booking = { _id: '1', client: { name: 'Ana' } };

    handlers.newBooking(booking);

    expect(onNewBooking).toHaveBeenCalledWith(booking);
  });

  it('tolerates a missing onNewBooking callback', () => {
    connectBookingSocket('http://x');
    expect(() => handlers.newBooking({ _id: '1' })).not.toThrow();
  });

  it('logs connect_error and forwards it to onError', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    connectBookingSocket('http://x', { onError });
    const err = new Error('boom');

    handlers.connect_error(err);

    expect(spy).toHaveBeenCalledWith('Error de conexión WebSocket:', err);
    expect(onError).toHaveBeenCalledWith(err);
  });

  it('disconnect() disconnects the socket', () => {
    const conn = connectBookingSocket('http://x', {});
    conn.disconnect();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it('does not throw when io() fails and returns a no-op disconnect', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failure = new Error('no socket');
    io.mockImplementation(() => { throw failure; });

    let conn;
    expect(() => { conn = connectBookingSocket('http://x', {}); }).not.toThrow();

    expect(spy).toHaveBeenCalledWith('Error inicializando WebSocket:', failure);
    expect(() => conn.disconnect()).not.toThrow();
  });
});

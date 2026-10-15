import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioService } from './audioService.js';

let created;

function installAudioContext(initialState) {
  created = [];
  class FakeAudioContext {
    constructor() {
      this.state = initialState;
      this.currentTime = 0;
      this.destination = {};
      this.resume = vi.fn(() => {
        this.state = 'running';
        return Promise.resolve();
      });
      this.createOscillator = vi.fn(() => ({
        connect: vi.fn(),
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        start: vi.fn(),
        stop: vi.fn(),
      }));
      this.createGain = vi.fn(() => ({
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      }));
      created.push(this);
    }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
}

beforeEach(() => {
  audioService._reset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('audioService', () => {
  it('init emits "needs-activation" when the context starts suspended', () => {
    installAudioContext('suspended');
    const listener = vi.fn();
    audioService.subscribe(listener);

    audioService.init();

    expect(listener).toHaveBeenCalledWith('needs-activation');
  });

  it('init emits nothing when the context is already running', () => {
    installAudioContext('running');
    const listener = vi.fn();
    audioService.subscribe(listener);

    audioService.init();

    expect(listener).not.toHaveBeenCalled();
  });

  it('init emits "needs-activation" when the AudioContext cannot be created', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    const listener = vi.fn();
    audioService.subscribe(listener);

    audioService.init();

    expect(listener).toHaveBeenCalledWith('needs-activation');
  });

  it('activate resumes a suspended context, emits "activated" and plays the tone', async () => {
    installAudioContext('suspended');
    const listener = vi.fn();
    audioService.subscribe(listener);
    audioService.init();
    listener.mockClear();

    audioService.activate();
    await Promise.resolve();
    await Promise.resolve();

    expect(created[0].resume).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith('activated');
    expect(created[0].createOscillator).toHaveBeenCalled();
  });

  it('activate emits "activated" straight away when the context is not suspended', () => {
    installAudioContext('running');
    const listener = vi.fn();
    audioService.subscribe(listener);

    audioService.activate();

    expect(listener).toHaveBeenCalledWith('activated');
  });

  it('activate emits "needs-activation" when resume() rejects', async () => {
    installAudioContext('suspended');
    audioService.init();
    created[0].resume = vi.fn(() => Promise.reject(new Error('blocked')));
    const listener = vi.fn();
    audioService.subscribe(listener);

    audioService.activate();
    await Promise.resolve();
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith('needs-activation');
  });

  it('play uses the shared context when running', () => {
    installAudioContext('running');
    audioService.init();

    audioService.play();

    expect(created).toHaveLength(1);
    expect(created[0].createOscillator).toHaveBeenCalledTimes(1);
  });

  it('play falls back to a fresh context when there is no running context', () => {
    installAudioContext('suspended');

    audioService.play();

    expect(created).toHaveLength(1);
    expect(created[0].createOscillator).toHaveBeenCalled();
    expect(created[0].resume).toHaveBeenCalled();
  });

  it('play does not throw when no AudioContext exists at all', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(() => audioService.play()).not.toThrow();
    expect(() => audioService.playNotification()).not.toThrow();
  });

  it('playNotification resumes a suspended context then plays', async () => {
    installAudioContext('suspended');

    audioService.playNotification();
    await Promise.resolve();
    await Promise.resolve();

    expect(created[0].resume).toHaveBeenCalled();
    expect(created[0].createOscillator).toHaveBeenCalled();
  });

  it('subscribe returns an unsubscribe function', () => {
    installAudioContext('suspended');
    const listener = vi.fn();
    const unsubscribe = audioService.subscribe(listener);
    unsubscribe();

    audioService.init();

    expect(listener).not.toHaveBeenCalled();
  });
});

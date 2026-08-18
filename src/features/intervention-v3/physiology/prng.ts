// prng.ts — Deterministic pseudo-random number generator (mulberry32).
// Same seed + same call sequence = same numbers. No Math.random anywhere in the engine.

export class PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    // mulberry32
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Random integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Random float in [min, max). */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /** Gaussian-ish noise via sum of two uniforms (triangular distribution, good enough for vitals). */
  noise(amplitude: number): number {
    return (this.next() + this.next() - 1) * amplitude;
  }

  /** Pick one of n options deterministically. */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  fork(salt: number): PRNG {
    return new PRNG((this.state ^ (salt * 0x9e3779b9)) >>> 0);
  }
}

export function seedFromString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

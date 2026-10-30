import { AppError } from './errors';

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerSnapshot {
  serviceKey: string;
  state: CircuitState;
  failureCount: number;
  cooldownUntil: string | null;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private cooldownUntilMs = 0;

  constructor(
    private readonly serviceKey: string,
    private readonly failureThreshold = 5,
    private readonly cooldownMs = 30_000
  ) {}

  public assertCanExecute(nowMs = Date.now()): void {
    if (this.state === 'open') {
      if (nowMs >= this.cooldownUntilMs) {
        this.state = 'half_open';
      } else {
        throw AppError.serviceUnavailable(
          'CIRCUIT_OPEN',
          `Protective circuit breaker for ${this.serviceKey} is open.`
        );
      }
    }
  }

  public recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    this.cooldownUntilMs = 0;
  }

  public recordFailure(nowMs = Date.now()): void {
    this.failures += 1;
    if (this.state === 'half_open' || this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.cooldownUntilMs = nowMs + this.cooldownMs;
    }
  }

  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.assertCanExecute();
    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  public snapshot(): CircuitBreakerSnapshot {
    return {
      serviceKey: this.serviceKey,
      state: this.state,
      failureCount: this.failures,
      cooldownUntil: this.cooldownUntilMs > 0 ? new Date(this.cooldownUntilMs).toISOString() : null,
    };
  }
}

export interface SloStatus {
  serviceName: string;
  availabilityTargetPct: number;
  availabilityObservedPct: number;
  latencyP95Ms: number;
  totalRequests: number;
  failedRequests: number;
  errorBudgetRemainingPct: number;
}

export class SloTracker {
  private readonly latencies: number[] = [];
  private totalRequests = 0;
  private serverErrors = 0;

  constructor(
    private readonly serviceName: string,
    private readonly availabilityTargetPct = 99.9,
    private readonly maxSamples = 500
  ) {}

  public recordRequest(latencyMs: number, statusCode: number): void {
    this.totalRequests += 1;
    if (statusCode >= 500) {
      this.serverErrors += 1;
    }
    this.latencies.push(Math.max(0, Math.round(latencyMs)));
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
  }

  public snapshot(): SloStatus {
    if (this.totalRequests === 0) {
      return {
        serviceName: this.serviceName,
        availabilityTargetPct: this.availabilityTargetPct,
        availabilityObservedPct: 100,
        latencyP95Ms: 8,
        totalRequests: 0,
        failedRequests: 0,
        errorBudgetRemainingPct: 100,
      };
    }

    const observed = ((this.totalRequests - this.serverErrors) / this.totalRequests) * 100;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
    const p95 = sorted[idx] ?? 0;

    const allowedErrorRate = (100 - this.availabilityTargetPct) / 100;
    const currentErrorRate = this.serverErrors / this.totalRequests;
    const budgetRemaining =
      allowedErrorRate <= 0
        ? 100
        : Math.max(0, Math.min(100, (1 - currentErrorRate / allowedErrorRate) * 100));

    return {
      serviceName: this.serviceName,
      availabilityTargetPct: this.availabilityTargetPct,
      availabilityObservedPct: Number(observed.toFixed(3)),
      latencyP95Ms: p95,
      totalRequests: this.totalRequests,
      failedRequests: this.serverErrors,
      errorBudgetRemainingPct: Number(budgetRemaining.toFixed(2)),
    };
  }
}

export class GracefulShutdownCoordinator {
  private shuttingDown = false;
  private readonly hooks: Array<{ name: string; fn: () => Promise<void> }> = [];

  public register(name: string, fn: () => Promise<void>): void {
    this.hooks.push({ name, fn });
  }

  public isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  public async drain(timeoutMs = 10_000): Promise<{ completed: string[]; timedOut: boolean }> {
    if (this.shuttingDown) {
      return { completed: [], timedOut: false };
    }
    this.shuttingDown = true;
    const completed: string[] = [];

    const runAll = (async () => {
      for (const hook of [...this.hooks].reverse()) {
        await hook.fn();
        completed.push(hook.name);
      }
      return false;
    })();

    const timeoutPromise = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(true), timeoutMs);
      timer.unref?.();
    });

    const timedOut = await Promise.race([runAll, timeoutPromise]);
    return { completed, timedOut };
  }
}

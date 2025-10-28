/**
 * Tests for BackgroundTasks
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createBackgroundTasks } from '../../../src/application/BackgroundTasks';

describe('BackgroundTasks', () => {
  let tasks: ReturnType<typeof createBackgroundTasks>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tasks = createBackgroundTasks();
    tasks.resetCounter();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('addTask()', () => {
    test('executes simple synchronous task', async () => {
      let executed = false;

      tasks.addTask(() => {
        executed = true;
      });

      // Wait for task to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(executed).toBe(true);
    });

    test('executes async task', async () => {
      let executed = false;

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executed = true;
      });

      // Wait for task to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(executed).toBe(true);
    });

    test('increments task counter', () => {
      expect(tasks.getTasksExecuted()).toBe(0);

      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(1);

      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(2);
    });

    test('does not block (fire and forget)', () => {
      const startTime = Date.now();

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const duration = Date.now() - startTime;

      // Should not wait for task to complete
      expect(duration).toBeLessThan(50);
    });

    test('handles task errors gracefully', async () => {
      tasks.addTask(() => {
        throw new Error('Task failed');
      });

      // Wait for task to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should log error but not crash
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('failed');
    });

    test('handles async task errors gracefully', async () => {
      tasks.addTask(async () => {
        throw new Error('Async task failed');
      });

      // Wait for task to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should log error but not crash
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('calls onComplete callback when task succeeds', async () => {
      let completed = false;

      tasks.addTask(() => {}, {
        onComplete: () => {
          completed = true;
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(completed).toBe(true);
    });

    test('calls onError callback when task fails', async () => {
      let errorReceived: Error | undefined;

      tasks.addTask(
        () => {
          throw new Error('Task error');
        },
        {
          onError: (error) => {
            errorReceived = error;
          },
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(errorReceived).toBeDefined();
      expect(errorReceived?.message).toBe('Task error');
    });

    test('warns if task takes longer than threshold (>100ms)', async () => {
      tasks.addTask(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 150));
        },
        { name: 'slow-task' },
      );

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('slow-task');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('100ms');
    });

    test('does not warn if task completes quickly', async () => {
      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    test('uses custom task name in logs', async () => {
      tasks.addTask(
        () => {
          throw new Error('Test error');
        },
        { name: 'my-custom-task' },
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('my-custom-task');
    });

    test('generates automatic task name if not provided', async () => {
      tasks.addTask(() => {
        throw new Error('Test error');
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/task-\d+/);
    });

    test('handles timeout for long-running tasks', async () => {
      tasks.addTask(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
        },
        {
          name: 'timeout-task',
          timeout: 50, // 50ms timeout
        },
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should log timeout error
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('timeout-task');
    });

    test('throws error if task is null', () => {
      expect(() => tasks.addTask(null as any)).toThrow('Task function is required');
    });

    test('throws error if task is undefined', () => {
      expect(() => tasks.addTask(undefined as any)).toThrow('Task function is required');
    });

    test('throws error if task is not a function', () => {
      expect(() => tasks.addTask('not a function' as any)).toThrow('Task must be a function');
    });
  });

  describe('getTasksExecuted()', () => {
    test('returns 0 initially', () => {
      expect(tasks.getTasksExecuted()).toBe(0);
    });

    test('increments with each task', () => {
      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(1);

      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(2);

      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(3);
    });
  });

  describe('resetCounter()', () => {
    test('resets task counter to 0', () => {
      tasks.addTask(() => {});
      tasks.addTask(() => {});
      expect(tasks.getTasksExecuted()).toBe(2);

      tasks.resetCounter();

      expect(tasks.getTasksExecuted()).toBe(0);
    });
  });

  describe('Multiple tasks', () => {
    test('executes multiple tasks concurrently', async () => {
      const results: number[] = [];

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(1);
      });

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        results.push(2);
      });

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push(3);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      // All tasks should execute
      expect(results).toHaveLength(3);
      expect(results).toContain(1);
      expect(results).toContain(2);
      expect(results).toContain(3);
    });

    test('one task error does not affect others', async () => {
      let task1Executed = false;
      let task2Executed = false;

      tasks.addTask(() => {
        throw new Error('Task 1 failed');
      });

      tasks.addTask(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        task1Executed = true;
      });

      tasks.addTask(() => {
        task2Executed = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(task1Executed).toBe(true);
      expect(task2Executed).toBe(true);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('handles task that returns a value (value is ignored)', async () => {
      let result: unknown;

      tasks.addTask(() => {
        result = 'some value';
        return 'ignored';
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(result).toBe('some value');
    });

    test('handles Promise rejection', async () => {
      tasks.addTask(async () => {
        return Promise.reject(new Error('Promise rejected'));
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('handles task with very short timeout', async () => {
      tasks.addTask(
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        },
        { timeout: 10, name: 'timeout-test' },
      );

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should have timed out and logged error
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('timeout-test');
    });
  });
});

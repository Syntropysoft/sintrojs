# Background Tasks - Usage Guide

> ⚠️ **CRITICAL:** Background Tasks are in-process and designed ONLY for light I/O operations.

---

## ✅ Correct Usage: Light I/O Operations

Background tasks are perfect for non-blocking I/O operations that don't require waiting for a response:

```typescript
import { SyntroJS } from 'syntrojs';
import { z } from 'zod';

const app = new SyntroJS();

app.post('/send-notification', {
  body: z.object({ email: z.string().email(), message: z.string() }),
  handler: ({ body, background }) => {
    // ✅ CORRECT: Light I/O - sending email
    background.addTask(async () => {
      await emailService.send(body.email, body.message);
    });

    // ✅ CORRECT: Light I/O - logging event
    background.addTask(() => {
      logger.info({ event: 'notification_sent', email: body.email });
    });

    // ✅ CORRECT: Light I/O - cache update
    background.addTask(async () => {
      await cache.set(`notification:${body.email}`, Date.now());
    });

    // Response returns immediately
    return { status: 'queued', email: body.email };
  },
});
```

**Characteristics of light I/O operations:**
- Sending emails
- Writing to logs
- Updating cache
- Making API calls
- Database writes (simple inserts/updates)
- Analytics tracking

---

## ❌ Incorrect Usage: CPU-Bound Operations

**NEVER use background tasks for CPU-intensive operations:**

```typescript
// ❌ WRONG: Video processing (CPU-bound, blocks Event Loop)
background.addTask(() => {
  processVideo(file); // DON'T DO THIS!
});

// ❌ WRONG: PDF generation (CPU-bound)
background.addTask(() => {
  generatePDF(data); // DON'T DO THIS!
});

// ❌ WRONG: Image manipulation (CPU-bound)
background.addTask(() => {
  resizeImage(image); // DON'T DO THIS!
});

// ❌ WRONG: Data processing (CPU-bound)
background.addTask(() => {
  processLargeDataset(data); // DON'T DO THIS!
});
```

**Why?** Node.js is single-threaded. CPU-bound operations block the Event Loop, making your entire server unresponsive.

---

## ✅ Correct Alternative: BullMQ for Heavy Operations

For CPU-bound or long-running tasks, use an external job queue:

### Setup BullMQ + Redis

```bash
npm install bullmq ioredis
```

### Create Worker (worker.ts)

```typescript
import { Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis({
  host: 'localhost',
  port: 6379,
});

// Worker runs in a SEPARATE PROCESS
const worker = new Worker(
  'video-processing',
  async (job) => {
    // CPU-bound work runs here, doesn't block API
    await processVideo(job.data.url);
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});
```

### Use in API (api.ts)

```typescript
import { SyntroJS } from 'syntrojs';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';

const connection = new Redis({ host: 'localhost', port: 6379 });
const videoQueue = new Queue('video-processing', { connection });

const app = new SyntroJS();

app.post('/process-video', {
  body: z.object({ url: z.string().url() }),
  handler: async ({ body, background }) => {
    // ✅ CORRECT: Delegate to external queue
    background.addTask(async () => {
      await videoQueue.add('process', { url: body.url });
    });

    return {
      status: 'queued',
      message: 'Video processing started',
    };
  },
});
```

**Benefits:**
- ✅ API stays responsive (no Event Loop blocking)
- ✅ Automatic retries on failure
- ✅ Job monitoring and progress tracking
- ✅ Horizontal scaling (multiple workers)
- ✅ Job persistence (survives crashes)

---

## 📊 Performance Warning System

SyntroJS automatically warns if a background task takes >100ms:

```typescript
app.post('/example', {
  handler: ({ background }) => {
    background.addTask(
      async () => {
        await someSlowOperation(); // Takes 150ms
      },
      { name: 'slow-task' }
    );

    return { ok: true };
  },
});

// Console output:
// ⚠️ Background task 'slow-task' took 150ms (>100ms threshold).
// Consider using a job queue (BullMQ) for heavy operations.
```

**This is a signal to:**
1. Review the task - Is it CPU-bound?
2. Move to BullMQ if needed
3. Optimize the operation

---

## 🎯 Decision Tree: Background Tasks vs BullMQ

```
Is the operation CPU-bound (video, PDF, computation)?
├─ YES → Use BullMQ + Redis (external worker)
└─ NO → Continue...

Does the operation take >100ms?
├─ YES → Use BullMQ + Redis (better reliability)
└─ NO → Continue...

Does the operation need retries or monitoring?
├─ YES → Use BullMQ + Redis
└─ NO → Use Background Tasks ✅
```

---

## 📚 Advanced Features

### Task with Timeout

```typescript
background.addTask(
  async () => {
    await somePotentiallySlowOperation();
  },
  {
    name: 'risky-task',
    timeout: 5000, // 5 seconds max
  }
);
```

### Task with Callbacks

```typescript
background.addTask(
  async () => {
    await sendEmail(email);
  },
  {
    name: 'email-task',
    onComplete: () => {
      logger.info('Email sent successfully');
    },
    onError: (error) => {
      logger.error('Email failed:', error);
    },
  }
);
```

---

## 🛡️ Best Practices

### ✅ DO:
- Use for light I/O operations (< 100ms)
- Use for operations that can fail gracefully
- Use for "fire and forget" operations
- Monitor warnings and move slow tasks to BullMQ

### ❌ DON'T:
- Use for CPU-bound operations
- Use for operations requiring guaranteed execution
- Use for operations needing retries
- Ignore performance warnings

---

## 🔗 Integration with BullMQ

Complete example with BullMQ integration:

```typescript
// api.ts
import { SyntroJS, inject } from 'syntrojs';
import { Queue } from 'bullmq';
import { z } from 'zod';

// Setup queue (singleton)
const getQueue = () => {
  return new Queue('heavy-tasks', {
    connection: { host: 'localhost', port: 6379 },
  });
};

const app = new SyntroJS();

app.post('/heavy-operation', {
  body: z.object({ data: z.string() }),
  dependencies: {
    queue: inject(getQueue, { scope: 'singleton' }),
  },
  handler: async ({ body, dependencies, background }) => {
    // ✅ Enqueue to BullMQ (light I/O)
    background.addTask(async () => {
      await dependencies.queue.add('process', { data: body.data });
    });

    return { status: 'queued' };
  },
});

app.listen(3000);
```

```typescript
// worker.ts (separate process)
import { Worker } from 'bullmq';

const worker = new Worker(
  'heavy-tasks',
  async (job) => {
    // Heavy CPU work happens here
    await processHeavyData(job.data.data);
  },
  {
    connection: { host: 'localhost', port: 6379 },
    concurrency: 5, // Process 5 jobs concurrently
  }
);
```

**Run:**
```bash
# Terminal 1: API
node api.js

# Terminal 2: Worker
node worker.js
```

---

## 📖 Related Documentation

- [Dependency Injection](./DEPENDENCY_INJECTION.md)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [ROADMAP - Background Tasks](../ROADMAP.md#background-tasks)

---

**Remember: Tiny in code, Mighty in impact. Use the right tool for the job.** 🚀


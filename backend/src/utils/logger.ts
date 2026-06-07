const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
const threshold = LEVELS[envLevel] ?? LEVELS.info;

function write(level: Level, msg: string, meta?: Record<string, unknown>): void {
  if (LEVELS[level] < threshold) return;
  const entry: Record<string, unknown> = { ts: new Date().toISOString(), level, msg, ...meta };
  const line = JSON.stringify(entry) + '\n';
  if (level === 'error' || level === 'warn') process.stderr.write(line);
  else process.stdout.write(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => write('debug', msg, meta),
  info:  (msg: string, meta?: Record<string, unknown>) => write('info',  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => write('warn',  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
};

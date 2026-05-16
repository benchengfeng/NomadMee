import WebSocket from 'ws';
import { AisShipPosition, AisStreamCargoSnapshotModel } from '../models/AisStreamCargoSnapshot';

const AIS_SOCKET_URL = 'wss://stream.aisstream.io/v0/stream';
const AIS_CRON_INTERVAL_MS = Number(process.env.AIS_CRON_INTERVAL_MS || 1000 * 60 * 60 * 6);
const AIS_SNAPSHOT_WINDOW_MS = Number(process.env.AIS_SNAPSHOT_WINDOW_MS || 1000 * 60 * 2);
const AIS_VERBOSE_LOGGING = process.env.AIS_VERBOSE_LOGGING !== 'false';

let scheduledTimer: NodeJS.Timeout | null = null;
let jobInFlight = false;
let activeSnapshotStartedAt: Date | null = null;
let activeSnapshotWindowEndsAt: Date | null = null;
let activeSnapshotSequence = 0;

function log(message: string, data?: Record<string, unknown>): void {
  if (AIS_VERBOSE_LOGGING) {
    console.log(`[AIS-SNAPSHOT] ${message}${data ? ` ${JSON.stringify(data)}` : ''}`);
  }
}

function getTrackingConfig(): { apiKey: string; mmsiList: string[] } {
  const apiKey = (process.env.AISSTREAM_API_KEY || '').trim();
  const mmsiList = (process.env.AISSTREAM_MMSI || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => /^\d+$/.test(value));

  return { apiKey, mmsiList };
}

function readNumericField(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function extractShipPositions(payload: unknown): AisShipPosition[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const root = payload as {
    Message?: {
      PositionReport?: Record<string, unknown>;
      StandardClassBPositionReport?: Record<string, unknown>;
      ExtendedClassBPositionReport?: Record<string, unknown>;
    };
  };

  const candidates = [
    root.Message?.PositionReport,
    root.Message?.StandardClassBPositionReport,
    root.Message?.ExtendedClassBPositionReport,
  ];

  const positions: AisShipPosition[] = [];

  for (const report of candidates) {
    if (!report) {
      continue;
    }

    const lat = readNumericField(report.Latitude ?? report.latitude);
    const lng = readNumericField(report.Longitude ?? report.longitude);
    const mmsi = readNumericField(report.UserID ?? report.MMSI ?? report.mmsi);

    if (lat === null || lng === null || mmsi === null) {
      continue;
    }

    positions.push({
      mmsi,
      lat,
      lng,
      lastSeen: new Date().toISOString(),
      sogKnots: readNumericField(report.Sog ?? report.sog),
      cogDegrees: readNumericField(report.Cog ?? report.cog),
    });
  }

  return positions;
}

function upsertShipIntoMap(shipMap: Map<string, AisShipPosition>, ship: AisShipPosition): void {
  shipMap.set(String(ship.mmsi), ship);
}

async function persistShipDocuments(
  ships: AisShipPosition[],
  mmsiList: string[],
  status: string,
  rawMessage: unknown
): Promise<void> {
  if (!activeSnapshotStartedAt || !activeSnapshotWindowEndsAt || ships.length === 0) {
    return;
  }

  activeSnapshotSequence += 1;
  const snapshotKey = `${activeSnapshotStartedAt.toISOString()}-${activeSnapshotSequence}`;

  await AisStreamCargoSnapshotModel.insertMany(
    ships.map((ship) => ({
      snapshotKey: `${snapshotKey}-${ship.mmsi}`,
      mmsi: ship.mmsi,
      lat: ship.lat,
      lng: ship.lng,
      lastSeen: ship.lastSeen,
      sogKnots: ship.sogKnots,
      cogDegrees: ship.cogDegrees,
      rawMessage,
      collectedAt: new Date(),
      expiresAt: activeSnapshotWindowEndsAt as Date,
      sourceWindowStartedAt: activeSnapshotStartedAt as Date,
      sourceWindowEndedAt: new Date(),
      trackedMmsiList: mmsiList,
      status,
    })),
    { ordered: false }
  );
}

async function runSnapshotJob(): Promise<void> {
  if (jobInFlight) {
    log('Snapshot job skipped because another run is still in progress.');
    return;
  }

  jobInFlight = true;
  const startedAt = new Date();
  activeSnapshotStartedAt = startedAt;
  activeSnapshotWindowEndsAt = new Date(Date.now() + AIS_CRON_INTERVAL_MS);
  activeSnapshotSequence = 0;
  const { apiKey, mmsiList } = getTrackingConfig();
  const shipMap = new Map<string, AisShipPosition>();

  log('Starting AIS snapshot collection run.', {
    startedAt: startedAt.toISOString(),
    windowMs: AIS_SNAPSHOT_WINDOW_MS,
    cronIntervalMs: AIS_CRON_INTERVAL_MS,
    trackedMmsiCount: mmsiList.length,
  });

  try {
    if (!apiKey) {
      throw new Error('AISSTREAM_API_KEY is required.');
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(AIS_SOCKET_URL);
      let finished = false;
      let windowTimer: NodeJS.Timeout | null = null;

      const finalize = async (reason: string, error?: unknown): Promise<void> => {
        if (finished) {
          return;
        }

        finished = true;

        if (windowTimer) {
          clearTimeout(windowTimer);
        }

        try {
          if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close();
          }
        } catch {
          socket.terminate();
        }

        log('AIS snapshot saved to MongoDB.', {
          reason,
          shipCount: shipMap.size,
          shipMapSize: shipMap.size,
          error: error instanceof Error ? error.message : undefined,
        });

        resolve();
      };

      socket.on('open', () => {
        log('AIS snapshot websocket opened. Sending subscription payload.', {
          apiKeyLength: apiKey.length,
          note: 'Collecting all ship position messages without MMSI filtering.',
        });

        const subscribeMessage = {
          APIKey: apiKey,
          BoundingBoxes: [[[-90, -180], [90, 180]]],
          FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ExtendedClassBPositionReport'],
        };

        console.log('[AIS][SNAPSHOT_SUBSCRIBE_PAYLOAD]', JSON.stringify(subscribeMessage, null, 2));

        socket.send(JSON.stringify(subscribeMessage), (error) => {
          if (error) {
            log('Failed to send AIS snapshot subscription payload.', {
              error: error instanceof Error ? error.message : String(error),
            });
            reject(error);
            return;
          }

          log('AIS snapshot subscription payload sent successfully.');
        });

        windowTimer = setTimeout(() => {
          log('AIS snapshot collection window elapsed. Closing websocket and persisting data.', {
            collectedShips: shipMap.size,
          });
          void finalize('window_complete');
        }, AIS_SNAPSHOT_WINDOW_MS);
      });

      socket.on('message', (rawData) => {
        const rawText = rawData.toString();
        console.log('[AIS][SNAPSHOT_RAW_MESSAGE]', rawText);

        try {
          const payload = JSON.parse(rawText) as unknown;
          const ships = extractShipPositions(payload);

          for (const ship of ships) {
            upsertShipIntoMap(shipMap, ship);
          }

          if (ships.length > 0) {
            void persistShipDocuments(ships, mmsiList, 'incremental_update', payload);
          }
        } catch (error) {
          log('Failed to parse AIS snapshot payload.', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      socket.on('error', (error) => {
        log('AIS snapshot websocket error.', {
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      });

      socket.on('close', () => {
        void finalize('socket_closed');
      });
    });
  } catch (error) {
    log('AIS snapshot job failed.', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    jobInFlight = false;
    activeSnapshotStartedAt = null;
    activeSnapshotWindowEndsAt = null;
    activeSnapshotSequence = 0;
  }
}

export function startAisStreamSnapshotJob(): void {
  if (scheduledTimer) {
    return;
  }

  void runSnapshotJob();

  scheduledTimer = setInterval(() => {
    void runSnapshotJob();
  }, AIS_CRON_INTERVAL_MS);

  log('AIS snapshot scheduler started.', {
    cronIntervalMs: AIS_CRON_INTERVAL_MS,
    windowMs: AIS_SNAPSHOT_WINDOW_MS,
  });
}

export async function getLatestTrackedShips(trackedMmsiList: string[]) {
  const mmsiNumbers = trackedMmsiList
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const query = mmsiNumbers.length > 0 ? { mmsi: { $in: mmsiNumbers } } : {};
  const documents = await AisStreamCargoSnapshotModel.find(query).sort({ collectedAt: -1, createdAt: -1 }).lean();
  const latestByMmsi = new Map<number, typeof documents[number]>();

  for (const document of documents) {
    if (!latestByMmsi.has(document.mmsi)) {
      latestByMmsi.set(document.mmsi, document);
    }
  }

  return Array.from(latestByMmsi.values());
}

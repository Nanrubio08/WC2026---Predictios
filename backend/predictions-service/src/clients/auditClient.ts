import axios from 'axios';

const MATCHES_URL     = process.env.MATCHES_SERVICE_URL ?? 'http://localhost:3002';
const INTERNAL_TOKEN  = process.env.INTERNAL_SERVICE_TOKEN ?? '';

export interface AuditPayload {
  adminUserId:   string;
  service:       string;
  action:        string;
  matchId?:      number;
  previousHome?: number | null;
  previousAway?: number | null;
  newHome?:      number | null;
  newAway?:      number | null;
  detail?:       Record<string, unknown>;
}

export async function writeAuditLog(payload: AuditPayload): Promise<void> {
  try {
    await axios.post(
      `${MATCHES_URL}/internal/audit`,
      payload,
      { headers: { 'x-internal-token': INTERNAL_TOKEN }, timeout: 5000 },
    );
  } catch (err) {
    // Audit failures must never break the primary operation
    console.error('[auditClient] Failed to write audit log:', err);
  }
}

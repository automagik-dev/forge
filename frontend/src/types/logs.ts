import type { ExecutorAction } from 'shared/types';

export interface ProcessStartPayload {
  processId: string;
  runReason: string;
  startedAt: string;
  status: string;
  action?: ExecutorAction;
}

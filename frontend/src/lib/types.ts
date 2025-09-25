import { ExecutionProcess, NormalizedEntry } from 'shared/types';
import type { ProcessStartPayload } from '@/types/logs';

export type AttemptData = {
  processes: ExecutionProcess[];
  runningProcessDetails: Record<string, ExecutionProcess>;
};

export interface ConversationEntryDisplayType {
  entry: NormalizedEntry | ProcessStartPayload;
  processId: string;
  processPrompt?: string;
  processStatus: string;
  processIsRunning: boolean;
  process: ExecutionProcess;
  isFirstInProcess: boolean;
  processIndex: number;
  entryIndex: number;
}

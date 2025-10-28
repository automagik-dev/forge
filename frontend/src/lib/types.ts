import { ExecutionProcess, NormalizedEntry } from 'shared/types';

export type AttemptData = {
  processes: ExecutionProcess[];
  runningProcessDetails: Record<string, ExecutionProcess>;
};

export interface ConversationEntryDisplayType {
  entry: NormalizedEntry;
  processId: string;
  processPrompt?: string;
  processStatus: string;
  processIsRunning: boolean;
  process: ExecutionProcess;
  isFirstInProcess: boolean;
  processIndex: number;
  entryIndex: number;
}

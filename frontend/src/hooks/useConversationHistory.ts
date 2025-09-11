// useConversationHistory.ts
import {
  CommandExitStatus,
  ExecutionProcess,
  NormalizedEntry,
  PatchType,
  TaskAttempt,
} from 'shared/types';
import { useExecutionProcesses } from './useExecutionProcesses';
import { useEffect, useMemo, useRef } from 'react';
import { streamSseJsonPatchEntries } from '@/utils/streamSseJsonPatchEntries';

export type PatchTypeWithKey = PatchType & { patchKey: string };

export type AddEntryType = 'initial' | 'running' | 'historic';

export type OnEntriesUpdated = (
  newEntries: PatchTypeWithKey[],
  addType: AddEntryType,
  loading: boolean
) => void;

type ExecutionProcessState = {
  executionProcess: ExecutionProcess;
  entries: PatchTypeWithKey[];
};

type ExecutionProcessStateStore = Record<string, ExecutionProcessState>;

interface UseConversationHistoryParams {
  attempt: TaskAttempt;
  onEntriesUpdated: OnEntriesUpdated;
}

interface UseConversationHistoryResult {}

const MIN_INITIAL_ENTRIES = 10;
const REMAINING_BATCH_SIZE = 50;

export const useConversationHistory = ({
  attempt,
  onEntriesUpdated,
}: UseConversationHistoryParams): UseConversationHistoryResult => {
  const { executionProcesses } = useExecutionProcesses(attempt.id);
  const displayedExecutionProcesses = useRef<ExecutionProcessStateStore>({});
  const loadedInitialEntries = useRef(false);
  const lastRunningProcessId = useRef<string | null>(null);

  // ✅ must provide an initial value; type as nullable
  const onEntriesUpdatedRef = useRef<OnEntriesUpdated | null>(null);
  useEffect(() => {
    onEntriesUpdatedRef.current = onEntriesUpdated;
  }, [onEntriesUpdated]);

  const loadEntriesForHistoricExecutionProcess = (
    executionProcess: ExecutionProcess
  ) => {
    let url = '';
    if (executionProcess.executor_action.typ.type === 'ScriptRequest') {
      url = `/api/execution-processes/${executionProcess.id}/raw-logs`;
    } else {
      url = `/api/execution-processes/${executionProcess.id}/normalized-logs`;
    }

    return new Promise<PatchType[]>((resolve) => {
      const controller = streamSseJsonPatchEntries<PatchType>(url, {
        onFinished: (allEntries) => {
          controller.close();
          resolve(allEntries);
        },
        onError: (err) => {
          console.warn!(
            `Error loading entries for historic execution process ${executionProcess.id}`,
            err
          );
          controller.close();
          resolve([]);
        },
      });
    });
  };

  // This emits its own events as they are streamed
  const loadRunningAndEmit = (
    executionProcess: ExecutionProcess
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let url = '';
      if (executionProcess.executor_action.typ.type === 'ScriptRequest') {
        url = `/api/execution-processes/${executionProcess.id}/raw-logs`;
      } else {
        url = `/api/execution-processes/${executionProcess.id}/normalized-logs`;
      }
      const controller = streamSseJsonPatchEntries<PatchType>(url, {
        onEntries(entries) {
          const patchesWithKey = entries.map((entry, index) =>
            patchWithKey(entry, executionProcess.id, index)
          );
          const localEntries = displayedExecutionProcesses.current;
          localEntries[executionProcess.id] = {
            executionProcess,
            entries: patchesWithKey,
          };
          displayedExecutionProcesses.current = localEntries;
          emitEntries(localEntries, 'running');
        },
        onFinished: () => {
          controller.close();
          resolve();
        },
        onError: () => {
          controller.close();
          reject();
        },
      });
    });
  };

  // Sometimes it can take a few seconds for the stream to start, wrap the loadRunningAndEmit method
  const loadRunningAndEmitWithBackoff = async (
    executionProcess: ExecutionProcess
  ) => {
    for (let i = 0; i < 20; i++) {
      try {
        await loadRunningAndEmit(executionProcess);
        break;
      } catch (_) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  const getRunningExecutionProcesses = (): ExecutionProcess | null => {
    // If more than one, throw an error
    const runningProcesses = executionProcesses.filter(
      (p) => p.status === 'running'
    );
    if (runningProcesses.length > 1) {
      throw new Error('More than one running execution process found');
    }
    return runningProcesses[0] || null;
  };

  const flattenEntries = (
    executionProcessState: ExecutionProcessStateStore
  ): PatchTypeWithKey[] => {
    return Object.values(executionProcessState)
      .sort(
        (a, b) =>
          new Date(
            a.executionProcess.created_at as unknown as string
          ).getTime() -
          new Date(b.executionProcess.created_at as unknown as string).getTime()
      )
      .flatMap((p) => p.entries);
  };

  const flattenEntriesForEmit = (
    executionProcessState: ExecutionProcessStateStore
  ): PatchTypeWithKey[] => {
    // Create user messages + tool calls for setup/cleanup scripts
    return Object.values(executionProcessState)
      .sort(
        (a, b) =>
          new Date(
            a.executionProcess.created_at as unknown as string
          ).getTime() -
          new Date(b.executionProcess.created_at as unknown as string).getTime()
      )
      .flatMap((p) => {
        const entries: PatchTypeWithKey[] = [];
        if (
          p.executionProcess.executor_action.typ.type ===
            'CodingAgentInitialRequest' ||
          p.executionProcess.executor_action.typ.type ===
            'CodingAgentFollowUpRequest'
        ) {
          // entries.push(p.executionProcess.executor_action.typ.prompt)
          const userNormalizedEntry: NormalizedEntry = {
            entry_type: {
              type: 'user_message',
            },
            content: p.executionProcess.executor_action.typ.prompt,
            timestamp: null,
          };
          const userPatch: PatchType = {
            type: 'NORMALIZED_ENTRY',
            content: userNormalizedEntry,
          };
          const userPatchTypeWithKey = patchWithKey(
            userPatch,
            p.executionProcess.id,
            'user'
          );
          entries.push(userPatchTypeWithKey);

          // Remove all coding agent added user messages, replace with our custom one
          const entriesExcludingUser = p.entries.filter(
            (e) =>
              e.type !== 'NORMALIZED_ENTRY' ||
              e.content.entry_type.type !== 'user_message'
          );
          entries.push(...entriesExcludingUser);
        } else if (
          p.executionProcess.executor_action.typ.type === 'ScriptRequest'
        ) {
          let toolName = '';
          switch (p.executionProcess.executor_action.typ.context) {
            case 'SetupScript':
              toolName = 'Setup Script';
              break;
            case 'CleanupScript':
              toolName = 'Cleanup Script';
              break;
            default:
              return [];
          }

          const exit_status: CommandExitStatus = {
            type: 'exit_code',
            code: Number(p.executionProcess.exit_code) || 0,
          };
          const output = p.entries.map((line) => line.content).join('\n');

          const toolNormalizedEntry: NormalizedEntry = {
            entry_type: {
              type: 'tool_use',
              tool_name: toolName,
              action_type: {
                action: 'command_run',
                command: p.executionProcess.executor_action.typ.script,
                result: {
                  output,
                  exit_status,
                },
              },
            },
            content: toolName,
            timestamp: null,
          };
          const toolPatch: PatchType = {
            type: 'NORMALIZED_ENTRY',
            content: toolNormalizedEntry,
          };
          const toolPatchWithKey: PatchTypeWithKey = patchWithKey(
            toolPatch,
            p.executionProcess.id,
            0
          );

          entries.push(toolPatchWithKey);
        }

        return entries;
      });
  };

  const patchWithKey = (
    patch: PatchType,
    executionProcessId: string,
    index: number | 'user'
  ) => {
    return { ...patch, patchKey: `${executionProcessId}:${index}` };
  };

  const loadInitialEntries = async (): Promise<ExecutionProcessStateStore> => {
    const localDisplayedExecutionProcesses: ExecutionProcessStateStore = {};
    for (const executionProcess of executionProcesses.reverse()) {
      // Skip if execution process is in progress
      if (executionProcess.status === 'running') continue;
      const entries =
        await loadEntriesForHistoricExecutionProcess(executionProcess);
      // add a stable key per entry (example: combine process id + index)
      const entriesWithKey = entries.map((e, idx) =>
        patchWithKey(e, executionProcess.id, idx)
      );
      localDisplayedExecutionProcesses[executionProcess.id] = {
        executionProcess,
        entries: entriesWithKey,
      };
      // Initial load should show
      if (
        flattenEntries(localDisplayedExecutionProcesses).length >
        MIN_INITIAL_ENTRIES
      ) {
        break;
      }
    }
    return localDisplayedExecutionProcesses;
  };

  const loadRemainingEntriesInBatches = async (
    batchSize: number
  ): Promise<ExecutionProcessStateStore | null> => {
    const localDisplayedExecutionProcesses: ExecutionProcessStateStore =
      displayedExecutionProcesses.current;
    let anyUpdated = false;
    for (const executionProcess of executionProcesses.reverse()) {
      // Skip if already loaded or running
      if (
        localDisplayedExecutionProcesses[executionProcess.id] ||
        executionProcess.status === 'running'
      )
        continue;
      const entries =
        await loadEntriesForHistoricExecutionProcess(executionProcess);
      // add a stable key per entry (example: combine process id + index)
      const entriesWithKey = entries.map((e, idx) =>
        patchWithKey(e, executionProcess.id, idx)
      );
      localDisplayedExecutionProcesses[executionProcess.id] = {
        executionProcess,
        entries: entriesWithKey,
      };
      if (flattenEntries(localDisplayedExecutionProcesses).length > batchSize) {
        break;
      }
      anyUpdated = true;
    }
    return anyUpdated ? localDisplayedExecutionProcesses : null;
  };

  const emitEntries = (
    executionProcessState: ExecutionProcessStateStore,
    addEntryType: AddEntryType
  ) => {
    // Flatten entries in chronological order of process start
    const entries = flattenEntriesForEmit(executionProcessState);
    onEntriesUpdatedRef.current?.(entries, addEntryType, false);
  };

  // Stable key for dependency arrays when process list changes
  const idListKey = useMemo(
    () => executionProcesses.map((p) => p.id).join(','),
    [executionProcesses]
  );

  // Initial load when attempt changes
  useEffect(() => {
    (async () => {
      // Waiting for execution processes to load
      if (executionProcesses.length === 0 || loadedInitialEntries.current)
        return;

      // Initial entries
      const allInitialEntries = await loadInitialEntries();
      displayedExecutionProcesses.current = allInitialEntries;
      emitEntries(allInitialEntries, 'initial');
      loadedInitialEntries.current = true;

      // Then load the remaining in batches
      let updatedEntries;
      while (
        (updatedEntries =
          await loadRemainingEntriesInBatches(REMAINING_BATCH_SIZE))
      ) {
        displayedExecutionProcesses.current = updatedEntries;
        emitEntries(updatedEntries, 'historic');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    })();
  }, [attempt.id, idListKey]); // include idListKey so new processes trigger reload

  useEffect(() => {
    const runningProcess = getRunningExecutionProcesses();
    if (runningProcess && lastRunningProcessId.current !== runningProcess.id) {
      lastRunningProcessId.current = runningProcess.id;
      loadRunningAndEmitWithBackoff(runningProcess);
    }
  }, [attempt.id, idListKey]);

  // Reset state when attempt changes
  useEffect(() => {
    displayedExecutionProcesses.current = {};
    loadedInitialEntries.current = false;
    lastRunningProcessId.current = null;
    // setLoading(true);
  }, [attempt.id]);

  // Reset loadedInitialEntries when attempt changes
  useEffect(() => {
    loadedInitialEntries.current = false;
  }, [attempt.id]);

  return {};
};

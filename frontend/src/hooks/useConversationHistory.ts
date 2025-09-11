// useConversationHistory.ts
import { ExecutionProcess, PatchType, TaskAttempt } from "shared/types";
import { useExecutionProcesses } from "./useExecutionProcesses";
import { useEffect, useMemo, useRef } from "react";
import { streamSseJsonPatchEntries } from "@/utils/streamSseJsonPatchEntries";

export type PatchTypeWithKey = PatchType & { patchKey: string };

export type AddEntryType = "initial" | "livestream" | "historic";

export type OnEntriesUpdated = (newEntries: PatchTypeWithKey[], addType: AddEntryType) => void;

type ExecutionProcessState = {
    executionProcess: ExecutionProcess;
    entries: PatchTypeWithKey[];
};

type ExecutionProcessStateStore = Record<string, ExecutionProcessState>;


interface UseConversationHistoryParams {
    attempt: TaskAttempt;
    onEntriesUpdated: OnEntriesUpdated;
}

interface UseConversationHistoryResult {
    // expose anything you actually need; placeholder here
}

const MIN_INITIAL_ENTRIES = 10;
const REMAINING_BATCH_SIZE = 50;

export const useConversationHistory = ({
    attempt,
    onEntriesUpdated,
}: UseConversationHistoryParams): UseConversationHistoryResult => {
    const { executionProcesses } = useExecutionProcesses(attempt.id);
    const displayedExecutionProcesses = useRef<ExecutionProcessStateStore>({});
    const loadedInitialEntries = useRef(false);

    // ✅ must provide an initial value; type as nullable
    const onEntriesUpdatedRef = useRef<OnEntriesUpdated | null>(null);
    useEffect(() => {
        onEntriesUpdatedRef.current = onEntriesUpdated;
    }, [onEntriesUpdated]);

    const loadEntriesForHistoricExecutionProcess = (executionProcess: ExecutionProcess) => {
        return new Promise<PatchType[]>((resolve, reject) => {
            const controller = streamSseJsonPatchEntries<PatchType>(
                `/api/execution-processes/${executionProcess.id}/normalized-logs`,
                {
                    onFinished: (allEntries) => resolve(allEntries),
                    onError: (err) => reject(err),
                }
            );
            // optional: controller.close() if your util exposes one after finish
        });
    };

    const flattenEntries = (executionProcessState: ExecutionProcessStateStore) => {
        return Object.values(executionProcessState)
            .sort(
                (a, b) =>
                    new Date(a.executionProcess.created_at as unknown as string).getTime() -
                    new Date(b.executionProcess.created_at as unknown as string).getTime()
            )
            .flatMap(p => p.entries);
    };

    const patchWithKey = (patch: PatchType, executionProcessId: string, index: number) => {
        return { ...patch, patchKey: `${executionProcessId}:${index}` };
    };

    const loadInitialEntries = async (): Promise<ExecutionProcessStateStore> => {
        const localDisplayedExecutionProcesses: ExecutionProcessStateStore = {};
        for (const executionProcess of executionProcesses.reverse()) {
            const entries = await loadEntriesForHistoricExecutionProcess(executionProcess);
            // add a stable key per entry (example: combine process id + index)
            const entriesWithKey = entries.map((e, idx) => patchWithKey(e, executionProcess.id, idx));
            localDisplayedExecutionProcesses[executionProcess.id] = { executionProcess, entries: entriesWithKey };
            // Initial load should show 
            if (flattenEntries(localDisplayedExecutionProcesses).length > MIN_INITIAL_ENTRIES) {
                break;
            }
        }
        return localDisplayedExecutionProcesses;
    };

    const loadRemainingEntriesInBatches = async (batchSize: number): Promise<ExecutionProcessStateStore | null> => {
        const localDisplayedExecutionProcesses: ExecutionProcessStateStore = displayedExecutionProcesses.current;
        let anyUpdated = false;
        for (const executionProcess of executionProcesses.reverse()) {
            // Skip if already loaded
            if (localDisplayedExecutionProcesses[executionProcess.id]) continue;
            const entries = await loadEntriesForHistoricExecutionProcess(executionProcess);
            // add a stable key per entry (example: combine process id + index)
            const entriesWithKey = entries.map((e, idx) => patchWithKey(e, executionProcess.id, idx));
            localDisplayedExecutionProcesses[executionProcess.id] = { executionProcess, entries: entriesWithKey };
            if (flattenEntries(localDisplayedExecutionProcesses).length > batchSize) {
                break;
            }
            anyUpdated = true;
        }
        return anyUpdated ? localDisplayedExecutionProcesses : null;
    };

    const emitEntries = (executionProcessState: ExecutionProcessStateStore, addEntryType: AddEntryType) => {
        // Flatten entries in chronological order of process start
        const entries = flattenEntries(executionProcessState);
        onEntriesUpdatedRef.current?.(entries, addEntryType);
    };

    // Stable key for dependency arrays when process list changes
    const idListKey = useMemo(
        () => executionProcesses.map((p) => p.id).join(","),
        [executionProcesses]
    );

    // Initial load when attempt changes
    useEffect(() => {
        (async () => {
            // Waiting for execution processes to load
            if (executionProcesses.length === 0 || loadedInitialEntries.current) return;

            // Initial entries
            const allInitialEntries = await loadInitialEntries();
            displayedExecutionProcesses.current = allInitialEntries;
            emitEntries(allInitialEntries, "initial");
            loadedInitialEntries.current = true;

            // Then load the remaining in batches
            while (true) {
                const updatedEntries = await loadRemainingEntriesInBatches(REMAINING_BATCH_SIZE);
                if (!updatedEntries) break;
                displayedExecutionProcesses.current = updatedEntries;
                emitEntries(updatedEntries, "historic");
                // Wait 1000ms
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        })();
    }, [attempt.id, idListKey]); // include idListKey so new processes trigger reload

    // Reset loadedInitialEntries when attempt changes
    useEffect(() => {
        loadedInitialEntries.current = false;
    }, [attempt.id]);

    return {};
};

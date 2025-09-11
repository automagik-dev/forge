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

const MIN_INITIAL_ENTRIES = 5;

export const useConversationHistory = ({
    attempt,
    onEntriesUpdated,
}: UseConversationHistoryParams): UseConversationHistoryResult => {
    const { executionProcesses } = useExecutionProcesses(attempt.id);
    const displayedExecutionProcesses = useRef<ExecutionProcessStateStore>({});
    const loadedInitialEntries = useRef(false);

    // ✅ must provide an initial value; type as nullable
    const onEntriesAddedRef = useRef<OnEntriesUpdated | null>(null);
    useEffect(() => {
        onEntriesAddedRef.current = onEntriesUpdated;
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
        return Object.values(executionProcessState).flatMap(p => p.entries);
    };

    const loadInitialEntries = async (): Promise<ExecutionProcessStateStore> => {
        const localDisplayedExecutionProcesses: ExecutionProcessStateStore = {};
        for (const executionProcess of executionProcesses.reverse()) {
            const entries = await loadEntriesForHistoricExecutionProcess(executionProcess);
            // add a stable key per entry (example: combine process id + index)
            const entriesWithKey = entries.map((e, idx) => ({ ...e, patchKey: `${executionProcess.id}:${idx}` }));
            localDisplayedExecutionProcesses[executionProcess.id] = { executionProcess, entries: entriesWithKey };
            // Initial load should show 
            if (flattenEntries(localDisplayedExecutionProcesses).length > MIN_INITIAL_ENTRIES) {
                break;
            }
        }
        return localDisplayedExecutionProcesses;
    };

    const emitEntries = (executionProcessState: ExecutionProcessStateStore, addEntryType: AddEntryType) => {
        // Flatten entries in chronological order of process start
        const entries = flattenEntries(executionProcessState);

        onEntriesAddedRef.current?.(entries, addEntryType);
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
            const allInitialEntries = await loadInitialEntries();
            displayedExecutionProcesses.current = allInitialEntries;
            emitEntries(allInitialEntries, "initial");
            loadedInitialEntries.current = true;
        })();
    }, [attempt.id, idListKey]); // include idListKey so new processes trigger reload

    // Reset loadedInitialEntries when attempt changes
    useEffect(() => {
        loadedInitialEntries.current = false;
    }, [attempt.id]);

    return {};
};

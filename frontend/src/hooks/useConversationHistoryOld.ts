import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExecutionProcess, PatchType, TaskAttempt } from 'shared/types';
import { streamSseJsonPatchEntries } from "@/utils/streamSseJsonPatchEntries";
import { get, set } from "@/utils/keyValueStore";

export type PatchTypeWithKey = PatchType & { patchKey: string };

type ExecutionProcessState = {
    executionProcess: ExecutionProcess;
    entries: PatchTypeWithKey[];
};

// The conversation should automatically load previous execution processes, until at least 50 entries are shown
const MIN_ENTRIES_TO_SHOW = 50;

export const useConversationHistory = (attempt: TaskAttempt) => {
    const { executionProcesses } = useExecutionProcesses(attempt.id);
    const [executionProcessesToShow, setExecutionProcessesToShow] = useState<Record<string, ExecutionProcessState>>({});

    // Track live streams so we can close them when attempt changes
    const streamControllersRef = useRef<Record<string, { close?: () => void }>>({});

    const processById = useMemo(() => {
        const map: Record<string, ExecutionProcess> = {};
        for (const p of executionProcesses) map[p.id] = p;
        return map;
    }, [executionProcesses]);

    const idListKey = useMemo(
        () => executionProcesses.map(p => p.id).join(','),
        [executionProcesses]
    );

    const mapEntries = (executionProcessId: string, entries: PatchType[]): PatchTypeWithKey[] =>
        entries.map((entry, index) => ({
            ...entry,
            patchKey: `${executionProcessId}-${index}`
        }));

    const getFinishedStreamCached = async (executionProcessId: string) => {
        const cached: PatchTypeWithKey[] | undefined = await get(`execution-process-${executionProcessId}`);
        if (cached && processById[executionProcessId]) {
            setExecutionProcessesToShow(prev => ({
                ...prev,
                [executionProcessId]: {
                    executionProcess: processById[executionProcessId], // <-- correct process
                    entries: cached
                }
            }));
            return;
        }
        getFinishedStream(executionProcessId);
    };

    const getFinishedStream = (executionProcessId: string) => {
        // If util returns a controller, keep it so we can close later
        const controller = streamSseJsonPatchEntries<PatchType>(
            `/api/execution-processes/${executionProcessId}/normalized-logs`,
            {
                onEntries: (entries) => {
                    setExecutionProcessesToShow(prev => ({
                        ...prev,
                        [executionProcessId]: {
                            ...(prev[executionProcessId] ?? { executionProcess: processById[executionProcessId] }),
                            executionProcess: processById[executionProcessId],
                            entries: mapEntries(executionProcessId, entries)
                        }
                    }));
                },
                onFinished: (entries) => {
                    // Stream has finished, store in cache
                    const mapped = mapEntries(executionProcessId, entries);
                    set(`execution-process-${executionProcessId}`, mapped);
                }
            }
        );

        if (controller) {
            streamControllersRef.current[executionProcessId] = controller;
        }
    };

    const loadPreviousExecutionProcess = () => {
        if (executionProcesses.length === 0) return;

        // If nothing shown yet, load the newest execution process
        if (Object.keys(executionProcessesToShow).length === 0) {
            const latest = executionProcesses[executionProcesses.length - 1];
            if (!latest) return;
            setExecutionProcessesToShow({ [latest.id]: { executionProcess: latest, entries: [] } });
            getFinishedStreamCached(latest.id);
            return;
        }

        // Otherwise, find the earliest shown and then load the one just before it (older)
        const earliestShownProcessId = Object.keys(executionProcessesToShow).sort((a, b) => {
            const ta = new Date(executionProcessesToShow[a].executionProcess.created_at as unknown as string).getTime();
            const tb = new Date(executionProcessesToShow[b].executionProcess.created_at as unknown as string).getTime();
            return ta - tb;
        })[0];

        const earliestShownProcessIndex = executionProcesses.findIndex(p => p.id === earliestShownProcessId);

        if (earliestShownProcessIndex === -1) {
            // The shown IDs belong to a previous attempt. Reset and load newest for this attempt.
            setExecutionProcessesToShow({});
            const latest = executionProcesses[executionProcesses.length - 1];
            if (!latest) return;
            setExecutionProcessesToShow({ [latest.id]: { executionProcess: latest, entries: [] } });
            getFinishedStreamCached(latest.id);
            return;
        }

        const previous = executionProcesses[earliestShownProcessIndex - 1];
        if (previous) {
            setExecutionProcessesToShow(prev => ({
                ...prev,
                [previous.id]: { executionProcess: previous, entries: [] }
            }));
            getFinishedStreamCached(previous.id);
        }
    };

    // When attempt changes: clear state, close any streams, then load the newest process for the new attempt
    useEffect(() => {
        // close old streams
        for (const c of Object.values(streamControllersRef.current)) {
            try { c.close?.(); } catch { }
        }
        streamControllersRef.current = {};

        setExecutionProcessesToShow({});
        // If processes already present for the new attempt, load one immediately
        if (executionProcesses.length > 0) {
            const latest = executionProcesses[executionProcesses.length - 1];
            setExecutionProcessesToShow({ [latest.id]: { executionProcess: latest, entries: [] } });
            getFinishedStreamCached(latest.id);
        }
    }, [attempt.id]);

    // Also react to process list changes within the same attempt
    useEffect(() => {
        loadPreviousExecutionProcess(); // ensures at least one is loaded
    }, [attempt.id, idListKey]);

    // Flatten entries in chronological order of process start
    const entries = useMemo(
        () =>
            Object.values(executionProcessesToShow)
                .sort(
                    (a, b) =>
                        new Date(a.executionProcess.created_at as unknown as string).getTime() -
                        new Date(b.executionProcess.created_at as unknown as string).getTime()
                )
                .flatMap(p => p.entries),
        [executionProcessesToShow]
    );

    return { loadPreviousExecutionProcess, entries };
};

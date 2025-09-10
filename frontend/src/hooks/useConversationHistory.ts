import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';
import { useEffect, useState } from 'react';
import { ExecutionProcess, PatchType, TaskAttempt } from 'shared/types';
import { streamSseJsonPatchEntries } from "@/utils/streamSseJsonPatchEntries";

export type PatchTypeWithKey = PatchType & { patchKey: string };

type ExecutionProcessState = {
    executionProcess: ExecutionProcess;
    entries: PatchTypeWithKey[];
}

export const useConversationHistory = (attempt: TaskAttempt) => {
    const { executionProcesses } = useExecutionProcesses(attempt.id);
    const [executionProcessesToShow, setExecutionProcessesToShow] = useState<Record<string, ExecutionProcessState>>({});


    const getFinishedStream = (executionProcessId: string) => {
        const stream = streamSseJsonPatchEntries<PatchType>(`/api/execution-processes/${executionProcessId}/normalized-logs`, {
            onEntries: (entries) => {
                setExecutionProcessesToShow(prev => ({
                    ...prev,
                    [executionProcessId]: {
                        ...prev[executionProcessId],
                        entries: entries.map((entry, index) => ({ ...entry, patchKey: `${executionProcessId}-${index.toString()}` }))
                    }
                }));
            }
        });
    }

    const loadPreviousExecutionProcess = () => {
        console.log("TEST");
        // Compare the list of shown processes with the list of all processes, find the earliest one that isn't shown
        const earliestShownProcessId = Object.keys(executionProcessesToShow).sort((a, b) => new Date(executionProcessesToShow[a].executionProcess.created_at as unknown as string).getTime() - new Date(executionProcessesToShow[b].executionProcess.created_at as unknown as string).getTime())[0];

        // Index of earliestShownProcessId in executionProcesses
        const earliestShownProcessIndex = executionProcesses.findIndex(process => process.id === earliestShownProcessId);
        const latestProcess = executionProcesses[earliestShownProcessIndex - 1];

        if (latestProcess) {
            setExecutionProcessesToShow(prev => ({
                ...prev,
                [latestProcess.id]: {
                    executionProcess: latestProcess,
                    entries: []
                }
            }));
            getFinishedStream(latestProcess.id);
        }
    }

    useEffect(() => {
        // If there are no shown processes, show the latest one
        if (Object.keys(executionProcessesToShow).length === 0 && executionProcesses.length > 0) {
            const executionProcessState: ExecutionProcessState = {
                executionProcess: executionProcesses[executionProcesses.length - 1],
                entries: []
            }
            setExecutionProcessesToShow({ [executionProcesses[executionProcesses.length - 1].id]: executionProcessState });
            getFinishedStream(executionProcesses[executionProcesses.length - 1].id);
        }
    }, [executionProcesses.map(process => process.id).join(",")]);

    useEffect(() => {

    }, [executionProcessesToShow])

    // Reduce executionProcessesToShow to list of entries, sorting by executionProcessesToShow process startTime
    const entries = Object.values(executionProcessesToShow).sort(
        (a, b) => new Date(a.executionProcess.created_at as unknown as string).getTime() -
            new Date(b.executionProcess.created_at as unknown as string).getTime()
    ).flatMap(process => process.entries);

    return {
        loadPreviousExecutionProcess,
        entries
    }
};
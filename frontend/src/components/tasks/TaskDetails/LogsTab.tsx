import type {
  TaskAttempt,
} from 'shared/types';
import VirtualizedList from '@/components/logs/VirtualizedList';
import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';

type Props = {
  selectedAttempt: TaskAttempt | null;
};

function LogsTab({ selectedAttempt }: Props) {
  if (!selectedAttempt) {
    return null;
  }

  const { executionProcesses } = useExecutionProcesses(selectedAttempt.id);

  const

    console.log(executionProcesses);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1">
        {/* <VirtualizedList entries={groups} /> */}
      </div>
    </div>
  );
}

export default LogsTab; // Filter entries to hide logs from collapsed processes

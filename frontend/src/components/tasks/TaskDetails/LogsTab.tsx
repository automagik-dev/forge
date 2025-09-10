import type {
  TaskAttempt,
} from 'shared/types';
// import VirtualizedList from '@/components/logs/VirtualizedList';
// import { useExecutionProcesses } from '@/hooks/useExecutionProcesses';
import { useConversationHistory } from '@/hooks/useConversationHistory';
import ConversationExecutionLogs from './ConversationExecutionLogs';
import VirtualizedList from '@/components/logs/VirtualizedList';

type Props = {
  selectedAttempt: TaskAttempt;
};

function LogsTab({ selectedAttempt }: Props) {
  const { loadPreviousExecutionProcess, entries } = useConversationHistory(selectedAttempt);


  // const { executionProcesses } = useExecutionProcesses(selectedAttempt.id);

  // console.log("DEBUG1", shownExecutionProcesses);

  // {shownExecutionProcesses.map((executionProcess) => (
  //   <ConversationExecutionLogs key={executionProcess.id} executionProcess={executionProcess} />
  // ))}  

  return (
    <>
      <button onClick={loadPreviousExecutionProcess}>Load Previous</button>
      <VirtualizedList entries={entries} startReached={loadPreviousExecutionProcess} />
    </>
  );
}

export default LogsTab; // Filter entries to hide logs from collapsed processes

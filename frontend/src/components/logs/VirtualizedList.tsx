import {
    VirtuosoMessageListProps,
    VirtuosoMessageListMethods,
    VirtuosoMessageListLicense,
    VirtuosoMessageList,
    DataWithScrollModifier,
    ScrollModifier,
} from '@virtuoso.dev/message-list'
import { useEffect, useRef } from "react";
import DisplayConversationEntry from "../NormalizedConversation/DisplayConversationEntry";
import { useConversationHistory, PatchTypeWithKey, AddEntryType } from "@/hooks/useConversationHistory";
import { TaskAttempt } from 'shared/types';

interface VirtualizedListProps {
    attempt: TaskAttempt;
};

type ChannelData = DataWithScrollModifier<PatchTypeWithKey> | null

const VirtualizedList = ({ attempt }: VirtualizedListProps) => {
    const onEntriesUpdated = (newEntries: PatchTypeWithKey[], addType: AddEntryType) => {
        console.log("DEBUG2", newEntries, addType);
    };

    useConversationHistory({ attempt, onEntriesUpdated });

    return <p>hi</p>;

    // const messageListRef = useRef<VirtuosoMessageListMethods | null>(null)
    // const previousEntryCountRef = useRef<number>(0)

    // const InitialDataScrollModifier: ScrollModifier = "prepend";

    // const ItemContent: VirtuosoMessageListProps<PatchTypeWithKey, null>['ItemContent'] = ({ data }) => {
    //     if (data.type === 'STDOUT') {
    //         return <p>{data.content}</p>
    //     } else if (data.type === 'STDERR') {
    //         return <p>{data.content}</p>
    //     } else if (data.type === 'NORMALIZED_ENTRY') {
    //         return <DisplayConversationEntry key={data.patchKey} expansionKey={data.patchKey} entry={data.content} />
    //     }
    // }

    // const computeItemKey: VirtuosoMessageListProps<PatchTypeWithKey, null>['computeItemKey'] = ({ data }) => {
    //     return `l-${data.patchKey}`;
    // }

    // return (
    //     <VirtuosoMessageListLicense>
    //         <VirtuosoMessageList<PatchTypeWithKey, null>
    //             ref={messageListRef}
    //             style={{ flex: 1 }}
    //             data={channelData}
    //             computeItemKey={computeItemKey}
    //             ItemContent={ItemContent}
    //         // onScroll={({ listOffset }) => {
    //         //     if (listOffset > -10) {
    //         //         debounce(() => {
    //         //             startReached?.();
    //         //         }, 1000)();
    //         //     }
    //         // }}
    //         // initialLocation={{
    //         //     index: 'LAST',
    //         //     align: 'end',
    //         // }}
    //         // onRenderedDataChange={(range) => {
    //         //     setTimeout(() => {
    //         //         if (initialLoading.current) {
    //         //             const containerHeight = messageListRef.current?.scrollerElement()?.clientHeight;
    //         //             const scrollHeight = messageListRef.current?.getScrollLocation().scrollHeight;
    //         //             if (scrollHeight && containerHeight && scrollHeight - 100 < containerHeight) {
    //         //                 startReached?.();
    //         //             } else {
    //         //                 initialLoading.current = false;
    //         //             }
    //         //         }
    //         //     }, 1000);
    //         // }}
    //         />
    //     </VirtuosoMessageListLicense>

    // )
}


function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export default VirtualizedList;

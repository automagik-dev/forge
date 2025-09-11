import {
    VirtuosoMessageListProps,
    VirtuosoMessageListMethods,
    VirtuosoMessageListLicense,
    VirtuosoMessageList,
    DataWithScrollModifier,
    ScrollModifier,
} from '@virtuoso.dev/message-list'
import { useEffect, useRef, useState } from "react";
import DisplayConversationEntry from "../NormalizedConversation/DisplayConversationEntry";
import { useConversationHistory, PatchTypeWithKey, AddEntryType } from "@/hooks/useConversationHistory";
import { TaskAttempt } from 'shared/types';

interface VirtualizedListProps {
    attempt: TaskAttempt;
};

type ChannelData = DataWithScrollModifier<PatchTypeWithKey> | null

const InitialDataScrollModifier: ScrollModifier = {
    type: 'item-location',
    location: {
        index: 'LAST',
        align: 'end',
    },
    purgeItemSizes: true,
}

const AutoScrollToBottom: ScrollModifier = {
    type: 'auto-scroll-to-bottom',
    autoScroll: ({ atBottom, scrollInProgress }) => {
        if (atBottom || scrollInProgress) {
            return 'smooth'
        }
        return false
    }
}

const VirtualizedList = ({ attempt }: VirtualizedListProps) => {
    const [channelData, setChannelData] = useState<ChannelData>(null)

    const onEntriesUpdated = (newEntries: PatchTypeWithKey[], addType: AddEntryType) => {
        // initial defaults to scrolling to the latest
        let scrollModifier: ScrollModifier = InitialDataScrollModifier;

        if (addType === "running") {
            scrollModifier = AutoScrollToBottom;
        }

        setChannelData({ data: newEntries, scrollModifier });
    };

    useConversationHistory({ attempt, onEntriesUpdated });

    const messageListRef = useRef<VirtuosoMessageListMethods | null>(null)

    const ItemContent: VirtuosoMessageListProps<PatchTypeWithKey, null>['ItemContent'] = ({ data }) => {
        if (data.type === 'STDOUT') {
            return <p>{data.content}</p>
        } else if (data.type === 'STDERR') {
            return <p>{data.content}</p>
        } else if (data.type === 'NORMALIZED_ENTRY') {
            return <DisplayConversationEntry key={data.patchKey} expansionKey={data.patchKey} entry={data.content} />
        }
    }

    const computeItemKey: VirtuosoMessageListProps<PatchTypeWithKey, null>['computeItemKey'] = ({ data }) => {
        return `l-${data.patchKey}`;
    }

    return (
        <VirtuosoMessageListLicense>
            <VirtuosoMessageList<PatchTypeWithKey, null>
                ref={messageListRef}
                style={{ flex: 1 }}
                data={channelData}
                computeItemKey={computeItemKey}
                ItemContent={ItemContent}
            // onScroll={({ listOffset }) => {
            //     if (listOffset > -10) {
            //         debounce(() => {
            //             startReached?.();
            //         }, 1000)();
            //     }
            // }}
            // initialLocation={{
            //     index: 'LAST',
            //     align: 'end',
            // }}
            // onRenderedDataChange={(range) => {
            //     setTimeout(() => {
            //         if (initialLoading.current) {
            //             const containerHeight = messageListRef.current?.scrollerElement()?.clientHeight;
            //             const scrollHeight = messageListRef.current?.getScrollLocation().scrollHeight;
            //             if (scrollHeight && containerHeight && scrollHeight - 100 < containerHeight) {
            //                 startReached?.();
            //             } else {
            //                 initialLoading.current = false;
            //             }
            //         }
            //     }, 1000);
            // }}
            />
        </VirtuosoMessageListLicense>

    )
}


function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

export default VirtualizedList;

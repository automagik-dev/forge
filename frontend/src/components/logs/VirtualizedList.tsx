import {
    VirtuosoMessageListProps,
    VirtuosoMessageListMethods,
    VirtuosoMessageListLicense,
    VirtuosoMessageList,
    DataWithScrollModifier,
    ScrollModifier,
} from '@virtuoso.dev/message-list'
import { useEffect, useRef, useState, startTransition, useCallback, useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import DisplayConversationEntry from "../NormalizedConversation/DisplayConversationEntry";
import { PatchTypeWithKey } from "@/hooks/useConversationHistory";
import { PatchType } from 'shared/types';

// If we update Virtuoso faster than this, it will stop auto scrolling
const FLUSH_MS = 100;

interface VirtualizedListProps {
    entries: PatchTypeWithKey[]
    startReached?: () => void
};

// use this shape to start channels at the bottom of the list
const InitialDataScrollModifier: ScrollModifier = {
    type: 'item-location',
    location: {
        index: 'LAST',
        align: 'end',
    },
    purgeItemSizes: true,
}

type ChannelData = DataWithScrollModifier<PatchTypeWithKey> | null

type ChannelsData = Record<string, ChannelData>

const VirtualizedList = ({ entries, startReached }: VirtualizedListProps) => {
    const entriesRef = useRef<PatchTypeWithKey[]>([]);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [channelsData, setChannelsData] = useState<ChannelsData>(() => ({
        general: null,
    }))
    const [currentChannel, setCurrentChannel] = useState<string>('general')


    // Throttle updates
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastFlushTsRef = useRef<number>(0);
    const scheduledRef = useRef(false);

    const setMessageListData = useCallback(
        (cb: (current: ChannelData) => ChannelData) => {
            setChannelsData((current) => {
                return {
                    ...current,
                    [currentChannel]: cb(current[currentChannel] ?? null),
                }
            })
        },
        [currentChannel]
    )

    const clearTimer = () => {
        if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
        }
        scheduledRef.current = false;
    };

    const flushNow = () => {
        clearTimer();
        lastFlushTsRef.current = performance.now();
        const snapshot = entriesRef.current;
        startTransition(() => {
            // slice() avoids sharing the same array instance with the ref
            setMessageListData((current) => {
                return {
                    data: snapshot,
                    scrollModifier: InitialDataScrollModifier,
                }
            })
        });
    };

    const scheduleFlush = () => {
        if (scheduledRef.current) return;

        const now = performance.now();
        const elapsed = now - lastFlushTsRef.current;
        const delay = elapsed >= FLUSH_MS ? 0 : FLUSH_MS - elapsed;

        scheduledRef.current = true;
        flushTimerRef.current = setTimeout(flushNow, delay);
    };

    useEffect(() => {
        entriesRef.current = entries;
        scheduleFlush();
        return () => {
            clearTimer();
        };
    }, [entries]);

    // return (
    //     <Virtuoso
    //         style={{ height: "100%" }}
    //         data={displayedEntries}
    //         followOutput={isAtBottom}
    //         itemContent={(_, item) => {
    //             if (item.type === 'STDOUT') {
    //                 return <p>{item.content}</p>
    //             } else if (item.type === 'STDERR') {
    //                 return <p>{item.content}</p>
    //             } else if (item.type === 'NORMALIZED_ENTRY') {
    //                 return <DisplayConversationEntry key={item.patchKey} expansionKey={item.patchKey} entry={item.content} />
    //             }
    //         }}
    //         firstItemIndex={entries.length}
    //         startReached={startReached}
    //     // atBottomStateChange={(isAtBottom) => setIsAtBottom(isAtBottom)}
    //     />
    // );

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


    const messageListData = useMemo(() => {
        return channelsData[currentChannel] ?? null
    }, [channelsData, currentChannel])

    return (
        <VirtuosoMessageListLicense>
            <VirtuosoMessageList<PatchTypeWithKey, null>
                style={{ flex: 1 }}
                data={messageListData}
                computeItemKey={computeItemKey}
                ItemContent={ItemContent}
            />
        </VirtuosoMessageListLicense>

    )
}

export default VirtualizedList;

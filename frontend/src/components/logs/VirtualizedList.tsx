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
// const InitialDataScrollModifier: ScrollModifier = {
//     type: 'items-change',
//     behavior: 'instant',
// }

const InitialDataScrollModifier: ScrollModifier = {
    type: 'item-location',
    location: {
        index: 'LAST',
        align: 'end', // start with the message at the bottom of the viewport
    }
}

type ChannelData = DataWithScrollModifier<PatchTypeWithKey> | null

type ChannelsData = Record<string, ChannelData>

const VirtualizedList = ({ entries, startReached }: VirtualizedListProps) => {
    const entriesRef = useRef<PatchTypeWithKey[]>([]);
    const [channelData, setChannelData] = useState<ChannelData>(null)
    const initialLoading = useRef(true)
    const messageListRef = useRef<VirtuosoMessageListMethods | null>(null)

    // Throttle updates
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastFlushTsRef = useRef<number>(0);
    const scheduledRef = useRef(false);

    const setMessageListData = useCallback(
        (cb: (current: ChannelData) => ChannelData) => {
            setChannelData(cb(channelData ?? null));
        },
        [channelData]
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
                    scrollModifier: 'prepend',
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
                // onScroll={({ isAtBottom, listOffset }) => {
                //     if (listOffset > -10) {
                //         debounce(() => {
                //             startReached?.();
                //         }, 1000)();
                //     }
                // }}
                initialLocation={{
                    index: 'LAST',
                    align: 'end',
                }}
            // onRenderedDataChange={(range) => {
            //     setTimeout(() => {
            //         console.log("DEBUG");
            //         if (initialLoading.current) {
            //             const containerHeight = messageListRef.current?.scrollerElement()?.clientHeight;
            //             const scrollHeight = messageListRef.current?.getScrollLocation().scrollHeight;
            //             console.log("DEBUG1", scrollHeight, containerHeight)
            //             if (scrollHeight && containerHeight && scrollHeight - 10 < containerHeight) {
            //                 debounce(() => {
            //                     startReached?.();
            //                 }, 100)();
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

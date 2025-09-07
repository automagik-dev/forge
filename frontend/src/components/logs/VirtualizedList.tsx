import { useEffect, useRef, useState, startTransition, ReactNode } from "react";
import { Virtuoso } from "react-virtuoso";
import { PatchType } from "shared/types";

// If we update Virtuoso faster than this, it will stop auto scrolling
const FLUSH_MS = 100;

interface VirtualizedListProps {
    entries: PatchType[]
};

export default function VirtualizedList({ entries }: VirtualizedListProps) {
    const [displayedEntries, setDisplayedEntries] = useState<PatchType[]>([]);
    const entriesRef = useRef<PatchType[]>([]);

    // throttle state
    const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastFlushTsRef = useRef<number>(0);
    const scheduledRef = useRef(false);

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
            setDisplayedEntries(snapshot.slice());
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

    return (
        <Virtuoso
            style={{ height: "100%" }}
            data={displayedEntries}
            followOutput={"smooth"}
            itemContent={(_, item) => {
                if (item.type === 'STDOUT') {
                    return <p>{item.content}</p>
                } else if (item.type === 'STDERR') {
                    return <p>{item.content}</p>
                } else {
                    return null
                }
            }}
        />
    );
}

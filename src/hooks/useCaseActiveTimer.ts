import { useEffect, useRef, useCallback } from 'react';
import { ResearchEventType } from '../types';

interface UseCaseActiveTimerOptions {
  caseId: string | undefined;
  isLocked: boolean;
  isDemoMode: boolean;
  onOpenCase?: (caseId: string) => Promise<void> | void;
  onHeartbeatTimer?: (caseId: string, deltaSeconds: number) => Promise<void> | void;
  onLogEvent?: (
    eventType: ResearchEventType,
    caseId?: string,
    payload?: Record<string, unknown>
  ) => void;
}

export interface LocalCaseTimingSnapshot {
  firstDisplayedAt: string;
  lastOpenedAt: string;
  activeSeconds: number;
}

/**
 * Visibility-aware foreground active-time tracker per case.
 * - Opens case session on mount / case change
 * - Counts active foreground seconds only when document.visibilityState === 'visible'
 * - Flushes heartbeats every 10s, on visibility hide, pagehide, case change, and manual flush()
 */
export function useCaseActiveTimer({
  caseId,
  isLocked,
  isDemoMode,
  onOpenCase,
  onHeartbeatTimer,
  onLogEvent
}: UseCaseActiveTimerOptions) {
  const pendingDeltaRef = useRef<number>(0);
  const localStatsRef = useRef<Record<string, LocalCaseTimingSnapshot>>({});
  const onOpenRef = useRef(onOpenCase);
  const onHeartbeatRef = useRef(onHeartbeatTimer);
  const onLogEventRef = useRef(onLogEvent);

  onOpenRef.current = onOpenCase;
  onHeartbeatRef.current = onHeartbeatTimer;
  onLogEventRef.current = onLogEvent;

  const flushDelta = useCallback(async (targetCaseId: string | undefined) => {
    if (!targetCaseId) return;
    const delta = pendingDeltaRef.current;
    if (delta <= 0) return;
    pendingDeltaRef.current = 0;

    if (onHeartbeatRef.current) {
      try {
        await onHeartbeatRef.current(targetCaseId, delta);
      } catch {
        // Non-fatal: restore delta only if we didn't reset; keep UI responsive
      }
    }
  }, []);

  useEffect(() => {
    if (!caseId) return;

    const nowIso = new Date().toISOString();
    const existing = localStatsRef.current[caseId];
    if (!existing) {
      localStatsRef.current[caseId] = {
        firstDisplayedAt: nowIso,
        lastOpenedAt: nowIso,
        activeSeconds: 0
      };
    } else {
      existing.lastOpenedAt = nowIso;
    }

    if (!isLocked) {
      void onOpenRef.current?.(caseId);
    }

    if (isLocked) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        pendingDeltaRef.current += 1;
        if (localStatsRef.current[caseId]) {
          localStatsRef.current[caseId].activeSeconds += 1;
        }
        if (pendingDeltaRef.current >= 10) {
          void flushDelta(caseId);
        }
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushDelta(caseId);
        onLogEventRef.current?.('tab_hidden', caseId, { isDemoMode });
      } else if (document.visibilityState === 'visible') {
        onLogEventRef.current?.('tab_visible', caseId, { isDemoMode });
      }
    };

    const handlePageHide = () => {
      void flushDelta(caseId);
      onLogEventRef.current?.('page_exit_beacon', caseId, { isDemoMode });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      void flushDelta(caseId);
    };
  }, [caseId, isLocked, isDemoMode, flushDelta]);

  const flushCurrent = useCallback(async () => {
    await flushDelta(caseId);
  }, [caseId, flushDelta]);

  const getLocalTiming = useCallback((targetCaseId: string) => {
    const nowIso = new Date().toISOString();
    const stat = localStatsRef.current[targetCaseId] || {
      firstDisplayedAt: nowIso,
      lastOpenedAt: nowIso,
      activeSeconds: 0
    };
    const wallClockSeconds = Math.max(
      stat.activeSeconds,
      Math.round((Date.now() - new Date(stat.firstDisplayedAt).getTime()) / 1000)
    );
    return {
      firstDisplayedAt: stat.firstDisplayedAt,
      lastOpenedAt: stat.lastOpenedAt,
      submittedAt: nowIso,
      activeSeconds: stat.activeSeconds,
      wallClockSeconds
    };
  }, []);

  return {
    flushCurrent,
    getLocalTiming
  };
}

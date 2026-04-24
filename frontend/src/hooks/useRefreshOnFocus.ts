import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Chạy callback mỗi lần screen được focus (quay lại màn).
 * Hỗ trợ async và hủy cập nhật state qua flag `cancelled`.
 */
export function useRefreshOnFocus(effect: (ctx: { cancelled: () => boolean }) => void | Promise<void>, deps: any[] = []) {
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;

      const ctx = { cancelled: () => isCancelled };
      const maybePromise = effect(ctx);

      // đảm bảo unhandled rejection không làm crash dev
      if (maybePromise && typeof (maybePromise as any).catch === 'function') {
        (maybePromise as Promise<void>).catch(() => undefined);
      }

      return () => {
        isCancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps),
  );
}


import { useEffect, useState } from 'react';
import type { HelloResponse } from '@app/shared';
import { fetchHello } from './api';
import type { AppData } from './app-data';

type HelloState =
  | { kind: 'ready'; value: HelloResponse }
  | { kind: 'error'; message: string };

export function App({ initialData }: { initialData: AppData }) {
  const [hello, setHello] = useState<HelloState | null>(() =>
    initialData.hello
      ? { kind: 'ready', value: initialData.hello }
      : initialData.helloError
        ? { kind: 'error', message: initialData.helloError }
        : null,
  );

  useEffect(() => {
    // The server already resolved this, so refetching would only flash.
    if (initialData.hello || initialData.helloError) {
      return;
    }

    let cancelled = false;

    fetchHello()
      .then((value) => {
        if (!cancelled) {
          setHello({ kind: 'ready', value });
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setHello({
            kind: 'error',
            message: cause instanceof Error ? cause.message : String(cause),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialData.hello, initialData.helloError]);

  return (
    <main className="page">
      <section className="card">
        <p className="eyebrow">NestJS + React + Vite</p>

        {hello === null ? (
          <h1 className="muted">Loading…</h1>
        ) : hello.kind === 'ready' ? (
          <h1>{hello.value.message}</h1>
        ) : (
          <>
            <h1>API unreachable</h1>
            <p className="detail">{hello.message}</p>
          </>
        )}

        <p className="detail">
          Server-rendered on the first request and hydrated in the browser. The
          message comes from <code>GET /api/hello</code>.
        </p>
      </section>
    </main>
  );
}

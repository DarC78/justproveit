# Dispatch hydration/build fix

`JustProveit/src/pages/crmdispatch.tsx` synchronously set a mounted flag inside `useEffect`, rejected by `react-hooks/set-state-in-effect`. The flag delays invalid-phone validation until hydration so server output and initial client output agree. Removing the delay would risk hydration mismatches.

The application now uses `useSyncExternalStore` with stable server=false/client=true snapshot functions and a no-op subscription. React retains the false server snapshot during hydration, then reads the true client snapshot without the effect-driven state setter. Phone precedence/normalization, authentication, contact lookup, queue/agent context, automatic/manual destinations, cancellation and failure/retry logic are unchanged. No timer or promise defers the old setter; no lint rule or check is disabled.

The new regression assertion renders the actual page with React server rendering and hydrates it in jsdom, requiring matching initial markup, zero recoverable hydration errors, then visible invalid-phone validation/retry without contact/routing reads. Existing routing assertions are unchanged. All133 frontend tests pass, TypeScript passes, and the official production Next build passes in an isolated complete-source copy with lint and types enabled.

The live staging page passed nine automated browser checks using real local backend reads and existing synthetic records. Controlled lookup failure aborts only the browser test request; retry uses the real backend. Explicit pension routing preserves real contact name/email, normalized phone, queue and agent. History routing matches the backend decision. No external destination was opened or data/message delivery performed. Inbound external URL selection remains covered by existing unit tests; its external site was not visited.

This is an application fix plus regression test in `01-justproveit-application.patch`. Staging configuration and simulator layers are unchanged and remain separate. Prior manual acceptance records are historical explicit user feedback; automated dispatch verification does not create new manual sign-off.

---
name: optimize-rerenders
description: Find and fix React re-render hotspots — bad memo, unstable refs, prop drilling.
premium: true
order: 35
applies_when:
  framework: [react, nextjs]
---
---
description: Hunt down re-render hotspots
argument-hint: [component-path]
---

Audit React components for unnecessary re-renders. If $ARGUMENTS names a file, focus there; otherwise audit the highest-traffic component tree (usually `app/layout.tsx` or `pages/_app.tsx` and its top children).

## What to look for, in order

1. **Inline object/array props on render-hot children.** `<Item config={{ a: 1 }} />` makes `config` a new reference every render. If the child uses `React.memo` or `useMemo`, the memo is useless.
2. **Inline function props that defeat memo.** `<Button onClick={() => doX(id)} />` — fix with `useCallback` OR by hoisting the handler if `id` doesn't depend on render.
3. **`useMemo` / `useCallback` with bad deps.** Missing deps (silent staleness) or unstable objects in deps (silent every-render-recompute).
4. **Context that fans out unnecessarily.** A single context provider holding multiple unrelated values — every consumer re-renders when any value changes. Split into multiple narrower contexts.
5. **`useState` setters called with object literals on every render.** `setX({...x})` in `useEffect` with no deps → infinite render.
6. **Children passed as `useEffect` dep.** `useEffect(..., [children])` — almost always wrong unless you specifically want this.
7. **Non-stable list keys.** `key={index}` on a reorderable list, `key={Math.random()}`, `key={item}` on objects.

## Methodology

8. Use the React DevTools Profiler mental model — for each finding, predict which component re-renders that shouldn't.
9. For each candidate fix, check the cost of the fix: a `useCallback` that's only run once isn't free — if the parent is itself stable, you're paying for nothing.

## Output

10. Give me a ranked list: file:line, what's wrong, the proposed fix, an estimate of impact (1=trivial, 5=visible perf gain).
11. Do NOT apply fixes yet. Show me the list, I'll pick the ones to apply.

Hard rules:
- Don't wrap everything in `React.memo`. Memo has overhead and only pays off when (a) the component renders often and (b) most renders have unchanged props.
- Don't add `useMemo` for primitive computations — it costs more than it saves.

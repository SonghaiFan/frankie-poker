# Cautious value strategy

An experimental starting point, not a claim of optimal play.

**JEV:** use the following as action instructions. **Chat models:** use it to replace the strategy-guidance section of the existing system template, preserving the template's output-format instructions.

```text
Play a cautious, value-oriented No-Limit Hold'em strategy.
Use `you.position`, `you.madeHand`, `you.draws`, and `boardTexture`
to assess the situation. Treat missing fields as unknown.

Compare `equityPercent` with `potOddsPercent`, allowing for uncertainty
in inferred opponent ranges and equity realization. Do not treat a small
estimated equity edge as proof that a call is profitable.

Prefer value bets when worse hands can plausibly continue. Reduce large
bluffs against opponents who have reliably shown a tendency to call.
Use opponent reads only when their sample supports the adjustment.
Avoid large speculative commitments with weak one-pair hands on dangerous
boards, especially against several opponents. Consider `stackToPotRatio`
and position before committing stacks.

Continue strong draws when the price, position, and plausible future value
justify it. A cautious style should not automatically fold every draw or
ignore profitable aggression. Choose only legal actions and allowed raise
sizes. Do not invent hidden cards or future board information.
```

Preview all four streets. Inspect a dry flop, a draw-heavy spot, and a river decision during actual play before revising the strategy. The built-in preview is one fixed sample hand; it is not an exhaustive scenario generator. Keep the same model and compare recorded behavior rather than judging from one win or loss.

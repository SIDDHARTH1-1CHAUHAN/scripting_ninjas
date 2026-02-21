from __future__ import annotations

from typing import Callable, Iterable


Objective = Callable[[object], float]


def pareto_front_indices(items: list[object], objectives: list[Objective]) -> list[int]:
    """Return indices of Pareto-optimal items (lower is better for all objectives)."""
    if not items:
        return []

    values = [[objective(item) for objective in objectives] for item in items]
    front: list[int] = []

    for i, value in enumerate(values):
        dominated = False
        for j, other in enumerate(values):
            if i == j:
                continue
            if _dominates(other, value):
                dominated = True
                break
        if not dominated:
            front.append(i)

    return front


def select_best_index(
    items: list[object],
    indices: Iterable[int],
    objectives: list[Objective],
    weights: list[float] | None = None,
) -> int:
    """Pick the lowest weighted-score item from a set of indices."""
    indices = list(indices)
    if not indices:
        return 0

    if weights is None:
        weights = [1.0 for _ in objectives]

    best_idx = indices[0]
    best_score = float("inf")

    for idx in indices:
        item = items[idx]
        score = 0.0
        for weight, objective in zip(weights, objectives, strict=False):
            score += weight * objective(item)
        if score < best_score:
            best_score = score
            best_idx = idx

    return best_idx


def _dominates(a: list[float], b: list[float]) -> bool:
    """Return True if a dominates b (<= in all objectives and < in at least one)."""
    less_or_equal = all(x <= y for x, y in zip(a, b, strict=False))
    strictly_less = any(x < y for x, y in zip(a, b, strict=False))
    return less_or_equal and strictly_less

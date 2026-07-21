#!/usr/bin/env python3
from __future__ import annotations

import base64
import hashlib
import json
import math
import random
import re
import zlib
from pathlib import Path
from statistics import mean

import numpy as np

ROOT = Path(__file__).resolve().parent
CANDIDATE_ID = re.compile(r"^[A-D][0-9]{2}$")


def load(name: str):
    data = json.loads((ROOT / name).read_text())
    if data.get("encoding") != "zlib+base64+json":
        return data
    raw = zlib.decompress(base64.b64decode(data["payload"]))
    assert hashlib.sha256(raw).hexdigest() == data["sha256"]
    assert len(raw) == data["bytes"]
    return json.loads(raw)


TASK = load("task_state.json")
POP = load("candidate_population.json")
SCORES = load("candidate_scores.json")
CG = load("candidate_graph.json")
SG = load("software_invariant_hypergraph.json")
CMP = load("selection_comparison.json")
EXP = load("selected_exploration.json")
IMP = load("selected_implementation.json")
VERIFY = load("verification_plan.json")
ABLATION = load("implementation_ablation.json")

DIMS = list(SCORES["dimensions"])
SCORE_WEIGHTS = SCORES["weights"]
CANDIDATES = {row["id"]: row for row in POP["candidates"]}
SCORE_ROWS = {row["id"]: row for row in SCORES["rows"]}
IDS = sorted(CANDIDATES)
INDEX = {candidate_id: index for index, candidate_id in enumerate(IDS)}
SET_SIZE = int(CMP["feasible_domain"]["set_size"])
VALIDATED = {candidate_id for candidate_id, row in CANDIDATES.items() if row.get("status") == "validated"}
REQUIRED_WORKSTREAMS = set(TASK["basis"]["workstreams"])
REQUIRED_SPACES = set(TASK["z_spaces"])

POSITIVE_ALIASES = (
    "Evidence", "EvidenceGrounding", "EvidenceStrength", "Applicability", "Transfer",
    "BusinessValue", "UserValue", "VerificationFeasibility", "Testability", "ProofDensity",
    "RiskReduction", "Reversibility", "ArchitectureLeverage",
)
NEGATIVE_ALIASES = (
    "Unsupported", "Unverifiability", "Risk", "Cost", "Scope", "PrerequisiteDebt", "OperatorBurden",
)
BASELINE_POSITIVE = [dimension for dimension in POSITIVE_ALIASES if dimension in DIMS]
BASELINE_NEGATIVE = [dimension for dimension in NEGATIVE_ALIASES if dimension in DIMS]
assert BASELINE_POSITIVE, f"no positive baseline dimensions in {DIMS}"
assert BASELINE_NEGATIVE, f"no penalty baseline dimensions in {DIMS}"


def quality(row: dict) -> float:
    return float(sum(SCORE_WEIGHTS[dimension] * row["r"][dimension] for dimension in DIMS))


def build_candidate_graph():
    groups: dict[str, list[str]] = {}
    for candidate_id in sorted(VALIDATED):
        groups.setdefault(CANDIDATES[candidate_id]["concept"], []).append(candidate_id)
    edges = [
        {
            "name": f"concept:{concept}",
            "members": sorted(members),
            "relation": CG["concept_edges"]["relation"],
            "weight": float(CG["concept_edges"]["weight"]),
        }
        for concept, members in sorted(groups.items())
    ] + list(CG["higher_order_edges"])

    incidence = np.zeros((len(IDS), len(edges)), dtype=float)
    for edge_index, edge in enumerate(edges):
        assert edge["members"] and all(member in INDEX for member in edge["members"]), edge["name"]
        for member in edge["members"]:
            incidence[INDEX[member], edge_index] = 1.0

    edge_weights = np.array([float(edge["weight"]) for edge in edges], dtype=float)
    edge_degree = incidence.sum(axis=0)
    vertex_degree = (incidence * edge_weights).sum(axis=1)
    inverse_vertex = np.diag(1.0 / np.sqrt(np.maximum(vertex_degree, 1e-12)))
    laplacian = (
        np.eye(len(IDS))
        - inverse_vertex
        @ incidence
        @ np.diag(edge_weights)
        @ np.diag(1.0 / np.maximum(edge_degree, 1e-12))
        @ incidence.T
        @ inverse_vertex
    )
    laplacian = (laplacian + laplacian.T) / 2.0

    vectors = np.array(
        [[float(SCORE_ROWS[candidate_id]["r"][dimension]) for dimension in DIMS] for candidate_id in IDS],
        dtype=float,
    )
    distance = np.sqrt(((vectors[:, None, :] - vectors[None, :, :]) ** 2).sum(axis=2))
    nonzero = distance[distance > 0]
    sigma = float(np.median(nonzero)) if len(nonzero) else 1.0
    similarity = np.exp(-(distance**2) / (2.0 * sigma * sigma))
    return edges, incidence, edge_weights, laplacian, distance, similarity, sigma


EDGES, INCIDENCE, EDGE_WEIGHTS, LAPLACIAN, DISTANCE, SIMILARITY, SIGMA = build_candidate_graph()
METRIC_CACHE: dict[tuple[str, ...], dict] = {}


def canonical(selection) -> tuple[str, ...]:
    return tuple(sorted(selection))


def feasible(selection) -> bool:
    selected = canonical(selection)
    if len(selected) != SET_SIZE or len(set(selected)) != SET_SIZE or not set(selected).issubset(VALIDATED):
        return False
    workstreams = {
        workstream for candidate_id in selected for workstream in CANDIDATES[candidate_id]["workstreams"]
    }
    spaces = {space for candidate_id in selected for space in CANDIDATES[candidate_id]["spaces"]}
    return REQUIRED_WORKSTREAMS.issubset(workstreams) and REQUIRED_SPACES.issubset(spaces)


def software_coverage(selection) -> dict:
    represented: set[str] = set()
    for candidate_id in canonical(selection):
        concept = CANDIDATES[candidate_id]["concept"]
        assert concept in SG["concept_representations"], concept
        represented.update(SG["concept_representations"][concept])

    total_weight = sum(float(edge["weight"]) for edge in SG["hyperedges"])
    touch = fractional = complete = proved = 0.0
    complete_ids: list[str] = []
    proved_ids: list[str] = []
    for edge in SG["hyperedges"]:
        members = set(edge["members"])
        fraction = len(members & represented) / len(members)
        weight = float(edge["weight"])
        touch += weight if fraction > 0 else 0.0
        fractional += weight * fraction
        if math.isclose(fraction, 1.0, abs_tol=1e-12):
            complete += weight
            complete_ids.append(edge["id"])
            if edge.get("proof_status") == "accepted":
                proved += weight
                proved_ids.append(edge["id"])
    return {
        "software_touch": touch / total_weight,
        "software_fractional": fractional / total_weight,
        "software_complete": complete / total_weight,
        "software_proved": proved / total_weight,
        "represented_software_vertices": sorted(represented),
        "complete_software_edges": sorted(complete_ids),
        "proved_software_edges": sorted(proved_ids),
    }


def metrics(selection) -> dict:
    selected = canonical(selection)
    if selected in METRIC_CACHE:
        return METRIC_CACHE[selected]
    assert feasible(selected), selected
    indices = [INDEX[candidate_id] for candidate_id in selected]
    selected_similarity = SIMILARITY[np.ix_(indices, indices)]
    selected_distance = DISTANCE[np.ix_(indices, indices)]
    similarities = [
        float(selected_similarity[i, j])
        for i in range(len(indices))
        for j in range(i + 1, len(indices))
    ]
    distances = [
        float(selected_distance[i, j])
        for i in range(len(indices))
        for j in range(i + 1, len(indices))
    ]
    density = selected_similarity / np.trace(selected_similarity)
    eigenvalues = np.linalg.eigvalsh((density + density.T) / 2.0)
    eigenvalues = eigenvalues[eigenvalues > 1e-12]

    edge_touch = sum(
        EDGE_WEIGHTS[edge_index]
        for edge_index in range(INCIDENCE.shape[1])
        if any(INCIDENCE[candidate_index, edge_index] for candidate_index in indices)
    ) / float(EDGE_WEIGHTS.sum())

    selected_cells = {
        (CANDIDATES[candidate_id]["batch"], workstream, space)
        for candidate_id in selected
        for workstream in CANDIDATES[candidate_id]["workstreams"]
        for space in CANDIDATES[candidate_id]["spaces"]
    }
    all_cells = {
        (candidate["batch"], workstream, space)
        for candidate in CANDIDATES.values()
        if candidate.get("status") == "validated"
        for workstream in candidate["workstreams"]
        for space in candidate["spaces"]
    }

    output = {
        "q_bar": float(mean(float(SCORE_ROWS[candidate_id]["q"]) for candidate_id in selected)),
        "candidate_edge_touch": float(edge_touch),
        "separation_min": min(distances),
        "separation_mean": float(mean(distances)),
        "von_neumann_entropy": float(-np.sum(eigenvalues * np.log(eigenvalues)) / math.log(len(indices))),
        "quality_diversity_occupancy": len(selected_cells) / len(all_cells),
        "redundancy": float(mean(similarities)),
    }
    output.update(software_coverage(selected))
    METRIC_CACHE[selected] = output
    return output


OBJECTIVE_KEYS = {
    "q_bar": "q_bar",
    "software_fractional": "software_fractional",
    "software_complete": "software_complete",
    "candidate_edge_touch": "candidate_edge_touch",
    "separation_mean": "separation_mean",
    "von_neumann_entropy": "von_neumann_entropy",
    "quality_diversity_occupancy": "quality_diversity_occupancy",
    "redundancy": "redundancy",
}
GRAPH_TERMS = {"software_fractional", "software_complete", "candidate_edge_touch"}
DIVERSITY_TERMS = {
    "separation_mean", "von_neumann_entropy", "quality_diversity_occupancy", "redundancy",
}
BASELINE_VALUE = {
    candidate_id: (
        mean(float(SCORE_ROWS[candidate_id]["r"][dimension]) for dimension in BASELINE_POSITIVE)
        - mean(float(SCORE_ROWS[candidate_id]["r"][dimension]) for dimension in BASELINE_NEGATIVE)
    )
    for candidate_id in IDS
}


def evidence_baseline(selection) -> float:
    return float(mean(BASELINE_VALUE[candidate_id] for candidate_id in canonical(selection)))


def objective(selection, mode: str, override: dict[str, float] | None = None) -> float:
    if mode == "evidence_baseline":
        return evidence_baseline(selection)
    weights = override or CMP["objectives"]["full"]
    removed = GRAPH_TERMS if mode == "no_graph" else DIVERSITY_TERMS if mode == "no_diversity" else set()
    if mode not in {"full", "no_graph", "no_diversity"}:
        raise ValueError(mode)
    row = metrics(selection)
    return float(sum(
        float(weight) * float(row[OBJECTIVE_KEYS[key]])
        for key, weight in weights.items()
        if key not in removed
    ))


def feasible_walk(start, seed: int, steps: int = 128) -> tuple[str, ...]:
    rng = random.Random(seed)
    current = set(canonical(start))
    for _ in range(steps):
        candidate = (current - {rng.choice(sorted(current))}) | {rng.choice(sorted(VALIDATED - current))}
        if feasible(candidate):
            current = candidate
    return canonical(current)


def local_optimize(
    start,
    mode: str,
    seed: int,
    override: dict[str, float] | None = None,
    rounds: int = 12,
    swaps_per_round: int = 128,
) -> tuple[tuple[str, ...], float]:
    rng = random.Random(seed)
    current = canonical(start)
    current_score = objective(current, mode, override)
    for _ in range(rounds):
        swaps = [(outgoing, incoming) for outgoing in current for incoming in sorted(VALIDATED - set(current))]
        rng.shuffle(swaps)
        best, best_score = current, current_score
        for outgoing, incoming in swaps[:swaps_per_round]:
            candidate = canonical((set(current) - {outgoing}) | {incoming})
            if not feasible(candidate):
                continue
            score = objective(candidate, mode, override)
            if score > best_score + 1e-12 or (math.isclose(score, best_score, abs_tol=1e-12) and candidate < best):
                best, best_score = candidate, score
        if best == current:
            break
        current, current_score = best, best_score
    return current, current_score


def jaccard(left, right) -> float:
    a, b = set(left), set(right)
    return len(a & b) / len(a | b)


def run_search(mode: str, starts: list[tuple[str, ...]], seed_offset: int, override=None) -> dict:
    solutions = [local_optimize(start, mode, seed_offset + index, override) for index, start in enumerate(starts)]
    solutions.sort(key=lambda item: (-item[1], item[0]))
    best_set, best_score = solutions[0]
    similarities = [jaccard(best_set, selection) for selection, _ in solutions]
    return {
        "selected_ids": list(best_set),
        "objective": best_score,
        "metrics": metrics(best_set),
        "search_sensitivity": {
            "restarts": len(starts),
            "unique_optima": len({selection for selection, _ in solutions}),
            "best_to_worst_objective_spread": solutions[0][1] - solutions[-1][1],
            "minimum_jaccard_to_best": min(similarities),
            "mean_jaccard_to_best": mean(similarities),
        },
    }


def rounded(value):
    if isinstance(value, (float, np.floating)):
        return round(float(value), 8)
    if isinstance(value, list):
        return [rounded(item) for item in value]
    if isinstance(value, dict):
        return {key: rounded(item) for key, item in value.items()}
    return value


def main() -> None:
    assert TASK["basis"]["size"] == 288
    assert TASK["basis"]["observed"] + TASK["basis"]["unknown"] == 288
    assert len(CANDIDATES) == 64
    assert {
        batch: sum(candidate["batch"] == batch for candidate in CANDIDATES.values())
        for batch in ("current", "feature", "counterfactual", "recombination")
    } == {"current": 16, "feature": 16, "counterfactual": 16, "recombination": 16}
    for candidate_id, row in SCORE_ROWS.items():
        assert candidate_id in CANDIDATES
        assert abs(quality(row) - float(row["q"])) < 1e-7
        assert 0 <= float(row["r"]["Unsupported"]) <= 1

    assert CG["semantic_boundary"].startswith("Vertices are candidate trajectories")
    assert all(not CANDIDATE_ID.match(vertex) for vertex in SG["vertices"])
    assert all(member in set(SG["vertices"]) for edge in SG["hyperedges"] for member in edge["members"])
    assert CMP["classifications"]["candidate_graph_terms"] == "descriptive"
    assert CMP["classifications"]["software_invariant_graph_terms"] == "descriptive"
    assert CMP["classifications"]["causal_improvement"] == "unestablished"
    assert ABLATION["status"] == "unestablished"
    assert all(value is None for value in ABLATION["required_independent_outcomes"].values())
    assert CMP["search"]["random_feasible_baselines"] >= 1000

    seed = canonical(EXP["seed_selected_ids"])
    assert feasible(seed)
    restart_count = int(CMP["search"]["restarts_per_objective"])
    starts = [seed] + [feasible_walk(seed, 7000 + index) for index in range(restart_count - 1)]
    searches = {
        mode: run_search(mode, starts, 10000 * (index + 1))
        for index, mode in enumerate(("full", "no_graph", "no_diversity", "evidence_baseline"))
    }
    assert all(feasible(result["selected_ids"]) for result in searches.values())

    full_set = tuple(searches["full"]["selected_ids"])
    random_values = [
        objective(feasible_walk(seed, 50000 + index, steps=192), "full")
        for index in range(int(CMP["search"]["random_feasible_baselines"]))
    ]

    base_weights = {key: float(value) for key, value in CMP["objectives"]["full"].items()}
    perturbation = float(CMP["search"]["weight_perturbation_fraction"])
    weight_runs = []
    for run_index in range(int(CMP["search"]["weight_sensitivity_runs"])):
        rng = random.Random(90000 + run_index)
        varied = {key: value * (1.0 + rng.uniform(-perturbation, perturbation)) for key, value in base_weights.items()}
        sensitivity_starts = [full_set] + [
            feasible_walk(full_set, 91000 + run_index * 10 + offset) for offset in range(3)
        ]
        result = run_search("full", sensitivity_starts, 92000 + run_index * 100, varied)
        weight_runs.append({
            "jaccard_to_base": jaccard(full_set, result["selected_ids"]),
            "software_complete": float(result["metrics"]["software_complete"]),
            "software_fractional": float(result["metrics"]["software_fractional"]),
        })

    implementation_ids = canonical(IMP["selected_ids"])
    implementation_coverage = software_coverage(implementation_ids)
    planned_edges = VERIFY["software_edge_tests"]
    software_edge_ids = {edge["id"] for edge in SG["hyperedges"]}
    assert software_edge_ids == set(planned_edges)
    assert all(planned_edges[edge_id] for edge_id in software_edge_ids)

    report = {
        "trace": "trace007",
        "candidate_count": len(CANDIDATES),
        "score_dimensions": DIMS,
        "evidence_baseline_dimensions": {
            "positive": BASELINE_POSITIVE,
            "penalties": BASELINE_NEGATIVE,
        },
        "candidate_graph": {
            "vertices": len(IDS),
            "edges": len(EDGES),
            "sigma": SIGMA,
            "semantic_use": "candidate search only",
        },
        "software_invariant_hypergraph": {
            "vertices": len(SG["vertices"]),
            "edges": len(SG["hyperedges"]),
            "implementation_coverage": implementation_coverage,
            "proof_plan_complete": software_edge_ids == set(planned_edges),
        },
        "equal_feasibility_searches": searches,
        "random_feasible_baseline": {
            "count": len(random_values),
            "minimum": min(random_values),
            "mean": mean(random_values),
            "maximum": max(random_values),
            "full_percentile": sum(value <= searches["full"]["objective"] for value in random_values) / len(random_values),
        },
        "weight_sensitivity": {
            "runs": len(weight_runs),
            "minimum_jaccard": min(row["jaccard_to_base"] for row in weight_runs),
            "mean_jaccard": mean(row["jaccard_to_base"] for row in weight_runs),
            "minimum_software_complete": min(row["software_complete"] for row in weight_runs),
            "minimum_software_fractional": min(row["software_fractional"] for row in weight_runs),
        },
        "classifications": {
            "graph_terms": "descriptive",
            "diversity_terms": (
                "selection-influencing"
                if searches["full"]["selected_ids"] != searches["no_diversity"]["selected_ids"]
                else "descriptive"
            ),
            "causal_improvement": "unestablished",
        },
    }
    print(json.dumps(rounded(report), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

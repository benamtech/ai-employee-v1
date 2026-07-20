#!/usr/bin/env python3
"""Compute the trace003 WS-04 destructive Host Provisioner decision model.

Dependency-free on purpose: the repository's primary toolchain is Node, so this
script uses only the Python standard library while still computing every matrix,
spectral proxy, Koopman proxy, utility, and selected design it records.
"""
from __future__ import annotations

import itertools
import json
import math
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

ROOT = Path(__file__).resolve().parent
EPS = 1e-9
RIDGE = 0.05
RBF_GAMMA = 1.25
OMEGA = 0.16
XI = 0.13

S12 = ["source", "test", "CI", "branch", "docs", "memory", "runtime", "deploy", "provider", "script", "API", "state"]
I8 = ["authority", "fail-closed", "idempotency", "effects", "observability", "recovery", "frontier", "future-bug"]
B96 = [f"{s}:{i}" for s in S12 for i in I8]

V = [
    "docker_failure_ok_leak", "destructive_command_executor", "docker_timeout_ambiguity",
    "docker_output_validation", "remove_runtime", "suspend_runtime",
    "replace_restore_remove_phase", "host_failure_response", "host_audit_evidence",
    "manager_require_provisioner", "manager_command_failure_record",
    "ws05_health_projection_guard", "focused_contract_tests", "full_ws04_acceptance",
    "dns_tls", "real_secret_store", "registry_release_evidence", "db_p0_02_07", "broad_ws05",
]

E = {
    2: [
        (["docker_failure_ok_leak", "remove_runtime"], 1.0),
        (["docker_failure_ok_leak", "suspend_runtime"], 1.0),
        (["manager_require_provisioner", "manager_command_failure_record"], 0.9),
        (["host_failure_response", "host_audit_evidence"], 0.9),
        (["manager_command_failure_record", "ws05_health_projection_guard"], 1.0),
        (["focused_contract_tests", "destructive_command_executor"], 0.8),
    ],
    3: [
        (["docker_failure_ok_leak", "destructive_command_executor", "remove_runtime"], 1.0),
        (["docker_failure_ok_leak", "destructive_command_executor", "suspend_runtime"], 1.0),
        (["docker_timeout_ambiguity", "destructive_command_executor", "host_failure_response"], 1.0),
        (["docker_output_validation", "destructive_command_executor", "host_failure_response"], 0.95),
        (["remove_runtime", "replace_restore_remove_phase", "manager_command_failure_record"], 1.0),
        (["manager_require_provisioner", "manager_command_failure_record", "ws05_health_projection_guard"], 1.0),
    ],
    4: [
        (["remove_runtime", "destructive_command_executor", "host_failure_response", "host_audit_evidence"], 1.0),
        (["suspend_runtime", "destructive_command_executor", "manager_command_failure_record", "ws05_health_projection_guard"], 1.0),
        (["manager_require_provisioner", "host_failure_response", "manager_command_failure_record", "ws05_health_projection_guard"], 0.95),
        (["focused_contract_tests", "remove_runtime", "suspend_runtime", "replace_restore_remove_phase"], 0.9),
    ],
    5: [
        (["docker_failure_ok_leak", "destructive_command_executor", "host_failure_response", "manager_command_failure_record", "ws05_health_projection_guard"], 1.0),
        (["manager_require_provisioner", "host_failure_response", "host_audit_evidence", "manager_command_failure_record", "ws05_health_projection_guard"], 1.0),
    ],
}

TRAJECTORIES = {
    "T1_destructive_executor": {
        "nodes": ["destructive_command_executor", "docker_timeout_ambiguity", "docker_output_validation", "remove_runtime", "suspend_runtime", "replace_restore_remove_phase"],
        "phi": [0.98, 0.97, 0.93, 0.90, 0.96, 0.86, 0.95, 0.24, 0.42, 0.72, 0.84, 0.88, 0.90, 0.05],
        "disposition": "admit",
    },
    "T2_host_evidence": {
        "nodes": ["host_failure_response", "host_audit_evidence", "docker_timeout_ambiguity", "docker_output_validation"],
        "phi": [0.90, 0.88, 0.82, 0.88, 0.91, 0.83, 0.87, 0.22, 0.35, 0.76, 0.76, 0.84, 0.88, 0.06],
        "disposition": "admit",
    },
    "T3_manager_projection_guard": {
        "nodes": ["manager_require_provisioner", "manager_command_failure_record", "ws05_health_projection_guard", "host_failure_response"],
        "phi": [0.94, 0.95, 0.90, 0.93, 0.94, 0.84, 0.91, 0.25, 0.40, 0.78, 0.82, 0.86, 0.92, 0.05],
        "disposition": "admit",
    },
    "T4_red_and_regression_tests": {
        "nodes": ["focused_contract_tests", "destructive_command_executor", "manager_command_failure_record", "ws05_health_projection_guard"],
        "phi": [0.83, 0.78, 0.86, 0.80, 0.89, 0.96, 0.88, 0.20, 0.30, 0.80, 0.72, 0.74, 0.85, 0.04],
        "disposition": "admit",
    },
    "T5_full_ws04_acceptance": {"nodes": ["full_ws04_acceptance"], "phi": [0.62, 0.58, 0.50, 0.45, 0.40, 0.30, 0.12, 0.98, 0.20, 0.18, 0.22, 0.36, 0.24, 0.76], "disposition": "reject"},
    "T6_dns_tls": {"nodes": ["dns_tls"], "phi": [0.30, 0.20, 0.18, 0.22, 0.30, 0.16, 0.06, 0.82, 0.18, 0.16, 0.10, 0.22, 0.18, 0.70], "disposition": "reject"},
    "T7_real_secret_store": {"nodes": ["real_secret_store"], "phi": [0.46, 0.38, 0.32, 0.34, 0.36, 0.20, 0.08, 0.94, 0.22, 0.20, 0.14, 0.30, 0.24, 0.74], "disposition": "reject"},
    "T8_registry_release_evidence": {"nodes": ["registry_release_evidence"], "phi": [0.40, 0.32, 0.25, 0.30, 0.44, 0.24, 0.10, 0.86, 0.28, 0.24, 0.16, 0.28, 0.22, 0.68], "disposition": "reject"},
    "T9_db_p0_02_07": {"nodes": ["db_p0_02_07"], "phi": [0.58, 0.50, 0.48, 0.42, 0.54, 0.32, 0.04, 1.00, 0.16, 0.12, 0.14, 0.40, 0.26, 0.82], "disposition": "reject"},
    "T10_broad_ws05": {"nodes": ["broad_ws05"], "phi": [0.42, 0.34, 0.30, 0.36, 0.48, 0.28, 0.10, 0.96, 0.22, 0.18, 0.20, 0.34, 0.20, 0.80], "disposition": "reject"},
}

PHI_NAMES = ["IG", "BV", "N", "C", "Adj", "Risk", "Cost", "Scope", "Fresh", "VF", "MI_p", "VNE_p", "lambda_p", "Residual"]
UTILITY_WEIGHTS = {
    "IG": 1.00, "BV": 0.90, "N": 0.55, "C": 0.65, "Adj": 1.10,
    "VF": 0.75, "MI_p": 0.45, "VNE_p": 0.30, "Risk": -0.70,
    "Cost": -0.55, "Scope": -1.00, "Fresh": 0.35, "lambda_p": 0.20, "Residual": -1.10,
}

Z_NAMES = ["ok_leak", "failure_detected", "ambiguity_preserved", "durable_evidence", "healthy_projection_blocked", "manager_route_preserved", "focused_tests", "regression_confidence"]
Z = {
    "z0_initial_projection": [1.00, 0.05, 0.00, 0.25, 0.10, 0.90, 0.10, 0.15],
    "z1_inspection": [1.00, 0.30, 0.15, 0.40, 0.20, 0.95, 0.25, 0.25],
    "z2_red_test": [1.00, 0.62, 0.42, 0.52, 0.44, 0.95, 0.82, 0.36],
    "z3_patch": [0.08, 0.94, 0.90, 0.88, 0.90, 0.96, 0.84, 0.60],
    "z4_verification": [0.02, 0.98, 0.95, 0.94, 0.96, 0.98, 0.96, 0.88],
}


def zeros(rows: int, cols: int) -> List[List[float]]:
    return [[0.0 for _ in range(cols)] for _ in range(rows)]


def transpose(a: Sequence[Sequence[float]]) -> List[List[float]]:
    return [list(row) for row in zip(*a)]


def matmul(a: Sequence[Sequence[float]], b: Sequence[Sequence[float]]) -> List[List[float]]:
    bt = transpose(b)
    return [[sum(x * y for x, y in zip(row, col)) for col in bt] for row in a]


def identity(n: int) -> List[List[float]]:
    out = zeros(n, n)
    for i in range(n):
        out[i][i] = 1.0
    return out


def inverse(a: Sequence[Sequence[float]]) -> List[List[float]]:
    n = len(a)
    aug = [list(map(float, row)) + ident for row, ident in zip(a, identity(n))]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < EPS:
            raise ValueError("singular_matrix")
        aug[col], aug[pivot] = aug[pivot], aug[col]
        scale = aug[col][col]
        aug[col] = [v / scale for v in aug[col]]
        for row in range(n):
            if row == col:
                continue
            factor = aug[row][col]
            aug[row] = [x - factor * y for x, y in zip(aug[row], aug[col])]
    return [row[n:] for row in aug]


def determinant(a: Sequence[Sequence[float]]) -> float:
    m = [list(map(float, row)) for row in a]
    n = len(m)
    det = 1.0
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(m[r][col]))
        if abs(m[pivot][col]) < EPS:
            return 0.0
        if pivot != col:
            m[col], m[pivot] = m[pivot], m[col]
            det *= -1.0
        pivot_value = m[col][col]
        det *= pivot_value
        for row in range(col + 1, n):
            factor = m[row][col] / pivot_value
            for j in range(col + 1, n):
                m[row][j] -= factor * m[col][j]
    return det


def jacobi_eigenvalues(a: Sequence[Sequence[float]], max_iter: int = 200, tol: float = 1e-12) -> List[float]:
    m = [list(map(float, row)) for row in a]
    n = len(m)
    for _ in range(max_iter):
        p, q, max_val = 0, 1 if n > 1 else 0, 0.0
        for i in range(n):
            for j in range(i + 1, n):
                if abs(m[i][j]) > max_val:
                    p, q, max_val = i, j, abs(m[i][j])
        if max_val < tol:
            break
        angle = math.pi / 4 if abs(m[p][p] - m[q][q]) < EPS else 0.5 * math.atan2(2 * m[p][q], m[q][q] - m[p][p])
        c, s = math.cos(angle), math.sin(angle)
        app, aqq, apq = m[p][p], m[q][q], m[p][q]
        m[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq
        m[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq
        m[p][q] = m[q][p] = 0.0
        for r in range(n):
            if r in (p, q):
                continue
            arp, arq = m[r][p], m[r][q]
            m[r][p] = m[p][r] = c * arp - s * arq
            m[r][q] = m[q][r] = s * arp + c * arq
    return sorted((max(0.0, m[i][i]) for i in range(n)), reverse=True)


def incidence(nodes: Sequence[str], edges: Sequence[Tuple[Sequence[str], float]]) -> List[List[int]]:
    index = {node: i for i, node in enumerate(nodes)}
    out = zeros(len(nodes), len(edges))
    for j, (members, _) in enumerate(edges):
        for node in members:
            out[index[node]][j] = 1
    return [[int(v) for v in row] for row in out]


def normalized_hypergraph_laplacian(nodes: Sequence[str], edges: Sequence[Tuple[Sequence[str], float]]) -> List[List[float]]:
    h = incidence(nodes, edges)
    weights = [weight for _, weight in edges]
    edge_degree = [sum(h[i][j] for i in range(len(nodes))) for j in range(len(edges))]
    vertex_degree = [sum(weights[j] * h[i][j] for j in range(len(edges))) for i in range(len(nodes))]
    l = identity(len(nodes))
    for i in range(len(nodes)):
        for j in range(len(nodes)):
            coupling = sum(weights[e] / max(edge_degree[e], 1) for e in range(len(edges)) if h[i][e] and h[j][e])
            denom = math.sqrt(max(vertex_degree[i], EPS) * max(vertex_degree[j], EPS))
            l[i][j] -= coupling / denom
    return l


def rbf_kernel(vectors: Sequence[Sequence[float]]) -> List[List[float]]:
    n = len(vectors)
    k = zeros(n, n)
    for i in range(n):
        for j in range(n):
            dist2 = sum((a - b) ** 2 for a, b in zip(vectors[i], vectors[j]))
            k[i][j] = math.exp(-RBF_GAMMA * dist2) + (1e-6 if i == j else 0.0)
    return k


def vne(eigenvalues: Sequence[float]) -> float:
    total = sum(eigenvalues)
    if total <= EPS:
        return 0.0
    probs = [value / total for value in eigenvalues if value > EPS]
    return -sum(p * math.log(p) for p in probs)


def fit_koopman(states: Sequence[Sequence[float]]) -> List[List[float]]:
    x = transpose(states[:-1])
    y = transpose(states[1:])
    xt = transpose(x)
    regularized = matmul(x, xt)
    for i in range(len(regularized)):
        regularized[i][i] += RIDGE
    return matmul(matmul(y, xt), inverse(regularized))


def utility(phi: Sequence[float]) -> float:
    values = dict(zip(PHI_NAMES, phi))
    return sum(UTILITY_WEIGHTS[name] * values[name] for name in PHI_NAMES)


def hyperedge_cut(selected_nodes: set[str], all_edges: Sequence[Tuple[Sequence[str], float]]) -> float:
    cut = 0.0
    for members, weight in all_edges:
        in_count = sum(1 for node in members if node in selected_nodes)
        if 0 < in_count < len(members):
            cut += weight
    return cut


def principal_submatrix(matrix: Sequence[Sequence[float]], indices: Sequence[int]) -> List[List[float]]:
    return [[matrix[i][j] for j in indices] for i in indices]


def select_design(ids: Sequence[str], kernel: Sequence[Sequence[float]], utilities: Dict[str, float], max_size: int = 4) -> Tuple[List[str], float, Dict[str, float]]:
    all_edges = [edge for order in sorted(E) for edge in E[order]]
    best_ids: List[str] = []
    best_score = -1e9
    diagnostics: Dict[str, float] = {}
    for size in range(1, max_size + 1):
        for combo in itertools.combinations(range(len(ids)), size):
            chosen = [ids[i] for i in combo]
            selected_nodes = {node for tid in chosen for node in TRAJECTORIES[tid]["nodes"]}
            sub = principal_submatrix(kernel, combo)
            det = max(determinant([[sub[i][j] + (1e-6 if i == j else 0.0) for j in range(size)] for i in range(size)]), EPS)
            score = sum(utilities[tid] for tid in chosen) + OMEGA * math.log(det) - XI * hyperedge_cut(selected_nodes, all_edges)
            diagnostics["|".join(chosen)] = score
            if score > best_score:
                best_ids, best_score = chosen, score
    return best_ids, best_score, diagnostics


def round_matrix(matrix: Sequence[Sequence[float]], digits: int = 6) -> List[List[float]]:
    return [[round(v, digits) for v in row] for row in matrix]


def main() -> None:
    ordered_edges = [edge for order in sorted(E) for edge in E[order]]
    incidence_by_order = {
        str(order): {
            "shape": [len(V), len(E[order])],
            "nonzero": [[i, j] for j, (members, _) in enumerate(E[order]) for i, node in enumerate(V) if node in members],
        }
        for order in sorted(E)
    }
    laplacian = normalized_hypergraph_laplacian(V, ordered_edges)
    laplacian_eigs = jacobi_eigenvalues(laplacian)

    trajectory_ids = list(TRAJECTORIES)
    phi_vectors = [TRAJECTORIES[tid]["phi"] for tid in trajectory_ids]
    kernel = rbf_kernel(phi_vectors)
    kernel_eigs = jacobi_eigenvalues(kernel)
    entropy = vne(kernel_eigs)
    utilities = {tid: utility(TRAJECTORIES[tid]["phi"]) for tid in trajectory_ids}
    selected, selected_score, subset_scores = select_design(trajectory_ids, kernel, utilities)

    states = list(Z.values())
    koopman = fit_koopman(states)
    predicted_z4 = [sum(koopman[i][j] * states[-2][j] for j in range(len(Z_NAMES))) for i in range(len(Z_NAMES))]
    koopman_residual = math.sqrt(sum((predicted_z4[i] - states[-1][i]) ** 2 for i in range(len(Z_NAMES))))

    decision_matrix = {
        "basis": {"S12": S12, "I8": I8, "B96": B96, "projection": "Z0 = Pi_B96(X)"},
        "V": V,
        "E_by_order": {str(order): [{"members": members, "weight": weight} for members, weight in E[order]] for order in sorted(E)},
        "A_by_order": incidence_by_order,
        "L_H": {"shape": [len(V), len(V)], "nonzero": [[i, j, round(laplacian[i][j], 8)] for i in range(len(V)) for j in range(len(V)) if abs(laplacian[i][j]) > 1e-10]},
        "spectral_proxy": {
            "eigenvalues": [round(v, 8) for v in laplacian_eigs],
            "spectral_gap_proxy": round(sorted(laplacian_eigs)[1] if len(laplacian_eigs) > 1 else 0.0, 8),
            "trace": round(sum(laplacian[i][i] for i in range(len(laplacian))), 8),
        },
        "Phi_names": PHI_NAMES,
        "trajectories": {tid: {**value, "U": round(utilities[tid], 6)} for tid, value in TRAJECTORIES.items()},
        "K_D": round_matrix(kernel),
        "K_D_eigenvalues": [round(v, 8) for v in kernel_eigs],
        "VNE_p": round(entropy, 8),
        "selection_parameters": {"omega": OMEGA, "xi": XI, "epsilon": 1e-6, "max_size": 4},
        "top_subset_objectives": {key: round(value, 6) for key, value in sorted(subset_scores.items(), key=lambda kv: kv[1], reverse=True)[:20]},
    }

    selected_design = {
        "selected_D_star": selected,
        "objective": round(selected_score, 6),
        "selected_nodes": sorted({node for tid in selected for node in TRAJECTORIES[tid]["nodes"]}),
        "rejected_modes": [
            {"trajectory": tid, "nodes": TRAJECTORIES[tid]["nodes"], "reason": reason}
            for tid, reason in {
                "T5_full_ws04_acceptance": "broader than the destructive Docker failure invariant and lacks target-host proof",
                "T6_dns_tls": "non-adjacent DNS/TLS scope",
                "T7_real_secret_store": "real secret-store is explicitly out of scope",
                "T8_registry_release_evidence": "registry/digest release work is non-adjacent",
                "T9_db_p0_02_07": "DB-P0-02..07 are not prerequisites for this patch",
                "T10_broad_ws05": "only the lifecycle health projection guard is adjacent; broad WS-05 is rejected",
            }.items()
        ],
        "unresolved_nodes": ["full_ws04_acceptance", "dns_tls", "real_secret_store", "registry_release_evidence", "db_p0_02_07", "broad_ws05"],
    }

    plan_state_vectors = {
        "dimensions": Z_NAMES,
        "checkpoints": Z,
        "koopman": {
            "accepted": True,
            "definition": "z_t checkpoints are the eight-dimensional rollout vectors listed above; K is ridge least-squares fitted across z0->z1->z2->z3->z4",
            "ridge_lambda": RIDGE,
            "K_hat": round_matrix(koopman),
            "predicted_z4_from_z3": [round(v, 6) for v in predicted_z4],
            "observed_z4": states[-1],
            "residual_l2": round(koopman_residual, 8),
        },
        "posterior_prior": {"theta_1": 0.92, "theta_2": 0.58, "theta_3": 0.91, "theta_4": 0.72},
        "posterior_expected_after_selected_design": {"theta_1": 0.06, "theta_2": 0.96, "theta_3": 0.08, "theta_4": 0.10},
    }

    (ROOT / "decision_matrix.json").write_text(json.dumps(decision_matrix, separators=(",", ":")) + "\n")
    (ROOT / "selected_design.json").write_text(json.dumps(selected_design, indent=2) + "\n")
    (ROOT / "plan_state_vectors.json").write_text(json.dumps(plan_state_vectors, indent=2) + "\n")

    summary = {
        "vertices": len(V),
        "hyperedges": {str(order): len(E[order]) for order in sorted(E)},
        "spectral_gap_proxy": decision_matrix["spectral_proxy"]["spectral_gap_proxy"],
        "VNE_p": decision_matrix["VNE_p"],
        "koopman_residual_l2": plan_state_vectors["koopman"]["residual_l2"],
        "selected_D_star": selected,
        "objective": selected_design["objective"],
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

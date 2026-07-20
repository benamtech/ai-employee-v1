#!/usr/bin/env python3
from __future__ import annotations
import base64, json, zlib
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent

def load(name):
    raw=json.loads((ROOT/name).read_text())
    if raw.get("encoding")=="zlib+base64+json":
        return json.loads(zlib.decompress(base64.b64decode(raw["payload"])))
    return raw

S=load("candidate_scores.json")
P=load("candidate_population.json")
H=load("hypergraph.json")
C=load("selection_comparison.json")
E=load("selected_exploration.json")
I=load("selected_implementation.json")
dims=S["dimensions"]; weights=S["weights"]
rows={r["id"]:r for r in S["rows"]}
pop={r["id"]:r for r in P["candidates"]}

def q(row):
    return sum(weights[d]*row["r"][d] for d in dims)

def main():
    assert len(pop)==64 and len(rows)==64
    assert {b:sum(x["batch"]==b for x in pop.values()) for b in ("current","feature","counterfactual","recombination")}=={"current":16,"feature":16,"counterfactual":16,"recombination":16}
    for cid,row in rows.items():
        assert abs(q(row)-row["q"])<2e-6, cid
        assert all(0<=row["r"][d]<=1 for d in dims)
    selected=E["selected_ids"]
    assert len(selected)<=16
    ws={w for cid in selected for w in pop[cid]["workstreams"]}
    zs={z for cid in selected for z in pop[cid]["z_spaces"]}
    assert ws=={"WS06","WS07","WS08_g"}
    assert zs=={"work","commercial","provider","authority","failure","proof","operator","future"}
    assert len(C["random_feasible"]["sample"])>=100
    assert C["causality"]["material_change"] is True
    impl=[x["id"] for x in I["selected"]]
    assert impl==["D01","D02","D03","D04","D06","D07"]
    inc=np.array(H["incidence_matrix"]["values"],float)
    lap=np.array(H["normalized_hypergraph_laplacian"]["values"],float)
    assert inc.shape[0]==64 and lap.shape==(64,64)
    assert np.max(np.abs(lap-lap.T))<2e-6
    print(json.dumps({"candidates":64,"selected_exploration":selected,"selected_implementation":impl,"J":E["metrics"]["J"],"graph_diversity":"causal"},indent=2))

if __name__=="__main__":
    main()

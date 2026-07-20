#!/usr/bin/env python3
"""Recompute and verify the public trace005 decision artifacts.

All inputs are committed public descriptors. Compressed JSON wrappers use
zlib+base64 only to keep the repository checkpoint reviewable.
"""
from __future__ import annotations
from pathlib import Path
import base64, hashlib, itertools, json, math, random, zlib
import numpy as np

ROOT=Path(__file__).resolve().parent
R_DIMS=["IG","BV","N","Adj","CrossLens","FutureBug","FeatureYield","ArchLeverage","VF","Testability","Reversibility","ProofDensity","Risk","Cost","Scope","Unsupported"]
WEIGHTS=np.array([.08,.12,.06,.08,.08,.07,.07,.08,.08,.07,.07,.08,-.10,-.07,-.08,-.10],float)
Z_SPACES={"work","commercial","provider","authority","failure","proof","operator","future"}
WORKSTREAMS={"WS06","WS07","WS08_g"}
EPS=1e-9

def load(name):
    data=json.loads((ROOT/name).read_text())
    if data.get("encoding")!="zlib+base64":
        return data
    raw=zlib.decompress(base64.b64decode(data["payload"]))
    assert hashlib.sha256(raw).hexdigest()==data["uncompressed_sha256"]
    assert len(raw)==data["uncompressed_bytes"]
    return json.loads(raw)

TASK=load("task_state.json")
POP=load("candidate_population.json")
SCORES=load("candidate_scores.json")
GRAPH=load("hypergraph.json")
COMPARE=json.loads((ROOT/"selection_comparison.json").read_text())
EXPLORE=json.loads((ROOT/"selected_exploration.json").read_text())
IMPLEMENT=json.loads((ROOT/"selected_implementation.json").read_text())
TEMPLATES=json.loads((ROOT/"thought_templates.json").read_text())
COUNTER=json.loads((ROOT/"counterexample_matrix.json").read_text())
CONTRACT=json.loads((ROOT/"implementation_contract.json").read_text())
VERIFY=json.loads((ROOT/"verification_plan.json").read_text())

C={c["id"]:c for c in POP}
SC={s["id"]:s for s in SCORES}
IDS=list(C)
IDX={x:i for i,x in enumerate(IDS)}

def evidence_classes(c):
    return {x for e in c["repo_evidence"] for x in e["classes"]}

def derive(c):
    s=c["signals"]; ec=evidence_classes(c)
    independent=len({e["path"] for e in c["repo_evidence"]})
    lenses=len(set(c["lenses"])); horizons=len(set(c["horizons"]))
    ws=len(set(c["workstreams"])); zs=len(set(c["spaces"]))
    support=min(1,s["supported_atoms"]/max(1,s["claim_atoms"]))
    unknown=1-support
    risk={"low":.20,"medium":.52,"high":.82}[s["risk_class"]]
    v={}
    v["IG"]=.15*min(independent,5)+.25*("current-defect" in ec)+.10*min(horizons/4,1)
    v["BV"]=.55*bool(s["p0"])+.25*("standard" in ec)+.20*("current-defect" in ec)
    v["N"]=.35*bool(s["feature"])+.25*(c["batch"] in ("B","D"))+.20*min(zs/4,1)+.20*support
    v["Adj"]=.45*(ws>1)+.25*("WS07" in c["workstreams"] and "WS06" in c["workstreams"])+.30*("WS08_g" in c["workstreams"])
    v["CrossLens"]=min(1,lenses/7)
    fh=set(c["horizons"])&{"concurrent","retry","timeout","acceptedLoss","crash","refund","future"}
    v["FutureBug"]=.15*min(len(fh),5)+.25*("current-defect" in ec)
    v["FeatureYield"]=.20*min(s["product_surface_count"],3)+.25*bool(s["feature"])+.15*min(ws/3,1)
    v["ArchLeverage"]=.35*bool(s["authority_central"])+.30*bool(s["shared_authority"])+.20*min(ws/3,1)+.15*("reusable" in ec)
    v["VF"]=.35*("current-defect" in ec)+.25*("migration" in ec)+.20*("source" in ec)+.20*bool(s["p0"])
    v["Testability"]=.30*bool(c["falsification_test"])+.25*("acceptance" in ec or "migration" in ec)+.25*(s["external_prereq_count"]==0)+.20*support
    v["Reversibility"]=.55*bool(s["reversible"])+.25*(not s["schema_change"])+.20*(s["risk_class"]!="high")
    v["ProofDensity"]=.12*min(s["proof_links"],6)+.28*("receipt" in c["lenses"])+.20*("proof" in c["lenses"])
    v["Risk"]=risk+.10*bool(s["schema_change"])+.08*bool(s["external_prereq_count"])
    v["Cost"]=.12*min(len(c["implementation_surface"]),5)+.12*bool(s["schema_change"])+.10*min(s["external_prereq_count"],2)
    v["Scope"]=.16*min(ws,3)+.08*min(lenses,6)+.06*min(len(c["implementation_surface"]),4)
    v["Unsupported"]=.65*unknown+.20*max(0,1-min(independent/3,1))+.15*(s["external_prereq_count"]>0)
    return {k:round(max(0,min(1,x)),6) for k,x in v.items()}

for cid,c in C.items():
    got=derive(c)
    assert got==SC[cid]["r"], (cid,got,SC[cid]["r"])
    q=float(WEIGHTS@np.array([got[k] for k in R_DIMS]))
    assert abs(q-SC[cid]["q"])<1e-7

# Rebuild the normalized hypergraph Laplacian from the committed incidence
# matrix and ordered edge weights. Named edge groups are independently checked.
named_edges=[e for arity in ("2","3","4","5","6") for e in GRAPH["edges_by_arity"][arity]]
for e in named_edges:
    assert e["arity"]==len(e["members"]) and 2<=e["arity"]<=6
H=np.array(GRAPH["incidence_matrix"],float)
ew=np.array(GRAPH["edge_weights"],float)
assert H.shape==(len(IDS),len(ew))
assert set(np.unique(H)).issubset({0.0,1.0})
assert sum(len(GRAPH["edges_by_arity"][str(k)]) for k in range(2,7))==len(ew)
de=H.sum(0); dv=(H*ew).sum(1)
Dv=np.diag(1/np.sqrt(np.maximum(dv,EPS))); De=np.diag(1/np.maximum(de,EPS))
L=np.eye(len(IDS))-Dv@H@np.diag(ew)@De@H.T@Dv
assert np.allclose(L,np.array(GRAPH["normalized_laplacian"]),atol=1e-9)
assert np.allclose(np.linalg.eigvalsh((L+L.T)/2),np.array(GRAPH["laplacian_eigenvalues"]),atol=1e-8)

R=np.array([[SC[cid]["r"][k] for k in R_DIMS] for cid in IDS])
dist=np.sqrt(((R[:,None,:]-R[None,:,:])**2).sum(2))
sigma=float(np.median(dist[dist>0]))
S=np.exp(-(dist**2)/(2*sigma*sigma))
assert abs(sigma-GRAPH["rbf"]["sigma"])<1e-12
assert np.allclose(S,np.array(GRAPH["rbf"]["similarity_matrix"]),atol=1e-9)

def metrics(sel):
    si=[IDX[x] for x in sel]; n=len(si)
    rbf=S[np.ix_(si,si)]
    off=[rbf[i,j] for i in range(n) for j in range(i+1,n)]
    redundancy=float(np.mean(off)) if off else 0
    d=dist[np.ix_(si,si)]
    pairs=[d[i,j] for i in range(n) for j in range(i+1,n)]
    sep_min=float(min(pairs)) if pairs else 0
    sep_mean=float(np.mean(pairs)) if pairs else 0
    rho=rbf/max(np.trace(rbf),EPS)
    vals=np.linalg.eigvalsh((rho+rho.T)/2); vals=vals[vals>1e-12]
    vne=float(-np.sum(vals*np.log(vals))/math.log(n)) if n>1 else 0
    selected_rows=set(si)
    covered=sum(ew[j] for j in range(H.shape[1]) if any(H[i,j] for i in selected_rows))/sum(ew)
    ws={w for x in sel for w in C[x]["workstreams"]}
    zs={z for x in sel for z in C[x]["spaces"]}
    coverage=1.0 if ws==WORKSTREAMS and zs==Z_SPACES else 0.0
    allcells={(c["workstreams"][0],c["spaces"][0],c["signals"]["failure_class"],c["implementation_surface"][0]) for c in POP}
    cells={(C[x]["workstreams"][0],C[x]["spaces"][0],C[x]["signals"]["failure_class"],C[x]["implementation_surface"][0]) for x in sel}
    qbar=float(np.mean([SC[x]["q"] for x in sel]))
    qd=len(cells)/len(allcells)
    J=.30*qbar+.20*coverage+.10*covered+.10*sep_min+.10*sep_mean+.10*vne+.10*qd-.15*redundancy
    return {"q_bar":qbar,"C_Omega":coverage,"C_H":covered,"Sep_min":sep_min,"Sep_mean":sep_mean,
            "VNE":vne,"QD":qd,"Redundancy":redundancy,"J":J}

for key in ("joint","utility_only","diversity_only"):
    expected=COMPARE[key]["metrics"]; got=metrics(COMPARE[key]["selected_ids"])
    for metric,value in got.items(): assert abs(value-expected[metric])<1e-8,(key,metric,value,expected[metric])
assert metrics(EXPLORE["selected_ids"])["C_Omega"]==1
assert len(EXPLORE["selected_ids"])<=16
assert set(IMPLEMENT["selected_ids"]).issubset(EXPLORE["selected_ids"])
assert len(IMPLEMENT["selected_ids"])<=6
assert len(C)==64 and {b:sum(c["batch"]==b for c in POP) for b in "ABCD"}=={"A":16,"B":16,"C":16,"D":16}
assert TASK["basis"]["size"]==288
assert TASK["basis"]["task_vector_summary"]["observed"]+TASK["basis"]["task_vector_summary"]["unknown"]==288
assert TEMPLATES["selected_ids"]==["TM01","TM02","TM03","TM04","TM05","TM06"]
assert all(case["behavioral_test_required"] for case in COUNTER["cases"])
assert CONTRACT["selected_trajectories"]==IMPLEMENT["selected_ids"]
assert VERIFY["promotion_rule"].startswith("No evidence class promotes")

print(json.dumps({
 "trace":"trace005","candidate_count":len(C),"basis":TASK["basis"]["task_vector_summary"],
 "selected_templates":TEMPLATES["selected_ids"],"exploration":EXPLORE["selected_ids"],
 "implementation":IMPLEMENT["selected_ids"],"joint_metrics":metrics(EXPLORE["selected_ids"]),
 "graph_diversity_terms":COMPARE["materiality"]["graph_diversity_terms"],
 "feasible_random_selections":COMPARE["random"]["feasible_samples"],
},indent=2))

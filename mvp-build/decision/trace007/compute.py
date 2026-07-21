#!/usr/bin/env python3
from __future__ import annotations
import base64, hashlib, json, math, random, zlib
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent
def load(n):
    data=json.loads((ROOT/n).read_text())
    if data.get("encoding")=="zlib+base64+json":
        raw=zlib.decompress(base64.b64decode(data["payload"]))
        assert hashlib.sha256(raw).hexdigest()==data["sha256"] and len(raw)==data["bytes"]
        return json.loads(raw)
    return data
TASK=load("task_state.json"); POP=load("candidate_population.json"); SCORES=load("candidate_scores.json")
HG=load("hypergraph.json"); CMP=load("selection_comparison.json"); EXP=load("selected_exploration.json"); IMP=load("selected_implementation.json")
D=SCORES["dimensions"]; W=SCORES["weights"]; C={x["id"]:x for x in POP["candidates"]}; S={x["id"]:x for x in SCORES["rows"]}
IDS=[x["id"] for x in POP["candidates"]]; IDX={x:i for i,x in enumerate(IDS)}

def q(row): return sum(W[d]*row["r"][d] for d in D)
def rebuild():
    edges=HG["edges"]; H=np.zeros(tuple(HG["incidence_matrix"]["shape"]))
    for j,e in enumerate(edges):
        for x in e["members"]: H[IDX[x],j]=1
    ew=np.array([e["weight"] for e in edges],float); de=H.sum(0); dv=(H*ew).sum(1)
    L=np.eye(len(IDS))-np.diag(1/np.sqrt(np.maximum(dv,1e-9)))@H@np.diag(ew)@np.diag(1/np.maximum(de,1e-9))@H.T@np.diag(1/np.sqrt(np.maximum(dv,1e-9)))
    L=(L+L.T)/2
    R=np.array([[S[x]["r"][d] for d in D] for x in IDS]); dist=np.sqrt(((R[:,None,:]-R[None,:,:])**2).sum(2))
    sigma=float(np.median(dist[dist>0])); sim=np.exp(-(dist**2)/(2*sigma*sigma))
    return H,ew,L,dist,sim,sigma

def metrics(sel,H,ew,dist,sim):
    si=[IDX[x] for x in sel]; rbf=sim[np.ix_(si,si)]
    off=[rbf[i,j] for i in range(len(si)) for j in range(i+1,len(si))]
    red=float(np.mean(off)); d=dist[np.ix_(si,si)]; pairs=[d[i,j] for i in range(len(si)) for j in range(i+1,len(si))]
    rho=rbf/np.trace(rbf); vals=np.linalg.eigvalsh((rho+rho.T)/2); vals=vals[vals>1e-12]
    ws={w for x in sel for w in C[x]["workstreams"]}; zs={z for x in sel for z in C[x]["spaces"]}
    cov=1.0 if ws==set(TASK["basis"]["workstreams"]) and zs==set(TASK["z_spaces"]) else 0.0
    ch=sum(ew[j] for j in range(H.shape[1]) if any(H[i,j] for i in si))/sum(ew)
    cells={(C[x]["workstreams"][0],C[x]["spaces"][0],C[x]["concept"]) for x in sel}
    allcells={(c["workstreams"][0],c["spaces"][0],c["concept"]) for c in POP["candidates"] if c["status"]=="validated"}
    out={"q_bar":np.mean([S[x]["q"] for x in sel]),"C_Omega":cov,"C_H":ch,"Sep_min":min(pairs),"Sep_mean":np.mean(pairs),
         "VNE":-np.sum(vals*np.log(vals))/math.log(len(si)),"QD":len(cells)/min(16,len(allcells)),"Redundancy":red}
    out["J"]=.30*out["q_bar"]+.20*out["C_Omega"]+.10*out["C_H"]+.10*out["Sep_min"]+.10*out["Sep_mean"]+.10*out["VNE"]+.10*out["QD"]-.15*out["Redundancy"]
    return {k:round(float(v),8) for k,v in out.items()}

def main():
    assert TASK["basis"]["size"]==288 and TASK["basis"]["observed"]+TASK["basis"]["unknown"]==288
    assert len(C)==64 and {b:sum(c["batch"]==b for c in C.values()) for b in ("current","feature","counterfactual","recombination")}=={"current":16,"feature":16,"counterfactual":16,"recombination":16}
    for x,row in S.items(): assert abs(q(row)-row["q"])<1e-7 and 0<=row["r"]["Unsupported"]<=1
    H,ew,L,dist,sim,sigma=rebuild()
    assert hashlib.sha256(H.astype(np.uint8).tobytes()).hexdigest()==HG["incidence_matrix"]["sha256"]
    assert hashlib.sha256(np.round(L,12).astype(np.float64).tobytes()).hexdigest()==HG["normalized_hypergraph_laplacian"]["sha256"]
    assert hashlib.sha256(np.round(sim,12).astype(np.float64).tobytes()).hexdigest()==HG["rbf"]["similarity_sha256"]
    for name in ("joint","utility_only","diversity_only"):
        assert metrics(CMP[name]["selected_ids"],H,ew,dist,sim)==CMP[name]["metrics"]
    assert len(CMP["random_feasible"]["sample"])>=100 and CMP["causality"]["material_change"]
    assert metrics(EXP["selected_ids"],H,ew,dist,sim)["C_Omega"]==1
    assert IMP["selected_ids"]==["D01","D02","D03","D04","D06","D07"]
    print(json.dumps({"trace":"trace007","candidates":64,"J":CMP["joint"]["metrics"]["J"],"graph_diversity":CMP["causality"]["classification"],"implementation":IMP["selected_ids"]},indent=2))
if __name__=="__main__": main()

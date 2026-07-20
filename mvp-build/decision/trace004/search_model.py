#!/usr/bin/env python3
"""Recompute and verify trace004 public search artifacts.

Operates only on committed public descriptors, categorical predictions, and
rollout states. It does not expose or reconstruct private chain-of-thought.
"""
from __future__ import annotations
import base64, json, math, zlib
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent
S=json.loads((ROOT/'search_space.json').read_text())
H=json.loads((ROOT/'hypothesis_predictions.json').read_text())
HP=json.loads(zlib.decompress(base64.b64decode(H['prediction_payload'])))
Q=json.loads((ROOT/'qd_archive.json').read_text())
R=json.loads((ROOT/'rollout_ensemble.json').read_text())
RO=json.loads(zlib.decompress(base64.b64decode(R['rollout_payload'])))
KJ=json.loads((ROOT/'koopman_validation.json').read_text())
E=json.loads((ROOT/'selected_exploration.json').read_text())
I=json.loads((ROOT/'selected_implementation.json').read_text())
RS=S['scale']['r']; MS=S['scale']['metric']; ES=S['scale']['edge']
RD=S['r_dimensions']; W=S['quality_weights']; SIGMA=S['sigma']; KNN=S['knn']; BF=S['b_fields']

def mask_values(mask, vocabulary):
    return [value for index,value in enumerate(vocabulary) if mask & (1 << index)]

def decode(row):
    node_mask=int(row[8],16)
    return {'id':row[0],'batch':row[1],'title':row[2],
      'b':[S['b_vocab'][f][x] for f,x in zip(BF,row[3])],
      'r':[x/RS for x in row[4]],'q':row[5]/MS,'N':row[6]/MS,'Sep':row[7]/MS,
      'nodes':mask_values(node_mask,S['node_vocab']),
      'refs':mask_values(row[9],list(S['evidence_catalog']))}
ROWS=json.loads(zlib.decompress(base64.b64decode(S['candidate_payload'])))
C={c['id']:c for c in map(decode,ROWS)}

def q(c): return sum(W[d]*v for d,v in zip(RD,c['r']))
def dist(a,b): return math.sqrt(sum((x-y)**2 for x,y in zip(a['r'],b['r'])))
def sm(ids):
    a=np.array([C[i]['r'] for i in ids],float); d=((a[:,None,:]-a[None,:,:])**2).sum(2)
    return np.exp(-d/(2*SIGMA**2))
def vs(ids):
    m=sm(ids); rho=m/np.trace(m); vals=np.linalg.eigvalsh(rho); vals=vals[vals>1e-12]
    return float(np.exp(-np.sum(vals*np.log(vals))))
def redundancy(ids):
    m=sm(ids); return float(np.mean([m[i,j] for i in range(len(ids)) for j in range(i+1,len(ids))]))
def hyper(ids):
    nodes={n for i in ids for n in C[i]['nodes']}
    return sum(w/ES for idx,w in S['hyperedges'] if nodes.intersection(S['node_vocab'][x] for x in idx))
def categorical_sep(predictions):
    values=list(predictions[:len(H['hypotheses'])]); pairs=0; different=0
    for i in range(len(values)):
        for j in range(i+1,len(values)):
            pairs+=1; different+=values[i] != values[j]
    return different/pairs if pairs else 0.0
def nrmse(y,p):
    span=float(np.max(y)-np.min(y)) or 1.0
    return float(np.sqrt(np.mean((y-p)**2))/span)
def koopman(ridge):
    ro=RO; X=[];Y=[]
    for i in R['train_ids']:
        z=np.array(ro[i],float); X.extend(z[:-1]);Y.extend(z[1:])
    X=np.array(X).T;Y=np.array(Y).T
    op=Y@X.T@np.linalg.inv(X@X.T+ridge*np.eye(12))
    hX=[];hY=[]
    for i in R['holdout_ids']:
        z=np.array(ro[i],float); hX.extend(z[:-1]);hY.extend(z[1:])
    hX=np.array(hX).T;hY=np.array(hY).T; md=np.mean(Y-X,axis=1,keepdims=True)
    my=[];mp=[]
    for i in R['holdout_ids']:
        z=np.array(ro[i],float); p=z[0].copy()
        for t in range(1,6): p=op@p; my.append(z[t]);mp.append(p.copy())
    return {'train_one_step_nrmse':nrmse(Y,op@X),'holdout_one_step_nrmse':nrmse(hY,op@hX),
      'holdout_multistep_nrmse':nrmse(np.array(my),np.array(mp)),
      'identity_baseline_nrmse':nrmse(hY,hX),'mean_delta_baseline_nrmse':nrmse(hY,hX+md),
      'rank':int(np.linalg.matrix_rank(op)),'eigenvalue_moduli':[float(abs(v)) for v in np.linalg.eigvals(op)]}

def main():
    assert len(C)==64
    assert {b:sum(c['batch']==b for c in C.values()) for b in 'ABCD'}=={'A':16,'B':16,'C':16,'D':16}
    assert len(E['selected_ids'])==16 and len(I['selected'])<=3
    for c in C.values():
        assert abs(q(c)-c['q'])<2e-6
        ds=sorted(dist(c,o) for o in C.values() if o['id']!=c['id'])
        assert abs(sum(ds[:KNN])/KNN-c['N'])<2e-6
        assert abs(categorical_sep(HP[c['id']])-c['Sep'])<2e-6
        assert abs(HP[c['id']][-1]-c['Sep'])<2e-6
    elite={}
    for c in C.values():
        key='|'.join(c['b']); prior=elite.get(key)
        if prior is None or c['q']>C[prior]['q']: elite[key]=c['id']
    assert elite==Q['archive'] and len(elite)==Q['occupied_cells']
    ids=E['selected_ids']; m=E['metrics']
    assert abs(vs(ids)-m['VS'])<2e-6 and abs(redundancy(ids)-m['Redundancy'])<2e-6 and abs(hyper(ids)-m['C_H'])<2e-6
    for rec in KJ['sensitivity']:
        got=koopman(rec['ridge_lambda'])
        for k in ['train_one_step_nrmse','holdout_one_step_nrmse','holdout_multistep_nrmse','identity_baseline_nrmse','mean_delta_baseline_nrmse']:
            assert abs(got[k]-rec[k])<2e-6
        assert got['rank']==rec['rank']
    best=KJ['selected']; predictive=best['holdout_one_step_nrmse']<min(best['identity_baseline_nrmse'],best['mean_delta_baseline_nrmse'])
    assert KJ['koopman_search_proxy']==('predictive' if predictive else 'non_predictive')
    print(json.dumps({'generated':64,'selected':16,'archive_occupancy':len(elite),'VS':round(vs(ids),8),'C_H':round(hyper(ids),8),'koopman_search_proxy':KJ['koopman_search_proxy'],'implementation_ids':[x['id'] for x in I['selected']]},indent=2))
if __name__=='__main__': main()

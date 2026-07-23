#!/usr/bin/env python3
from __future__ import annotations
import argparse, hashlib, itertools, json, math, os, random, subprocess, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACE = Path(__file__).resolve().parent
SEED = 80820260721
DIMENSIONS = ["IG","BV","N","Adj","CrossLens","FutureBug","FeatureYield","ArchLeverage","VF","Testability","Reversibility","ProofDensity","Risk","Cost","Scope","Unsupported"]
W = {"IG":.10,"BV":.08,"N":.03,"Adj":.04,"CrossLens":.05,"FutureBug":.07,"FeatureYield":.04,"ArchLeverage":.07,"VF":.08,"Testability":.08,"Reversibility":.04,"ProofDensity":.09,"Risk":-.09,"Cost":-.04,"Scope":-.04,"Unsupported":-.06}
LAMBDAS = {"q":.22,"fractional":.18,"complete":.20,"separation":.10,"vne":.08,"qd":.10,"redundancy":.12}
BATCHES = ["direct_ws08","architecture_product","failure_operator_capacity","recombination"]
EVIDENCE_FILES = [
 "infra/deploy/docker-compose.production.yml","infra/scripts/production-topology.mjs","infra/scripts/production-normal-up.mjs",
 "infra/scripts/deploy-smoke.mjs","infra/scripts/deploy-rollback.mjs","infra/scripts/backup-restore.mjs",
 "infra/scripts/capacity-pod-alpha.mjs","infra/scripts/repair.mjs","infra/scripts/acceptance/release-evidence-spine.mjs",
 "apps/manager/src/provisioner-host.ts","apps/manager/src/lib/provisioning-reconciler.ts","package.json",
 "../.github/workflows/ws07-ws08-commercial-effect.yml","CODEGRAPH.md","STANDARD.md","STANDARD-V0.2-AMENDMENT-001.md",
 "decision/protocol-v1.json","decision/trace008/prior_model.json"
]

SOFTWARE_EDGES = [
 ("E_repository_closure",1.0,["source","migration","fixtures","types","unit","integration","build","workflow","artifact","pr_prose"]),
 ("E_temporal_authority",1.0,["replica_clock","database_clock","rate_window","lease","expiry","retry"]),
 ("E_ambiguity_terminality",1.2,["ambiguous","accepted_proof","nonacceptance_proof","operator_blocked","reservation_release","retry_permission"]),
 ("E_durable_truth",1.2,["database_mutation","returned_record","application_projection","audit","conservation"]),
 ("E_release",1.5,["git_sha","manager_digest","gateway_digest","provisioner_digest","web_digest","caddy_digest","compose_hash","config_hash","migration_head","signed_manifest","independent_verifier"]),
 ("E_effect_recovery",1.4,["command","effect","provider_receipt","accounting_receipt","proof","repair"]),
 ("E_restore",1.5,["backup_id","database_backup","filesystem_backup","secret_version","restore_result","proof_refinding"]),
 ("E_truthful_health",1.2,["five_service_state","dependency_health","migration_readiness","public_route","degraded_state"]),
 ("E_docker_authority",1.3,["host_provisioner","docker_socket","signed_request","idempotency","audit","manager_denial","gateway_denial"]),
 ("E_network_isolation",1.2,["employee_network","manager_attachment","gateway_attachment","hermes_attachment","cross_employee_denial","bounded_egress"]),
 ("E_whole_release_rollback",1.4,["prior_manifest","image_set","compose_config","migration_compatibility","accepted_work_check","rollback_smoke","rollback_proof"]),
 ("E_operator_recovery",1.1,["stable_crash_point","failure_state","safe_next_action","retry_permission","diagnostic_bundle"]),
 ("E_capacity_groundwork",.8,["employee_id","queue_depth","connection_count","sse_count","resource_sample","fairness","saturation_state","pilot_stop_schema"]),
]
EDGE_MAP = {e[0]: {"weight":e[1],"members":e[2]} for e in SOFTWARE_EDGES}

DIRECT = [
 ("canonical five-service compose closure","release",["five_service_state","compose_hash","config_hash","dependency_health"], ["infra/deploy/docker-compose.production.yml","infra/scripts/production-topology.mjs"]),
 ("separate exact-SHA gateway image","release",["git_sha","gateway_digest","manager_digest"],["infra/deploy/model-gateway.Dockerfile","infra/deploy/docker-compose.production.yml"]),
 ("truthful aggregate topology health","health",["five_service_state","dependency_health","migration_readiness","degraded_state"],["infra/scripts/deploy-smoke.mjs","infra/deploy/docker-compose.production.yml"]),
 ("recomputable release manifest","provenance",["git_sha","manager_digest","gateway_digest","provisioner_digest","web_digest","caddy_digest","compose_hash","config_hash","migration_head"],["infra/scripts/release-manifest.mjs"]),
 ("independent manifest signing and verification","provenance",["signed_manifest","independent_verifier","secret_version"],["infra/scripts/release-manifest.mjs","infra/scripts/verify-release-manifest.mjs"]),
 ("deterministic release fault injection","failure",["stable_crash_point","failure_state","diagnostic_bundle"],["infra/scripts/release-fault-injection.mjs"]),
 ("whole-release rollback executor","rollback",["prior_manifest","image_set","compose_config","migration_compatibility","accepted_work_check","rollback_smoke","rollback_proof"],["infra/scripts/deploy-rollback.mjs"]),
 ("complete backup bundle","restore",["backup_id","database_backup","filesystem_backup","secret_version"],["infra/scripts/backup-restore.mjs"]),
 ("restore continuity and proof refinding","restore",["restore_result","proof_refinding","accepted_work_check"],["infra/scripts/backup-restore.mjs","infra/scripts/restore-verify.mjs"]),
 ("release and effect telemetry lineage","telemetry",["command","effect","provider_receipt","accounting_receipt","proof","audit","diagnostic_bundle"],["infra/scripts/release-telemetry.mjs"]),
 ("Docker authority negative proof","authority",["host_provisioner","docker_socket","signed_request","manager_denial","gateway_denial","audit"],["tests/unit/ws08-release-authority.test.ts"]),
 ("employee network isolation proof","network",["employee_network","manager_attachment","gateway_attachment","hermes_attachment","cross_employee_denial"],["infra/scripts/acceptance/target-host-two-employee-isolation.mjs"]),
 ("bounded egress descriptor and verifier","network",["bounded_egress","employee_network","diagnostic_bundle"],["infra/scripts/egress-policy.mjs"]),
 ("migration rollback compatibility contract","migration",["migration_head","migration_compatibility","accepted_work_check"],["infra/scripts/migration-rollback-compatibility.mjs"]),
 ("operator recovery terminality","operator",["operator_blocked","safe_next_action","retry_permission","failure_state"],["infra/scripts/operator-recovery.mjs"]),
 ("exact-SHA reproducible image workflow","build",["source","types","unit","integration","build","workflow","artifact","git_sha","manager_digest","gateway_digest","provisioner_digest","web_digest","caddy_digest"],[".github/workflows/ws08-ws09-release.yml"]),
]
EMERGENCE = [
 ("release identity diff viewer","product",["prior_manifest","signed_manifest","independent_verifier"],["infra/scripts/release-diff.mjs"]),
 ("restore trust packet","product",["backup_id","restore_result","proof_refinding","diagnostic_bundle"],["infra/scripts/restore-verify.mjs"]),
 ("operator release dashboard projection","operator",["five_service_state","degraded_state","safe_next_action"],["apps/manager/src/lib/admin.ts"]),
 ("pilot saturation stop schema","pilot",["saturation_state","pilot_stop_schema","safe_next_action"],["packages/shared/src/release-evidence.ts"]),
 ("per-employee fairness report","capacity",["employee_id","queue_depth","connection_count","sse_count","fairness"],["infra/scripts/capacity-pod-alpha.mjs"]),
 ("release manifest as support correlation key","product",["git_sha","signed_manifest","diagnostic_bundle"],["infra/scripts/release-telemetry.mjs"]),
 ("backup inventory retention policy","restore",["backup_id","filesystem_backup","database_backup"],["infra/scripts/backup-restore.mjs"]),
 ("secret-version release binding","secret",["secret_version","signed_manifest","config_hash"],["infra/scripts/release-manifest.mjs"]),
 ("migration compatibility preview","migration",["migration_head","migration_compatibility","safe_next_action"],["infra/scripts/migration-rollback-compatibility.mjs"]),
 ("degraded topology owner message","product",["degraded_state","safe_next_action","five_service_state"],["apps/web/app/api/health/route.ts"]),
 ("release evidence retention index","provenance",["artifact","signed_manifest","backup_id","rollback_proof"],["infra/scripts/release-evidence-index.mjs"]),
 ("crash-point registry","failure",["stable_crash_point","failure_state","retry_permission"],["infra/scripts/release-fault-injection.mjs"]),
 ("capacity partition recommendation","future",["fairness","saturation_state","resource_sample"],["infra/scripts/capacity-pod-alpha.mjs"]),
 ("multi-host pressure descriptor","future",["saturation_state","pilot_stop_schema"],["production-readiness-program/09-workstream-execution-map.md"]),
 ("release rollback dry-run planner","rollback",["prior_manifest","migration_compatibility","safe_next_action"],["infra/scripts/deploy-rollback.mjs"]),
 ("proof-refinding customer assurance","product",["proof_refinding","restore_result","signed_manifest"],["infra/scripts/restore-verify.mjs"]),
]
COUNTER = [
 ("Caddy healthy while upstream missing","failure",["dependency_health","degraded_state","public_route"],["tests/unit/ws08-release-authority.test.ts"]),
 ("gateway shares manager tag and drifts command","failure",["manager_digest","gateway_digest","git_sha"],["tests/unit/ws08-release-authority.test.ts"]),
 ("rollback omits gateway coordinate","failure",["prior_manifest","image_set","rollback_proof"],["tests/unit/ws08-release-authority.test.ts"]),
 ("restore archive valid but database absent","failure",["backup_id","database_backup","restore_result"],["tests/unit/ws08-release-authority.test.ts"]),
 ("restore succeeds but proof cannot be refound","failure",["restore_result","proof_refinding","operator_blocked"],["tests/unit/ws08-release-authority.test.ts"]),
 ("fault after first destructive release step","failure",["stable_crash_point","failure_state","diagnostic_bundle","safe_next_action"],["tests/unit/ws08-release-authority.test.ts"]),
 ("retry after ambiguous release mutation","failure",["ambiguous","accepted_proof","nonacceptance_proof","operator_blocked","reservation_release","retry_permission"],["tests/unit/ws08-release-authority.test.ts"]),
 ("application projection diverges from returned database record","failure",["database_mutation","returned_record","application_projection","audit","conservation"],["tests/unit/ws08-release-authority.test.ts"]),
 ("replica clock expires shared lease early","failure",["replica_clock","database_clock","lease","expiry","retry"],["tests/unit/ws08-release-authority.test.ts"]),
 ("Manager receives Docker socket","failure",["host_provisioner","docker_socket","manager_denial"],["tests/unit/ws08-release-authority.test.ts"]),
 ("cross-employee network attachment","failure",["employee_network","cross_employee_denial","bounded_egress"],["tests/unit/ws08-release-authority.test.ts"]),
 ("secret value enters release diagnostics","failure",["secret_version","diagnostic_bundle"],["tests/unit/ws08-release-authority.test.ts"]),
 ("one noisy employee starves another","capacity",["employee_id","queue_depth","fairness","saturation_state"],["tests/unit/ws09-capacity-groundwork.test.ts"]),
 ("SSE fanout exhausts descriptors","capacity",["employee_id","sse_count","connection_count","resource_sample"],["tests/unit/ws09-capacity-groundwork.test.ts"]),
 ("pilot continues after saturation","pilot",["saturation_state","pilot_stop_schema","safe_next_action"],["tests/unit/ws09-capacity-groundwork.test.ts"]),
 ("200-500 pressure becomes current claim","future",["saturation_state","pilot_stop_schema"],["tests/unit/ws09-capacity-groundwork.test.ts"]),
]
RECOMB = [
 ("signed five-image release and repository closure transaction","release",["source","migration","fixtures","types","unit","integration","build","workflow","artifact","pr_prose","git_sha","manager_digest","gateway_digest","provisioner_digest","web_digest","caddy_digest","compose_hash","config_hash","migration_head","signed_manifest","independent_verifier","five_service_state","dependency_health","migration_readiness","public_route","degraded_state"],["infra/scripts/release-manifest.mjs",".github/workflows/ws08-ws09-release.yml","infra/scripts/deploy-smoke.mjs"]),
 ("fault ambiguity durable-truth and operator recovery transaction","recovery",["replica_clock","database_clock","rate_window","lease","expiry","retry","ambiguous","accepted_proof","nonacceptance_proof","operator_blocked","reservation_release","retry_permission","database_mutation","returned_record","application_projection","audit","conservation","command","effect","provider_receipt","accounting_receipt","proof","repair","stable_crash_point","failure_state","safe_next_action","diagnostic_bundle"],["infra/scripts/release-fault-injection.mjs","infra/scripts/operator-recovery.mjs","infra/scripts/release-telemetry.mjs"]),
 ("backup-restore-proof transaction","restore",["backup_id","database_backup","filesystem_backup","secret_version","restore_result","proof_refinding"],["infra/scripts/backup-restore.mjs","infra/scripts/restore-verify.mjs"]),
 ("whole-release rollback with accepted-work guard","rollback",["prior_manifest","image_set","compose_config","migration_compatibility","accepted_work_check","rollback_smoke","rollback_proof"],["infra/scripts/deploy-rollback.mjs"]),
 ("topology health and release identity","health",["five_service_state","dependency_health","migration_readiness","degraded_state","signed_manifest"],["infra/scripts/deploy-smoke.mjs","infra/scripts/release-manifest.mjs"]),
 ("Docker and network authority proof","authority",["host_provisioner","docker_socket","signed_request","idempotency","audit","manager_denial","gateway_denial","employee_network","manager_attachment","gateway_attachment","hermes_attachment","cross_employee_denial","bounded_egress"],["tests/unit/ws08-release-authority.test.ts"]),
 ("effect recovery and release telemetry","telemetry",["command","effect","provider_receipt","accounting_receipt","proof","repair","diagnostic_bundle","signed_manifest"],["infra/scripts/release-telemetry.mjs"]),
 ("exact build to retained evidence closure","build",["source","migration","fixtures","types","unit","integration","build","workflow","artifact","pr_prose","signed_manifest"],[".github/workflows/ws08-ws09-release.yml"]),
 ("capacity fairness and pilot stop groundwork","capacity",["employee_id","queue_depth","connection_count","sse_count","resource_sample","fairness","saturation_state","pilot_stop_schema"],["infra/scripts/capacity-pod-alpha.mjs","tests/unit/ws09-capacity-groundwork.test.ts"]),
 ("restore and rollback compatibility envelope","recovery",["backup_id","restore_result","proof_refinding","prior_manifest","migration_compatibility","accepted_work_check","rollback_proof"],["infra/scripts/backup-restore.mjs","infra/scripts/deploy-rollback.mjs"]),
 ("truthful health under destructive faults","failure",["five_service_state","dependency_health","degraded_state","stable_crash_point","failure_state"],["infra/scripts/release-fault-injection.mjs","infra/scripts/deploy-smoke.mjs"]),
 ("secret-safe independent provenance","provenance",["secret_version","signed_manifest","independent_verifier","diagnostic_bundle"],["infra/scripts/release-manifest.mjs","infra/scripts/verify-release-manifest.mjs"]),
 ("database-clock recovery permission","authority",["database_clock","lease","expiry","retry","operator_blocked","reservation_release"],["infra/scripts/operator-recovery.mjs"]),
 ("proof-refinding release acceptance packet","proof",["signed_manifest","restore_result","proof_refinding","artifact","rollback_proof"],["infra/scripts/restore-verify.mjs","infra/scripts/release-evidence-index.mjs"]),
 ("25-30 runtime saturation envelope","capacity",["employee_id","queue_depth","connection_count","sse_count","resource_sample","fairness","saturation_state"],["infra/scripts/capacity-pod-alpha.mjs"]),
 ("operator-visible release lifecycle","operator",["five_service_state","failure_state","safe_next_action","retry_permission","signed_manifest","backup_id","rollback_proof"],["infra/scripts/operator-recovery.mjs"]),
]

def read(rel):
    p = ROOT / rel
    return p.read_text("utf8") if p.exists() else ""

def git_repo_prefix():
    try:
        return subprocess.check_output(["git", "rev-parse", "--show-prefix"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""

GIT_PREFIX = git_repo_prefix()

def blob_sha(rel):
    path = f"{GIT_PREFIX}{rel}" if GIT_PREFIX else rel
    try:
        return subprocess.check_output(["git","rev-parse",f"HEAD:{path}"],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
    except Exception:
        return None

def clamp(x): return round(max(0.0,min(1.0,x)),6)

def jaccard(a,b):
    a,b=set(a),set(b)
    return 1.0 if not a and not b else len(a&b)/len(a|b)

def entropy(labels):
    if not labels: return 0.0
    c=Counter(labels); n=len(labels)
    h=-sum((v/n)*math.log(v/n,2) for v in c.values())
    return h/math.log(max(2,len(c)),2)

def make_candidate(idx,batch,row):
    title,theme,vertices,files=row
    cid=f"{chr(65+BATCHES.index(batch))}{idx:02d}"
    external = any(k in title for k in ["multi-host pressure","customer assurance"])
    source_exists=sum((ROOT/f).exists() for f in files)
    evidence_strength=min(1.0,(source_exists+1)/(len(files)+1))
    direct=1.0 if batch=="direct_ws08" else .75 if batch=="recombination" else .55
    counter=1.0 if batch=="failure_operator_capacity" else .45
    capacity=1.0 if theme in {"capacity","pilot","future"} else .2
    proof_density=min(1.0,len(vertices)/10)
    risk=.65 if any(x in title for x in ["rollback","restore","fault","Docker","secret"]) else .35
    cost=.7 if external else .45 if batch=="recombination" else .3
    scope=min(1.0,len(files)/4 + len(vertices)/30)
    unsupported=.75 if external else .45 if source_exists==0 else .15
    scores={
      "IG":clamp(.45+.45*(1-evidence_strength)+.1*counter),"BV":clamp(.45+.35*direct+.15*capacity),
      "N":clamp(.35+.35*(batch!="direct_ws08")+.2*(theme=="product")),"Adj":clamp(.4+.45*direct),
      "CrossLens":clamp(.35+.08*len(set([theme,"release" if "manifest" in title else theme,"operator" if "operator" in title else theme]))),
      "FutureBug":clamp(.4+.45*counter+.1*(theme in {"failure","rollback","restore","authority"})),
      "FeatureYield":clamp(.25+.5*(theme in {"product","capacity","pilot","future"})+.15*(batch=="recombination")),
      "ArchLeverage":clamp(.35+.45*(theme in {"release","authority","health","recovery","provenance"})),
      "VF":clamp(.8 if all("target-host" not in f for f in files) else .35),"Testability":clamp(.55+.25*counter+.15*("test" in " ".join(files))),
      "Reversibility":clamp(.75-.3*risk),"ProofDensity":clamp(.35+.55*proof_density),
      "Risk":clamp(risk),"Cost":clamp(cost),"Scope":clamp(scope),"Unsupported":clamp(unsupported),
    }
    q=round(sum(W[d]*scores[d] for d in DIMENSIONS),8)
    baseline=round(.30*scores["IG"]+.25*scores["BV"]+.25*((scores["VF"]+scores["Testability"])/2)+.20*scores["ProofDensity"]-.35*scores["Unsupported"]-.30*scores["Risk"]-.20*scores["Scope"]-.15*scores["Cost"],8)
    eligible=not external and unsupported<.7
    return {
      "id":cid,"batch":batch,"title":title,"theme":theme,
      "evidence":[{"path":f,"blob_sha":blob_sha(f),"observed":(ROOT/f).exists()} for f in files],
      "contradictions":[],"software_vertices":sorted(set(vertices)),
      "hyperedges":sorted(eid for eid,e in EDGE_MAP.items() if set(vertices)&set(e["members"])),
      "state_sequence":["observed","planned","verified"],
      "partial_effect_path":["before_effect","partial_effect","durable_terminal_or_operator_blocked"],
      "repair_rollback_path":["preserve_original_identity","validate_durable_truth","repair_or_rollback","refind_proof"],
      "operator_consequence":f"Operator receives bounded evidence and a safe next action for {title}.",
      "capability_unlocked":f"Current capability: {title}; no higher evidence class is promoted.",
      "proof_obligation":f"Behaviorally prove represented vertices and reject false success for {title}.",
      "score_vector":scores,"q":q,"baseline_j0":baseline,
      "eligibility":eligible,"rejection_reason":None if eligible else "external_or_unsupported_prerequisite",
      "patch_surfaces":files,
    }

def candidates():
    out=[]
    for batch,rows in zip(BATCHES,[DIRECT,EMERGENCE,COUNTER,RECOMB]):
        out += [make_candidate(i+1,batch,row) for i,row in enumerate(rows)]
    return out

def coverage(ids,byid):
    represented=set().union(*(set(byid[i]["software_vertices"]) for i in ids)) if ids else set()
    tw=fw=cw=pw=0.0
    detail={}
    for eid,e in EDGE_MAP.items():
        members=set(e["members"]); hit=len(members&represented); frac=hit/len(members); complete=hit==len(members); proved=False
        wt=e["weight"]; tw += wt*(hit>0); fw += wt*frac; cw += wt*complete; pw += wt*proved
        detail[eid]={"touch":hit>0,"fractional":round(frac,6),"complete":complete,"proved":proved}
    den=sum(e["weight"] for e in EDGE_MAP.values())
    return {"touch":tw/den,"fractional":fw/den,"complete":cw/den,"proved":pw/den,"detail":detail,"represented_vertices":sorted(represented)}

def feasible(ids,byid,implementation=False):
    if len(ids)> (6 if implementation else 16) or len(ids)<4: return False
    cs=[byid[i] for i in ids]
    if not all(c["eligibility"] for c in cs): return False
    themes={c["theme"] for c in cs}; batches={c["batch"] for c in cs}; verts=set().union(*(set(c["software_vertices"]) for c in cs))
    req=[{"release","build","provenance"},{"restore","rollback","recovery"},{"authority","network"},{"health","failure"},{"operator","telemetry"},{"capacity","pilot"}]
    if not implementation and not all(themes&r for r in req): return False
    if not implementation and len(batches)<3: return False
    invariants=["git_sha","five_service_state","host_provisioner","restore_result","safe_next_action","saturation_state"]
    if not all(v in verts for v in invariants): return False
    if implementation:
        return all(set(edge["members"]).issubset(verts) for edge in EDGE_MAP.values())
    return True

def objective(ids,byid,variant="full",weights=None):
    weights=weights or W
    cs=[byid[i] for i in ids]
    q=sum(sum(weights[d]*c["score_vector"][d] for d in DIMENSIONS) for c in cs)/len(cs)
    cov=coverage(ids,byid)
    themes=[c["theme"] for c in cs]; batches=[c["batch"] for c in cs]
    sep=len(set(themes))/len(themes); vne=entropy(themes); qd=.5*entropy(batches)+.5*(sum(c["baseline_j0"] for c in cs)/len(cs)+1)/2
    redundancy=1-sep
    if variant=="baseline": return sum(c["baseline_j0"] for c in cs)/len(cs)
    vals=dict(LAMBDAS)
    if variant=="no_graph": vals["separation"]=0
    if variant=="no_diversity": vals["vne"]=0; vals["qd"]=0
    return vals["q"]*q+vals["fractional"]*cov["fractional"]+vals["complete"]*cov["complete"]+vals["separation"]*sep+vals["vne"]*vne+vals["qd"]*qd-vals["redundancy"]*redundancy

def sample_sets(byid,count=1024,implementation=False,seed=SEED):
    rng=random.Random(seed); eligible=[i for i,c in byid.items() if c["eligibility"]]
    if implementation:
        pool=[i for i in eligible if byid[i]["batch"]=="recombination"]
        sets=[]
        for n in range(4,7):
            for ids in itertools.combinations(pool,n):
                if feasible(ids,byid,True): sets.append(tuple(ids))
        if not sets: raise RuntimeError("no coherent implementation sets")
        return sets
    sets=[]; seen=set(); attempts=0
    while len(sets)<count and attempts<count*800:
        attempts+=1; n=rng.randint(4,16); ids=tuple(sorted(rng.sample(eligible,n)))
        if ids in seen or not feasible(ids,byid,False): continue
        seen.add(ids); sets.append(ids)
    if len(sets)<count: raise RuntimeError(f"insufficient feasible sets:{len(sets)}")
    return sets

def choose(sets,byid,variant="full",weights=None):
    return max(sets,key=lambda s:(objective(s,byid,variant,weights),tuple(reversed(s))))

def main(write=False):
    prior=json.loads((TRACE/"prior_model.json").read_text())
    cs=candidates(); byid={c["id"]:c for c in cs}
    sets=sample_sets(byid,1024,False); impl_sets=sample_sets(byid,1024,True,SEED+1)
    selected={v:choose(sets,byid,v) for v in ["full","no_graph","no_diversity","baseline"]}
    impl=choose(impl_sets,byid,"full")
    restarts=[]
    for i in range(32):
        rs=sample_sets(byid,128,False,SEED+100+i); best=choose(rs,byid,"full")
        restarts.append({"restart":i,"selected_ids":best,"objective":round(objective(best,byid),8)})
    perturb=[]
    modes=[]
    for pct in [.10,-.10,.25,-.25]:
        modes.append((f"global_{pct}",{d:w*(1+pct) for d,w in W.items()}))
    modes.append(("double_penalties",{d:(w*2 if d in {"Risk","Cost","Scope"} else w) for d,w in W.items()}))
    for d in DIMENSIONS:
        modes.append((f"remove_{d}",{k:(0 if k==d else v) for k,v in W.items()}))
    for k in range(11):
        pct=.10 if k<6 else .25
        modes.append((f"striped_plus_{pct}_{k}",{d:(w*(1+pct) if (DIMENSIONS.index(d)+k)%3==0 else w) for d,w in W.items()}))
    assert len(modes)==32
    for name,weights in modes:
        best=choose(sets,byid,"full",weights); perturb.append({"name":name,"selected_ids":best,"jaccard_to_full":round(jaccard(best,selected["full"]),6),"coverage":coverage(best,byid)})
    stable_vertices=set(coverage(selected["full"],byid)["represented_vertices"])
    for p in perturb: stable_vertices &= set(p["coverage"]["represented_vertices"])
    classifications={
      "H01":{"status":"modified","evidence":"compose declares five services, but dependency health is incomplete"},
      "H02":{"status":"modified","evidence":"SHA tags are required, but model-gateway reuses the manager image"},
      "H03":{"status":"confirmed","evidence":"release evidence has a digest but no signature or independent recomputation"},
      "H04":{"status":"confirmed","evidence":"rollback is a manual command planner, omits gateway coordinate, and does not enforce compatibility"},
      "H05":{"status":"confirmed","evidence":"backup covers Hermes and clients directories only; database, secret version and proof refinding are absent"},
      "H06":{"status":"confirmed","evidence":"Caddy health validates configuration; compose smoke accepts containers with no healthcheck"},
      "H07":{"status":"modified","evidence":"Host Provisioner records partial destructive Docker failure; release-level deterministic fault injection is absent"},
      "H08":{"status":"unresolved","evidence":"repair surfaces require deeper caller-level behavioral proof"},
      "H09":{"status":"modified","evidence":"production compose grants docker.sock only to Host Provisioner; repository-wide negative proof remains required"},
      "H10":{"status":"modified","evidence":"employee topology checks exist but are optional and target-host evidence remains external"},
      "H11":{"status":"confirmed","evidence":"backup and release artifacts do not bind secret versions"},
      "H12":{"status":"modified","evidence":"component proofs carry Git SHA, but one release-command-effect lineage is absent"},
      "H13":{"status":"confirmed","evidence":"no workflow builds and inspects five distinct exact-SHA images"},
      "H14":{"status":"modified","evidence":"current workflow preserves artifacts and separately enforces outcomes, but the base PostgreSQL job is red"},
      "H15":{"status":"confirmed","evidence":"capacity harness lacks queue, SSE and fairness accounting"},
      "H16":{"status":"unresolved","evidence":"pilot stop/rollback source schema not established"},
      "H17":{"status":"modified","evidence":"Host Provisioner TTL uses replica Date.now; database remains authority for shared commercial windows"},
      "H18":{"status":"modified","evidence":"effect ambiguity is durable, but release/operator terminality is incomplete"},
      "H19":{"status":"confirmed","evidence":"rollback accepts an operator compatibility string rather than executable compatibility proof"},
      "H20":{"status":"unresolved","evidence":"no representative 25-30 runtime result on a 64 GiB host is available"},
    }
    input_blobs={rel:blob_sha(rel) for rel in EVIDENCE_FILES}
    task={"schema":"amtech.trace008.task-state.v1","starting_sha":"0193bc2f8d87fec07fd645171c37cb4b9e66e1ff","generation_head":subprocess.check_output(["git","rev-parse","HEAD"],cwd=ROOT,text=True).strip(),"input_blob_shas":input_blobs,"seed":SEED,"runtime":sys.version,"commands":["python decision/trace008/compute.py --write","python decision/trace008/compute.py --verify"],"weights_w":W,"lambdas":LAMBDAS,"baseline":"0.30IG+0.25BV+0.25mean(VF,Testability)+0.20ProofDensity-0.35Unsupported-0.30Risk-0.20Scope-0.15Cost","basis":prior["active_basis_coordinates"],"hypothesis_classification":classifications,"evidence_nonpromotion":["source","ci","container","target_host","restore","rollback","capacity","provider","pilot","production"]}
    graph_edges=[]
    for a,b in itertools.combinations(cs,2):
        sim=len(set(a["software_vertices"])&set(b["software_vertices"]))/max(1,len(set(a["software_vertices"])|set(b["software_vertices"])))
        if a["theme"]==b["theme"] or sim>=.35 or (b["batch"]=="recombination" and sim>0):
            graph_edges.append({"source":a["id"],"target":b["id"],"relation":"same_concept" if a["theme"]==b["theme"] else "similarity","weight":round(sim if sim else .2,6)})
    comp={v:{"selected_ids":list(ids),"objective":round(objective(ids,byid,v),8),"coverage":coverage(ids,byid)} for v,ids in selected.items()}
    full=set(selected["full"])
    comparison={"schema":"amtech.trace008.selection-comparison.v1","same_feasible_domain":True,"feasible_random_sets":len(sets),"restarts":restarts,"weight_perturbations":perturb,"selections":comp,"selection_jaccard":{"full_no_graph":round(jaccard(full,selected["no_graph"]),6),"full_no_diversity":round(jaccard(full,selected["no_diversity"]),6),"full_baseline":round(jaccard(full,selected["baseline"]),6)},"invariant_basin":{"stable_vertices":sorted(stable_vertices),"stable_edge_complete":[eid for eid,e in coverage(selected["full"],byid)["detail"].items() if e["complete"] and all(p["coverage"]["detail"][eid]["complete"] for p in perturb)]},"causal_improvement":"unestablished","independent_proof_yield_difference":None}
    exploration={"schema":"amtech.trace008.selected-exploration.v1","selected_ids":list(selected["full"]),"objective":round(objective(selected["full"],byid),8),"coverage":coverage(selected["full"],byid),"classification":"selection_influencing_or_descriptive_not_causal"}
    implementation={"schema":"amtech.trace008.selected-implementation.v1","selected_ids":list(impl),"trajectory_count":len(impl),"objective":round(objective(impl,byid),8),"coverage":coverage(impl,byid),"patch_surfaces":sorted(set(sum((byid[i]["patch_surfaces"] for i in impl),[]))),"invariants":["no_false_success","no_blind_retry","no_stranded_ambiguity","host_provisioner_only_docker","exact_release_identity","restore_proof_refinding","accepted_work_preserved"],"mathematical_causality":"unestablished"}
    counterexamples={"schema":"amtech.trace008.counterexamples.v1","cases":[{"candidate_id":c["id"],"title":c["title"],"proof":c["proof_obligation"]} for c in cs if c["batch"]=="failure_operator_capacity"]}
    verification={"schema":"amtech.trace008.verification-plan.v1","software_edge_tests":{eid:["tests/unit/ws08-release-authority.test.ts"] if eid!="E_capacity_groundwork" else ["tests/unit/ws09-capacity-groundwork.test.ts"] for eid in EDGE_MAP},"workflow_required":["trace verifier","governance","source generation","typecheck/lint","focused and broad units","PostgreSQL integration","all-workspace build","production compose validation","five exact-SHA image builds","digest inspection","release-manifest verification"],"external_blockers":["target Linux host","registry/signing authority","managed database backup/restore","representative 64 GiB capacity run","pilot cohort"]}
    artifacts={
      "task_state.json":task,
      "thought_templates.json":{"schema":"amtech.trace008.templates.v1","templates":prior["reusable_templates"],"interpretations":prior["interpretations"]},
      "candidate_population.json":{"schema":"amtech.trace008.candidates.v1","count":len(cs),"batches":BATCHES,"candidates":cs},
      "candidate_scores.json":{"schema":"amtech.trace008.scores.v1","dimensions":DIMENSIONS,"weights":W,"baseline_contract":{"positive_required":["IG","BV","VF","ProofDensity"],"positive_optional":["Testability"],"penalty_required":["Unsupported","Risk","Scope","Cost"],"excluded":["N","Adj","CrossLens","FutureBug","FeatureYield","ArchLeverage","Reversibility"]},"scores":[{"id":c["id"],"vector":c["score_vector"],"q":c["q"],"j0":c["baseline_j0"]} for c in cs]},
      "candidate_graph.json":{"schema":"amtech.trace008.candidate-graph.v1","semantic_boundary":"candidate trajectories only","nodes":[c["id"] for c in cs],"edges":graph_edges,"forbidden_claim":"software completion"},
      "software_invariant_hypergraph.json":{"schema":"amtech.trace008.software-hypergraph.v1","vertices":sorted(set(sum((e[2] for e in SOFTWARE_EDGES),[]))),"hyperedges":[{"id":i,"weight":w,"members":m} for i,w,m in SOFTWARE_EDGES],"coverage_order":"proved<=complete<=fractional<=touch"},
      "selection_comparison.json":comparison,
      "selected_exploration.json":exploration,
      "selected_implementation.json":implementation,
      "implementation_ablation.json":{"schema":"amtech.trace008.ablation.v1","status":"unestablished","independent_outcomes":{"defects_found":None,"proof_yield":None,"unnecessary_scope":None}},
      "implementation_contract.json":{"schema":"amtech.trace008.implementation-contract.v1","selected_ids":list(impl),"source_edits_forbidden_until_this_artifact":True,"max_trajectories":6},
      "counterexample_matrix.json":counterexamples,
      "verification_plan.json":verification,
      "post_patch_frontier.json":{"schema":"amtech.trace008.post-patch-frontier.v1","status":"pending_implementation","trajectories":[]},
    }
    decision_record="# Trace008 Decision Record\n\nStarting SHA: `0193bc2f8d87fec07fd645171c37cb4b9e66e1ff`\n\nTrace008 separates candidate topology from software-invariant topology, uses the explicit baseline and one feasible domain, and reports selection influence without causal promotion. The computed implementation contains at most six trajectories and is binding only as a scope compression; repository invariants and behavioral verification decide correctness.\n\nSelected implementation: `"+"`, `".join(impl)+"`.\n\nExternal target-host, signing, managed restore, representative capacity, pilot and production evidence remain unresolved.\n"
    if write:
        for name,data in artifacts.items(): (TRACE/name).write_text(json.dumps(data,indent=2,sort_keys=True)+"\n")
        (TRACE/"decision_record.md").write_text(decision_record)
    assert len(cs)==64 and len(set(c["id"] for c in cs))==64
    assert len(impl)<=6 and feasible(impl,byid,True)
    assert len(sets)>=1024 and len(restarts)==32 and len(perturb)==32
    assert coverage(impl,byid)["complete"]==1.0
    for sel in selected.values():
        cov=coverage(sel,byid); assert cov["proved"]<=cov["complete"]<=cov["fractional"]<=cov["touch"]
    print(json.dumps({"status":"ok","candidates":64,"feasible_random":len(sets),"implementation":list(impl),"implementation_count":len(impl),"causal_improvement":"unestablished"},indent=2))

if __name__=="__main__":
    ap=argparse.ArgumentParser(); ap.add_argument("--write",action="store_true"); ap.add_argument("--verify",action="store_true")
    args=ap.parse_args(); main(write=args.write)

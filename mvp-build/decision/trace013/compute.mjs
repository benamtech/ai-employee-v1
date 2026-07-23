#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const descriptors = JSON.parse(await readFile(resolve(root, 'candidate_descriptors.json'), 'utf8'));
const prefixes = { current: 'C', feature: 'F', counterfactual: 'X', recombination: 'R' };
const outsideFirstSlice = new Set(['F13','F14','F15','R06','R07','R08','R09','R10','R11','R12','R13','R14','R15','R16']);
const componentIds = new Set(['C03','C04','C05','C06','C07','C08','C09','C11','C12','C13','C14','C15','C16','F01','F02','F03','F04','F05','F06','F07','F08','F09','F10','F11','F12','F16','R01','R02','R03','R04','R05']);
const machineIds = new Set(['C11','C12','C13','C14','C16','F01','F03','F04','F05','F07','F08','F09','F10','F11','F12','R01','R02','R03','R04','R05']);
const vendorIds = new Set(['F12','R04','R05']);
const rows = [];
for (const [batch, titles] of Object.entries(descriptors.batches)) {
  if (titles.length !== 16) throw new Error(`batch ${batch} must contain 16 candidates`);
  titles.forEach((title, index) => {
    const id = `${prefixes[batch]}${String(index + 1).padStart(2, '0')}`;
    const counterfactual = batch === 'counterfactual';
    const eligible = !counterfactual && !outsideFirstSlice.has(id) && !['C01','C02','C10'].includes(id);
    rows.push({
      id,
      batch,
      title,
      eligible,
      rejection: eligible ? null : counterfactual ? 'counterfactual_violation' : 'outside_first_vertical_slice',
      properties: {
        content_addressed: componentIds.has(id),
        machine_verifiable: machineIds.has(id),
        vendor_neutral: vendorIds.has(id),
        proof_taxonomy_preserved: !['X03','X04','X05'].includes(id),
        chronology_preserved: !['X06','X07'].includes(id),
        no_task_time_remote_dependency: !['X02','R15'].includes(id),
        bounded_first_slice: !outsideFirstSlice.has(id)
      }
    });
  });
}
if (rows.length !== 64 || new Set(rows.map((row) => row.id)).size !== 64) throw new Error('candidate population must contain 64 unique ids');
const feasible = rows.filter((row) => row.eligible && descriptors.mandatory_constraints.every((key) => row.properties[key]));
const selected = rows.find((row) => row.id === descriptors.selected_candidate);
if (!selected || !feasible.some((row) => row.id === selected.id)) throw new Error('declared selected candidate is not feasible');
const population = {
  schema: 'trace013.candidate-population.v1',
  count: rows.length,
  batch_counts: Object.fromEntries(Object.keys(descriptors.batches).map((batch) => [batch, rows.filter((row) => row.batch === batch).length])),
  rows
};
const selection = {
  schema: 'trace013.selection.v1',
  selected: selected.id,
  selected_title: selected.title,
  mandatory_constraints: descriptors.mandatory_constraints,
  feasible_ids: feasible.map((row) => row.id),
  controls: {
    evidence_and_invariants: 'R05',
    no_spectral: ['R01','R03','R04'],
    no_experiment_chronology: ['R01','R02','R04'],
    prose_only: ['C01','C02']
  },
  causal_status: descriptors.causal_status,
  rationale: 'R05 is the smallest candidate that simultaneously supplies repository facts, typed representations, P1/P2 proof carrying, experiment chronology, vendor-neutral execution, and bounded first-slice scope.'
};
if (process.argv.includes('--write')) {
  await writeFile(resolve(root, 'candidate_population.generated.json'), `${JSON.stringify(population, null, 2)}\n`);
  await writeFile(resolve(root, 'selection.generated.json'), `${JSON.stringify(selection, null, 2)}\n`);
}
console.log(JSON.stringify(selection, null, 2));

import { performance } from "node:perf_hooks";
import { runScaleCompilation } from "../dist/index.js";

const sizes = process.argv.slice(2).map(Number).filter((value) => Number.isInteger(value) && value > 0);
const targets = sizes.length > 0 ? sizes : [200, 500, 1000, 2000];
const reports = targets.map((size) => runScaleCompilation(size, () => performance.now()));
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2));

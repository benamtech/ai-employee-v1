import { sha256 } from "./core.js";

export interface LexicalDocumentInput {
  id: string;
  text: string;
  fieldWeights?: Readonly<Record<string, number>>;
}

export interface SparseLexicalDocument {
  id: string;
  length: number;
  termFrequencies: readonly [string, number][];
  tfIdf: readonly [string, number][];
}

export interface SparseLexicalIndex {
  documents: readonly SparseLexicalDocument[];
  inverseDocumentFrequency: Readonly<Record<string, number>>;
  postings: Readonly<Record<string, readonly string[]>>;
  averageDocumentLength: number;
  indexHash: string;
}

export interface LexicalNeighbor {
  documentId: string;
  cosine: number;
  bm25: number;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "is", "it", "of", "on", "or", "that", "the", "this", "to", "with",
]);

export function tokenizeLexical(text: string): string[] {
  return (text.normalize("NFKC").toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function buildSparseLexicalIndex(inputs: readonly LexicalDocumentInput[]): SparseLexicalIndex {
  const ids = new Set<string>();
  const termCounts = new Map<string, Map<string, number>>();
  const documentFrequency = new Map<string, number>();
  for (const input of [...inputs].sort((left, right) => left.id.localeCompare(right.id))) {
    if (!input.id.trim() || ids.has(input.id)) throw new Error(`invalid or duplicate lexical document ${input.id}`);
    ids.add(input.id);
    const counts = countTerms(tokenizeLexical(input.text));
    termCounts.set(input.id, counts);
    for (const term of counts.keys()) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
  const count = Math.max(1, inputs.length);
  const idf = Object.fromEntries([...documentFrequency.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([term, frequency]) => [term, Math.log(1 + (count - frequency + 0.5) / (frequency + 0.5))]));
  const postingsMutable = new Map<string, string[]>();
  const documents = [...termCounts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([id, counts]) => {
    const length = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const tfIdfEntries = [...counts.entries()].map(([term, frequency]) => [term, (1 + Math.log(frequency)) * (idf[term] ?? 0)] as [string, number]);
    const norm = Math.sqrt(tfIdfEntries.reduce((sum, [, value]) => sum + value * value, 0));
    const tfIdf = tfIdfEntries.map(([term, value]) => [term, norm === 0 ? 0 : value / norm] as [string, number]).sort(([left], [right]) => left.localeCompare(right));
    for (const term of counts.keys()) {
      const postings = postingsMutable.get(term) ?? [];
      postings.push(id);
      postingsMutable.set(term, postings);
    }
    return { id, length, termFrequencies: [...counts.entries()].sort(([left], [right]) => left.localeCompare(right)), tfIdf } satisfies SparseLexicalDocument;
  });
  const postings = Object.fromEntries([...postingsMutable.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([term, documentIds]) => [term, [...documentIds].sort()]));
  const averageDocumentLength = documents.length === 0 ? 0 : documents.reduce((sum, document) => sum + document.length, 0) / documents.length;
  const canonical = { documents, inverseDocumentFrequency: idf, postings, averageDocumentLength };
  return { ...canonical, indexHash: sha256(JSON.stringify(canonical)) };
}

export function tfIdfCosine(index: SparseLexicalIndex, leftId: string, rightId: string): number {
  const left = requiredDocument(index, leftId);
  const right = requiredDocument(index, rightId);
  const rightMap = new Map(right.tfIdf);
  return left.tfIdf.reduce((sum, [term, value]) => sum + value * (rightMap.get(term) ?? 0), 0);
}

export function bm25Score(index: SparseLexicalIndex, query: string | readonly string[], documentId: string, k1 = 1.2, b = 0.75): number {
  if (!Number.isFinite(k1) || k1 <= 0 || !Number.isFinite(b) || b < 0 || b > 1) throw new Error("invalid BM25 parameters");
  const document = requiredDocument(index, documentId);
  const frequencies = new Map(document.termFrequencies);
  const queryTerms = typeof query === "string" ? tokenizeLexical(query) : [...query];
  const uniqueTerms = [...new Set(queryTerms)].sort();
  const averageLength = index.averageDocumentLength || 1;
  return uniqueTerms.reduce((score, term) => {
    const frequency = frequencies.get(term) ?? 0;
    if (frequency === 0) return score;
    const idf = index.inverseDocumentFrequency[term] ?? 0;
    const denominator = frequency + k1 * (1 - b + b * document.length / averageLength);
    return score + idf * (frequency * (k1 + 1)) / denominator;
  }, 0);
}

export function lexicalNeighbors(index: SparseLexicalIndex, documentId: string, limit = 12): LexicalNeighbor[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error("lexical neighbor limit must be a positive integer");
  const document = requiredDocument(index, documentId);
  const candidates = new Set<string>();
  for (const [term] of document.termFrequencies) for (const id of index.postings[term] ?? []) if (id !== documentId) candidates.add(id);
  const query = document.termFrequencies.flatMap(([term, count]) => Array.from({ length: count }, () => term));
  return [...candidates].map((id) => ({ documentId: id, cosine: tfIdfCosine(index, documentId, id), bm25: bm25Score(index, query, id) }))
    .sort((left, right) => right.cosine - left.cosine || right.bm25 - left.bm25 || left.documentId.localeCompare(right.documentId))
    .slice(0, limit);
}

function countTerms(tokens: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}
function requiredDocument(index: SparseLexicalIndex, id: string): SparseLexicalDocument {
  const document = index.documents.find((item) => item.id === id);
  if (!document) throw new Error(`unknown lexical document ${id}`);
  return document;
}

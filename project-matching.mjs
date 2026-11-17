// Source-grounded, deterministic project matching for the draft Catio Assistant.
// Only published-original URLs, project names and descriptions from the catalog may be returned.
// Do not infer prices, dimensions, material brands, finishes or verified current availability.

const typeSynonyms = {
  patio: ["patio", "porch", "screened", "conversion", "breezeway", "patio techado", "conversion de patio"],
  tunnel: ["tunnel", "cat run", "connected", "catwalk", "tunel"],
  balcony: ["balcony", "second-story", "second story"],
  freestanding: ["freestanding", "custom catio", "cedar catio", "independiente", "autoportante"],
  window: ["window", "window access", "window catio", "ventana"]
};

const featureSynonyms = {
  barnDoors: ["barn door", "barn doors"],
  bridge: ["bridge", "suspended bridge"],
  honeycomb: ["honeycomb"],
  penthouse: ["penthouse"],
  rooftop: ["roof", "roofing"],
  catRun: ["cat run", "cat tunnel", "tunnel"],
  screened: ["screened-in", "screened", "enclosed patio"]
};

function normalize(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}
function includesPhrase(haystack, needle) {
  const phrase = normalize(needle);
  return phrase.length > 0 && (" " + haystack + " ").includes(" " + phrase + " ");
}
function tokens(value) {
  const stop = new Set(["this","that","with","from","and","the","for","catio","catios","like","similar","want","need","have","near","cat","cats","custom","built","company","thecatio","project","in","or","wa"]);
  return [...new Set(normalize(value).split(" ").filter(word => word.length > 2 && !stop.has(word)))].slice(0, 16);
}
function requestedTerms(query) {
  const raw = normalize(query);
  const types = Object.entries(typeSynonyms).filter(([,variants]) => variants.some(x => includesPhrase(raw,x))).map(([key]) => key);
  const features = Object.entries(featureSynonyms).filter(([,variants]) => variants.some(x => includesPhrase(raw,x))).map(([key]) => key);
  return {raw, types, features, keywords:tokens(query)};
}
function matchingTags(project) {
  const content = normalize(project.name + " " + project.shortDescription);
  const types = Object.entries(typeSynonyms).filter(([,variants]) => variants.some(x => includesPhrase(content,x))).map(([key]) => key);
  const features = Object.entries(featureSynonyms).filter(([,variants]) => variants.some(x => includesPhrase(content,x))).map(([key]) => key);
  return {content, types, features};
}
export function findSimilarProjects(catalog, input = {}) {
  if (!catalog || !Array.isArray(catalog.cmsProjects)) throw new TypeError("Invalid project catalog");
  const query = String(input.query ?? "").trim().slice(0, 300);
  const referenceId = String(input.projectId ?? "").trim();
  const requested = requestedTerms(query);
  const limit = Math.min(5,Math.max(1,Number.isInteger(input.limit) ? input.limit : 3));
  const viable = catalog.cmsProjects.filter(p =>
    p && typeof p.cmsId === "string" &&
    typeof p.name === "string" && /^https:\/\/www\.thecatiocompany\.com\//.test(p.sourceUrl ?? "") &&
    p.verified === true
  );
  const reference = referenceId ? viable.find(p => p.cmsId === referenceId) : null;
  const search = reference ? requestedTerms(reference.name + " " + reference.shortDescription + " " + query) : requested;
  if (!reference && !query) return {reference:null,projects:[],needsDetails:true,disclaimer:"Describe the type or features of the catio to see comparable projects."};
  const ranked = viable.filter(p => !reference || p.cmsId !== reference.cmsId).map(p => {
    const tags = matchingTags(p);
    let score = 0;
    const reasons = [];
    const matchedTypes = search.types.filter(t => tags.types.includes(t));
    const matchedFeatures = search.features.filter(f => tags.features.includes(f));
    score += matchedTypes.length * 5 + matchedFeatures.length * 7;
    const matchedWords = search.keywords.filter(t => includesPhrase(tags.content,t));
    score += Math.min(10, matchedWords.length * 2);
    if (matchedTypes.length) reasons.push("Matching documented project type");
    if (matchedFeatures.length) reasons.push("Matching documented features: " + matchedFeatures.join(", "));
    if (matchedWords.length && reasons.length === 0) reasons.push("Matching terms in project description");
    return {p,score,reasons};
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score || a.p.name.localeCompare(b.p.name));
  const results = ranked.slice(0,limit).map(({p,reasons})=>({
    projectId:p.cmsId,
    title:p.name.trim(),
    sourceUrl:p.sourceUrl,
    description:p.shortDescription || "",
    reasons,
    source:"Original The Catio Company published project reference"
  }));
  return {
    reference:reference?{projectId:reference.cmsId,title:reference.name.trim(),sourceUrl:reference.sourceUrl}:null,
    projects:results,
    needsDetails:results.length === 0,
    disclaimer:"Similarities are based only on documented catalog text, not a structural or pricing comparison. Final project feasibility requires the team's review."
  };
}

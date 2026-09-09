export { CELL_PHENOTYPES, effectiveMutationChance, polymeraseMutationMultiplier } from "./cell-types";
export { CELL_TYPE_IDS } from "./types";
export { transcribeDnaToMrnaCore } from "./transcribe";
export { translateMrnaToProteinCore, refoldWithChaperone, MISFOLD_MARKER } from "./translate";
export { createRng, hashSeed } from "./rng";
export type { CellType, MrnaTranscript, MutationEvent, ProteinTranslation } from "./types";
export { encodeCodonStrand } from "./codons";

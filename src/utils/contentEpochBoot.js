// Imported first by main.jsx so the epoch check runs before any module reads
// saved progress (see contentEpoch.js).
import { applyContentEpoch } from './contentEpoch.js'

export const EPOCH_BOOT = applyContentEpoch()

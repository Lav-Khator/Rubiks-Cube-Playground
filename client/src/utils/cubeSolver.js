import SolverWorker from './solver.worker.js?worker';

let globalWorker = null;
let initPromise = null;

/**
 * Initializes the solver tables in a background worker.
 * Can be called once at app load.
 */
export function initSolver() {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    try {
      globalWorker = new SolverWorker();

      const handleMessage = (e) => {
        if (e.data.type === 'ready') {
          globalWorker.removeEventListener('message', handleMessage);
          resolve();
        } else if (e.data.type === 'error') {
          globalWorker.removeEventListener('message', handleMessage);
          reject(new Error(e.data.error));
        }
      };

      globalWorker.addEventListener('message', handleMessage);
      globalWorker.postMessage({ type: 'init' });
    } catch (err) {
      reject(err);
    }
  });

  return initPromise;
}

export function validateAndConvertNet(net) {
  //Check center stickers are distinct
  const centers = {
    U: net.U[4],
    L: net.L[4],
    F: net.F[4],
    R: net.R[4],
    B: net.B[4],
    D: net.D[4]
  };

  const centerColors = Object.values(centers);
  const uniqueCenterColors = new Set(centerColors);
  if (uniqueCenterColors.size !== 6) {
    throw new Error("Center stickers must have 6 distinct colors.");
  }

  // Count total stickers of each color
  const allStickers = [
    ...net.U, ...net.L, ...net.F,
    ...net.R, ...net.B, ...net.D
  ];

  const colorCounts = {};
  for (const color of allStickers) {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  }

  for (const color of centerColors) {
    if (colorCounts[color] !== 9) {
      throw new Error(`Invalid color count: Color of center face needs exactly 9 stickers, found ${colorCounts[color] || 0}.`);
    }
  }

  // Map colors to face letters
  const colorToFace = {};
  colorToFace[centers.U] = 'U';
  colorToFace[centers.R] = 'R';
  colorToFace[centers.F] = 'F';
  colorToFace[centers.D] = 'D';
  colorToFace[centers.L] = 'L';
  colorToFace[centers.B] = 'B';

  const mapFace = (faceStickers) => {
    return faceStickers.map(c => {
      const face = colorToFace[c];
      if (!face) {
        throw new Error("Some stickers do not match any face center color.");
      }
      return face;
    }).join('');
  };

  // cubejs expects URFDLB order
  const faceletString =
    mapFace(net.U) +
    mapFace(net.R) +
    mapFace(net.F) +
    mapFace(net.D) +
    mapFace(net.L) +
    mapFace(net.B);

  return faceletString;
}

export function solveCube(faceletString, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const solveWorker = new SolverWorker();

    const timeoutId = setTimeout(() => {
      solveWorker.terminate();
      reject(new Error("Timeout: Solver took too long. This isn't a solvable cube state — double check your colors."));
    }, timeoutMs);

    solveWorker.onmessage = (e) => {
      clearTimeout(timeoutId);
      solveWorker.terminate();

      if (e.data.type === 'success') {
        resolve(e.data.solution);
      } else {
        reject(new Error(e.data.error || "Solver failed to find a solution."));
      }
    };

    solveWorker.postMessage({ type: 'solve', facelets: faceletString });
  });
}

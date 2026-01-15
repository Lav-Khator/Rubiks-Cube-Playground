import Cube from 'cubejs';

let isInitialized = false;

self.onmessage = (e) => {
  const { type, facelets } = e.data;

  if (type === 'init') {
    try {
      if (!isInitialized) {
        Cube.initSolver();
        isInitialized = true;
      }
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', error: 'Init failed: ' + err.message });
    }
  } else if (type === 'solve') {
    try {
      if (!isInitialized) {
        Cube.initSolver();
        isInitialized = true;
      }
      const cube = Cube.fromString(facelets);
      const solution = cube.solve();
      self.postMessage({ type: 'success', solution });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.message });
    }
  }
};

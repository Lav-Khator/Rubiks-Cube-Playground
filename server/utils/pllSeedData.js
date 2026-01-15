const pllSeedData = [
  {
    name: "Ua-Perm",
    group: "Edges Only",
    scramble: "M2 U M U2 M' U M2",
    preferredAlg: "M2 U M U2 M' U M2",
    alternativeAlgs: ["R U' R U R U R U' R' U' R2"]
  },
  {
    name: "Ub-Perm",
    group: "Edges Only",
    scramble: "M2 U' M U2 M' U' M2",
    preferredAlg: "M2 U' M U2 M' U' M2",
    alternativeAlgs: ["R2 U R U R' U' R' U' R' U R'"]
  },
  {
    name: "H-Perm",
    group: "Edges Only",
    scramble: "M2 U M2 U2 M2 U M2",
    preferredAlg: "M2 U M2 U2 M2 U M2",
    alternativeAlgs: []
  },
  {
    name: "Z-Perm",
    group: "Edges Only",
    scramble: "M' U M2 U M2 U M' U2 M2",
    preferredAlg: "M' U M2 U M2 U M' U2 M2",
    alternativeAlgs: ["M2 U M2 U M' U2 M2 U2 M'"]
  },
  {
    name: "Aa-Perm",
    group: "Adjacent Corners",
    scramble: "x L D' L U2 L' D L U2 L2 x'",
    preferredAlg: "x L D' L U2 L' D L U2 L2 x'",
    alternativeAlgs: []
  },
  {
    name: "Ab-Perm",
    group: "Adjacent Corners",
    scramble: "x L2 U2 L D L' U2 L D' L x'",
    preferredAlg: "x L2 U2 L D L' U2 L D' L x'",
    alternativeAlgs: []
  },
  {
    name: "E-Perm",
    group: "Corners Only",
    scramble: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    preferredAlg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    alternativeAlgs: []
  },
  {
    name: "F-Perm",
    group: "Adjacent Corners",
    scramble: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    preferredAlg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    alternativeAlgs: []
  },
  {
    name: "Ga-Perm",
    group: "G-Permutations",
    scramble: "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    preferredAlg: "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    alternativeAlgs: []
  },
  {
    name: "Gb-Perm",
    group: "G-Permutations",
    scramble: "R' U' R U D' R2 U R' U R U' R U' R2 D",
    preferredAlg: "R' U' R U D' R2 U R' U R U' R U' R2 D",
    alternativeAlgs: []
  },
  {
    name: "Gc-Perm",
    group: "G-Permutations",
    scramble: "R2 U' R U' R U R' U R2 U D' R U' R' D",
    preferredAlg: "R2 U' R U' R U R' U R2 U D' R U' R' D",
    alternativeAlgs: []
  },
  {
    name: "Gd-Perm",
    group: "G-Permutations",
    scramble: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    preferredAlg: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    alternativeAlgs: []
  },
  {
    name: "Ja-Perm",
    group: "Adjacent Corners",
    scramble: "x R2 F R F' R U2 r' U r U2 x'",
    preferredAlg: "x R2 F R F' R U2 r' U r U2 x'",
    alternativeAlgs: []
  },
  {
    name: "Jb-Perm",
    group: "Adjacent Corners",
    scramble: "R U R' F' R U R' U' R' F R2 U' R' U'",
    preferredAlg: "R U R' F' R U R' U' R' F R2 U' R' U'",
    alternativeAlgs: []
  },
  {
    name: "Ra-Perm",
    group: "Adjacent Corners",
    scramble: "R U' R' U' R U R D R' U' R D' R' U2 R'",
    preferredAlg: "R U' R' U' R U R D R' U' R D' R' U2 R'",
    alternativeAlgs: []
  },
  {
    name: "Rb-Perm",
    group: "Adjacent Corners",
    scramble: "R' U2 R U2 R' F R U R' U' R' F' R2 U'",
    preferredAlg: "R' U2 R U2 R' F R U R' U' R' F' R2 U'",
    alternativeAlgs: []
  },
  {
    name: "T-Perm",
    group: "Adjacent Corners",
    scramble: "R U R' U' R' F R2 U' R' U' R U R' F'",
    preferredAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    alternativeAlgs: []
  },
  {
    name: "V-Perm",
    group: "Diagonal Corners",
    scramble: "R' U R' d' R' F' R2 U' R' U R' F R F",
    preferredAlg: "R' U R' d' R' F' R2 U' R' U R' F R F",
    alternativeAlgs: []
  },
  {
    name: "Y-Perm",
    group: "Diagonal Corners",
    scramble: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    preferredAlg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    alternativeAlgs: []
  },
  {
    name: "Na-Perm",
    group: "Diagonal Corners",
    scramble: "z d R' U R2 D' R D R' U' R D' R' U R D R' U' z'",
    preferredAlg: "z d R' U R2 D' R D R' U' R D' R' U R D R' U' z'",
    alternativeAlgs: []
  },
  {
    name: "Nb-Perm",
    group: "Diagonal Corners",
    scramble: "z d' L U' L2 D L' D' L U L' D L U' L' D' L U z'",
    preferredAlg: "z d' L U' L2 D L' D' L U L' D L U' L' D' L U z'",
    alternativeAlgs: []
  }
];

export default pllSeedData;

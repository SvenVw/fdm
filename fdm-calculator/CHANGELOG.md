# fdm-calculator

## 0.4.0

### Minor Changes

- 5d0a80b: Expand number of nutrients in output of `calculateDose`
- fbbdc57: Add doses of individual applications to the output of `calculateDose`
- 2c6251c: Add calculation of ammonia emissions to nitrogen balance calculation.

### Patch Changes

- 955f854: Fix unit conversion at calculation of N supply by other fertilizers
- Updated dependencies [ce5ffa8]
- Updated dependencies [b6721b4]
- Updated dependencies [780e8c4]
- Updated dependencies [ac05d8b]
- Updated dependencies [a58b367]
- Updated dependencies [afe2a32]
- Updated dependencies [e6c0fa3]
- Updated dependencies [75693e4]
  - @svenvw/fdm-core@0.22.0

## 0.3.3

### Patch Changes

- 94a82f6: Fix at balance calculation to convert null values to 0 and prevent exception due to Decimal

## 0.3.2

### Patch Changes

- Updated dependencies [8cb4399]
  - @svenvw/fdm-core@0.21.1

## 0.3.1

### Patch Changes

- Updated dependencies [004c58d]
- Updated dependencies [7b447f6]
- Updated dependencies [7b447f6]
- Updated dependencies [842aac4]
  - @svenvw/fdm-core@0.21.0

## 0.3.0

### Minor Changes

- 119c328: Add the function `calculateNitrogenBalance` to calculate on farm level the nitrogen balance
- 119c328: Add the function `collectInputForNitrogenBalance` to collect input data from a fdm instance for the `calculateNitrogenBalance` function
- ba3801c: Add function `collectInputForNitrogenBalance` to collect the input data from a fdm instance to calculate the nitrogen balance
- c122c66: Add function to calculate target for nitrogen balance

### Patch Changes

- Updated dependencies [e260795]
- Updated dependencies [0dc93fd]
- Updated dependencies [5a3bf78]
- Updated dependencies [c44812f]
- Updated dependencies [cf399ca]
- Updated dependencies [249138c]
- Updated dependencies [f05e1cb]
- Updated dependencies [9a5be3b]
- Updated dependencies [6292cf3]
- Updated dependencies [f05e1cb]
- Updated dependencies [286abb9]
- Updated dependencies [bdf0cb0]
- Updated dependencies [343c580]
- Updated dependencies [ef8a2c6]
- Updated dependencies [e260795]
- Updated dependencies [13210e6]
- Updated dependencies [18f195b]
- Updated dependencies [a550805]
- Updated dependencies [7e881c1]
- Updated dependencies [d4a7e02]
- Updated dependencies [e0a779c]
- Updated dependencies [c44812f]
- Updated dependencies [dd7bb7b]
- Updated dependencies [ec0494c]
- Updated dependencies [0a546d4]
- Updated dependencies [ec0494c]
- Updated dependencies [6676992]
- Updated dependencies [4027c9a]
  - @svenvw/fdm-core@0.20.0

## 0.2.6

### Patch Changes

- Updated dependencies [eed1780]
  - @svenvw/fdm-core@0.19.0

## 0.2.5

### Patch Changes

- 175ea6a: Minify the code during rollup with terser
- Updated dependencies [c240486]
- Updated dependencies [e9926cb]
- Updated dependencies [82f4767]
- Updated dependencies [a52796a]
- Updated dependencies [9ea6795]
- Updated dependencies [a259ff6]
- Updated dependencies [01081b3]
- Updated dependencies [d693cdb]
- Updated dependencies [0944ef1]
- Updated dependencies [175ea6a]
- Updated dependencies [9f4d818]
  - @svenvw/fdm-core@0.18.0

## 0.2.4

### Patch Changes

- Updated dependencies [9bfd0a8]
  - @svenvw/fdm-core@0.17.0

## 0.2.3

### Patch Changes

- Updated dependencies [e134cfc]
  - @svenvw/fdm-core@0.16.0

## 0.2.2

### Patch Changes

- Updated dependencies [b601b5f]
- Updated dependencies [9b1f522]
- Updated dependencies [f056396]
- Updated dependencies [cdb1d02]
- Updated dependencies [9a6e329]
  - @svenvw/fdm-core@0.15.0

## 0.2.1

### Patch Changes

- 98e20ac: List other `fdm` packages as `dependencies` instead `peerDependencies` to prevent not needed major version bumps

## 0.2.0

### Minor Changes

- 45eda20: Add `p_dose_nw` to output at `calculateDose`

### Patch Changes

- e312060: Fix at `calculateDose` the unit of the output
- Updated dependencies [4d1dbd9]
- Updated dependencies [4d1dbd9]
- Updated dependencies [0224544]
- Updated dependencies [0b28bd5]
- Updated dependencies [1a295b0]
- Updated dependencies [6a01698]
- Updated dependencies [972bac8]
- Updated dependencies [7387530]
  - @svenvw/fdm-core@0.14.0

## 0.1.1

### Patch Changes

- da00990: Fix using incorrect unit for nutrient content of fertilizer
- Updated dependencies [9830186]
- Updated dependencies [06619e7]
  - @svenvw/fdm-core@0.13.0

## 0.1.0

### Minor Changes

- 475986f: Add `calculateDose` and `getDoseForField` to retrieve the nutrient doses

### Patch Changes

- Updated dependencies [5d2871e]
- Updated dependencies [644a159]
- Updated dependencies [e518d78]
- Updated dependencies [9e05058]
- Updated dependencies [d2a2ab7]
- Updated dependencies [1b435a3]
- Updated dependencies [488f898]
- Updated dependencies [ed82ff6]
- Updated dependencies [d2a2ab7]
- Updated dependencies [aede4a7]
- Updated dependencies [9e6f2d7]
- Updated dependencies [644a159]
  - @svenvw/fdm-core@0.12.0

## 0.0.2

### Patch Changes

- Upgrade to use ES2022

## 0.0.1

### Patch Changes

- Updated dependencies [6f6b1c4]
- Updated dependencies [1750661]
  - fdm-core@0.3.1

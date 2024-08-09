# @svelte-add/core

## 2.10.1

### Patch Changes

- chore: replace `preferred-pm` with `package-manager-detector` ([#535](https://github.com/svelte-add/svelte-add/pull/535))

## 2.10.0

### Minor Changes

- feat: support adder aliases ([#512](https://github.com/svelte-add/svelte-add/pull/512))

### Patch Changes

- chore: add new lines at the end of files ([#511](https://github.com/svelte-add/svelte-add/pull/511))

## 2.9.7

### Patch Changes

- chore: expose processor types ([#502](https://github.com/svelte-add/svelte-add/pull/502))

- fix: typescript detection ([#508](https://github.com/svelte-add/svelte-add/pull/508))

- Updated dependencies [[`dc2d5d5084d6130f4e0be86c50f056b358ae94b6`](https://github.com/svelte-add/svelte-add/commit/dc2d5d5084d6130f4e0be86c50f056b358ae94b6)]:
  - @svelte-add/ast-manipulation@2.2.2

## 2.9.6

### Patch Changes

- chore: trigger release ([#504](https://github.com/svelte-add/svelte-add/pull/504))

- Updated dependencies [[`6cce02c2902938e29a6c2bfa9a95435ca8b32461`](https://github.com/svelte-add/svelte-add/commit/6cce02c2902938e29a6c2bfa9a95435ca8b32461)]:
  - @svelte-add/ast-manipulation@2.2.1
  - @svelte-add/ast-tooling@2.1.5

## 2.9.5

### Patch Changes

- chore: install packages without `--legacy-peer-deps` flag when using npm ([#393](https://github.com/svelte-add/svelte-add/pull/393))

## 2.9.4

### Patch Changes

- fix: pin workspace dependencies versions ([#493](https://github.com/svelte-add/svelte-add/pull/493))

- Updated dependencies [[`3a678c00b6a40c938dcf4afef9670ae9a67236ae`](https://github.com/svelte-add/svelte-add/commit/3a678c00b6a40c938dcf4afef9670ae9a67236ae), [`0b18faf1d0f3054c42091e522c19dc7dcdbf467c`](https://github.com/svelte-add/svelte-add/commit/0b18faf1d0f3054c42091e522c19dc7dcdbf467c), [`7dfab9d875c1ccd9ae163fddf665d7f3a52af447`](https://github.com/svelte-add/svelte-add/commit/7dfab9d875c1ccd9ae163fddf665d7f3a52af447), [`0b18faf1d0f3054c42091e522c19dc7dcdbf467c`](https://github.com/svelte-add/svelte-add/commit/0b18faf1d0f3054c42091e522c19dc7dcdbf467c), [`3a678c00b6a40c938dcf4afef9670ae9a67236ae`](https://github.com/svelte-add/svelte-add/commit/3a678c00b6a40c938dcf4afef9670ae9a67236ae)]:
  - @svelte-add/ast-tooling@2.1.4
  - @svelte-add/ast-manipulation@2.2.0

## 2.9.3

### Patch Changes

- fix: have prettier ignore unknown file types when formatting ([#453](https://github.com/svelte-add/svelte-add/pull/453))

- fix: initialize json files if they don't already exist ([#453](https://github.com/svelte-add/svelte-add/pull/453))

- Updated dependencies [[`0bb636bf3b9604be65e760ca09d0029c79e5a34d`](https://github.com/svelte-add/svelte-add/commit/0bb636bf3b9604be65e760ca09d0029c79e5a34d)]:
  - @svelte-add/ast-manipulation@2.1.6

## 2.9.2

### Patch Changes

- fix: correctly parse newly created json files ([#486](https://github.com/svelte-add/svelte-add/pull/486))

## 2.9.1

### Patch Changes

- fix: correct typo in package manager prompt ([#483](https://github.com/svelte-add/svelte-add/pull/483))

## 2.9.0

### Minor Changes

- feat: allow adders to run after another adder ([#466](https://github.com/svelte-add/svelte-add/pull/466))

### Patch Changes

- fix: improved parser for `svelte.config.js` ([#474](https://github.com/svelte-add/svelte-add/pull/474))

- fix: validate cli adder names ([#469](https://github.com/svelte-add/svelte-add/pull/469))

- fix: better file error handling ([#478](https://github.com/svelte-add/svelte-add/pull/478))

- Updated dependencies [[`d2ae7633b07f16eeaaaaeda526a64e5bf15fc484`](https://github.com/svelte-add/svelte-add/commit/d2ae7633b07f16eeaaaaeda526a64e5bf15fc484)]:
  - @svelte-add/ast-manipulation@2.1.5

## 2.8.3

### Patch Changes

- fix: `dependencies` and `devDependencies` are now properly sorted after modification ([#463](https://github.com/svelte-add/svelte-add/pull/463))

## 2.8.2

### Patch Changes

- chore: consolidate adders into one package ([#446](https://github.com/svelte-add/svelte-add/pull/446))

- Updated dependencies [[`46cbc00b7d3aef64c932616bc31f6285c9fd4abb`](https://github.com/svelte-add/svelte-add/commit/46cbc00b7d3aef64c932616bc31f6285c9fd4abb)]:
  - @svelte-add/ast-manipulation@2.1.4
  - @svelte-add/ast-tooling@2.1.3

## 2.8.1

### Patch Changes

- chore: removed `prettier` as a direct dependency and use the project's local installation of `prettier` for formatting ([#444](https://github.com/svelte-add/svelte-add/pull/444))

- Updated dependencies [[`f41ef62f2ccd6c9bcfcc7f434e191c860fa7cfb6`](https://github.com/svelte-add/svelte-add/commit/f41ef62f2ccd6c9bcfcc7f434e191c860fa7cfb6)]:
  - @svelte-add/ast-tooling@2.1.2
  - @svelte-add/ast-manipulation@2.1.3

## 2.8.0

### Minor Changes

- feat: provide `dedent` utility ([#440](https://github.com/svelte-add/svelte-add/pull/440))

- feat: custom ordered adders ([#437](https://github.com/svelte-add/svelte-add/pull/437))

## 2.7.0

### Minor Changes

- feat: display website documentation url in hint ([#435](https://github.com/svelte-add/svelte-add/pull/435))

- feat: display next steps after running the adders ([#409](https://github.com/svelte-add/svelte-add/pull/409))

## 2.6.0

### Minor Changes

- feat: simplify cli usage ([#429](https://github.com/svelte-add/svelte-add/pull/429))

- feat: tool selection prompt is now a flat and grouped list ([#421](https://github.com/svelte-add/svelte-add/pull/421))

## 2.5.2

### Patch Changes

- chore: fixed type imports and exports ([#412](https://github.com/svelte-add/svelte-add/pull/412))

- Updated dependencies [[`21cfd6a0d9b149fcadce0f41e3f80e4a35d00cc7`](https://github.com/svelte-add/svelte-add/commit/21cfd6a0d9b149fcadce0f41e3f80e4a35d00cc7)]:
  - @svelte-add/ast-manipulation@2.1.2
  - @svelte-add/ast-tooling@2.1.1

## 2.5.1

### Patch Changes

- chore: improve welcome message ([#407](https://github.com/svelte-add/svelte-add/pull/407))

- chore: enforce stricter eslint rules ([#378](https://github.com/svelte-add/svelte-add/pull/378))

- fix: only check dirty git repo precondition if in git repo ([#400](https://github.com/svelte-add/svelte-add/pull/400))

- fix: avoid adding adders to unsupported project types ([#402](https://github.com/svelte-add/svelte-add/pull/402))

- fix: only print failed preconditions ([#401](https://github.com/svelte-add/svelte-add/pull/401))

- Updated dependencies [[`128be6cb88d382744c61d4eb2efe595b46ff2dc0`](https://github.com/svelte-add/svelte-add/commit/128be6cb88d382744c61d4eb2efe595b46ff2dc0)]:
  - @svelte-add/ast-manipulation@2.1.1

## 2.5.0

### Minor Changes

- feat: added Select questions for adder options ([#379](https://github.com/svelte-add/svelte-add/pull/379))

- add postconditions ([#388](https://github.com/svelte-add/svelte-add/pull/388))

### Patch Changes

- fix: directories are now recursively created for files created by an adder ([#379](https://github.com/svelte-add/svelte-add/pull/379))

- fix: global preconditions are now ignored during tests ([#379](https://github.com/svelte-add/svelte-add/pull/379))

- chore: bump dependencies ([#392](https://github.com/svelte-add/svelte-add/pull/392))

- Updated dependencies [[`c8d0622442ada1388d2f96ef9fe81c27a2f7e5eb`](https://github.com/svelte-add/svelte-add/commit/c8d0622442ada1388d2f96ef9fe81c27a2f7e5eb), [`db58988066790b2cd79fb5325758b87f92ce9565`](https://github.com/svelte-add/svelte-add/commit/db58988066790b2cd79fb5325758b87f92ce9565)]:
  - @svelte-add/ast-manipulation@2.1.0
  - @svelte-add/ast-tooling@2.1.0

## 2.4.0

### Minor Changes

- feat: added the shorthand `--default` flag to install the default adder options ([#376](https://github.com/svelte-add/svelte-add/pull/376))

## 2.3.0

### Minor Changes

- feat: display warning if dirty git workspace ([#373](https://github.com/svelte-add/svelte-add/pull/373))

### Patch Changes

- chore: update external dependencies ([#375](https://github.com/svelte-add/svelte-add/pull/375))

- Updated dependencies [[`fe3efbcd5190f798fbb2097af9e1bcd5cdacf170`](https://github.com/svelte-add/svelte-add/commit/fe3efbcd5190f798fbb2097af9e1bcd5cdacf170)]:
  - @svelte-add/ast-manipulation@2.0.5
  - @svelte-add/ast-tooling@2.0.4

## 2.2.0

### Minor Changes

- feat: add ability to skip installing dependencies and skip precondition checks ([#371](https://github.com/svelte-add/svelte-add/pull/371))

### Patch Changes

- chore: consolidate common options ([#371](https://github.com/svelte-add/svelte-add/pull/371))

## 2.1.2

### Patch Changes

- chore: add precondition logic and improve user flow ([#368](https://github.com/svelte-add/svelte-add/pull/368))

## 2.1.1

### Patch Changes

- Updated dependencies [[`8abea835a5c761fcc208f151b7ef347c238e3862`](https://github.com/svelte-add/svelte-add/commit/8abea835a5c761fcc208f151b7ef347c238e3862)]:
  - @svelte-add/ast-manipulation@2.0.4

## 2.1.0

### Minor Changes

- feat: dependencies are now installed automatically if a package manager can be detected ([#361](https://github.com/svelte-add/svelte-add/pull/361))

### Patch Changes

- chore: enabled `strict` mode and fixed types ([#361](https://github.com/svelte-add/svelte-add/pull/361))

- Updated dependencies [[`4631dcad866b9d06a48c50b2f28928a4eb64061b`](https://github.com/svelte-add/svelte-add/commit/4631dcad866b9d06a48c50b2f28928a4eb64061b)]:
  - @svelte-add/ast-manipulation@2.0.3
  - @svelte-add/ast-tooling@2.0.3

## 2.0.4

### Patch Changes

- improve wording for installing dependencies ([#354](https://github.com/svelte-add/svelte-add/pull/354))

## 2.0.3

### Patch Changes

- fix: always add the optional semicolon in stylesheets ([#347](https://github.com/svelte-add/svelte-add/pull/347))

## 2.0.2

### Patch Changes

- preserve json intendation ([#345](https://github.com/svelte-add/svelte-add/pull/345))

- Updated dependencies [[`eff46682b9f4e39f5ea5b2c7fcba6db701cc99aa`](https://github.com/svelte-add/svelte-add/commit/eff46682b9f4e39f5ea5b2c7fcba6db701cc99aa)]:
  - @svelte-add/ast-tooling@2.0.2
  - @svelte-add/ast-manipulation@2.0.2

## 2.0.1

### Patch Changes

- publish v2 ([`05d47180aa7c03c7b67e6e28279b192c91955a5a`](https://github.com/svelte-add/svelte-add/commit/05d47180aa7c03c7b67e6e28279b192c91955a5a))

- Updated dependencies [[`05d47180aa7c03c7b67e6e28279b192c91955a5a`](https://github.com/svelte-add/svelte-add/commit/05d47180aa7c03c7b67e6e28279b192c91955a5a)]:
  - @svelte-add/ast-manipulation@2.0.1
  - @svelte-add/ast-tooling@2.0.1

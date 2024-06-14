# testblox-v3

## naming scheme & general rules
do not name classes, variables, functions or anything that you define in any case other than snake_case
make utilities for things you think you will reuse and same for db accessing, if you need to format like how much money a user has, make a get func which will output the formatted sum
always think of security as its important, if you ever plan to use a package from anything, please look into its issues, security and code.

## ignore the bun crap
To install dependencies:

```bash
bun install
```

To run:

```bash
bun run src/index.ts
```

This project was created using `bun init` in bun v1.1.4. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# testblox-v3

## setup 
run `bun i` to install every dependency, then\
run `bun build-css` to build the css, then finally\
run `bun dev` to start the webserver\
OR\
run `bun dev:watch` to start web server with reload on change

## scripts 
run `bun dev` to start web server (will change script name)\
run `bun dev:watch` to start web server with reload on change\
run `bun build-css` to build\
run `bun build-css:watch` to build with reload on change

## naming scheme & general rules
* do not name classes, variables, functions or anything that you define in any case other than snake_case
* make utilities for things you think you will reuse and same for db accessing, if you need to format like how much money a user has, make a get func which will output the formatted sum
* always think of security as its important, if you ever plan to use a package from anything, please look into its issues, security and code.

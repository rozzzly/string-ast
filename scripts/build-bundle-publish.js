/**
 * Take some inspiration from apollo-client
 *    @see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/scripts/deploy.sh
 *
 * Basically, just do the following:
 *
 *    --[Pre Clean]--------------------------
 *    rm -fr ./dist/*
 *    rm -fr ./bin/*
 *
 *    --[Versioning:Merge]--------------------
 *    Ensure local is up to date with remote by fetching from origin/master
 *        If merge is required
 *            If --auto or --force flag is present
 *                Attempt auto merge
 *                    If auto merge fails
 *                        If --force flag is present
 *                            Preform forced merge
 *                    Else FAIL loudly and revert any changes made
 *            Otherwise pause and prompt user
 *                  If user approves, attempt auto merge
 *                      If auto merge fails, FAIL loudly and revert any changes (to files, git, etc)
 *                  Else exit
 *                If merge cannot be preformed automatically, FAIL loudly and revert any changes (to files, git, etc)
 *
 *    --[Versioning:Bump]--------------------
 *    Bump version in ./src/package.json
 *        If --version={SOME_SEMVER} argument is present (takes precedence over presence of other flags)
 *            Verify given semver is valid (FAIL loudly if not)
 *            Rewrite ./src/package.json with new semver
 *        Else If --major flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        Else If --minor flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        Else If --patch flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        Else (none of these flags/arguments are present)
 *            Act like --patch flag was given
 *                Rewrite ./src/package.json with new semver
 * [TODO] // determine if this logic must be written or can be handled with the npm version command
 *
 * [TODO] // decide what to do when previous version was a pre-release (eg: v0.2.3-alpha.2)      
 * [TODO] // auto update changelog
 * [TODO] // prompt for custom message to update changelog with
 *
*    --[Build:dev]--------------------
 *    Run tsc against ./tsconfig.json
 *        ./src/* outputs in ./bin/src/*
 *            If an error occurs, FAIL loudly and revert any changes (to files, git, etc)
 *        ./test/* outputs in ./bin/test/*
 *            If an error occurs, FAIL loudly and revert any changes (to files, git, etc)
 *
 *    --[Testing]-----------------------
 *    Run compiled test suite
 *        If an error occurs, FAIL loudly and revert any changes (to files, git, etc)
 *
 * [TODO] // run code coverage
 *
 *    --[Build:dist]--------------------
 *    Run tsc against ./tsconfig.es2015.json
 *        ./src/* outputs to ./bin/es2015/*
 *            If an error occurs, FAIL loudly and revert any changes (to files, git, etc)
 *    Run tsc against ./tsconfig.legacy.json
 *        ./src/* outputs to ./bin/legacy/*
 *            If an error occurs, FAIL loudly and revert any changes (to files, git, etc)
 *
 * [TODO] // use Rollup to create browser bundle (UMD)
 *
 *    --[Copy]--------------------------
 *    Copy ./src/package.json to ./dist/package.json
 *    Copy ./src/package-lock.json to ./dist/package-lock.json
 *
 *    Copy ./LICENSE to ./dist/LICENSE
 *    Copy ./README.md to ./dist/README.md
 *    Copy ./CHANGELOG.md to ./dist/CHANGELOG.md
 *
 *    Copy ./bin/es2015/* to ./dist/*
 *    Copy ./bin/legacy/* to ./dist/legacy/*
 *    Copy ./src/* to ./dist/src/*
 *
 *    --[Patch]--------------------------
 *    Rewrite path mappings of source maps in ./dist/* so that they point to the corresponding file in ./dist/src/*
 *    Patch package entry points in ./dist/package.json
 *        'main': './legacy/index.js'
 *        'esnext:main': './index.js'
 *        'module': './index.js'
 *
 * [TODO] // patch 'browser' property with path of UMD bundle
 *
 *    --[Publishing]-----------------
 *    git commit
 *    git tag with bumped version
 *    git push to origin/master
 *    git fetch origin/releases
 *    git force merge master to local/releases
 *    git push to origin/releases
 *    npm publish
 *
 *    done... see npm is easy
 */

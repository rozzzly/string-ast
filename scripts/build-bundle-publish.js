/**
 * Take some inspiration from apollo-client 
 *    @see https://github.com/apollographql/apollo-client/blob/master/packages/apollo-client/scripts/deploy.sh
 *
 * Basically, just do the following:
 *
 *    --[Versioning]---------------
 *    Ensure src is up to date by fetching from origin/master
 *        If merge is required
 *            pause and prompt user
 *            If merge cannot be 
 *    Bump version in ./src/package.json
 *        If --major flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        If --minor flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        If --patch flag is present, bump major portion of semver
 *            Rewrite ./src/package.json with new semver
 *        If --version={SOME_SEMVER} argument is present (takes precedence over presence of other flags)
 *            Verify given semver is valid (FAIL loudly if not)
 *            Rewrite ./src/package.json with new semver
 *        If none of these flags/arguments are present, act like --patch flag was given
 *            Rewrite ./src/package.json with new semver
 *
 *    Copy ./src/package.json to ./dist/package.json
 *    Copy ./src/package-lock.json to ./dist/package-lock.json
 *
 *    Copy ./src/tsconfig.json to ./dist/tsconfig.json
 *          
 *    Copy ./src/* to ./dist/src/*
 *    Copy ./src/tsconfig.json to ./dist/tsconfig.json
 *    /// what about .gitignore?
 *    
 *
 * 
 *    --[Clean Up]------------
 * 
 *    tsconfig.json
 *    --[Publishing:npm]------
 */

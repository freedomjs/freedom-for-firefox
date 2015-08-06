#!/bin/bash
# Get The locations that the current checked-out version lives.
FREEDOMCR="https://github.com/freedomjs/freedom-for-firefox/commit"
COMMIT=$(git rev-parse HEAD)
BRANCH=$(git name-rev --name-only HEAD | cut -d "/" -f3)
TAG=$(git describe --abbrev=0 --tags)
#TAG=$(git describe --exact-match --tags HEAD 2>/dev/null)

# Clone
rm -rf build/freedomjs
git clone https://github.com/freedomjs/freedomjs.github.io.git build/freedomjs

# Copy latest release
mkdir -p build/freedomjs/dist/freedom-for-firefox
cp freedom-for-firefox.jsm build/freedomjs/dist/freedom-for-firefox/freedom-for-firefox.$TAG.jsm
#cp freedom-for-firefox.jsm.map build/freedomjs/dist/freedom-for-firefox/freedom-for-firefox.$TAG.jsm.map

# Link to the latest
rm -f build/freedomjs/dist/freedom-for-firefox/freedom-for-firefox.latest.js*
ln -s freedom-for-firefox.$TAG.jsm build/freedomjs/dist/freedom-for-firefox/freedom-for-firefox.latest.jsm
#ln -s freedom-for-firefox.$TAG.js.map build/freedomjs/dist/freedom-for-firefox/freedom-for-firefox.latest.js.map

# Commit
cd build/freedomjs
git add -A .
git commit -m $FREEDOMCR/$COMMIT
git push origin master

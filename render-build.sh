#!/usr/bin/env bash
# exit on error
set -o errexit

# Install ALL dependencies including devDependencies
npm install

# Build the project
npm run build
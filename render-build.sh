#!/bin/bash
# Frontend build
cd client
npm install
npm run build
mv dist ../dist/client  # Move to expected location

# Backend build
cd ../server
npm install
npm run build
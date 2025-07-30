#!/bin/bash
npm run build
cp -r public/* dist/
echo "✅ Build completed with assets copied!"

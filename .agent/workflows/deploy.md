---
description: how to build and deploy the Volfied game to GitHub Pages
---

# Deploy Volfied to GitHub Pages

This workflow describes the process for taking your local changes and deploying them to the live Game hosted on GitHub Pages. Note that your `vite.config.js` and `.package.json` are already set up for this workflow to succeed as long as your code builds properly.

1. Ensure all your dependencies are installed.
```bash
npm install
```

// turbo
2. Build the project and deploy it.
```bash
npm run deploy
```

This runs both Vite builds for production (output to `/dist`) and then the `gh-pages` module to force-push the updated dist files to the remote `gh-pages` branch, triggering GitHub Pages to deploy.

3. Verify things are synced to git
```bash
git status
```
(Be sure to `git add .` and `git commit` alongside `git push` if you made changes you want on the `main` repo as well.)

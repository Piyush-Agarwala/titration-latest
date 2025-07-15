# GitHub Pages Deployment Guide

## Prerequisites

- GitHub account
- Git installed on your local machine

## Setup Instructions

### 1. Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `chem-lab-simulator` (or update the repository name in `package.json`)
3. Make it public (GitHub Pages requires public repositories for free accounts)

### 2. Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit the changes
git commit -m "Initial commit: Chemistry Lab Simulator"

# Add your GitHub repository as origin
git remote add origin https://github.com/Piyush/chem-lab-simulator.git

# Push to GitHub
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select "Deploy from a branch"
5. Choose **main** branch and **/docs** folder
6. Click **Save**

### 4. Build and Deploy

The project includes automated build scripts for GitHub Pages deployment:

```bash
# Build the project for GitHub Pages
npm run build:pages
```

This command:

- Builds the client application with proper base path
- Creates a `docs/` folder with static files
- Updates asset paths to relative URLs for GitHub Pages

### 5. Update and Redeploy

Whenever you make changes:

```bash
# Make your changes
# ...

# Rebuild for GitHub Pages
npm run build:pages

# Commit and push changes
git add .
git commit -m "Update: description of changes"
git push
```

## Project Structure for Deployment

```
├── docs/                 # GitHub Pages deployment folder
│   ├── index.html       # Main HTML file with relative asset paths
│   └── assets/          # Built CSS and JS files
├── client/              # React frontend source
├── server/              # Express backend (not used in GitHub Pages)
└── package.json         # Contains homepage URL for GitHub Pages
```

## Configuration Details

### Base Path Configuration

The project is configured to use the correct base path for GitHub Pages:

- Development: `/`
- Production (GitHub Pages): `/chem-lab-simulator/`

### Asset Path Resolution

The build process automatically converts absolute asset paths to relative paths for GitHub Pages compatibility.

## Accessing Your Deployed App

Once deployed, your app will be available at:
`https://Piyush.github.io/chem-lab-simulator/`

## Troubleshooting

### Common Issues

1. **404 errors**: Ensure the repository name matches the base path in `vite.config.ts`
2. **Asset loading issues**: Verify that `npm run build:pages` completed successfully
3. **GitHub Pages not updating**: Check that you're pushing to the main branch and the docs folder contains the latest build

### Development vs Production

- Use `npm run dev` for local development
- Use `npm run build:pages` for GitHub Pages deployment
- The app includes both client-side and server-side code, but GitHub Pages only serves the static client build

## Notes

- This is a static deployment (client-side only)
- Server-side features (if any) won't work on GitHub Pages
- The chemistry simulator runs entirely in the browser

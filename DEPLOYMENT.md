# Deployment Guide

This guide explains how to deploy the Chemistry Lab Simulator for both development and GitHub Pages hosting.

## 📁 Project Structure

The project supports both development and GitHub Pages deployment:

```
chem-lab-simulator/
├── client/                 ← React frontend source (development)
├── server/                 ← Express backend source (development)
├── shared/                 ← Shared utilities and types
├── docs/                   ← GitHub Pages static files ✅
│   ├── index.html          ← Entry point for GitHub Pages
│   └── assets/             ← Compiled CSS and JavaScript
├── dist/                   ← Build output from Vite
├── .github/workflows/      ← Automatic deployment
└── package.json            ← Scripts for both dev and deployment
```

## 🚀 GitHub Pages Deployment

### Method 1: Automatic Deployment (Recommended)

The repository includes GitHub Actions that automatically build and deploy to GitHub Pages:

1. **Push to main branch:**

   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: "GitHub Actions"
   - The workflow will automatically build and deploy

3. **Your site will be live at:**
   ```
   https://yourusername.github.io/chem-lab-simulator
   ```

### Method 2: Manual Build and Deploy

1. **Build the static site:**

   ```bash
   npm run build:pages
   ```

2. **Deploy the `docs/` folder:**
   - Go to repository Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`
   - Folder: `/docs`

## 🛠️ Development Server

For local development with full backend functionality:

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Access at:** `http://localhost:5000`

## 📝 Available Scripts

| Script                 | Purpose                  | Output                          |
| ---------------------- | ------------------------ | ------------------------------- |
| `npm run dev`          | Start development server | Full-stack app on port 5000     |
| `npm run build:client` | Build frontend only      | `dist/public/` folder           |
| `npm run build:pages`  | Build for GitHub Pages   | `docs/` folder with fixed paths |
| `npm run build`        | Build full application   | Server + client in `dist/`      |
| `npm run preview`      | Preview production build | Local preview server            |

## ✅ Deployment Checklist

### For GitHub Pages:

- [ ] Run `npm run build:pages` successfully
- [ ] `docs/index.html` exists with relative asset paths
- [ ] `docs/assets/` contains CSS and JS files
- [ ] Repository is public (for free GitHub Pages)
- [ ] GitHub Actions workflow exists (`.github/workflows/deploy.yml`)

### For Development:

- [ ] `client/` folder exists with React source code
- [ ] `server/` folder exists with Express backend
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Development server runs (`npm run dev`)

## 🔧 Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. **Add CNAME file in `docs/` folder:**

   ```
   yourdomain.com
   ```

2. **Configure DNS:**
   - Add CNAME record: `www.yourdomain.com` → `yourusername.github.io`

3. **Update in repository settings:**
   - Settings → Pages → Custom domain

## 🚨 Troubleshooting

### GitHub Pages Issues:

1. **404 Error:**
   - Ensure `docs/index.html` exists
   - Check that repository is public
   - Verify Pages source is set to `main` branch `/docs` folder

2. **Assets not loading:**
   - Verify asset paths in `docs/index.html` are relative (`./assets/`)
   - Run `npm run build:pages` to regenerate with correct paths

3. **Deployment not updating:**
   - Check GitHub Actions tab for build status
   - Clear browser cache
   - GitHub Pages can take a few minutes to update

### Development Issues:

1. **Dev server not starting:**
   - Run `npm install` to install dependencies
   - Check that `client/` and `server/` folders exist
   - Verify port 5000 is not in use

2. **Missing files error:**
   - Ensure you're running `npm run dev` (not `npm start`)
   - Check that `client/index.html` exists

## 🔄 Updating Both Environments

### For Development Changes:

1. Edit files in `client/`, `server/`, or `shared/`
2. Test with `npm run dev`
3. Commit and push changes

### For GitHub Pages:

1. Development changes will automatically trigger GitHub Actions
2. Or manually run: `npm run build:pages` and commit the `docs/` folder

## 📊 Performance Notes

- **Development**: Full React app with hot reload and backend API
- **GitHub Pages**: Optimized static build with minified assets
- **Assets**: Automatically cached by GitHub's CDN
- **Bundle size**: ~780KB JavaScript, ~80KB CSS (gzipped)

## 📞 Support

- Check [GitHub Pages documentation](https://docs.github.com/en/pages)
- Review GitHub Actions logs for deployment errors
- Verify all paths are relative in `docs/index.html`
- Open repository issues for specific problems

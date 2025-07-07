const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const browsers = ['chrome', 'firefox'];
const manifestsDir = path.join(__dirname, '..', 'src', 'manifests');
const distDir = path.join(__dirname, '..', 'dist');

// Files to copy from root directory (browser-specific)
const browserFiles = {
  chrome: ['icon.png', 'content.js'],
  firefox: ['icon.png', 'content.js']
};

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  if (fs.lstatSync(src).isDirectory()) {
    fs.readdirSync(src).forEach(child =>
      copyRecursiveSync(path.join(src, child), path.join(dest, child))
    );
  } else {
    fs.copyFileSync(src, dest);
  }
}

browsers.forEach(browser => {
  const browserDist = path.join(distDir, browser);
  if (fs.existsSync(browserDist)) fs.rmSync(browserDist, { recursive: true, force: true });
  fs.mkdirSync(browserDist, { recursive: true });

  // Copy files from root directory (browser-specific)
  const filesToCopy = browserFiles[browser] || [];
  filesToCopy.forEach(file => {
    const srcPath = path.join(__dirname, '..', 'src', file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(browserDist, file));
    }
  });

  // Copy the correct manifest
  const manifestPath = path.join(manifestsDir, `manifest.${browser}.json`);
  if (fs.existsSync(manifestPath)) {
    fs.copyFileSync(manifestPath, path.join(browserDist, 'manifest.json'));
  } else {
    // Fallback: use the root manifest.json if browser-specific doesn't exist
    const rootManifest = path.join(__dirname, '..', 'src', 'manifest.json');
    if (fs.existsSync(rootManifest)) {
      fs.copyFileSync(rootManifest, path.join(browserDist, 'manifest.json'));
    }
  }
  
  console.log(`Built for ${browser}: ${browserDist}`);
});

// Create zip files for distribution
console.log('\nCreating zip files for distribution...');

browsers.forEach(browser => {
  const browserDist = path.join(distDir, browser);
  const zipName = `${browser}-extension.zip`;
  const zipPath = path.join(distDir, zipName);
  
  try {
    // Remove existing zip if it exists
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
    
    // Create zip file
    execSync(`cd "${browserDist}" && zip -r "../${zipName}" .`, { stdio: 'inherit' });
    console.log(`Created ${zipPath}`);
  } catch (error) {
    console.error(`Failed to create zip for ${browser}:`, error.message);
  }
});

console.log('\nBuild complete! Zip files are ready in the dist folder.');
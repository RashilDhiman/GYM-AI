/**
 * Cross-platform copy of Skia prebuilt libs into @shopify/react-native-skia/libs.
 * Upstream uses rm/cp in postinstall (fails under Windows cmd). This script runs
 * from `npm run skia:copy-libs` and from `preandroid`.
 *
 * If `npm install` fails on Skia postinstall: `npm install --ignore-scripts`,
 * then `npm run skia:copy-libs`.
 */
'use strict';

const path = require('path');
const fs = require('fs');
const cp = require('child_process');

const useGraphite =
  process.env.SK_GRAPHITE === '1' ||
  (process.env.SK_GRAPHITE || '').toLowerCase() === 'true';
const prefix = useGraphite ? 'react-native-skia-graphite' : 'react-native-skia';

const projectRoot = path.join(__dirname, '..');
const skiaPkgRoot = path.join(projectRoot, 'node_modules', '@shopify', 'react-native-skia');
const libsDir = path.join(skiaPkgRoot, 'libs');
const skiaAndroidBuildDir = path.join(skiaPkgRoot, 'android', 'build');
const androidModuleBuildDir = path.join(projectRoot, 'android', '.module-build');

function sleepMs(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Intentional short blocking wait for retry backoff.
  }
}

function rmrf(target, retries = 8) {
  if (!fs.existsSync(target)) {
    return;
  }
  let lastErr;
  for (let i = 0; i < retries; i += 1) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return;
    } catch (err) {
      lastErr = err;
      sleepMs(250 * (i + 1));
    }
  }
  if (lastErr) {
    throw lastErr;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function copyXcframeworks(srcLibsDir, destDir) {
  ensureDir(destDir);
  if (!fs.existsSync(srcLibsDir)) {
    throw new Error(`Missing Skia libs directory: ${srcLibsDir}`);
  }
  for (const name of fs.readdirSync(srcLibsDir)) {
    if (!name.endsWith('.xcframework')) {
      continue;
    }
    const from = path.join(srcLibsDir, name);
    const to = path.join(destDir, name);
    rmrf(to);
    fs.cpSync(from, to, { recursive: true });
  }
}

function resolvePkgJsonDir(packageName) {
  return path.dirname(require.resolve(path.join(packageName, 'package.json'), { paths: [projectRoot] }));
}

function stopGradleDaemons() {
  const androidDir = path.join(projectRoot, 'android');
  try {
    if (process.platform === 'win32') {
      cp.execFileSync('cmd.exe', ['/c', 'gradlew.bat --stop'], {
        cwd: androidDir,
        stdio: 'pipe',
        windowsHide: true,
      });
    } else {
      cp.execFileSync('./gradlew', ['--stop'], {
        cwd: androidDir,
        stdio: 'pipe',
      });
    }
    console.log('-- Stopped Gradle daemons');
  } catch {
    console.log('-- Could not stop Gradle daemons (continuing)');
  }
}

stopGradleDaemons();
rmrf(skiaAndroidBuildDir);
rmrf(path.join(androidModuleBuildDir, 'shopify_react-native-skia'));
console.log('-- Cleaned Skia Android build cache');

// --- Apple ---

let iosPackage;
let macosPackage;
try {
  iosPackage = resolvePkgJsonDir(`${prefix}-apple-ios`);
  macosPackage = resolvePkgJsonDir(`${prefix}-apple-macos`);
} catch (e) {
  console.error(
    `ERROR: Could not resolve ${prefix}-apple-ios or ${prefix}-apple-macos. Run npm install from the project root.`,
  );
  process.exit(1);
}

const iosXcf = path.join(iosPackage, 'libs');
if (!fs.existsSync(iosXcf) || !fs.readdirSync(iosXcf).some((f) => f.endsWith('.xcframework'))) {
  console.error(`ERROR: Skia prebuilt binaries not found in ${prefix}-apple-ios under ${iosXcf}`);
  process.exit(1);
}

console.log('-- Skia iOS package:', iosPackage);
console.log('-- Skia macOS package:', macosPackage);

rmrf(path.join(libsDir, 'ios'));
rmrf(path.join(libsDir, 'macos'));
rmrf(path.join(libsDir, 'tvos'));
copyXcframeworks(iosXcf, path.join(libsDir, 'ios'));
copyXcframeworks(path.join(macosPackage, 'libs'), path.join(libsDir, 'macos'));

if (!useGraphite) {
  try {
    const tvosPackage = resolvePkgJsonDir(`${prefix}-apple-tvos`);
    console.log('-- Skia tvOS package:', tvosPackage);
    copyXcframeworks(path.join(tvosPackage, 'libs'), path.join(libsDir, 'tvos'));
  } catch {
    console.log('-- tvOS package not found, skipping');
  }
}

console.log('-- Copied Apple xcframeworks to libs/');

// --- Android ---

const androidPackageName = useGraphite ? 'react-native-skia-graphite-android' : 'react-native-skia-android';
let androidPackage;
try {
  androidPackage = resolvePkgJsonDir(androidPackageName);
} catch {
  console.error(`ERROR: Could not resolve ${androidPackageName}`);
  process.exit(1);
}

const androidSrcLibs = path.join(androidPackage, 'libs');
if (!fs.existsSync(androidSrcLibs)) {
  console.error(`ERROR: Skia prebuilt binaries not found in ${androidPackageName}!`);
  process.exit(1);
}

console.log('-- Skia Android package:', androidPackage);

const androidDest = path.join(libsDir, 'android');
rmrf(androidDest);
fs.cpSync(androidSrcLibs, androidDest, { recursive: true });

console.log('-- Copied Android libs to libs/android/');

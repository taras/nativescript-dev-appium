const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const utils = require("./utils");
const projectDir = utils.projectDir();
const pluginRoot = utils.pluginRoot();
const testsDir = utils.resolve(projectDir, "e2e-tests");
const packageJsonPath = utils.resolve(projectDir, "package.json");
let packageJson = {};

let generateSampleTest = true;

if (fs.existsSync(packageJsonPath)) {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

try {
    fs.mkdirSync(testsDir);
} catch (e) {
    generateSampleTest = false;
}

if (generateSampleTest) {
    let sampleTestSrc = utils.resolve(pluginRoot, "sample-test.js");
    let sampleTestDest = utils.resolve(testsDir, "sample-test.js");
    if (!fs.existsSync(sampleTestDest)) {
        let javaClassesContent = fs.readFileSync(sampleTestSrc, "utf8");
        fs.writeFileSync(sampleTestDest, javaClassesContent);
    }
}

if (!packageJson.scripts) {
    packageJson.scripts = {};
}
if (!packageJson.scripts["appium"]) {
    packageJson.scripts["appium"] = "nativescript-dev-appium";
}

configureDevDependencies(packageJson, function(add) {
    add("chai", "~3.5.0");
    add("chai-as-promised", "~5.3.0");
    add("wd", "~1.1.1");
});

console.warn("WARNING: nativescript-dev-appium no longer installs Appium as a local dependency!");
console.log("Add appium as a local dependency (see README) or we'll attempt to run it from PATH.");

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

function configureDevDependencies(packageJson, adderCallback) {
    let pendingNpmInstall = false;
    if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
    }

    let dependencies = packageJson.devDependencies;

    adderCallback(function(name, version) {
        if (!dependencies[name]) {
            dependencies[name] = version;
            console.info("Adding dev dependency: " + name + "@" + version);
            pendingNpmInstall = true;
        } else {
            console.info("Dev dependency: '" + name + "' already added. Leaving version: " + dependencies[name]);
        }
    });

    if (pendingNpmInstall) {
        console.info("Installing new dependencies...");
        //Run `npm install` after everything else.
        setTimeout(function() {
            let spawnArgs = [];
            if (/^win/.test(process.platform)) {
                spawnArgs = ["cmd.exe", ["/c", "npm", "install"]];
            } else {
                spawnArgs = ["npm", ["install"]];
            }
            spawnArgs.push({ cwd: projectDir(), stdio: "inherit" });
            const npm = childProcess.spawn.apply(null, spawnArgs);
            npm.on("close", function(code) {
                process.exit(code);
            });
        }, 100);
    }
}
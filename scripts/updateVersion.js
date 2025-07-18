// scripts/updateVersion.js
// This script updates the version number in the src/index.js file based on the version specified in package.json.
// It uses shell commands to perform the update and logs the new version to the console.
// updateVersion.js

var path = require("path");
var fs = require("fs");
var shell = require('shelljs');

var root = path.join(__dirname, "..");

var packageJson = fs.readFileSync(path.join(root, "package.json")).toString()
var version = JSON.parse(packageJson).version;

var indexjs = path.join(root, "src", "index.js");

shell.sed("-i", /(const version = ").*";/, "$1" + version + "\";", indexjs)

console.log("updated version to", version);

if (typeof __dirname === "undefined") {
  global.__dirname = "/";
}

if (typeof __filename === "undefined") {
  global.__filename = "";
}

if (typeof process === "undefined") {
  global.process = require("process");
} else {
  const processShim = require("process");

  for (const key in processShim) {
    if (!(key in process)) {
      process[key] = processShim[key];
    }
  }
}

process.browser = false;
process.env = process.env || {};
process.env.NODE_ENV = typeof __DEV__ === "boolean" && __DEV__ ? "development" : "production";

if (typeof Buffer === "undefined") {
  global.Buffer = require("buffer").Buffer;
}

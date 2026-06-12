const packageJson = require("./package.json");

module.exports = {
  ...packageJson.build,
  forceCodeSigning: true,
  win: {
    ...packageJson.build.win,
    signAndEditExecutable: true
  }
};

const packageJson = require("./package.json");

const storeIdentityName =
  process.env.MORPHTERM_STORE_IDENTITY_NAME || "MorphTerm";
const storePublisher =
  process.env.MORPHTERM_STORE_PUBLISHER ||
  "CN=3d21611c-4ee6-471d-b8dc-7eae5a934a28";
const storePublisherDisplayName =
  process.env.MORPHTERM_STORE_PUBLISHER_DISPLAY_NAME || "hqdev";

module.exports = {
  ...packageJson.build,
  win: {
    ...packageJson.build.win,
    target: ["appx"],
    signAndEditExecutable: true
  },
  appx: {
    identityName: storeIdentityName,
    publisher: storePublisher,
    publisherDisplayName: storePublisherDisplayName,
    applicationId: "MorphTerm",
    displayName: "Morph Term",
    backgroundColor: "#101214"
  }
};

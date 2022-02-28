const {
  process,
  removePeerDeps,
  addDependencies,
} = require("./tools/pnpm-utils");

function readPackage(pkg, context) {
  const major = parseInt(pkg.version?.split(".")[0] || "0");

  process(
    [
      // Prevents duplicate packages.
      removePeerDeps("react-redux", "styled-components"),
      // The following packages are broken and do not declare their dependencies properly.
      addDependencies(
        "@svgr/core",
        { "@svgr/plugin-svgo": "*" },
        { kind: "peerDependencies" }
      ),
      addDependencies("@storybook/webpack-config", { "resolve-from": "*" }),
      addDependencies(/@celo\/(?!base)+/, { "@celo/base": `^${pkg.version}` }),
      addDependencies("@celo/connect", {
        "@celo/base": `^${pkg.version}`,
        "web3-eth-contract": pkg.peerDependencies?.web3 ?? "*",
      }),
      addDependencies("@celo/contractkit", {
        "web3-utils": pkg.dependencies?.["web3"],
      }),
      addDependencies("@celo/utils", {
        randombytes: "*",
        rlp: "*",
      }),
      addDependencies("@cosmjs/proto-signing", {
        "@cosmjs/crypto": pkg.version,
        "@cosmjs/encoding": pkg.version,
        "@cosmjs/utils": pkg.version,
        "@cosmjs/math": pkg.version,
      }),
      addDependencies("@cosmjs/tendermint-rpc", {
        "@cosmjs/utils": pkg.version,
      }),
      addDependencies("@walletconnect/iso-crypto", {
        "@walletconnect/encoding": "*",
      }),
      addDependencies("react-native", {
        "react-native-codegen": "0.0.7",
        mkdirp: "*",
      }),
      addDependencies("react-native-codegen", {
        glob: "*",
        invariant: "*",
      }),
      addDependencies("@react-native-community/cli", {
        "metro-resolver": "^0.67.0",
      }),
      addDependencies("metro-config", {
        "metro-transform-worker": pkg.version,
      }),
      addDependencies("metro-transform-worker", {
        "metro-minify-uglify": pkg.version,
      }),
      addDependencies("@expo/webpack-config", {
        "resolve-from": "*",
      }),
      addDependencies("@sentry/react-native", {
        tslib: "*",
        promise: "*",
      }),
      addDependencies("react-native-text-input-mask", {
        tslib: "*",
      }),
      addDependencies("react-native-locale", {
        fbjs: "*",
      }),
      addDependencies(
        "any-observable",
        {
          rxjs: "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies("@storybook/addon-knobs", {
        "@storybook/client-api": major ? "" + major : "*",
      }),
      addDependencies(
        "@cspotcode/source-map-support",
        {
          "source-map-support": "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
      addDependencies(
        "eslint-plugin-jest",
        {
          "jest": "*",
        },
        {
          kind: "peerDependencies",
        }
      ),
    ],
    pkg,
    context
  );

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};

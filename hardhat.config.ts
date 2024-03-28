import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-contract-sizer";
import "@nomicfoundation/hardhat-verify";

import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.24",

  // Compiler optimization
  settings: { optimizer: { enabled: true, runs: 500 } },

  // Networks
  networks: {
    arb: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: process.env.DEPLOYER_PVT_KEY
        ? [process.env.DEPLOYER_PVT_KEY]
        : [],
    },
    arbMain: {
      url: "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      accounts: process.env.PROD_PVT_KEY ? [process.env.PROD_PVT_KEY] : [],
    },
  },

  // Gas reporting
  gasReporter: {
    enabled: true,
    currency: "USD", // currency to show
    noColors: false,
  },

  // Source verification
  sourcify: {
    enabled: true,
  },

  // Contract sizing this is must, EVM has a contract size limit of 24kB
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    unit: "kB",
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARB_SCAN_KEY ? process.env.ARB_SCAN_KEY : "",
      arbitrumSepolia: process.env.ARB_SCAN_KEY ? process.env.ARB_SCAN_KEY : "",
    },
  },
};

export default config;

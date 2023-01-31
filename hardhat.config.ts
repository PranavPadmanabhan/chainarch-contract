import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "dotenv/config";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      // hardfork: "merge",
      // // If you want to do some forking set `enabled` to true
      // forking: {
      //     url: MAINNET_RPC_URL,
      //     blockNumber: Number(FORKING_BLOCK_NUMBER),
      //     enabled: false,
      // },
      chainId: 31337,
    },
    goerli: {
      chainId: 5,
      url: process.env.GOERLY_URL,
      accounts: [KEY],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  gasReporter: {
    enabled: false,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [],
  },
  mocha: {
    timeout: 15000000,
  },
};

export default config;

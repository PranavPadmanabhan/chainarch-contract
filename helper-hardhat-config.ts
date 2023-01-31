import { BigNumber } from "ethers";

type NetworkConfigItem = {
  name: string;
  fundAmount: BigNumber;
  fee?: string;
  keyHash?: string;
  interval?: string;
  linkToken?: string;
  vrfCoordinator?: string;
  keepersUpdateInterval?: string;
  oracle?: string;
  jobId?: string;
  ethUsdPriceFeed?: string[];
};

type NetworkConfigMap = {
  [chainId: string]: NetworkConfigItem;
};

export const networkConfig: NetworkConfigMap = {
  default: {
    name: "hardhat",
    fee: "100000000000000000",
    keyHash:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    jobId: "29fa9aa13bf1468788b7cc4a500a45b8",
    fundAmount: BigNumber.from("1000000000000000000"),
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
    fee: "100000000000000000",
    keyHash:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    jobId: "29fa9aa13bf1468788b7cc4a500a45b8",
    fundAmount: BigNumber.from("1000000000000000000"),
    keepersUpdateInterval: "30",
    ethUsdPriceFeed: ["0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"],
  },
  1: {
    name: "mainnet",
    linkToken: "0x514910771af9ca656af840dff83e8264ecf986ca",
    fundAmount: BigNumber.from("0"),
    keepersUpdateInterval: "30",
  },
  5: {
    name: "goerli",
    linkToken: "0x326c977e6efc84e512bb9c30f76e30c160ed06fb",
    ethUsdPriceFeed: [
      "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", //ETH / USD
      "0xA39434A63A52E749F02807ae27335515BA4b07F7", // BTC / USD
      "0x0d79df66BE487753B02D015Fb622DED7f0E9798d", // DAI / USD
      "0x48731cF7e84dc94C5f84577882c14Be11a5B7456", // LINK / USD
      "0x779877A7B0D9E8603169DdbD7836e478b4624789", // BTC / ETH
      "0xb4c4a493AB6356497713A78FFA6c60FB53517c63", // LINK / ETH
    ],
    keyHash:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
    vrfCoordinator: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
    oracle: "0xCC79157eb46F5624204f47AB42b3906cAA40eaB7",
    jobId: "ca98366cc7314957b8c012c72f05aeeb",
    fee: "100000000000000000",
    fundAmount: BigNumber.from("100000000000000000"),
    keepersUpdateInterval: "30",
  },
  137: {
    name: "polygon",
    linkToken: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
    ethUsdPriceFeed: ["0xF9680D99D6C9589e2a93a78A04A279e509205945"],
    oracle: "0x0a31078cd57d23bf9e8e8f1ba78356ca2090569e",
    jobId: "12b86114fa9e46bab3ca436f88e1a912",
    fee: "100000000000000",
    fundAmount: BigNumber.from("100000000000000"),
  },
};

export const developmentChains: string[] = ["hardhat", "localhost"];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
export const rewardArray2 = [
  0.5, 0.25, 0.1, 0.085, 0.0625, 0.05, 0.015, 0.01, 0.005,
];
export const rewardArray3 = [0.2, 0.1, 0.05, 0.043, 0.0325, 0.026];
export const array = [
  0.0008, 0.0005, 0.0002, 0.00005333333, 0.00004, 0.000032, 0.00001066666,
  0.0000064, 0.00000333333,
];

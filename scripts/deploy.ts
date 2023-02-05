import { SolMate } from "./../typechain-types/SolMate";
import { deployments, ethers, getNamedAccounts } from "hardhat";

async function main() {
  let address: string = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  let gasLimit: number = 200000;
  let interval: number = 600;
  let accounts: any;
  let funds: any = ethers.utils.parseEther("0.007");

  const provider = new ethers.providers.WebSocketProvider(
    process.env.GOERLY_URL!
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
  const { deployer } = await getNamedAccounts();
  await deployments.fixture(["all"]);
  const solMateContract: SolMate = await ethers.getContract(
    "SolMate",
    deployer
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

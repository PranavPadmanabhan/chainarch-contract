import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deploySolMate: DeployFunction = async function ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("deploying contract...");
  const solMateContract = await deploy("SolMate", {
    contract: "SolMate",
    args: [],
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });
};
export default deploySolMate;

deploySolMate.tags = ["all", "solmate"];

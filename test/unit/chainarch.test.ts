import { ChainArch } from "./../../typechain-types/ChainArch";
import { deployments, network, ethers, getNamedAccounts } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { assert, expect } from "chai";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("solMate Unit Tests", async function () {
      let chainArchContract: ChainArch;
      let deployer: any;
      let address: string = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      let gasLimit: number = 200000;
      let interval: number = 600;
      let accounts: any;
      let funds: any = ethers.utils.parseEther("0.007");
      let executor = "0xAfF6aF0bE557873Fbc3d8038BAC733641f98F3B6";
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        accounts = await ethers.getSigners();
        await deployments.fixture(["all"]);
        const contract = await deployments.get("SolMate")
        chainArchContract = await ethers.getContractAt("SolMate",contract.address, accounts[0]);
      });

      describe("constructor", async () => {
        it("should set owner correctly", async () => {
          const owner = await chainArchContract.getOwner();
          assert.equal(
            owner.toString().toLowerCase(),
            deployer.toString().toLowerCase()
          );
        });
      });

      describe.only("createAutomation", async () => {
        beforeEach(async () => {
          const tx = await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            { value: funds }
          );
          const rec = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = rec;
          console.log(gasUsed.toString());
          console.log(
            `gas for creating automation : ${ethers.utils.formatEther(
              gasUsed.mul(effectiveGasPrice).toString()
            )}`
          );
        });
        it("should update details", async () => {
          const tasks = await chainArchContract.getAllTasks();
          const {
            funds,
            gasLimit: _gasLimit,
            taskAddress,
            id,
            totalCostForExec,
            state,
          } = tasks[0];
          const execList = await chainArchContract.getExecListOf(address);
          assert(tasks.length > 0);
          assert.equal(id.toString(), "1");
          assert.equal(funds.toString(), funds.toString());
          assert.equal(_gasLimit.toString(), gasLimit.toString());
          // assert(execList.length === 1);
          assert.equal(totalCostForExec.toString(), "0");
          assert.equal(taskAddress.toString(), address.toString());
          assert.equal(state.toString(), "0");
        });
        it("should emit the event", async () => {
          await expect(
            chainArchContract.createAutomation(
              address,
              gasLimit,
              deployer,
              {
                value: funds,
              }
            )
          ).to.emit(chainArchContract, "NewAutoTask");
        });
      });

      describe("cancelAutomation", async () => {
        beforeEach(async () => {
          await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            {
              value: funds,
            }
          );
        });

        it("should update task state", async () => {
          const tx = await chainArchContract.cancelAutomation(address);
          await tx.wait(1);
          const tasks = await chainArchContract.getAllTasks();
          const { state } = tasks[0];
          console.log(state.toString());
          // assert.equal(state.toString(), "1");
        });
        it("should emit the event", async () => {
          await expect(chainArchContract.cancelAutomation(address)).to.emit(
            solMateContract,
            "AutoTaskCancelled"
          );
        });
      });

      describe("addFunds", async () => {
        beforeEach(async () => {
          await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            {
              value: funds,
            }
          );
          await chainArchContract.addFunds(address, deployer, { value: funds });
        });

        it("should update fund of task", async () => {
          const tasks = await chainArchContract.getAllTasks();
          const { funds: fund } = tasks[0];
          assert.equal(fund.toString(), funds.add(funds).toString());
        });
        it("should emit the event", async () => {
          await expect(
            chainArchContract.addFunds(address, deployer, { value: funds })
          ).to.emit(chainArchContract, "TaskFundingSuccess");
        });
      });

      describe("withdrawFunds", async () => {
        beforeEach(async () => {
          await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            {
              value: funds,
            }
          );
        });

        it("should update fund of task", async () => {
          const initialBalance = await chainArchContract.provider.getBalance(
            deployer
          );
          const tx = await chainArchContract.withdrawFunds(address);
          const rec = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = rec;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const tasks = await solMateContract.getAllTasks();
          const { funds: fund } = tasks[0];
          assert.equal(fund.toString(), "0");
        });
        it("should emit the event", async () => {
          await expect(chainArchContract.withdrawFunds(address)).to.emit(
            chainArchContract,
            "TaskFundWithdrawSuccess"
          );
        });
      });

      describe("updateTaskExecDetails", async () => {
        beforeEach(async () => {
          await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            {
              value: funds,
            }
          );
        });

        it("should update details of task", async () => {
          let executionCost = ethers.utils.parseEther("0.00005");
          const tx = await chainArchContract.updateTaskExecDetails(
            address,
            executionCost,
          );
          const { gasUsed, effectiveGasPrice } = await tx.wait(1);
          console.log(ethers.utils.formatEther(gasUsed.mul(effectiveGasPrice)));
          console.log(gasUsed.toString());
          const tasks = await chainArchContract.getAllTasks();
          const { totalCostForExec } = tasks[0];
          const execList = await chainArchContract.getExecListOf(address);
          // assert(execList.length == 2);
          assert.equal(totalCostForExec.toString(), executionCost.toString());
        });
        it("should emit the event", async () => {
          let executionCost = ethers.utils.parseEther("0.00005");
          await expect(
            chainArchContract.updateTaskExecDetails(address, executionCost)
          ).to.emit(chainArchContract, "TaskDetailsUpdated");
        });
      });

      describe("updateTaskGasLimit", async () => {
        beforeEach(async () => {
          await chainArchContract.createAutomation(
            address,
            gasLimit,
            deployer,
            {
              value: funds,
            }
          );
        });

        it("should update gasLimit of task", async () => {
          let _gasLimit = 260000;
          const tx = await chainArchContract.updateTaskGasLimit(
            address,
            _gasLimit
          );
          const tasks = await chainArchContract.getAllTasks();
          const { gasLimit } = tasks[0];
          assert.equal(gasLimit.toString(), _gasLimit.toString());
        });

        it("should emit the event", async () => {
          let _gasLimit = 260000;
          await expect(
            await chainArchContract.updateTaskGasLimit(address, _gasLimit)
          ).to.emit(chainArchContract, "GasLimitUpdated");
        });
      });

      describe("check", async () => {});
      beforeEach(async () => {
        await chainArchContract.createAutomation(
          address,
          gasLimit,
          deployer,
          {
            value: funds,
          }
        );
      });

    });

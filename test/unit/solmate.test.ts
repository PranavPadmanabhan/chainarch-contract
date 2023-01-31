import { SolMate } from "./../../typechain-types/SolMate";
import { deployments, network, ethers, getNamedAccounts } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { assert, expect } from "chai";
import { string } from "hardhat/internal/core/params/argumentTypes";

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("solMate Unit Tests", async function () {
      let solMateContract: SolMate;
      let deployer: any;
      let address: string = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      let gasLimit: number = 200000;
      let interval: number = 600;
      let accounts: any;
      let funds: any = ethers.utils.parseEther("0.007");
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        accounts = await ethers.getSigners();
        await deployments.fixture(["all"]);
        solMateContract = await ethers.getContract("SolMate", deployer);
      });

      describe("constructor", async () => {
        it("should set owner correctly", async () => {
          const owner = await solMateContract.getOwner();
          assert.equal(
            owner.toString().toLowerCase(),
            deployer.toString().toLowerCase()
          );
        });
      });

      describe("createAutomation", async () => {
        beforeEach(async () => {
          const tx = await solMateContract.createAutomation(
            address,
            gasLimit,
            interval,
            { value: funds }
          );
          const rec = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = rec;
          console.log(
            `gas for creating automation : ${ethers.utils.formatEther(
              gasUsed.mul(effectiveGasPrice).toString()
            )}`
          );
        });
        it("should update details", async () => {
          const tasks = await solMateContract.getTasksOf(deployer);
          const {
            execList,
            funds,
            gasLimit: _gasLimit,
            taskAddress,
            id,
            totalCostForExec,
            state,
            interval: _int,
          } = tasks[0];
          assert(tasks.length > 0);
          assert.equal(id.toString(), "1");
          assert.equal(funds.toString(), funds.toString());
          assert.equal(_gasLimit.toString(), gasLimit.toString());
          assert.equal(execList.length, 0);
          assert.equal(totalCostForExec.toString(), "0");
          assert.equal(taskAddress.toString(), address.toString());
          assert.equal(_int.toString(), interval.toString());
          assert.equal(state.toString(), "0");
        });
        it("should emit the event", async () => {
          await expect(
            solMateContract.createAutomation(address, gasLimit, interval, {
              value: funds,
            })
          ).to.emit(solMateContract, "NewAutoTask");
        });
      });

      describe("cancelAutomation", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
          await solMateContract.cancelAutomation(address);
        });

        it("should update task state", async () => {
          const tasks = await solMateContract.getTasksOf(deployer);
          const { state } = tasks[0];
          assert.equal(state.toString(), "1");
        });
        it("should emit the event", async () => {
          await expect(solMateContract.cancelAutomation(address)).to.emit(
            solMateContract,
            "AutoTaskCancelled"
          );
        });
      });

      describe("addFunds", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
          await solMateContract.addFunds(address, { value: funds });
        });

        it("should update fund of task", async () => {
          const tasks = await solMateContract.getTasksOf(deployer);
          const { funds: fund } = tasks[0];
          assert.equal(fund.toString(), funds.add(funds).toString());
        });
        it("should emit the event", async () => {
          await expect(
            solMateContract.addFunds(address, { value: funds })
          ).to.emit(solMateContract, "TaskFundingSuccess");
        });
      });

      describe("withdrawFunds", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
        });

        it("should update fund of task", async () => {
          const initialBalance = await solMateContract.provider.getBalance(
            deployer
          );
          const tx = await solMateContract.withdrawFunds(address);
          const rec = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = rec;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const tasks = await solMateContract.getTasksOf(deployer);
          const { funds: fund } = tasks[0];
          const finalBalance = await solMateContract.provider.getBalance(
            deployer
          );
          assert.equal(fund.toString(), "0");
          assert.equal(
            finalBalance.toString(),
            initialBalance.add(funds).sub(gasCost).toString()
          );
        });
        it("should emit the event", async () => {
          await expect(solMateContract.withdrawFunds(address)).to.emit(
            solMateContract,
            "TaskFundWithdrawSuccess"
          );
        });
      });

      describe("updateTaskExecDetails", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
        });

        it("should update details of task", async () => {
          let executionCost = ethers.utils.parseEther("0.00005");
          const tx = await solMateContract.updateTaskExecDetails(
            address,
            executionCost
          );
          const tasks = await solMateContract.getTasksOf(deployer);
          const { execList, totalCostForExec } = tasks[0];
          assert(execList.length == 1);
          assert.equal(totalCostForExec.toString(), executionCost.toString());
        });
        it("should emit the event", async () => {
          let executionCost = ethers.utils.parseEther("0.00005");
          await expect(
            solMateContract.updateTaskExecDetails(address, executionCost)
          ).to.emit(solMateContract, "TaskDetailsUpdated");
        });
      });

      describe("updateTaskGasLimit", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
        });

        it("should update gasLimit of task", async () => {
          let _gasLimit = 260000;
          const tx = await solMateContract.updateTaskGasLimit(
            address,
            _gasLimit
          );
          const tasks = await solMateContract.getTasksOf(deployer);
          const { gasLimit } = tasks[0];
          assert.equal(gasLimit.toString(), _gasLimit.toString());
        });

        it("should emit the event", async () => {
          let _gasLimit = 260000;
          await expect(
            await solMateContract.updateTaskGasLimit(address, _gasLimit)
          ).to.emit(solMateContract, "GasLimitUpdated");
        });
      });

      describe("updateTaskFunds", async () => {
        beforeEach(async () => {
          await solMateContract.createAutomation(address, gasLimit, interval, {
            value: funds,
          });
        });

        it("should update fund of task", async () => {
          const intialTasks = await solMateContract.getTasksOf(deployer);
          const { funds: initial } = intialTasks[0];
          let amount = ethers.utils.parseEther("0.002");
          const tx = await solMateContract.updateTaskFunds(address, amount);
          const rec = await tx.wait(1);
          const { gasUsed, effectiveGasPrice } = rec;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const tasks = await solMateContract.getTasksOf(deployer);
          const { funds } = tasks[0];
          assert.equal(funds.toString(), initial.sub(amount).toString());
        });

        it("should emit the event", async () => {
          let amount = ethers.utils.parseEther("0.002");
          await expect(
            solMateContract.updateTaskFunds(address, amount)
          ).to.emit(solMateContract, "AutoMationCostDeducted");
        });

        it("should revert if caller is not owner ", async () => {
          let amount = ethers.utils.parseEther("0.002");
          await expect(
            solMateContract
              .connect(accounts[2])
              .updateTaskFunds(address, amount)
          ).to.be.revertedWith("user is not owner");
        });
      });
    });

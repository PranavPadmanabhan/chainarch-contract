// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

error MinimumBalanceRequired();
error WithdrawFailed();
error TopUpFailed();
error FundingFailed();
error NotAuthorized();

import "./automationInterface.sol";

contract SolMate {
    enum TaskState {
        active,
        cancelled
    }

    string name;

    // EVENTS

    event NewAutoTask(
        uint256 id,
        address taskAddress,
        uint256 funds,
        uint256 gasLimit,
        TaskState state,
        address creator,
        uint256 totalCostForExec
    );

    event AutoTaskCancelled(address taskAddress, uint amount, address owner);
    event TaskFundingSuccess(uint256 amount, address taskAddress);
    event TaskFundWithdrawSuccess(address taskAddress, uint256 fund);
    event GasLimitUpdated(uint256 gasLimit, address taskAddress, address user);
    event TaskDetailsUpdated(uint256 time, address taskAddress, uint256 amount);
    event FundDeposited(uint amount, address caller);

    // MODIFIERS

    modifier onlyOwner() {
        require(msg.sender == i_owner, "user is not owner");
        _;
    }

    // STRUCTS

    struct AutoTask {
        uint256 id;
        address taskAddress;
        uint256 funds;
        uint256 gasLimit;
        TaskState state;
        address creator;
        uint256 totalCostForExec;
    }

    // STATE VARIABLES

    AutoTask[] private s_tasks;
    mapping(address => AutoTask[]) private s_tasksOf;
    address payable immutable i_owner;
    mapping(address => uint[]) private s_execListOf;

    // FUNCTIONS

    constructor() {
        i_owner = payable(msg.sender);
    }


    /**
     * 
     * @dev this function will add new automatedTask to the s_tasks array and transfer the initial funds to executor address
     * @param _address  target contract address to be automated
     * @param _gasLimit  gasLimit for the automated transaction
     * @param executor  address of automation executor(owner of this contract)
     */

    function createAutomation(
        address _address,
        uint256 _gasLimit,
        address executor
    ) public payable {
        if (msg.value < 0.0005 ether) {
            revert MinimumBalanceRequired();
        }
        s_tasks.push(
            AutoTask(
                s_tasks.length + 1,
                _address,
                msg.value,
                _gasLimit,
                TaskState.active,
                msg.sender,
                0
            )
        );
        (bool success, ) = payable(executor).call{value: msg.value}("");
        if (!success) {
            revert TopUpFailed();
        }
        emit NewAutoTask(
            s_tasks.length + 1,
            _address,
            msg.value,
            _gasLimit,
            TaskState.active,
            msg.sender,
            0
        );
    }

    /**
     * @dev it updates the state of the task to cancelled, only creator of the task can cancell it
     * 
     * @param id  id of the specific task that needs to be cancelled
     */

    function cancelAutomation(uint id) public {
        uint fund;
        if (msg.sender != s_tasks[id - 1].creator) {
            revert NotAuthorized();
        }
        s_tasks[id - 1].state = TaskState.cancelled;
        fund = s_tasks[id - 1].funds;
        emit AutoTaskCancelled(s_tasks[id - 1].taskAddress, fund, msg.sender);
    }


    /**
     * @dev  it will update the funds of the task and also transfer the amount to executor address
     * 
     * @param id  id of the specific task to be funded
     * @param executor  address of task executor
     */

    function addFunds(uint id, address executor) public payable {
        if (msg.value < 0.0001 ether) {
            revert MinimumBalanceRequired();
        }
        s_tasks[id - 1].funds += msg.value;

        (bool success, ) = payable(executor).call{value: msg.value}("");
        if (!success) {
            revert FundingFailed();
        }
        emit TaskFundingSuccess(msg.value, s_tasks[id - 1].taskAddress);
    }

     /**
     * @dev  it will update the funds of the task and also transfer the funds to creator of the task
     * 
     * @param id  id of the specific task to be funded
     */

    function withdrawFunds(uint id) public payable {
        uint256 fund;
        if (msg.sender != s_tasks[id - 1].creator) {
            revert NotAuthorized();
        }
        fund = s_tasks[id - 1].funds;
        s_tasks[id - 1].funds = 0;

        (bool success, ) = payable(msg.sender).call{value: fund}("");
        if (!success) {
            revert WithdrawFailed();
        }
        emit TaskFundWithdrawSuccess(s_tasks[id - 1].taskAddress, fund);
    }

    /**
     * @dev this function will update the totalCost for execution and funds of the task, only owner can call this functions
     * 
     * @param id id of the specific task
     * @param amount amount in ethers used for executing the task
     */

    function updateTaskExecDetails(
        uint id,
        uint256 amount
    ) public payable onlyOwner {
        s_tasks[id - 1].totalCostForExec += amount;
        s_tasks[id - 1].funds -= amount;
        s_execListOf[s_tasks[id - 1].taskAddress].push(block.timestamp);
        emit TaskDetailsUpdated(
            block.timestamp,
            s_tasks[id - 1].taskAddress,
            amount
        );
    }

    /**
     * @dev this function will do the execution of the automation task
     * 
     * @param id id of the specific task
     */

    function execute(uint id) public onlyOwner {
        IAutomatable(s_tasks[id - 1].taskAddress).automate();
    }


    /**
     * @dev function for depoisiting funds to the contract
     */

    function depositeFunds() public payable onlyOwner {
        if (msg.value < 0.00001 ether) {
            revert MinimumBalanceRequired();
        }
        emit FundDeposited(msg.value, msg.sender);
    }

    /**
     * @dev function will update the gasLimit of a specific task
     * 
     * @param id id of the specific task
     * @param _gasLimit new gasLimit value 
     */

    function updateTaskGasLimit(uint id, uint256 _gasLimit) public payable {
        if (msg.sender != s_tasks[id - 1].creator) {
            revert NotAuthorized();
        }
        s_tasks[id - 1].gasLimit = _gasLimit;
        emit GasLimitUpdated(
            _gasLimit,
            s_tasks[id - 1].taskAddress,
            msg.sender
        );
    }

    /**
     * @dev this function is for the owner to withdraw funds from contract
     * 
     * @param amount amount to be withdrawn from contract
     */

    function withdrawContractFunds(uint amount) public payable onlyOwner {
        (bool success, ) = i_owner.call{value: amount}("");
        if (!success) {
            revert WithdrawFailed();
        }
    }

    //    VIEW FUNCTIONS

    function getStatus(address taskAddress) public view returns (bool) {
        return IAutomatable(taskAddress).checkAutomationStatus();
    }

    function getAllTasks() public view returns (AutoTask[] memory) {
        return s_tasks;
    }

    function getTaskByAddress(
        address _taskAddress
    ) public view returns (AutoTask memory) {
        AutoTask memory task;
        for (uint i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                task = s_tasks[i];
            }
        }
        return task;
    }

    function getTaskById(uint id) public view returns (AutoTask memory) {
        return s_tasks[id - 1];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getExecListOf(
        address _taskAddress
    ) public view returns (uint[] memory) {
        return s_execListOf[_taskAddress];
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

error MinimumBalanceRequired();
error WithdrawFailed();
error TopUpFailed();
error FundingFailed();
error NotAuthorized();

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
        uint256 interval,
        address creator,
        uint256 totalCostForExec
    );

    event AutoTaskCancelled(address taskAddress, address owner);
    event TaskFundingSuccess(uint256 amount, address taskAddress);
    event TaskFundWithdrawSuccess(address taskAddress, uint256 fund);
    event GasLimitUpdated(uint256 gasLimit, address taskAddress, address user);
    event TaskDetailsUpdated(uint256 time, address taskAddress, uint256 amount);

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
        uint256 interval;
        address creator;
        uint256 totalCostForExec;
    }

    // STATE VARIABLES

    AutoTask[] private s_tasks;
    mapping(address => AutoTask[]) private s_tasksOf;
    address payable immutable i_owner;
    mapping(address => uint256[]) private s_execListOf;
    mapping(address => bool) private s_isAuthorized;

    // FUNCTIONS

    constructor() {
        i_owner = payable(msg.sender);
    }

    function createAutomation(
        address _address,
        uint256 _gasLimit,
        uint256 _interval,
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
                _interval,
                msg.sender,
                0
            )
        );
        s_isAuthorized[executor] = true;
        s_execListOf[_address].push(block.timestamp);
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
            _interval,
            msg.sender,
            0
        );
    }

    function cancelAutomation(address _taskAddress) public {
        for (uint256 i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                s_tasks[i].state = TaskState.cancelled;
            }
        }
        emit AutoTaskCancelled(_taskAddress, msg.sender);
    }

    function addFunds(address _taskAddress, address executor) public payable {
        if (msg.value < 0.0001 ether) {
            revert MinimumBalanceRequired();
        }
        for (uint256 i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                s_tasks[i].funds += msg.value;
            }
        }
        (bool success, ) = payable(executor).call{value: msg.value}("");
        if (!success) {
            revert FundingFailed();
        }
        emit TaskFundingSuccess(msg.value, _taskAddress);
    }

    function withdrawFunds(address _taskAddress) public payable {
        uint256 fund;
        for (uint256 i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                fund = s_tasks[i].funds;
                s_tasks[i].funds = 0;
            }
        }
        emit TaskFundWithdrawSuccess(_taskAddress, fund);
    }

    function updateTaskExecDetails(address _taskAddress, uint256 amount)
        public
        payable
    {
        if (s_isAuthorized[msg.sender] != true) {
            revert NotAuthorized();
        }
        for (uint256 i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                s_execListOf[_taskAddress].push(block.timestamp);
                s_tasks[i].totalCostForExec += amount;
                s_tasks[i].funds -= amount;
                emit TaskDetailsUpdated(block.timestamp, _taskAddress, amount);
            }
        }
    }

    function updateTaskGasLimit(address _taskAddress, uint256 _gasLimit)
        public
        payable
    {
        for (uint256 i = 0; i < s_tasks.length; i++) {
            if (s_tasks[i].taskAddress == _taskAddress) {
                s_tasks[i].gasLimit = _gasLimit;
                emit GasLimitUpdated(_gasLimit, _taskAddress, msg.sender);
            }
        }
    }

    //    VIEW FUNCTIONS

    function getAllTasks() public view returns (AutoTask[] memory) {
        return s_tasks;
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getExecListOf(address _taskAddress)
        public
        view
        returns (uint256[] memory)
    {
        return s_execListOf[_taskAddress];
    }

    function checkAutomationStatus(uint256 _id)
        public
        view
        returns (bool automationNeeded)
    {
        automationNeeded =
            (block.timestamp -
                s_execListOf[s_tasks[_id - 1].taskAddress][
                    s_execListOf[s_tasks[_id - 1].taskAddress].length - 1
                ]) >
            (s_tasks[_id - 1].interval - 5);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// import "hardhat/console.sol";

error MinimumBalanceRequired();
error WithdrawFailed();
error TopUpFailed();

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
        uint256 totalCostForExec,
        uint256[] execList
    );

    event AutoTaskCancelled(address taskAddress, address owner);
    event TaskFundingSuccess(uint256 amount, address taskAddress);
    event TaskFundWithdrawSuccess(address taskAddress, uint256 fund);
    event GasLimitUpdated(uint256 gasLimit, address taskAddress, address user);
    event TaskDetailsUpdated(uint256 time, uint256 amount);
    event AutoMationCostDeducted(uint256 amount, address taskAddress);

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
        uint256 totalCostForExec;
        uint256[] execList;
    }

    // STATE VARIABLES

    mapping(address => AutoTask[]) private s_tasksOf;
    address payable immutable i_owner;
    mapping(address => uint256[]) private s_execListOf;

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
        s_tasksOf[msg.sender].push(
            AutoTask(
                s_tasksOf[msg.sender].length + 1,
                _address,
                msg.value,
                _gasLimit,
                TaskState.active,
                _interval,
                0,
                new uint256[](0)
            )
        );
        (bool success, ) = payable(executor).call{value: msg.value}("");
        if (!success) {
            revert TopUpFailed();
        }
        emit NewAutoTask(
            s_tasksOf[msg.sender].length + 1,
            _address,
            msg.value,
            _gasLimit,
            TaskState.active,
            _interval,
            0,
            new uint256[](0)
        );
    }

    function cancelAutomation(address _taskAddress) public {
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                s_tasksOf[msg.sender][i].state = TaskState.cancelled;
            }
        }
        emit AutoTaskCancelled(_taskAddress, msg.sender);
    }

    function addFunds(address _taskAddress) public payable {
        if (msg.value < 0.0001 ether) {
            revert MinimumBalanceRequired();
        }
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                s_tasksOf[msg.sender][i].funds += msg.value;
            }
        }
        emit TaskFundingSuccess(msg.value, _taskAddress);
    }

    function withdrawFunds(address _taskAddress) public payable {
        uint256 fund;
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                fund = s_tasksOf[msg.sender][i].funds;
                s_tasksOf[msg.sender][i].funds = 0;
            }
        }
        (bool success, ) = payable(msg.sender).call{value: fund}("");
        if (!success) {
            revert WithdrawFailed();
        }
        emit TaskFundWithdrawSuccess(_taskAddress, fund);
    }

    function updateTaskExecDetails(address _taskAddress, uint256 amount)
        public
        payable
        onlyOwner
    {
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                s_tasksOf[msg.sender][i].execList.push(block.timestamp);
                s_tasksOf[msg.sender][i].totalCostForExec += amount;
                emit TaskDetailsUpdated(block.timestamp, amount);
            }
        }
    }

    function updateTaskGasLimit(address _taskAddress, uint256 _gasLimit)
        public
        payable
    {
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                s_tasksOf[msg.sender][i].gasLimit = _gasLimit;
                emit GasLimitUpdated(_gasLimit, _taskAddress, msg.sender);
            }
        }
    }

    function updateTaskFunds(address _taskAddress, uint256 amount)
        public
        payable
        onlyOwner
    {
        for (uint256 i = 0; i < s_tasksOf[msg.sender].length; i++) {
            if (s_tasksOf[msg.sender][i].taskAddress == _taskAddress) {
                s_tasksOf[msg.sender][i].funds -= amount;
            }
        }
        (bool success, ) = i_owner.call{value: amount}("");
        if (!success) {
            revert WithdrawFailed();
        }
        emit AutoMationCostDeducted(amount, _taskAddress);
    }

    //    VIEW FUNCTIONS

    function getTasksOf(address _address)
        public
        view
        returns (AutoTask[] memory)
    {
        return s_tasksOf[_address];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

// Import this file to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IBank.sol";

contract Bank is IBank {

    using SafeERC20 for IERC20;

    IERC20 public token;
    mapping(address => uint) public deptOf;
    constructor(address _token) {
        token = IERC20(_token);
    }

    function deposit(uint _amount) external {
        require(token.allowance(msg.sender, address(this)) >= _amount,'allownance insufficient');
        require(token.balanceOf(msg.sender) >= _amount, "insufficient balance");
        token.safeTransferFrom(msg.sender, address(this), _amount);
        emit Deposit(msg.sender, address(this), _amount);
    }

    function borrow(uint _amount) external {
        require(deptOf[msg.sender] == 0,'in dept');
        deptOf[msg.sender] += _amount*110/100;
        token.safeTransfer(msg.sender, _amount);
        emit Borrow(address(this), msg.sender, _amount);
        
    }

    function repay() external {
        require(token.allowance(msg.sender, address(this)) >= deptOf[msg.sender],'allownance insufficient');
        require(token.balanceOf(msg.sender) >= deptOf[msg.sender], "insufficient balance");
        token.safeTransferFrom(msg.sender, address(this), deptOf[msg.sender]);
        deptOf[msg.sender] = 0;
        emit Repay(address(this), msg.sender, deptOf[msg.sender]);
    }
    
}

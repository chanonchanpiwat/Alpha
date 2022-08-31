// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

interface IBank {
    function deptOf(address) external view returns (uint);

    function deposit(uint) external;

    function borrow(uint amount) external;

    function repay() external;

    event Deposit(address indexed from, address indexed to, uint amount);
    event Borrow(address indexed lender, address indexed borrower, uint amount);
    event Repay(address indexed lender, address indexed borrower, uint amount);
}
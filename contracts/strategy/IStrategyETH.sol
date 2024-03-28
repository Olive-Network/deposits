// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

interface IStrategyETH {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
    function depositFor(address _account) external payable;

    function withdrawAll() external;

    function balanceOf(address _account) external view returns (uint256);
    function balance() external view returns (uint256);

    function harvest() external;

    event Deposit(address indexed account, uint256 amount);
    event Withdraw(address indexed account, uint256 amount);
}
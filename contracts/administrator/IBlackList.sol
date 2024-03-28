// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

interface IBlackList {

    function addBlackListUsers(address[] calldata evilUsers) external;
    function removeBlackListUsers(address[] calldata clearedUsers) external;

    function isBlackListed(address user) external view returns (bool);
    
    event BlackListed(address indexed sender, address indexed user);
    event BlackListCleared(address indexed sender, address indexed user);
}
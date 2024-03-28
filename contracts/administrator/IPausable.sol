// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

interface IPausable {
    function pause() external;
    function unpause() external;

    function isPaused() external view returns (bool);

    event Paused(address indexed sender);
    event Unpaused(address indexed sender);
}
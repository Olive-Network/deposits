// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

interface IRole {
    function grantRoles(bytes32 role, address[] calldata accounts) external;
    function revokeRoles(bytes32 role, address[] calldata accounts) external;

    function hasRole(bytes32 role, address account) external view returns (bool);
    function hasRoles(bytes32[] calldata role, address[] calldata accounts) external view returns (bool[] memory);

    event RoleGranted(bytes32 indexed role, address indexed sender, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed sender, address indexed account);
}
// SPDX-License-Identifier: GPL-2.0

pragma solidity 0.8.24;

import { Initializable }  from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IRole } from "./IRole.sol";
import { IPausable } from "./IPausable.sol";
import { IBlackList } from "./IBlackList.sol";

contract Administrator is IRole, IPausable, IBlackList, Initializable {
    /** Don't change the order of variables, always append */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    bool paused;
    mapping(bytes32 => mapping(address => bool)) private _roles;
    mapping(address => bool) private _blackList;

    function init(address admin) public initializer {
        _roles[ADMIN_ROLE][admin] = true;
    }

    modifier onlyAdmin() {
        require(hasRole(ADMIN_ROLE, msg.sender), "!admin");
        _;
    }

    modifier onlyOperator() {
        require(hasRole(OPERATOR_ROLE, msg.sender), "!operator");
        _;
    }

    /** Function of Roles **/
    function hasRole(
        bytes32 role,
        address account
    ) public view override returns (bool) {
        return _roles[role][account];
    }

    function hasRoles(
        bytes32[] calldata role,
        address[] calldata accounts
    ) external view override returns (bool[] memory) {
        require(role.length == accounts.length, "!length");
        bool[] memory result = new bool[](accounts.length);
        for (uint256 i = 0; i < accounts.length; i++) {
            result[i] = _roles[role[i]][accounts[i]];
        }
        return result;
    }

    function grantRoles(
        bytes32 role,
        address[] calldata accounts
    ) external override onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            _roles[role][accounts[i]] = true;
            emit RoleGranted(role, msg.sender, accounts[i]);
        }
    }

    function revokeRoles(
        bytes32 role,
        address[] calldata accounts
    ) external override onlyAdmin {
        for (uint256 i = 0; i < accounts.length; i++) {
            _roles[role][accounts[i]] = false;
            emit RoleRevoked(role, msg.sender, accounts[i]);
        }
    }

    /** Function of Pausable **/
    function isPaused() external view override returns (bool) {
        return paused;
    }

    function pause() external override onlyAdmin {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external override onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /** Function of blacklist  */
    function addBlackListUsers(
        address[] calldata evilUsers
    ) external override onlyAdmin {
        for (uint256 i = 0; i < evilUsers.length; i++) {
            _blackList[evilUsers[i]] = true;
            emit BlackListed(msg.sender, evilUsers[i]);
        }
    }

    function removeBlackListUsers(
        address[] calldata clearedUsers
    ) external override onlyAdmin {
        for (uint256 i = 0; i < clearedUsers.length; i++) {
            _blackList[clearedUsers[i]] = false;
            emit BlackListCleared(msg.sender, clearedUsers[i]);
        }
    }

    function isBlackListed(
        address user
    ) external view override returns (bool) {
        return _blackList[user];
    }
}
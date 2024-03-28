// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract Olive is ERC20Upgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    address public admin;
    mapping(bytes32 => mapping(address => bool)) private _roles;

    function initialize(
        string memory name,
        string memory symbol,
        address _admin
    ) public initializer {
        __ERC20_init(name, symbol);
        admin = _admin;
        _roles[OPERATOR_ROLE][_admin] = true;
    }

    modifier onlyOperator() {
        require(
            _roles[OPERATOR_ROLE][msg.sender],
            "!operator"
        );
        _;
    }

    modifier onlyAdmin() {
        require(admin == msg.sender,"!admin");
        _;
    }

    function grantRole(bytes32 role, address operator) public onlyAdmin {
        _roles[role][operator] = true;
    }

    function setAdmin(address _admin) public onlyAdmin {
        require(_admin != address(0), "!valid address");
        admin = _admin;
    }

    function mint(address account, uint256 amount) public onlyOperator {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyOperator {
        _burn(account, amount);
    }
}
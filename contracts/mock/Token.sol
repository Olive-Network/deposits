// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

import { ERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { IRole }  from "../administrator/IRole.sol";

contract Token is ERC20Upgradeable {
    address public adminstator;

    function initialize(
        string memory name,
        string memory symbol,
        address _adminstator
    ) public initializer {
        __ERC20_init(name, symbol);
        adminstator = _adminstator;
    }

    modifier onlyOperator() {
        require(
            IRole(adminstator).hasRole(keccak256("OPERATOR"), msg.sender),
            "!operator"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            IRole(adminstator).hasRole(keccak256("ADMIN"), msg.sender),
            "!admin"
        );
        _;
        
    }

    function setAdministrator(address _adminstator) public onlyAdmin {
        adminstator = _adminstator;
    }

    function mint(address account, uint256 amount) public onlyOperator {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public onlyOperator {
        _burn(account, amount);
    }
}


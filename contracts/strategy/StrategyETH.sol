// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

import { Initializable }  from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IStrategyETH } from "./IStrategyETH.sol";
import { IRole }  from "../administrator/IRole.sol";
import { IPausable }  from "../administrator/IPausable.sol";
import { IBlackList }  from "../administrator/IBlackList.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StrategyETH is IStrategyETH, ReentrancyGuardUpgradeable {
    /** Don't change the order of variables, always append */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    address public administrator;
    mapping(address => uint256) balances;

    uint256[32] __gap; // reserve space for new variables to be added in future without changing the storage layout

    using SafeERC20 for IERC20;

    function init(
        address _administrator
    ) public initializer {
        administrator = _administrator;
        __ReentrancyGuard_init();
    }

    modifier onlyOperator() {
        require(
            IRole(administrator).hasRole(OPERATOR_ROLE, msg.sender),
            "!operator"
        );
        _;
    }

    modifier onlyAdmin() {
        require(
            IRole(administrator).hasRole(ADMIN_ROLE, msg.sender),
            "!admin"
        );
        _;
    }

    modifier notPaused {
        require(!IPausable(administrator).isPaused(), "paused");
        _;
    }

    modifier onlyAllowed() {
        require(
            !IBlackList(administrator).isBlackListed(msg.sender),
            "blacklisted"
        );
        _;
    }

    function balanceOf(
        address _account
    ) public override view returns (uint256) {
        return balances[_account];
    }

    function balance() public view override returns (uint256) {
        return ethBalance(address(this));
    }

    function setAdministrator(address _administrator) external onlyAdmin {
        // to add a contract address check - 
        // wrong adminstrator whole contract becomes unusable unless its upgraded
        require(_administrator != address(0), "!address");
        administrator = _administrator;
    }

    function deposit() external payable override onlyAllowed nonReentrant notPaused {
        uint256 _amount = msg.value;
        require(_amount > 0, "!amount");
        balances[msg.sender] += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function depositFor(address _account) external payable override onlyAllowed nonReentrant notPaused {
        uint256 _amount = msg.value;
        require(_amount > 0, "!amount");
        require(_account != address(0), "!address");
        require(!IBlackList(administrator).isBlackListed(_account), "blacklisted");
        balances[_account] += _amount;
        emit Deposit(_account, _amount);
    }

    function withdraw(uint256 _amount) external override nonReentrant notPaused {
        require(_amount > 0, "!amount");
        require(balances[msg.sender] >= _amount, "!balance");
        balances[msg.sender] -= _amount;
        (bool suceess, ) = payable(msg.sender).call{value: _amount}(""); // send ether
        require(suceess, "!transfer");
        emit Withdraw(msg.sender, _amount);
    }

    function withdrawAll() external override nonReentrant notPaused {
        uint256 _amount = balances[msg.sender];
        require(_amount > 0, "!balance");
        balances[msg.sender] = 0;
        (bool suceess, ) = payable(msg.sender).call{value: _amount}(""); // send ether
        require(suceess, "!transfer");
        emit Withdraw(msg.sender, _amount);
    }

    function ethBalance(address _user) public view returns (uint256) {
        return address(_user).balance;
    }

    function rescue(address _toRescue, address _user, uint256 _amount) external onlyOperator {
        require(_toRescue != address(0), "!address");
        require(_user != address(0) && _amount > 0, "!address");
        IERC20(_toRescue).safeTransfer(_user, _amount);
    }

    function harvest() external override view onlyOperator {
        // do the airdrop collection
        // will be implemented based on the token and their point / token economics
        revert("!implemeted");
    }
}
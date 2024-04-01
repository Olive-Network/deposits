// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

import { Initializable }  from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IStrategy } from "./IStrategy.sol";
import { IRole }  from "../administrator/IRole.sol";
import { IPausable }  from "../administrator/IPausable.sol";
import { IBlackList }  from "../administrator/IBlackList.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Strategy is IStrategy, ReentrancyGuardUpgradeable {
    /** Don't change the order of variables, always append */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    address public administrator;
    address public token;
    mapping(address => uint256) balances;

    using SafeERC20 for IERC20;

    function init(
        address _administrator,
        address _token
    ) public initializer {
        administrator = _administrator;
        token = _token;
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
        return IERC20(token).balanceOf(address(this));
    }

    function setAdministrator(address _administrator) external onlyAdmin {
        // to add a contract address check - 
        // wrong adminstrator make disallow admin functions
        require(_administrator != address(0), "!address");
        administrator = _administrator;
    }

    function deposit(uint256 _amount) external override onlyAllowed nonReentrant notPaused {
        _deposit(msg.sender, msg.sender, _amount);
    }

    function depositFor(address _account, uint256 _amount) external override onlyAllowed nonReentrant notPaused {
        require(!IBlackList(administrator).isBlackListed(_account), "blacklisted");
        _deposit(msg.sender, _account, _amount);
    }

    function _deposit (address _from, address _user, uint256 _amount) internal {
        require(_amount > 0, "!amount");
        require(_user != address(0), "!address");
        // Account for tokens with fee transfer
        uint256 _before = balance();
        IERC20(token).safeTransferFrom(_from, address(this), _amount);
        uint256 _after = balance();
        require(_after > _before, "!token transfer");
        uint256 _trasferred = _after - _before;
        balances[_user] += _trasferred;
        emit Deposit(_user, _trasferred);
    }

    function withdraw(uint256 _amount) external override nonReentrant notPaused {
        _withdraw(msg.sender, _amount);
    }

    function withdrawAll() external override nonReentrant notPaused {
        uint256 _amount = balances[msg.sender];
       _withdraw(msg.sender, _amount);
    }

    function _withdraw(address _user, uint256 _amount) internal {
        require(_amount > 0, "!balance");
        balances[_user] -= _amount;
        IERC20(token).safeTransfer(_user, _amount);
        emit Withdraw(_user, _amount);
    }

    function rescue(address _toRescue, address _user, uint256 _amount) external onlyOperator {
        require(_toRescue != address(0) && _toRescue != token, "!token");
        require(_user != address(0) && _amount > 0, "!user !amount");
        IERC20(_toRescue).safeTransfer(_user, _amount);
    }

    function harvest() external override view onlyOperator {
        // do the airdrop collection
        // will be implemented based on the token and their point / token economics
        revert("!implemeted");
    }
}
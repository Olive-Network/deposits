// SPDX-License-Identifier: GPL-2.0
pragma solidity 0.8.24;

import { Initializable }  from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { IStrategy } from "./IStrategy.sol";
import { IRole }  from "../administrator/IRole.sol";
import { IPausable }  from "../administrator/IPausable.sol";
import { IBlackList }  from "../administrator/IBlackList.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract Strategy is IStrategy, ReentrancyGuardUpgradeable {
    /** Don't change the order of variables, always append */
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    address public administrator;
    address public token;
    mapping(address => uint256) balances;

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
        require(_amount > 0, "!amount");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
        emit Deposit(msg.sender, _amount);
    }

    function depositFor(address _account, uint256 _amount) external override onlyAllowed nonReentrant notPaused {
        require(_amount > 0, "!amount");
        require(_account != address(0), "!address");
        IERC20(token).transferFrom(msg.sender, address(this), _amount);
        balances[_account] += _amount;
        emit Deposit(_account, _amount);
    }

    function withdraw(uint256 _amount) external override nonReentrant notPaused {
        require(_amount > 0, "!amount");
        require(balances[msg.sender] >= _amount, "!balance");
        balances[msg.sender] -= _amount;
        IERC20(token).transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount);
    }

    function withdrawAll() external override nonReentrant notPaused {
        uint256 _amount = balances[msg.sender];
        require(_amount > 0, "!balance");
        balances[msg.sender] = 0;
        IERC20(token).transfer(msg.sender, _amount);
        emit Withdraw(msg.sender, _amount);
    }

    function rescue(address _toRescue, address _user, uint256 _amount) external onlyOperator {
        require(_toRescue != address(0) && _toRescue != token, "!token");
        require(_user != address(0) && _amount > 0, "!user !amount");
        IERC20(_toRescue).transfer(_user, _amount);
    }

    function harvest() external override view onlyOperator {
        // do the airdrop collection
        // will be implemented based on the token and their point / token economics
        revert("!implemeted");
    }
}
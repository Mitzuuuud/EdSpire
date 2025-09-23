// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TopUpGateway - deposit ETH, earn off-chain "tokens" at 0.0001 ETH = 1 token
/// @notice Tracks per-user deposits in wei. Frontend reads tokenBalanceOf(user).
contract TopUpGateway {
    /// @dev 0.0001 ether = 1e14 wei
    uint256 public constant WEI_PER_TOKEN = 1e14;

    /// @notice where ETH is forwarded when sweeping
    address public immutable treasury;

    /// @notice raw ETH (wei) credited per user
    mapping(address => uint256) public depositsWei;

    event Deposited(address indexed payer, address indexed beneficiary, uint256 weiAmount, uint256 tokensCredited);
    event Swept(address indexed to, uint256 amount);

    constructor(address _treasury) {
        require(_treasury != address(0), "treasury required");
        treasury = _treasury;
    }

    /// @notice deposit for yourself
    function deposit() external payable {
        _credit(msg.sender, msg.sender);
    }

    /// @notice deposit on behalf of someone else (e.g., custodial flow)
    function depositFor(address beneficiary) external payable {
        require(beneficiary != address(0), "beneficiary required");
        _credit(msg.sender, beneficiary);
    }

    function _credit(address payer, address beneficiary) internal {
        require(msg.value > 0, "no value");
        depositsWei[beneficiary] += msg.value;
        emit Deposited(payer, beneficiary, msg.value, msg.value / WEI_PER_TOKEN);
    }

    /// @notice derived "token" balance per user (integer tokens)
    function tokenBalanceOf(address user) external view returns (uint256) {
        return depositsWei[user] / WEI_PER_TOKEN;
    }

    /// @notice raw deposited wei (useful for debugging/analytics)
    function rawDepositWeiOf(address user) external view returns (uint256) {
        return depositsWei[user];
    }

    /// @notice forward full balance to the treasury; callable by anyone
    function sweep() external {
        uint256 bal = address(this).balance;
        (bool ok, ) = treasury.call{value: bal}("");
        require(ok, "sweep failed");
        emit Swept(treasury, bal);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AirdropDistributor
 * @notice Gas-optimized batch distributor for ERC-20 tokens and native BOT on Bohr Chain (Chain ID 968).
 * @dev Fully non-custodial: user approves contract and calls airdrop in a single atomic flow.
 */
interface IERC20Minimal {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AirdropDistributor {
    // Events for tracking and indexing distributions
    event AirdropERC20(
        address indexed sender,
        address indexed token,
        uint256 totalRecipients,
        uint256 totalAmount
    );

    event AirdropNative(
        address indexed sender,
        uint256 totalRecipients,
        uint256 totalAmount
    );

    error MismatchedArrayLengths();
    error ZeroRecipients();
    error InsufficientNativeBalance();
    error TransferFailed(address recipient, uint256 amount);
    error ERC20TransferFromFailed(address recipient, uint256 amount);

    /**
     * @notice Distribute ERC-20 tokens to multiple recipients
     * @param token Address of the ERC-20 token
     * @param recipients Array of recipient addresses
     * @param amounts Array of token amounts (in token base units/wei)
     */
    function airdropERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        uint256 count = recipients.length;
        if (count == 0) revert ZeroRecipients();
        if (count != amounts.length) revert MismatchedArrayLengths();

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < count;) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            if (amount > 0 && recipient != address(0)) {
                _safeTransferFrom(token, msg.sender, recipient, amount);
                unchecked {
                    totalDistributed += amount;
                }
            }

            unchecked {
                ++i;
            }
        }

        emit AirdropERC20(msg.sender, token, count, totalDistributed);
    }

    /**
     * @notice Distribute native BOT coins to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of BOT amounts (in wei)
     */
    function airdropNative(
        address payable[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        uint256 count = recipients.length;
        if (count == 0) revert ZeroRecipients();
        if (count != amounts.length) revert MismatchedArrayLengths();

        uint256 totalDistributed = 0;

        for (uint256 i = 0; i < count;) {
            address payable recipient = recipients[i];
            uint256 amount = amounts[i];

            if (amount > 0 && recipient != address(0)) {
                (bool success, ) = recipient.call{value: amount}("");
                if (!success) revert TransferFailed(recipient, amount);
                unchecked {
                    totalDistributed += amount;
                }
            }

            unchecked {
                ++i;
            }
        }

        if (msg.value < totalDistributed) revert InsufficientNativeBalance();

        // Refund any excess native BOT back to sender
        uint256 excess = msg.value - totalDistributed;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }

        emit AirdropNative(msg.sender, count, totalDistributed);
    }

    /**
     * @dev Safe ERC20 transferFrom compatible with both standard tokens and non-standard tokens
     * (e.g. tokens that don't return a boolean return value on transferFrom).
     */
    function _safeTransferFrom(
        address token,
        address from,
        address to,
        uint256 value
    ) internal {
        // bytes4(keccak256("transferFrom(address,address,uint256)")) == 0x23b872dd
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(0x23b872dd, from, to, value)
        );

        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert ERC20TransferFromFailed(to, value);
        }
    }
}

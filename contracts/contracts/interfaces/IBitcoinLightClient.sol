// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBitcoinLightClient {
    function blockHashes(uint256) external view returns (bytes32);
}

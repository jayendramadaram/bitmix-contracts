// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


interface ILightClient {
    function hasBlockhash(bytes32 blockhash) external view returns (bool);
}

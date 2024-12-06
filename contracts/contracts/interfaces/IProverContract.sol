// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProverContract {
    function prove(bytes memory proof, bytes memory inputs) 
        external 
        view 
        returns (bytes32 blockhash, bytes memory cipherText);
}
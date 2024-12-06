// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

pragma solidity ^0.8.20;

contract MockProverContract {
    function prove(bytes memory proof, bytes memory inputs) 
        external 
        pure 
        returns (bytes32 bitcoin_blockhash, bytes memory cipherText) 
    {
        bitcoin_blockhash = keccak256(proof);
        cipherText = inputs;
    }
}
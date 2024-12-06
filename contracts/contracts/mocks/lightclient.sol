// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockLightClient {
    // mapping(bytes32 => bool) public validBlockhashes;

    // function addValidBlockhash(bytes32 blockhash) external {
    //     validBlockhashes[blockhash] = true;
    // }

    function hasBlockhash(bytes32 bitcoin_blockhash) external pure returns (bool) {
        // return validBlockhashes[blockhash];
        return true;
    }
}

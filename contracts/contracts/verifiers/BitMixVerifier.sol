// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ISP1Verifier} from "./ISP1Verifier.sol";
import {IBitcoinLightClient} from "../interfaces/IBitcoinLightClient.sol";

import {Groth16Verifier} from "./Groth16Verifier.sol";

struct PublicValuesStruct {
    // set to 1 block right now for simplicity but the original plan was to prove
    // inclusivity in a merkle tree which needs changes to how the light client is storing the block hashes
    bytes32[1] block_hashes;
    bytes32 pub_a_x;
    bytes32 pub_a_y;
    bytes32 pub_c_x;
    bytes32 pub_c_y;
    bytes cipher;
}

struct ScriptInputs {
    bytes32 pub_a_x;
    bytes32 pub_a_y;
    bytes32 pub_c_x;
    bytes32 pub_c_y;
    bytes cipher;
}

contract BitMixVerifier {
    /// @notice The address of the SP1 verifier contract.
    /// @dev This can either be a specific SP1Verifier for a specific version, or the
    ///      SP1VerifierGateway which can be used to verify proofs for any version of SP1.
    ///      For the list of supported verifiers on each chain, see:
    ///      https://github.com/succinctlabs/sp1-contracts/tree/main/contracts/deployments
    Groth16Verifier public verifier;
    address public citraLightClient;

    /// @notice The verification key for the bitmix program.
    bytes32 public bitmixProgramVKey;

    constructor(bytes32 _bitmixProgramVKey) {
        verifier = new Groth16Verifier();
        bitmixProgramVKey = _bitmixProgramVKey;
    }

    function verifyBitMixProof(
        bytes calldata _publicValues,
        bytes calldata _proofBytes,
        uint256[1] calldata blockNumbers
    ) public view returns (ScriptInputs memory inps) {
        (verifier).verifyProof(bitmixProgramVKey, _publicValues, _proofBytes);
        PublicValuesStruct memory publicValues = abi.decode(
            _publicValues,
            (PublicValuesStruct)
        );
        require(
            IBitcoinLightClient(citraLightClient).blockHashes(
                blockNumbers[0]
            ) ==
                convertToBytes32(
                    convertToBigEndian(
                        abi.encodePacked(publicValues.block_hashes[0])
                    )
                ),
            "Block doesnot exist"
        );
        inps = ScriptInputs({
            pub_a_x: publicValues.pub_a_x,
            pub_a_y: publicValues.pub_a_y,
            pub_c_x: publicValues.pub_c_x,
            pub_c_y: publicValues.pub_c_y,
            cipher: publicValues.cipher
        });
    }

    function convertToBytes32(
        bytes memory data
    ) internal pure returns (bytes32 result) {
        assembly {
            // Copy 32 bytes from data into result
            result := mload(add(data, 32))
        }
    }

    function convertToBigEndian(
        bytes memory bytesLE
    ) internal pure returns (bytes memory) {
        uint256 length = bytesLE.length;
        bytes memory bytesBE = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            bytesBE[length - i - 1] = bytesLE[i];
        }
        return bytesBE;
    }
}

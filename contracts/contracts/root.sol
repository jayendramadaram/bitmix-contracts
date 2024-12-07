// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import {ScriptInputs, BitMixVerifier} from "./verifiers/BitMixVerifier.sol";

contract BitMix {
    struct OrderDetails {
        uint256 amount;
        uint256 timeLock;
        uint256 nonce;
        uint256 depositedAt;
        bytes32 pubkey_x;
        bytes32 pubkey_y;
        ScriptInputs scriptInputs;
        bool isValidated;
    }

    IERC20 public immutable wbtcToken;
    BitMixVerifier public immutable verifier;

    mapping(address => uint256) public nonces;
    mapping(bytes32 => OrderDetails) public orderMap;

    event Deposit(
        address indexed user,
        bytes32 indexed orderID,
        uint256 nonce,
        uint256 amount,
        uint256 timeLock
    );

    event OrderValidated(bytes32 indexed orderID);

    constructor(
        address _tokenAddr,
        address _verifierAddr,
        bytes32 _bitmixProgramVKey
    ) {
        wbtcToken = IERC20(_tokenAddr);
        verifier = new BitMixVerifier(_verifierAddr, _bitmixProgramVKey);
    }

    function deposit(
        uint256 amount,
        uint256 timeLock,
        bytes32 pubkey_x,
        bytes32 pubkey_y
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(timeLock > 0, "timeLock must be greater than 0");

        uint256 currentNonce = nonces[msg.sender]++;

        bytes32 orderID = keccak256(
            abi.encodePacked(
                msg.sender,
                amount,
                pubkey_x,
                pubkey_y,
                currentNonce
            )
        );

        require(
            wbtcToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        orderMap[orderID] = OrderDetails({
            amount: amount,
            pubkey_x: pubkey_x,
            pubkey_y: pubkey_y,
            timeLock: timeLock,
            nonce: currentNonce,
            depositedAt: block.number,
            scriptInputs: ScriptInputs({
                pub_a_x: pubkey_x,
                pub_a_y: pubkey_y,
                pub_c_x: bytes32(0),
                pub_c_y: bytes32(0),
                cipher: ""
            }),
            isValidated: false
        });

        emit Deposit(msg.sender, orderID, currentNonce, amount, timeLock);
    }

    function validate(
        bytes32 orderID,
        bytes calldata _publicValues,
        bytes calldata _proofBytes,
        uint256[1] calldata blockNumbers
    ) external {
        OrderDetails storage order = orderMap[orderID];

        require(order.isValidated == false, "Order already validated");
        require(
            order.depositedAt + order.timeLock < block.number,
            "Order has expired"
        );

        ScriptInputs memory scriptInputs = verifier.verifyBitMixProof(
            _publicValues,
            _proofBytes,
            blockNumbers
        );
        require(
            order.scriptInputs.pub_a_x == scriptInputs.pub_a_x,
            "Invalid pubkey_x"
        );
        require(
            order.scriptInputs.pub_a_y == scriptInputs.pub_a_y,
            "Invalid pubkey_y"
        );

        order.scriptInputs = scriptInputs;
        order.isValidated = true;

        emit OrderValidated(orderID);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "./interfaces/IProverContract.sol";
import "./interfaces/ILightclient.sol";

contract BitMix {
    struct OrderDetails {
        uint256 amount;
        bytes32 pubkey;
        bytes cipherText;
        bool isValidated;
    }

    IERC20 public immutable wbtcToken;
    IProverContract public immutable proverContract;
    ILightClient public immutable lightClient;

    mapping(address => uint256) public nonces;
    mapping(bytes32 => OrderDetails) public orderMap;

    event Deposit(
        address indexed user, 
        bytes32 indexed orderID, 
        uint256 amount, 
        bytes32 pubkey
    );

    event OrderValidated(
        bytes32 indexed orderID, 
        bytes32 blockhash, 
        bytes cipherText
    );

    constructor(
        address _wbtcTokenAddress, 
        address _proverContractAddress,
        address _lightClientAddress
    ) {
        wbtcToken = IERC20(_wbtcTokenAddress);
        proverContract = IProverContract(_proverContractAddress);
        lightClient = ILightClient(_lightClientAddress);
    }

    function deposit(uint256 amount, bytes32 pubkey) external {
        uint256 currentNonce = nonces[msg.sender]++;

        bytes32 orderID = keccak256(
            abi.encodePacked(
                msg.sender, 
                amount, 
                pubkey, 
                currentNonce
            )
        );

        require(
            wbtcToken.transferFrom(msg.sender, address(this), amount), 
            "Transfer failed"
        );

        orderMap[orderID] = OrderDetails({
            amount: amount,
            pubkey: pubkey,
            cipherText: new bytes(0),
            isValidated: false
        });

        emit Deposit(msg.sender, orderID, amount, pubkey);
    }

    function validate(
        bytes32 orderID, 
        bytes memory proof, 
        bytes memory publicInputs
    ) external {

        OrderDetails storage order = orderMap[orderID];
        require(!order.isValidated, "Order already validated");

        (bytes32 bitcoin_blockhash, bytes memory cipherText) = proverContract.prove(
            proof, 
            publicInputs
        );

        require(
            lightClient.hasBlockhash(bitcoin_blockhash), 
            "Invalid blockhash"
        );

        order.cipherText = cipherText;
        order.isValidated = true;

        emit OrderValidated(orderID, bitcoin_blockhash, cipherText);
    }
}


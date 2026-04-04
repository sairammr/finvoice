// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./interface/ITeeExtensionRegistry.sol";
import "./interface/ITeeMachineRegistry.sol";

/**
 * @title InvoiceInstructionSender
 * @notice On-chain contract on Flare Coston2 that sends invoice instructions to
 *         the TEE extension for private processing (create, approve, score).
 *         This is the ONLY Solidity contract in the project.
 */
contract InvoiceInstructionSender {
    ITeeExtensionRegistry public immutable teeExtensionRegistry;
    ITeeMachineRegistry public immutable teeMachineRegistry;

    uint256 public _extensionId;
    address[] public _teeIds;

    // Operation types and commands
    bytes32 public constant OP_TYPE_INVOICE = bytes32("INVOICE");
    bytes32 public constant OP_COMMAND_CREATE = bytes32("CREATE");
    bytes32 public constant OP_COMMAND_APPROVE = bytes32("APPROVE");
    bytes32 public constant OP_COMMAND_SCORE = bytes32("SCORE");

    event InstructionSent(bytes32 indexed instructionId, bytes32 opCommand, address sender);

    constructor(address _registry, address _machineRegistry) {
        teeExtensionRegistry = ITeeExtensionRegistry(_registry);
        teeMachineRegistry = ITeeMachineRegistry(_machineRegistry);
    }

    /// @notice Find and set this contract's extension ID from the registry
    function setExtensionId() external {
        uint256 counter = teeExtensionRegistry.extensionsCounter();
        for (uint256 i = 1; i <= counter; i++) {
            if (teeExtensionRegistry.getTeeExtensionInstructionsSender(i) == address(this)) {
                _extensionId = i;
                return;
            }
        }
        revert("Extension not found in registry");
    }

    /// @notice Send ECIES-encrypted invoice data to TEE for private storage
    /// @param _encryptedData ECIES-encrypted JSON with debtor name, email, payment history, etc.
    function createInvoice(bytes calldata _encryptedData) external payable returns (bytes32) {
        _teeIds = teeMachineRegistry.getRandomTeeIds(_extensionId, 1);

        ITeeExtensionRegistry.TeeInstructionParams memory params = ITeeExtensionRegistry
            .TeeInstructionParams({
                opType: OP_TYPE_INVOICE,
                opCommand: OP_COMMAND_CREATE,
                message: _encryptedData,
                cosigners: new address[](0),
                cosignersThreshold: 0,
                claimBackAddress: address(0)
            });

        bytes32 instructionId = teeExtensionRegistry.sendInstructions{value: msg.value}(_teeIds, params);
        emit InstructionSent(instructionId, OP_COMMAND_CREATE, msg.sender);
        return instructionId;
    }

    /// @notice Send invoice approval instruction to TEE
    /// @param _invoiceIdData ABI-encoded invoice ID string
    function approveInvoice(bytes calldata _invoiceIdData) external payable returns (bytes32) {
        require(_teeIds.length > 0, "Create invoice first");

        ITeeExtensionRegistry.TeeInstructionParams memory params = ITeeExtensionRegistry
            .TeeInstructionParams({
                opType: OP_TYPE_INVOICE,
                opCommand: OP_COMMAND_APPROVE,
                message: _invoiceIdData,
                cosigners: new address[](0),
                cosignersThreshold: 0,
                claimBackAddress: address(0)
            });

        bytes32 instructionId = teeExtensionRegistry.sendInstructions{value: msg.value}(_teeIds, params);
        emit InstructionSent(instructionId, OP_COMMAND_APPROVE, msg.sender);
        return instructionId;
    }

    /// @notice Send scoring instruction to TEE — TEE will run AI scoring privately
    /// @param _invoiceIdData ABI-encoded invoice ID string
    function scoreInvoice(bytes calldata _invoiceIdData) external payable returns (bytes32) {
        require(_teeIds.length > 0, "Create invoice first");

        ITeeExtensionRegistry.TeeInstructionParams memory params = ITeeExtensionRegistry
            .TeeInstructionParams({
                opType: OP_TYPE_INVOICE,
                opCommand: OP_COMMAND_SCORE,
                message: _invoiceIdData,
                cosigners: new address[](0),
                cosignersThreshold: 0,
                claimBackAddress: address(0)
            });

        bytes32 instructionId = teeExtensionRegistry.sendInstructions{value: msg.value}(_teeIds, params);
        emit InstructionSent(instructionId, OP_COMMAND_SCORE, msg.sender);
        return instructionId;
    }
}

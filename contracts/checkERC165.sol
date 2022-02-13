
pragma solidity >=0.5.0 <0.7.0;

import "./standard/IERC165.sol";

contract CheckERC165 is ERC165 {
    ///This way, the supportsInterface function just has to return a value from the mapping
    mapping (bytes4 => bool) internal supportedInterfaces;

    constructor() public {
        supportedInterfaces[this.supportsInterface.selector] = true;
    }

    /// @notice Query if a contract implements an interface
    /// @param interfaceID The interface identifier, as specified in ERC-165
    /// @dev Interface identification is specified in ERC-165. This function
    ///  uses less than 30,000 gas.
    /// @return `true` if the contract implements `interfaceID` and
    ///  `interfaceID` is not 0xffffffff, `false` otherwise
    function supportsInterface(bytes4 interfaceID) external view override returns (bool){
        return supportedInterfaces[interfaceID];
    }
}
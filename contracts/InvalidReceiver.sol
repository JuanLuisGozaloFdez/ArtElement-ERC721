pragma solidity >=0.5.0 <0.7.0;

import "./standard/IERC721TokenReceiver.sol";

contract InvalidReceiver is ERC721TokenReceiver {
    function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes _data) external returns(bytes4){
        return bytes4(keccak256("some invalid return data"));
    }
}
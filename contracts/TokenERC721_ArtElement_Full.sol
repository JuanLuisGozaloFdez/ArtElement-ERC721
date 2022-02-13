pragma solidity >=0.5 <0.7;

import "./TokenERC721Enumerable.sol";
import "./TokenERC721Metadata.sol";

/// @title A scalable implementation of all ERC721 NFT standards combined.
/// @dev Extends TokenERC721Metadata, TokenERC721Enumerable
contract TokenERC721_ArtElement_Full is TokenERC721Metadata, TokenERC721Enumerable{
    constructor(uint _initialSupply) public TokenERC721Metadata(_initialSupply) TokenERC721Enumerable(_initialSupply){
        //Nothing extra required, just need to make sure you explicitly call the other two constructors above ^^
    }
}
pragma solidity ^0.8.0;

import "./token721.sol";
import "./NFTInterface.sol";

contract NFTTokenFactory is NFTInterface {
    constructor() public{

    }

    function create(string memory _name, string memory _symbol) public returns (NFTInterface) {
        NFTTokenFactory token = new ERC721(_name, _symbol);
       // token.transferOwnership(msg.sender);
        return token;
    }
}

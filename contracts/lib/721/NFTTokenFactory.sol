pragma solidity ^0.8.0;

import "./ownable721.sol";
import "./NFTInterface.sol";

contract NFTTokenFactory  {
    constructor() public{

    }

    function create(string memory _name, string memory _symbol) public returns (NFTInterface) {
        ownable721 token = new ownable721(_name, _symbol);
        token.transferOwnership(msg.sender);
        return token;
    }
}

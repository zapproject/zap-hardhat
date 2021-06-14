pragma solidity ^0.8.0;

import "./ownable1155.sol";
import "./IERC1155.sol";

contract NFTTokenFactory  {
    constructor() public{

    }

    function create(string memory _uri) public returns (IERC1155) {
        ownable1155 token = new ownable1155(_uri);
        token.transferOwnership(msg.sender);
        return token;
    }
}

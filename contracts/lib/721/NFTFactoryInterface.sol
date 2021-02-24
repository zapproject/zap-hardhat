pragma solidity ^0.8.0;

import "./NFTInterface.sol";

contract NFTFactoryInterface {
    function create(string memory _name, string memory _symbol) public returns (NFTInterface);
}

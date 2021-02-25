pragma solidity ^0.8.0;

import "./NFTInterface.sol";

interface NFTFactoryInterface {
    function create(string memory _name, string memory _symbol) external returns (NFTInterface);
}

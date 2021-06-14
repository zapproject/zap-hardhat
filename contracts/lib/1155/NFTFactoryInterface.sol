pragma solidity ^0.8.0;

import "./IERC1155.sol";

interface NFTFactoryInterface {
    function create(string memory _uri) external returns (IERC1155);
}

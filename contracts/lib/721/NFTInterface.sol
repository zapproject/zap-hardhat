pragma solidity ^0.8.0;

//import "../ownership/Ownable.sol";
import "contracts/lib/165/IERC165.sol";

        interface NFTInterface is IERC165 {

           event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
           event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
           event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

            function balanceOf(address _owner) external view returns (uint256);
            function ownerOf(uint256 _tokenId) external view returns (address);
            function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory data) external;
            function safeTransferFrom(address _from, address _to, uint256 _tokenId) external;
            function transferFrom(address _from, address _to, uint256 _tokenId) external;
            function setApprovalForAll(address _operator, bool _approved) external;
            function getApproved(uint256 _tokenId) external view returns (address);
            function isApprovedForAll(address _owner, address _operator) external view returns (bool);
        }
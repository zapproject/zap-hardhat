pragma solidity ^0.8.0;
import './token721.sol';


contract Ownable {
    address  public owner;
    event OwnershipTransferred(address indexed previousOwner,address indexed newOwner);

    /// @dev The Ownable constructor sets the original `owner` of the contract to the sender account.
    constructor() public { owner = msg.sender; }

    /// @dev Throws if called by any contract other than latest designated caller
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    /// @dev Allows the current owner to transfer control of the contract to a newOwner.
    /// @param newOwner The address to transfer ownership to.
    function transferOwnership(address  newOwner) public onlyOwner {
        require(newOwner != address(0));
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

contract ownable721 is ERC721,Ownable{
bool public mintingFinished=false;
modifier canMint() {
        require(!mintingFinished);
        _;
    }

    modifier hasMintPermission() {
        require(msg.sender == owner);
        _;
    }
     constructor( string memory name_, string memory symbol_) ERC721(name_,symbol_){

    }
   function mint(address to,uint256 tokenId) public hasMintPermission canMint {
     
         _safeMint(to, tokenId);
   }
   function setURI(uint256 tokenId,string memory uri) public hasMintPermission canMint{
        _setTokenURI(tokenId,uri);
   }
   function setBaseURI(string memory base) public hasMintPermission canMint{
        _setBaseURI(base);
   }
}
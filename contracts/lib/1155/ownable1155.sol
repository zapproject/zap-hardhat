pragma solidity ^0.8.0;
import './ERC1155.sol';
import "contracts/utils/Address.sol";

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

contract ownable1155 is ERC1155,Ownable{
    bool public mintingFinished=false;
    using Address for address;
    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    modifier hasMintPermission() {
        require(msg.sender == owner);
        _;
    }
    constructor( string memory uri_) ERC1155(uri_){
         require( msg.sender.isContract()==true,"NFT must deployed through a factory contract");
    }
   function mint(address to,uint256 tokenId,uint256 amount,bytes memory data) public onlyOwner canMint {
     
         _mint(to, tokenId, amount, data);
   }
   function setURI(string memory uri) public onlyOwner canMint{
        _setURI(uri);
   }
   function mintBatch(address to,uint256[] memory ids,uint256[] memory amounts,bytes memory data) public onlyOwner canMint{
    _mintBatch(to,ids,amounts,data)
   }

   // function setBaseURI(string memory base) public onlyOwner canMint{
   //      _setBaseURI(base);
   // }
   
  function burnFrom(address account, uint256 id, uint256 amount) public onlyOwner{
      //
      _burn(account, id,amount);
    }
    function burnBatch(address account,uint256[] memory ids,uint256[] memory amounts) public onlyOwner{
      _burnbatch(account,ids,amounts);
    }
   function toggleMinting() public  onlyOwner{
       mintingFinished=!mintingFinished;
   }
}
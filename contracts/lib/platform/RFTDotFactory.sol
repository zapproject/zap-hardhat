import "contracts/lib/token/TokenFactoryInterface.sol";
import "contracts/lib/token/FactoryTokenInterface.sol";
import "contracts/lib/ownership/ZapCoordinatorInterface.sol";
import "contracts/platform/bondage/BondageInterface.sol";
import "contracts/platform/bondage/currentCost/CurrentCostInterface.sol";
import "contracts/platform/registry/RegistryInterface.sol";
import "contracts/platform/bondage/currentCost/CurrentCostInterface.sol";

interface RFTTokenInterface  {

    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
 event TransferBatch(address indexed operator,address indexed from,address indexed to,uint256[] ids,uint256[] values);
     event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

            function _mint(address account,uint256 id,uint256 amount,bytes memory data) internal virtual;
            function _mintBatch(address to,uint256[] memory ids,uint256[] memory amounts,bytes memory data) internal virtual;
            function _burn(address account,uint256 id,uint256 amount) internal virtual;
            function _burnBatch(address account,uint256[] memory ids,uint256[] memory amounts) internal virtual; 
            function balanceOf(address _owner) external view returns (uint256);
            function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids)external view returns (uint256[] memory);
            function ownerOf(uint256 _tokenId) external view returns (address);
            function safeTransferFrom( address from, address to, uint256 id, uint256 amount,bytes calldata data) external;
            function safeBatchTransferFrom(address from,address to,uint256[] calldata ids,uint256[] calldata amounts,bytes calldata data) external;
            function setApprovalForAll(address operator, bool approved) external;
            function getApproved(uint256 _tokenId) external view returns (address);
            function isApprovedForAll(address account, address operator) external view returns (bool);
            function _setURI(string memory newuri) internal virtual
}
interface RFTFactoryInterface {
    function create(string memory _uri) external returns (RFTTokenInterface);
}

contract DotFactoryFactory{
    address[] public deployedFactories;
    address public coordinator;
    address public factory;
    event newDotFactory(address dotfactory,uint PubKey,bytes32 Title );

    constructor(address _coordinator,address _factory) public {
        coordinator=_coordinator;
        factory=_factory;
    }
    function deployFactory(uint256 providerPubKey,bytes32 providerTitle ) public returns(address){
        TokenDotFactory TDF=  new TokenDotFactory(coordinator,factory,providerPubKey,providerTitle);
        TDF.transferOwnership(msg.sender);
        deployedFactories.push(address(TDF));
        emit newDotFactory(address(TDF),providerPubKey,providerTitle);
        return address(TDF);
    }
    function getFactories() public view returns(address[] memory){
        return deployedFactories;
    }
}

contract TokenDotFactory is Ownable {

    CurrentCostInterface currentCost;
    FactoryTokenInterface public reserveToken;
    ZapCoordinatorInterface public coord;
    TokenFactoryInterface public tokenFactory;
    BondageInterface bondage;

    mapping(bytes32 => address) public curves; // map of endpoint specifier to token-backed dotaddress
    bytes32[] public curves_list; // array of endpoint specifiers
    event DotTokenCreated(address tokenAddress);

    constructor(
        address coordinator, 
        address factory,
        uint256 providerPubKey,
        bytes32 providerTitle 
    ) public {
        coord = ZapCoordinatorInterface(coordinator); 
        reserveToken = FactoryTokenInterface(coord.getContract("ZAP_TOKEN"));
        //always allow bondage to transfer from wallet
        reserveToken.approve(coord.getContract("BONDAGE"), ~uint256(0));
        tokenFactory = TokenFactoryInterface(factory);

        RegistryInterface registry = RegistryInterface(coord.getContract("REGISTRY")); 
        registry.initiateProvider(providerPubKey, providerTitle);
    }

    function initializeCurve(
        bytes32 specifier, 
        bytes32 symbol, 
        int256[] memory curve
    ) public  onlyOwner returns(address) {
        
        require(curves[specifier] == address(0), "Curve specifier already exists");
        
        RegistryInterface registry = RegistryInterface(coord.getContract("REGISTRY")); 
        require(registry.isProviderInitiated(address(this)), "Provider not intiialized");

        registry.initiateProviderCurve(specifier, curve, address(this));
        curves[specifier] = newToken(bytes32ToString(specifier), bytes32ToString(symbol));
        curves_list.push(specifier);
        
        registry.setProviderParameter(specifier, toBytes(curves[specifier]));
        
        emit DotTokenCreated(curves[specifier]);
        return curves[specifier];
    }


    event Bonded(bytes32 indexed specifier, uint256 indexed numDots, address indexed sender); 

    //whether this contract holds tokens or coming from msg.sender,etc
    function bond(bytes32 specifier, uint numDots) public  {

        bondage = BondageInterface(coord.getContract("BONDAGE"));
        uint256 issued = bondage.getDotsIssued(address(this), specifier);

        CurrentCostInterface cost = CurrentCostInterface(coord.getContract("CURRENT_COST"));
        uint256 numReserve = cost._costOfNDots(address(this), specifier, issued + 1, numDots - 1);

        require(
            reserveToken.transferFrom(msg.sender, address(this), numReserve),
            "insufficient accepted token numDots approved for transfer"
        );

        reserveToken.approve(address(bondage), numReserve);
        bondage.bond(address(this), specifier, numDots);
        FactoryTokenInterface(curves[specifier]).mint(msg.sender, numDots);
        emit Bonded(specifier, numDots, msg.sender);

    }

    event Unbonded(bytes32 indexed specifier, uint256 indexed numDots, address indexed sender); 

    //whether this contract holds tokens or coming from msg.sender,etc
    function unbond(bytes32 specifier, uint numDots) public {
        bondage = BondageInterface(coord.getContract("BONDAGE"));
        uint issued = bondage.getDotsIssued(address(this), specifier);

        currentCost = CurrentCostInterface(coord.getContract("CURRENT_COST"));
        uint reserveCost = currentCost._costOfNDots(address(this), specifier, issued + 1 - numDots, numDots - 1);

        //unbond dots
        bondage.unbond(address(this), specifier, numDots);
        //burn dot backed token
        FactoryTokenInterface curveToken = FactoryTokenInterface(curves[specifier]);
        curveToken.burnFrom(msg.sender, numDots);

        require(reserveToken.transfer(msg.sender, reserveCost), "Error: Transfer failed");
        emit Unbonded(specifier, numDots, msg.sender);

    }

    function newToken(
        string  memory name,
        string memory symbol
    ) 
        public
        onlyOwner
        returns (address tokenAddress) 
    {
        FactoryTokenInterface token = tokenFactory.create(name, symbol);
        tokenAddress = address(token);
        return tokenAddress;
    }

    function getTokenAddress(bytes32 endpoint) public view returns(address) {
        RegistryInterface registry = RegistryInterface(coord.getContract("REGISTRY"));
       // console.log(registry.getProviderParameter(address(this), endpoint));
        return toAddress(registry.getProviderParameter(address(this), endpoint),0);
    }

    function getEndpoints() public view returns(bytes32[] memory ){
      return curves_list;
    }

    // https://ethereum.stackexchange.com/questions/884/how-to-convert-an-address-to-bytes-in-solidity
    function toBytes(address x) public pure returns (bytes memory b) {
        b = new bytes(20);
        for (uint i = 0; i < 20; i++)
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
    }

    //https://ethereum.stackexchange.com/questions/2519/how-to-convert-a-bytes32-to-string
    function bytes32ToString(bytes32 x) public pure returns (string memory) {
        bytes memory bytesString = new bytes(32);

        bytesString = abi.encodePacked(x);

        return string(bytesString);
    }

    
    function toAddress(bytes memory _bytes, uint256 _start) internal view returns (address) {
        require(_start + 20 >= _start, "toAddress_overflow");
        //console.log(_bytes.length);
        require(_bytes.length >= _start + 20, "toAddress_outOfBounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

}


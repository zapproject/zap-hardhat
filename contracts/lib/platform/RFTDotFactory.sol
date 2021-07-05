import "contract/lib/1155/NFTFactoryInterface.sol";
import "../token/FactoryTokenInterface.sol";
import "../ownership/ZapCoordinatorInterface.sol";
import "../../platform/bondage/BondageInterface.sol";
import "../../platform/bondage/currentCost/CurrentCostInterface.sol";
import "../../platform/registry/RegistryInterface.sol";
import "../../platform/bondage/currentCost/CurrentCostInterface.sol";
import "contract/lib/1155/ownable1155.sol";
// import "contract/lib/1155/ownable1155.sol";
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

contract RFTDotFactory is ownable1155 {

    CurrentCostInterface currentCost;
    FactoryTokenInterface public reserveToken;
    ZapCoordinatorInterface public coord;
    NFTFactoryInterface public tokenFactory;
    BondageInterface bondage;
    uint256 ownerfee;
    mapping(bytes32 => address) public curves; // map of endpoint specifier to token-backed dotaddress
    bytes32[] public curves_list; // array of endpoint specifiers
    event DotTokenCreated(address tokenAddress);

    constructor(
        address coordinator, 
        address factory,
        uint256 providerPubKey,
        bytes32 providerTitle,
        uint256 fee 
    ) public {
        coord = ZapCoordinatorInterface(coordinator); 
        reserveToken = FactoryTokenInterface(coord.getContract("ZAP_TOKEN"));
        //always allow bondage to transfer from wallet
        reserveToken.approve(coord.getContract("BONDAGE"), ~uint256(0));
        tokenFactory = TokenFactoryInterface(factory);
        ownerfee=fee;
        RegistryInterface registry = RegistryInterface(coord.getContract("REGISTRY")); 
        registry.initiateProvider(providerPubKey, providerTitle);
    }

    function initializeCurve(
        bytes32 specifier, 
        bytes32 symbol, 
        int256[] memory curve,
        uint256 mintprice,
        uint256 burnprice,
        string memory baseMetadata
    ) public  onlyOwner returns(address) {
        
        require(curves[specifier] == address(0), "Curve specifier already exists");
        
        RegistryInterface registry = RegistryInterface(coord.getContract("REGISTRY")); 
        require(registry.isProviderInitiated(address(this)), "Provider not intiialized");

        registry.initiateProviderCurve(specifier, curve, address(this));
        curves[specifier] = newToken(bytes32ToString(specifier), bytes32ToString(symbol));
        curves_list.push(specifier);
        // int256 supply = curve[curve.length-1];
        registry.setProviderParameter(specifier, toBytes(curves[specifier]));
        NFTTokenInterface token= NFTTokenInterface( curves[specifier]);
        token.setBaseURI(baseMetadata);
        
        emit DotTokenCreated(curves[specifier]);
        return curves[specifier];
    }

    function getTokenID(bytes32 specifier,uint tokenMinted) public view returns(uint){
        return uint(keccak256(abi.encodePacked(specifier)))+tokensMinted[specifier];
    }
    event Bonded(bytes32 indexed specifier, uint256 indexed numDots, address indexed sender, bytes memory data); 

    //whether this contract holds tokens or coming from msg.sender,etc
    function bond(bytes32 specifier, uint numDots, uint256 amount) public {
        bondage = BondageInterface(coord.getContract("BONDAGE"));
        uint256 issued = bondage.getDotsIssued(address(this), specifier);

        CurrentCostInterface cost = CurrentCostInterface(coord.getContract("CURRENT_COST"));
        uint256 numReserve = cost._costOfNDots(address(this), specifier, issued + 1, numDots - 1);

        require(
            reserveToken.transferFrom(msg.sender, address(this), numReserve+ownerfee),
            "insufficient accepted token numDots approved for transfer"
        );
        tokensMinted[specifier]+=1;
        uint id= uint(keccak256(abi.encodePacked(specifier)))+tokensMinted[specifier];

        reserveToken.approve(address(bondburnage), numReserve);
        bondage.bond(address(this), specifier, numDots);
        FactoryTokenInterface(curves[specifier]).mint(msg.sender, id, numDots,data);
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
            uint id= uint(keccak256(abi.encodePacked(specifier)))+tokensMinted[specifier];
        curveToken.burnFrom(msg.sender,id, numDots);

        require(reserveToken.transfer(msg.sender, reserveCost), "Error: Transfer failed");
        emit Unbonded(specifier, numDots, msg.sender);

    }

    
    function newToken(
        string  memory uri
    ) 
        public
        onlyOwner
        returns (address tokenAddress) 
    {
        FactoryTokenInterface token = tokenFactory.create(uri);
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


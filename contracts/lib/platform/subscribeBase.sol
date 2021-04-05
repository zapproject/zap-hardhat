pragma solidity ^0.7.3;


// Zap contracts's methods that user can call knowing the contracts's addresses
interface ZapBridge{
	function getContract(string memory contractName) external view returns (address); //coordinator
	
	function delegateBond(address holderAddress, address oracleAddress, bytes32 endpoint, uint256 numDots) external returns (uint256 boundZap); //bondage
	function query(address, string calldata, bytes32 , bytes32[] calldata) external returns (uint256); //dispatch
	
    function bond(bytes32 specifier, uint numDots) external;
}
contract SubscriberBase {
    address public provider;
	bytes32 public endpoint;
    address public dispatchAddress;
	ZapBridge public coordinator;
	

//Coordinator contract is one single contract that 
//knows all other Zap contract aaaaa addresses 
	constructor(address _coordinator,address _provider,bytes32 _endpoint) public {
		
		coordinator = ZapBridge(_coordinator);	
		
        dispatchAddress=coordinator.getContract("DISPATCH");
        _setProvider(_provider, _endpoint);
	}

	//Set provider that contract will receive data (only owner allowed)
	function _setProvider(address _provider, bytes32 _endpoint) internal {
		
		endpoint = _endpoint;
		provider = _provider;
	}
	
	//This function call can be ommitted if owner call delegateBond directly to Bondage
	function _bond(uint256 dots) internal {
       
		address BondageAddress = coordinator.getContract("BONDAGE");
		return ZapBridge(BondageAddress).bond(endpoint,dots);
	}

	//Query offchain or onchain provider.
	function _queryProvider(string memory queryString, bytes32[] memory params) internal returns (uint256) {
        
		//address dispatchAddress = coordinator.getContract("DISPATCH");
		uint id = ZapBridge(dispatchAddress).query(provider,queryString,endpoint,params);
		return id;
	}

   

}

// Inherit the SubscriberBase and implmement a callback
contract Example is SubscriberBase{
    int[] public response;
    constructor(address _coordinator,address _provider,bytes32 _endpoint)  public SubscriberBase(_coordinator,_provider,_endpoint){        
    }
    //Implementing callback that will accept provider's respondIntArray
    //Response method options  are  :respondBytes32Array, respondIntArray, respond1, respond2, respond3, respond4
	function callback(uint256 _id, int[] calldata _response) external{
		require(msg.sender==dispatchAddress);
        response=_response;
        //Implement your logic with _response data here
	}
    function queryProvider(string memory queryString, bytes32[] memory params) public returns(uint){
        uint id=_queryProvider( queryString,  params);
    }
}

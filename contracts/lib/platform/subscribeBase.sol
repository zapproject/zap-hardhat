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
	/**
	
	 */
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
	// @Param querystring
	function _queryProvider(string memory queryString, bytes32[] memory params) internal returns (uint256) {
        
		//address dispatchAddress = coordinator.getContract("DISPATCH");
		uint id = ZapBridge(dispatchAddress).query(provider,queryString,endpoint,params);
		return id;
	}

   

}
/**
Implmenting a ZAP Oracle
Integrating zap oracles into a smart contract can be done easily using the SubscriberBase contract. 
This contract when inherited provides the necessary methods and variables for subscribing to any single zap endpoint.
Every Oracle service provider is specified by a unique bytes32 identifier and has a unique address. 
This is set in the contructor along with the zap coordinator address which is needed for bonding and dispatching.
For a contract to use a zap oracle two methods must be implemented a callback and a query.
The query method  must call the internal _queryProvider method of the SubscriberBase. This takes two paramaters a string  called queryString and a byte32 array
called params. The queryString is the primary query specifier used to tell an oracle the type of data being requested. In the case of a price feed the queryString be would the currency being requested.
The params arguements can be used to add extra specifications to the query which are strings encoded as a bytes32. For a price query adding a param of "int" will return the price as an integer rather than 
the default of a string.
Every query returns a unique uint identifier that can be handled appropriately by the calling smart contract. In the example it is saved as current query. 

To receive data a smart contract must implement a callback function which can only be called by the dispatch contract responsible for handle oracle replies.
The callback function takes a uint id  which will correspond to a given query id and a response which can have different types.
The response can be a array of bytes32 values, an integer array, or a string depending on the oracle service you are subscribing to.
In the Example contract we use a int[] response which is ideal for receiving integer price data.
++
*/



// Inherit the SubscriberBase and implmement a callback
contract Example is SubscriberBase{
    int[] public response;
	uint current_query;
	/**
	 *Constructor method inherits the SubscriberBase contructor 
	 * Coordinator address
	 * Provider address
	 * oracle endpoint specifier
	 */
    constructor(address _coordinator,address _provider,bytes32 _endpoint)  public SubscriberBase(_coordinator,_provider,_endpoint){        
    }

   
    /**
	* Implementing callback that will accept provider's respondIntArray
	* Response method options  are  respondBytes32Array, respondIntArray, respond1, respond2, respond3, respond4
	* this method uses respondIntArray
	* uint _id 
	* int[] _response
	*
	*/
	function callback(uint256 _id, int[] calldata _response) external{
		require(msg.sender==dispatchAddress);
        response=_response;
        //Implement your logic with _response data here
	}
	/**
	 * Implement _queryProvider method with custom behaviour for 
	 * queryString
	 * query params 
	 */
    function query(string memory queryString, bytes32[] memory params) public returns(uint){
        uint id=_queryProvider( queryString,  params);
		current_query=id;
    }
}

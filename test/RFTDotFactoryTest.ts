    import { ethers } from 'hardhat';
    import { solidity } from 'ethereum-waffle';
    import chai from 'chai';
    const { expect } = require('chai');
    import mocha from 'mocha';
    import { RftDotFactory } from '../typechain/RFTDotFactory';
    import { ZapCoordinator } from '../typechain/ZapCoordinator';
    //import { TokenFactory } from '../typechain/TokenFactory';
    import { Erc1155Factory } from '../typechain/Erc1155Factory';
    import { RftTokenFactory } from '../typechain/RftTokenFactory';
// ABI
// ADDRESS

    let RFTDotFactory: RftDotFactory;
    let signers : any;
    let coordinator: ZapCoordinator;
    //let factory : TokenFactory;
    let RFTTokenFactory : RftTokenFactory;

describe('Testing', () => {
    
    beforeEach(async () => {
    signers = await ethers.getSigners();
    
        // Instantiates coordinator contract
        const coordinatorFactory = await ethers.getContractFactory('ZapCoordinator', signers[0]);
      
        // deploys coordinator contract
        coordinator = (await coordinator.deploy()) as ZapCoordinator;
        await coordinator.deployed();
    
        // Instantiate factory contract
        RFTTokenFactory = (await ethers.getContractFactory('RFTTokenFactory', signers[0])) as unknown as RftTokenFactory;

        // deploys factory contract 
        RFTTokenFactory = (await RFTTokenFactory.deploy()) as RftTokenFactory;
       

        //instantiate dotfactoryfactory
       // const rftDotFactoryFactory = (await ethers.getContractFactory('RftDotFactoryFactory', signers[0])) as RftDotFactoryFactory;
       
        // deploys dotfactoryfactory
         //RFTDotFactory = (await RFTDotFactory.deploy(coordinator.address, )) as RftDotFactory;
        //await RFTDotFactory.deployed();
    

 
   

    });
    
    it('Should get accounts', () => {
    
       
    })
});

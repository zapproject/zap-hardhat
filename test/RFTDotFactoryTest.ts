    import { ethers } from 'hardhat';
    import { solidity } from 'ethereum-waffle';
    import chai from 'chai';
    const { expect } = require('chai');
    import mocha from 'mocha';
    import { RftDotFactory } from '../typechain/RftDotFactory';
    import { ZapCoordinator } from '../typechain/ZapCoordinator';
    import {RftDotFactoryFactory} from '../typechain/RftDotFactoryFactory';

    //import { TokenFactory } from '../typechain/TokenFactory';
    import { Erc1155Factory } from '../typechain/Erc1155Factory';
    import { RftTokenFactory } from '../typechain/RftTokenFactory';
// ABI
// ADDRESS

    let RFTDotFactory: RftDotFactory;
    let signers : any;
    let coordinator: ZapCoordinator;
    let coordinatorFactory: any;
    //let factory : TokenFactory;
    let RFTTokenFactory : RftTokenFactory;
    let RFTDotFactoryFactory:RftDotFactoryFactory;
    let RFTDotFactoryInstance:any;
    let RFTDotFactoryFactoryInstance:any;
    const title =
  '0x048a2991c2676296b330734992245f5ba6b98174d3f1907d795b7639e92ce532';
describe('Testing', () => {
    
    beforeEach(async () => {
    signers = await ethers.getSigners();
    
        // Instantiates coordinator contract
        const coordinatorFactory = await ethers.getContractFactory('ZapCoordinator', signers[0]);
      
        // deploys coordinator contract
        coordinator = (await coordinatorFactory.deploy()) as ZapCoordinator;
        await coordinator.deployed();
    
        // Instantiate token factory contract
        const RFTFactory = await ethers.getContractFactory('RFTTokenFactory',signers[0]);
        RFTTokenFactory = (await RFTFactory.deploy()) as RftTokenFactory;
       

        //instantiate dotfactoryfactory
       const rftDotFactoryFactory = (await ethers.getContractFactory('RFTDotFactoryFactory', signers[0]));// as RftDotFactoryFactory;
       
        // deploys dotfactoryfactory
        RFTDotFactoryFactoryInstance=await rftDotFactoryFactory.deploy(coordinator.address, RFTTokenFactory.address) as unknown as RftDotFactoryFactory;
         // RFTDotFactoryFactoryInstance = (await rftDotFactoryFactory.deploy(coordinator.address, RFTTokenFactory.address)) as RftDotFactoryFactory;
        // await RFTDotFactory.deployed();
        const rftDotFactory = await ethers.getContractFactory('RFTDotFactory',signers[0]);
        // RFTDotFactoryInstance = await rftDotFactory.deploy(coordinator.address, RFTTokenFactory.address,77,title,2)

 
   

    });
    
    it('Should get accounts', () => {
    
       
    })
});

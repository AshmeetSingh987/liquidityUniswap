const { Contract, ContractFactory, utils, BigNumber, constants }=require('ethers');
const WETH9=require('../WETH9.json');


const factoryArtifact=require('@uniswap/v2-core/build/UniswapV2Factory.json');
const routerArtifact=require('@uniswap/v2-core/build/UniswapV2Router02.json');
const pairArtifact=require('@uniswap/v2-core/build/UniswapV2Pair.json');
const { ethers }=require('hardhat');

async function main() {
    const [owner]=await ethers.getSigners();

    const Factory=new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, owner);
    const factory=await Factory.deploy(owner.address);
    console.log(`Factory deployed to ${factory.address}`);

    const USdt=await ethers.getContractFactory("Tether", owner);

    const usdt=await USdt.deploy();
    console.log(`USDT deployed to ${usdt.address}`);

    const USDC=await ethers.getContractFactory("UsdCoin", owner);
    const usdc=await USDC.deploy();
    console.log(`USDC deployed to ${usdc.address}`);

    await usdt.connect(owner).mint(owner.address, utils.parseEther('1000000000'));

    await usdc.connect(owner).mint(owner.address, utils.parseEther('1000000000'));


    const tx1=await factory.createPair(usdt.address, weth.address);
    await tx1.wait();

    const pairAddress=await factory.getPair(usdt.address, weth.address);
    console.log(`Pair address: ${pairAddress}`);

    const pair=new Contract(pairAddress, pairArtifact.abi, owner);

    let reserves=await pair.getReserves();
    console.log(`Reserves: ${reserves[0].toString()}, ${reserves[1].toString()}`);

    const Weth=new ContractFactory(WETH9.abi, WETH9.bytecode, owner);
    const weth=await Weth.deploy();
    console.log(`WETH deployed to ${weth.address}`);

    const Router=new ContractFactory(routerArtifact.abi, routerArtifact.bytecode, owner);
    const router=await Router.deploy(factory.address, weth.address);
    console.log(`Router deployed to ${router.address}`);

    const approval1=await usdt.approve(router.address, constants.MaxUint256);
    await approval1.wait();
    const approval2=await usdc.approve(router.address, constants.MaxUint256);
    await approval2.wait();

    // Start id with any ration as we are the first liquidity provider

    const token1Amount=utils.parseUnits('100')
    const token2Amount=utils.parseEther('100')


    const deadline=Math.floor(Date.now()/1000)+(10*60)
    // 10 minutes from the current Unix time

    const addLiquidityTx=await router.connect(owner).addLiquidity(
        usdt.address,
        usdc.address,
        token1Amount,
        token2Amount,
        0,
        0,
        owner.address,
        deadline,
        { gasLimit: utils.hexlify(100000) } // 100,000 Gwei to be changed while launching reduce this gas limit 
    );
    addLiquidityTx.wait();
    reserves=await pair.getReserves();
    console.log('reserver', reserves)
    // npx hardhat run scripts/_deployContracts.js --network localhost 
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
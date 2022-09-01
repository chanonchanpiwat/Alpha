const { expect } = require("chai");
const { ethers } = require("hardhat");


const { USDT_WHALE_ADDRESS,  USDT_ADDRESS } = require("../config.js")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe('contract', function() {
    let owner;
    let address1;
    let address2;
    let usdt_whale;

    let Bank;
    let USDT;

    let tx;
    const usdt_decimals = 6;
    const interest = 10;

    this.beforeEach("Deploying the contract", async() => { 
      [owner, address1, address2] = await ethers.getSigners();
      usdt_whale = await ethers.getImpersonatedSigner(USDT_WHALE_ADDRESS);
    
      Bank = await ethers.getContractFactory("Bank");
      Bank = await Bank.deploy(USDT_ADDRESS)
      Bank = await Bank.deployed()
  
      USDT = await hre.ethers.getContractAt("IERC20", USDT_ADDRESS);
      
      return {owner, address1, address2, usdt_whale, Bank, USDT}
    });

    it('Should successfully deploy a contract', async () => {
        console.log(`contract Bank deployed at ${Bank.address}`)
    });

    it("Should be able to recevie the initail 10 millions USDT token", async () => {
      const BankSignedByWhale = await Bank.connect(usdt_whale)
      const USDTSignedByWhale = await USDT.connect(usdt_whale)

      // deposit initial fund in to Bank contract
      const initial_fund = ethers.BigNumber.from(10).pow(7+usdt_decimals);
      let tx = await USDTSignedByWhale.approve(Bank.address, initial_fund)
      tx = await BankSignedByWhale.deposit(initial_fund)
      console.log(`--deposit--`)
      console.log(`Bank balance ${await USDT.balanceOf(Bank.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      // expect USDT balanceOf of Bank to equal 10 million USDT after token transfer
      expect(await USDT.balanceOf(Bank.address)).to.equal("10000000000000");
    })

    it('Should be able lend token to the borrower with correct interest rate', async() => {
      // deposit initial fund in to Bank contract
      const initial_fund = ethers.BigNumber.from(10).pow(7+usdt_decimals);
      // borrowing amount 10 millions usdt
      const borrowingAmount = ethers.BigNumber.from(10).pow(7+usdt_decimals); 

      const BankSignedByWhale = await Bank.connect(usdt_whale)
      const USDTSignedByWhale = await USDT.connect(usdt_whale)

      
      let tx = await USDTSignedByWhale.approve(Bank.address, initial_fund)
      tx = await BankSignedByWhale.deposit(initial_fund)

      // expect USDT balanceOf of Bank to equal 10 million USDT after token transfer
      expect(await USDT.balanceOf(Bank.address)).to.equal(initial_fund);

      // borrower lend the token [5 million usdt] from the bank
      const BankSignedByOwner = await Bank.connect(owner)

      // balanceOf lender before lending the token
      const BorrowerBalanceBeforeLend = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeLend = await USDT.balanceOf(Bank.address)

      
      console.log(`Bank balance before lending ${await USDT.balanceOf(Bank.address).then((data) => data.div(10**usdt_decimals))} usdt`)
      console.log(`Borrower balance before lending ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      // lending
      tx = await BankSignedByOwner.borrow(borrowingAmount)
      console.log(`--lending--`)

      console.log(`Bank balance after lending ${await USDT.balanceOf(Bank.address).then((data) => data.div(10**usdt_decimals))} usdt`)
      console.log(`Borrower balance after lending ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      // balanceOf lender before lending the token
      const BorrowerBalanceAfterLend = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterLend = await USDT.balanceOf(Bank.address)

      const totalDebt = borrowingAmount.mul(100+interest).div(100)
      // expect borrower to receive token equal borrowing amount
      expect(await Bank.deptOf(owner.address)).to.equal(totalDebt)
      expect(BorrowerBalanceAfterLend.sub(BorrowerBalanceBeforeLend)).to.equal(borrowingAmount)
      expect(LenderBalanceBeforeLend.sub(LenderBalanceAfterLend)).to.equal(borrowingAmount)

      console.log(`Borrower balance before repay ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)
    })

    it("Should be able to receive a repay of borrowing fund back plus interest from borrower", async () => {
      // deposit initial fund in to Bank contract
      const initial_fund = ethers.BigNumber.from(10).pow(7+usdt_decimals);
      // borrowing amount 10 millions usdt
      const borrowingAmount = ethers.BigNumber.from(10).pow(7+usdt_decimals); 

      console.log(`Borrower balance before lending ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      const BankSignedByWhale = await Bank.connect(usdt_whale)
      const USDTSignedByWhale = await USDT.connect(usdt_whale)

      
      let tx = await USDTSignedByWhale.approve(Bank.address, initial_fund)
      tx = await BankSignedByWhale.deposit(initial_fund)

      // expect USDT balanceOf of Bank to equal 10 million USDT after token transfer
      expect(await USDT.balanceOf(Bank.address)).to.equal(initial_fund);

      // borrower lend the token [5 million usdt] from the bank
      const BankSignedByOwner = await Bank.connect(owner)

      console.log(`Bank balance before lending ${await USDT.balanceOf(Bank.address).then((data) => data.div(10**usdt_decimals))} usdt`)
      console.log(`Borrower balance before lending ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      // lending
      tx = await BankSignedByOwner.borrow(borrowingAmount)
      console.log(`--lending--`)

      console.log(`Bank balance after lending ${await USDT.balanceOf(Bank.address).then((data) => data.div(10**usdt_decimals))} usdt`)
      console.log(`Borrower balance after lending ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      const totalDebt = borrowingAmount.mul(100+interest).div(100)
      // expect borrower to receive token equal borrowing amount
      expect(await Bank.deptOf(owner.address)).to.equal(totalDebt)
      expect(BorrowerBalanceAfterLend.sub(BorrowerBalanceBeforeLend)).to.equal(borrowingAmount)
      expect(LenderBalanceBeforeLend.sub(LenderBalanceAfterLend)).to.equal(borrowingAmount)


      // get current dept of borrower
      const dept = await Bank.deptOf(owner.address)
      console.log(`Borrower balance before transfer ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)
      console.log(`Dept of borrower ${dept.div(10**usdt_decimals)} usdt`)

      // dai whale transfer token to borrower to help paying the interest
      await USDTSignedByWhale.transfer(owner.address, dept)
      // borrower approving bank contract to spend their token
      console.log(`Borrower balance after transfer ${await USDT.balanceOf(owner.address).then((data) => data.div(10**usdt_decimals))} usdt`)

      const USDTSignedByOwner = USDT.connect(owner)
      tx = await USDTSignedByOwner.approve(Bank.address, dept)
      
      // balanceOf lender before repaying the token
      const BorrowerBalanceBeforeRepay = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeRepay= await USDT.balanceOf(Bank.address)
      
      tx = await BankSignedByWhale.deposit(10)
      
      // balanceOf lender before repaying the token
      const BorrowerBalanceAfterRepay = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterRepay = await USDT.balanceOf(Bank.address)

      expect(BorrowerBalanceBeforeRepay.sub(BorrowerBalanceAfterRepay)).to.equal("1100000000000");
      expect(LenderBalanceAfterRepay.sub(LenderBalanceBeforeRepay)).to.equal("1100000000000");
    })
  })
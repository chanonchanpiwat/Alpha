const { expect } = require("chai");
const { ethers } = require("hardhat");


const { USDT_WHALE_ADDRESS,  USDT_ADDRESS } = require("../config.js")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


describe('contract', function() {

    const usdt_decimals = 6;
    const interest = 10;

    async function deployTokenFixture() {
      const [owner, address1, address2] = await ethers.getSigners();
      const usdt_whale = await ethers.getImpersonatedSigner(USDT_WHALE_ADDRESS);
    
      let Bank = await ethers.getContractFactory("Bank");
      Bank = await Bank.deploy(USDT_ADDRESS)
      Bank = await Bank.deployed()
  
      let USDT = await hre.ethers.getContractAt("IERC20", USDT_ADDRESS);

      // deposit initial fund in to Bank contract
      const initial_fund = ethers.BigNumber.from(10).pow(7+usdt_decimals);

      const USDTSignedByWhale = USDT.connect(usdt_whale);
      let tx = await USDTSignedByWhale.approve(Bank.address, initial_fund);

      const BankSignedByWhale = Bank.connect(usdt_whale);
      tx = await BankSignedByWhale.deposit(initial_fund);
      console.log(`--deposit--`)

      const BankBalanceAfterDeposit = await USDT.balanceOf(Bank.address);
      console.log(`Bank balance after deposit ${BankBalanceAfterDeposit.div(10**usdt_decimals)} usdt`);
      expect(BankBalanceAfterDeposit).to.equal(initial_fund);
      console.log(`--------------`)

      return {owner, address1, address2, usdt_whale, Bank, USDT}
    }

    it('Should be able lend token to the borrower with correct interest rate', async() => {
      const {owner, address1, address2, usdt_whale, Bank, USDT} = await loadFixture(deployTokenFixture);
      // borrowing amount 10 millions usdt
      const borrowingAmount = ethers.BigNumber.from(10).pow(7+usdt_decimals); 

      // borrower lend the token [5 million usdt] from the bank
      const BankSignedByOwner = await Bank.connect(owner)

      // balanceOf lender before lending the token
      const BorrowerBalanceBeforeLend = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance before lending ${BorrowerBalanceBeforeLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance before lending ${LenderBalanceBeforeLend.div(10**usdt_decimals)} usdt`)

      // lending
      tx = await BankSignedByOwner.borrow(borrowingAmount)
      console.log(`--lending--`)

      // balanceOf lender after lending the token
      const BorrowerBalanceAfterLend = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance after lending ${BorrowerBalanceAfterLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance after lending ${LenderBalanceAfterLend.div(10**usdt_decimals)} usdt`)

      const totalDebt = borrowingAmount.mul(100+interest).div(100)
      // expect borrower to receive token equal borrowing amount
      expect(await Bank.deptOf(owner.address)).to.equal(totalDebt)
      expect(BorrowerBalanceAfterLend.sub(BorrowerBalanceBeforeLend)).to.equal(borrowingAmount)
      expect(LenderBalanceBeforeLend.sub(LenderBalanceAfterLend)).to.equal(borrowingAmount)
      console.log(`--------------`)
    })

    it("Should be able to receive a repay of borrowing fund back plus interest from borrower", async () => {
      const {owner, address1, address2, usdt_whale, Bank, USDT} = await loadFixture(deployTokenFixture);
      // borrowing amount 10 millions usdt
      const borrowingAmount = ethers.BigNumber.from(10).pow(7+usdt_decimals); 

      // borrower lend the token [10 million usdt] from the bank
      const BankSignedByOwner = await Bank.connect(owner)

      // balanceOf lender before lending the token
      const BorrowerBalanceBeforeLend = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance before lending ${BorrowerBalanceBeforeLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance before lending ${LenderBalanceBeforeLend.div(10**usdt_decimals)} usdt`)

      // lending
      tx = await BankSignedByOwner.borrow(borrowingAmount)
      console.log(`--lending--`)

      // balanceOf lender after lending the token
      const BorrowerBalanceAfterLend = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance after lending ${BorrowerBalanceAfterLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance after lending ${LenderBalanceAfterLend.div(10**usdt_decimals)} usdt`)

      const totalDebt = borrowingAmount.mul(100+interest).div(100)
      // expect borrower to receive token equal borrowing amount
      expect(await Bank.deptOf(owner.address)).to.equal(totalDebt)
      expect(BorrowerBalanceAfterLend.sub(BorrowerBalanceBeforeLend)).to.equal(borrowingAmount)
      expect(LenderBalanceBeforeLend.sub(LenderBalanceAfterLend)).to.equal(borrowingAmount)

      // get current dept of borrower
      const dept = await Bank.deptOf(owner.address)
      console.log(`dept of borrower ${dept.div(10**usdt_decimals)} usdt`)

      // whale help pay for interest of loan
      const USDTSignedByWhale = USDT.connect(usdt_whale);
      const borrowerBalance = await USDT.balanceOf(owner.address)
      tx = await USDTSignedByWhale.transfer(owner.address, dept.sub(borrowerBalance))
      console.log(`--whale help pay for interest ${dept.sub(borrowerBalance).div(10**usdt_decimals)} usdt`)

      // approving the token
      const USDTSignedByOwner = USDT.connect(owner)
      tx = await USDTSignedByOwner.approve(Bank.address, dept)
      
      // balanceOf lender before repaying the token
      const BorrowerBalanceBeforeRepay = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeRepay= await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance before repay ${BorrowerBalanceBeforeRepay.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance before repay ${LenderBalanceBeforeRepay.div(10**usdt_decimals)} usdt`)

      tx = await BankSignedByOwner.repay()
      console.log(`--repay--`)
      
      // balanceOf lender before repaying the token
      const BorrowerBalanceAfterRepay = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterRepay = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance after repay ${BorrowerBalanceAfterRepay.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance after repay ${LenderBalanceAfterRepay.div(10**usdt_decimals)} usdt`)

      expect(BorrowerBalanceBeforeRepay.sub(BorrowerBalanceAfterRepay)).to.equal(borrowingAmount.mul(110).div(100));
      expect(LenderBalanceAfterRepay.sub(LenderBalanceBeforeRepay)).to.equal(borrowingAmount.mul(110).div(100));
      console.log(`--------------`)
    })

    it("Should fail if sender don not have enough token to repay the dept", async () => {
      const {owner, address1, address2, usdt_whale, Bank, USDT} = await loadFixture(deployTokenFixture);
      // borrowing amount 10 millions usdt
      const borrowingAmount = ethers.BigNumber.from(10).pow(7+usdt_decimals); 

      // borrower lend the token [10 million usdt] from the bank
      const BankSignedByOwner = await Bank.connect(owner)

      // balanceOf lender before lending the token
      const BorrowerBalanceBeforeLend = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance before lending ${BorrowerBalanceBeforeLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance before lending ${LenderBalanceBeforeLend.div(10**usdt_decimals)} usdt`)

      // lending
      tx = await BankSignedByOwner.borrow(borrowingAmount)
      console.log(`--lending--`)

      // balanceOf lender after lending the token
      const BorrowerBalanceAfterLend = await USDT.balanceOf(owner.address)
      const LenderBalanceAfterLend = await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance after lending ${BorrowerBalanceAfterLend.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance after lending ${LenderBalanceAfterLend.div(10**usdt_decimals)} usdt`)

      const totalDebt = borrowingAmount.mul(100+interest).div(100)
      // expect borrower to receive token equal borrowing amount
      expect(await Bank.deptOf(owner.address)).to.equal(totalDebt)
      expect(BorrowerBalanceAfterLend.sub(BorrowerBalanceBeforeLend)).to.equal(borrowingAmount)
      expect(LenderBalanceBeforeLend.sub(LenderBalanceAfterLend)).to.equal(borrowingAmount)

      // get current dept of borrower
      const dept = await Bank.deptOf(owner.address)
      console.log(`dept of borrower ${dept.div(10**usdt_decimals)} usdt`)

      // approving the token
      const USDTSignedByOwner = USDT.connect(owner)
      tx = await USDTSignedByOwner.approve(Bank.address, dept)
      
      // balanceOf lender before repaying the token
      const BorrowerBalanceBeforeRepay = await USDT.balanceOf(owner.address)
      const LenderBalanceBeforeRepay= await USDT.balanceOf(Bank.address)
      console.log(`Borrower balance before repay ${BorrowerBalanceBeforeRepay.div(10**usdt_decimals)} usdt`)
      console.log(`Bank balance before repay ${LenderBalanceBeforeRepay.div(10**usdt_decimals)} usdt`)

      await expect(Bank.connect(owner).repay()).to.be.revertedWith("insufficient balance")
      console.log(`--------------`)
    })
  })
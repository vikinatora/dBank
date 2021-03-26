import { Tabs, Tab } from 'react-bootstrap'
import dBankJson from '../abis/dBank.json'
import React, { Component, useState, useEffect } from 'react';
import TokenJson from '../abis/Token.json'
import dbankLogo from '../dbank.png';
import Web3 from 'web3';
import './App.css';

const App = (props) => {

  const [web3, setWeb3] = useState();
  const [account, setAccount] = useState('');
  const [token, setToken] = useState(null);
  const [dbank, setDbank] = useState(null);
  const [balance, setBalance] = useState(0);
  const [dBankAddress, setDBankAddress] = useState(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);
  const [dbcTokens, setDbctokens] = useState(0);

  useEffect(() => {
    const load = async () => {
      await loadBlockchainData(props.dispatch);
    };
    load();
  }, []);

  const loadBlockchainData = async() => {
    if (typeof window.ethereum !== 'undefined') {
      const web3Obj = new Web3(window.ethereum);
      const netId = await web3Obj.eth.net.getId();
      const accs = await web3Obj.eth.getAccounts();

      if (accs && accs.length) {
        setWeb3(web3Obj);
        setAccount(accs[0]);

        fetchBalance(web3Obj, accs[0]);

      } else {
        alert("Please login with Metamask");
      }
      try {
        const tokenContract = new web3Obj.eth.Contract(TokenJson.abi, TokenJson.networks[netId].address);
        const dBankContract = new web3Obj.eth.Contract(dBankJson.abi, dBankJson.networks[netId].address);
        console.log(dBankContract)
        const dBankAddress = dBankJson.networks[netId].address;
        setToken(tokenContract);
        setDbank(dBankContract);
        setDBankAddress(dBankAddress);

        fetchDBCTokens(web3Obj, accs[0], tokenContract);
      }
      catch(err) {
        console.log(err.message)
      }
    } else {
      alert("Please install Metamask");
    }

  }

  const deposit = async(e) => {
    e.preventDefault();
    const value = depositAmount.value;
    const weiValue = value * 10**18;

    if (dbank) {
      try {
        await dbank.methods.deposit().send({
          value: weiValue.toString(),
          from: account
        });

        fetchBalance(web3, account);

      } catch(err) {
        console.log(`Error, deposit: ${err.message}`);
      }
    }
  }

  const borrow = async(e) => {
    e.preventDefault()
    console.log(`borrow amount: ${borrowAmount.value}`)
    let amount = borrowAmount.value * 10 **18 //convert to wei

    if (dbank){
      try{
        await dbank.methods.borrow().send({value: amount.toString(), from: account});
        fetchBalance(web3, account);
      } catch (err) {
        console.log(`Error, borrow: ', ${err.message}`);
      }
    }
  }


  const fetchBalance = async(web3, account) => {
    try{
      const currBalance = await web3.eth.getBalance(account);
      setBalance(currBalance);
    } catch(err) {
      console.log(`Coulnd't fetch balance: ${err.message}`)
    }

  }
  const withdraw = async(e) => {
    e.preventDefault()
    if (dbank) {
      try {
        await dbank.methods.withdraw().send({
          from: account
        });
        fetchBalance(web3, account);

      } catch(err) {
        console.log(`Error, withdraw: ${err.message}`);
      }
    }
  }

  const fetchDBCTokens = async(web3, account, token) => {
    try {
      if (web3 && account && token) {
        console.log("fetching")
        const tokenBalance = await token.methods.balanceOf(account).call();
        setDbctokens(web3.utils.fromWei(tokenBalance));
      }
    }
    catch(err) {
      console.log(err);
    }
  }


  const payOff = async(e) => {
    e.preventDefault()
    if(dbank){
      try{
        const collateralEther = await dbank.methods.collateralEther(account).call({from: account})
        const tokenBorrowed = collateralEther/2
        await token.methods.approve(dBankAddress, tokenBorrowed.toString()).send({from: account})
        await dbank.methods.payOff().send({from: account})
        fetchBalance(web3, account);
      } catch(err) {
        console.log(`Error, pay off: ', ${err.message}`);
      }
    }
  }


  return (
    <div className='text-monospace'>
      <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
        <a
          className="navbar-brand col-sm-3 col-md-2 mr-0"
          href="http://www.dappuniversity.com/bootcamp"
          target="_blank"
          rel="noopener noreferrer"
        >
      <img src={dbankLogo} className="App-logo" alt="logo" height="32"/>
        <b>dBank</b>
      </a>
      </nav>
      <div className="container-fluid mt-5 text-center">
      <br></br>
        <h1>Welcome to dBank</h1>
        <h2>{account}</h2>
        {web3
          ? <h2>Balance: {web3.utils.fromWei(balance.toString(), 'ether')} ETH</h2>
        :null}
        
        <br></br>
        <div className="row">
          <main role="main" className="col-lg-12 d-flex text-center">
            <div className="content mr-auto ml-auto">
            <Tabs onSelect={(eventKey) => {
              if (eventKey === "interest") {
                fetchDBCTokens(web3, account, token)
              }
            }} defaultActiveKey="profile" id="uncontrolled-tab-example">
              <Tab eventKey="deposit" title="Deposit">
                <div>
                  <div>
                    How much do you want to deposit?
                  </div>
                  <div>
                    (min amount is 0.01 ETH)
                  </div>
                  <div>
                    (1 deposit is possible at a time)
                  </div>
                  <form onSubmit={(e) => {deposit(e);}}>
                    <div className="form-group mr-sm-2">
                      <input
                      ref={(input) => {setDepositAmount(input)}}
                      required placeholder="Amount..." 
                      className="form-control form-control-md"
                      id="depositAmount" step="0.01"
                      type="number"/>
                    </div>
                    <button type="submit" className="btn btn-primary">DEPOSIT</button>
                  </form>
                </div>
              </Tab>
              <Tab eventKey="withdraw" title="Withdraw">
                <div>
                  Do you want to withdraw and take interest?
                </div>
                <button type="submit" className="btn btn-primary" onClick={withdraw}> WITHDRAW</button>
              </Tab>
              <Tab eventKey="interest" title="Interest">
                  <h3>
                    You currently have
                  </h3>
                  <h3> {dbcTokens} DBC</h3>
              </Tab>
              <Tab eventKey="borrow" title="Borrow DBC">
                  <div>
                    <div>Do you want to borrow tokens?</div>
                    <div>(You'll get 50% of collateral, in DBC)</div>
                    <div>Type collateral amount (in ETH)</div>
                    <form onSubmit={borrow}>
                      <div className='form-group mr-sm-2'>
                        <input
                          id='borrowAmount'
                          step="0.01"
                          type='number'
                          ref={(input) => { setBorrowAmount(input) }}
                          className="form-control form-control-md"
                          placeholder='amount...'
                          required />
                      </div>
                      <button type='submit' className='btn btn-primary'>BORROW</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="payOff" title="Payoff DBC">
                  <div>
                    <div>Do you want to payoff the loan?</div>
                    <div>Payoff fee is 10%</div>
                    <div>(You'll receive your collateral)</div>
                    <button type='submit' className='btn btn-primary' onClick={payOff}>PAYOFF</button>
                  </div>
                </Tab>
            </Tabs>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
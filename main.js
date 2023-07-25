require("dotenv").config();
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const _ = require("lodash");
var XLSX = require("xlsx");

const inquirer = require("inquirer");
const NFT_Contract_ABI = require("./abi/abi.json");

const NFT_Contract_ADDRESS = "0xe12dCD9cf652c8F0d9bfb5666A0abEf17c3C8f4e";

const rpcUrl = "https://mainnet.infura.io/v3/17f9a5bfa49a45b7bea48e78f825cb02";

// // gasPrice - String: The gas price in wei to use for transactions.
// const _gasPrice = '20000000000000'; // default gas price in wei
// // gas - Number: The maximum gas provided for a transaction (gas limit).
// const _gas = 5000000;  // provide as fallback always 5M gas

const nftYouWant = 1;
const EtherValueForOneNft = 10 ** 16;

function plsWaitFor(miliseconds) {
  var currentTime = new Date().getTime();

  while (currentTime + miliseconds >= new Date().getTime()) {}
}

const timer = ms => new Promise(res => setTimeout(res, ms))


function randomInteger() {
  const { min, max } = { min: 5000, max: 15000 };

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function readDataFromFile() {
  var workbook = XLSX.readFile("file/xlfile.xlsx");
  var sheet_name_list = workbook.SheetNames;
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
}

const mintNftsForArray = async () => {
  var data = readDataFromFile();

  var _exTime = 0;
  for (let i = 0; i < data.length; i++) {
    const _address = data[i].Address;
    const _privateKey = data[i].PrivateKey;
    
    mintOne(_address, _privateKey);
    
    let _increageTime = randomInteger();
    console.log(`Wait for ${_increageTime} mili Sec`);
    await timer(_increageTime); 
  }
};

const mintOne = async (_address, _privateKey) => {
  const web3 = new Web3(new HDWalletProvider(_privateKey, rpcUrl));
  const nftContract = new web3.eth.Contract(
    NFT_Contract_ABI.abi,
    NFT_Contract_ADDRESS
  );

  
  console.log("=> Minting for: ", _address);
  try {
    await nftContract.methods
    .mint(nftYouWant)
    .send({ from: _address, value: EtherValueForOneNft * nftYouWant })
    // const _n  = await nftContract.methods.totalSupply().call();
    console.log("Minted Succefully for address: ", _address);
  } catch (error) {
    console.log("Minting Failed......");
    console.log("error message: ", error.message);
  }

};

const mintNftsTesting = async () => {
  var data = readDataFromFile();

  for (let i = 0; i < data.length; i++) {
    const _address = data[i].Address;
    const _privateKey = data[i].PrivateKey;

    console.log(
      i + 1,
      ". ",
      "Address: ",
      _address,
      " Private Key: ",
      _privateKey
    );

    let n = randomInteger();
    console.log(`Wait for ${n} mili Sec`);
    plsWaitFor(n);
  }
};

const _init = async () => {
  console.log("Hi, For check ");

  var task1Q = [
    {
      type: "input",
      name: "task1",
      message: "For testing - 1, for Real Mint - 2",
    },
  ];

  var task2Q = [
    {
      type: "input",
      name: "task2",
      message: "Yes - 1, Exit - 2",
    },
  ];

  const _task = await inquirer.prompt(task1Q);

  if (_task["task1"] == "1") {
    console.log("testing....");

    console.log("Details:----");
    console.log("You want to Mint: ", nftYouWant, " Nfts");
    console.log("One Nft Price: ", EtherValueForOneNft / 10 ** 18, " ETH");
    console.log("Contract Address: ", NFT_Contract_ADDRESS);

    console.log("Are you Realy want to test.... ");
    const _task2 = await inquirer.prompt(task2Q);

    if (_task2["task2"] == "1") {
      console.log("Now testing Started: ");
      mintNftsTesting();
    }
  } else if (_task["task1"] == "2") {
    console.log("Real Minting....");

    console.log("Details:----");
    console.log("You want to Mint: ", nftYouWant, " Nfts");
    console.log("One Nft Price: ", EtherValueForOneNft / 10 ** 18, " ETH");
    console.log("Contract Address: ", NFT_Contract_ADDRESS);

    console.log("Are you Realy want to Mint.... ");
    const _task2 = await inquirer.prompt(task2Q);

    if (_task2["task2"] == "1") {
      console.log("Now Real Minting Started: ");
      mintNftsForArray();
    }
  }
};


_init();

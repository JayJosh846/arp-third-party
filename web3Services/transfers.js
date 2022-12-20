// const Web3 = require('web3');
const Web3 = require('web3');
const webb3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

// // import axios from 'axios';
// // import BnbManager from './src/centerpirme.js';
const ethers = require("ethers");
const { abiJSON } = require("../utils/abi");

// // var bnbManager = new BnbManager("https://data-seed-prebsc-1-s1.binance.org:8545/");



const tokenContractAddress = '0xC34761543AA8B9061EAc4fB0cB036c2348bA96a0';
const address = '0x04284CE609Ea6A9c91b66340fEB457bc7cDCe5D9'
const privateKey = '0xfabef18b878549c12e8546873b6eeaf944f1e05d6d58ea307e0ad4ad881fa411'

const toAddress = '0x22E79B7e9450B17ba2BECFC797879dE20D7C3f78';
const UserPrivateKey = '0xc20823a08945d750cadd1ba6f24ff142a2eab75056c8397bed3179bb125dbd53';

// const receiverAddress = '0x765557244ddFe617C484731C146c2ba7Add7DEA1';

webb3.utils.toChecksumAddress(address)


// // const binanceURL = 'https://data-seed-prebsc-1-s1.binance.org:8545/';




// let abi = abiJSON;



// const createAccountCNGNBSC = () => {

//     bnbManager.createAccount("12345")
//         .then(res => {
//             console.log(res);
//         });
// }

// const getCNGNBSCBalance = (_userAddress) => {
//     var bnbManager = new BnbManager("https://data-seed-prebsc-1-s1.binance.org:8545/");
//     bnbManager.getBEPTokenBalance(tokenContractAddress, _userAddress)
//         .then(res => {
//             console.log(res);
//         });
// }



const creditUserCNGN = async (_address, _userAddress, _privateKey, _amount) => {

    const web3 = new Web3(webb3);
    const networkId = await web3.eth.net.getId();
    let contract = new web3.eth.Contract(abiJSON, tokenContractAddress, { from: _address });
    web3.eth.accounts.wallet.add(_privateKey);

    // Get Name
    let name = await contract.methods.name().call(); 
    // Get Symbol
    let symbol = await contract.methods.symbol().call();



    const txAmount = contract.methods.transferFrom(_address, _userAddress, _amount).encodeABI();
    const amount = web3.utils.toWei(_amount.toString(), 'ether');


    // const gas = await txAmount.estimateGas({from: address});
    const gasPrice = await web3.eth.getGasPrice();
    const nonce = web3.eth.getTransactionCount(_address);

    const sendTrx = await contract.methods.transfer(_userAddress, _amount).send({
        from: _address,
        gas: 150000
    });

    const txData = {
        from: _address,
        nonce,
        gasPrice,
        gasLimit: 21600,
        fee: gasPrice * 21000,
        to: _userAddress,
        tx_hash: sendTrx.transactionHash,
        value: 0,
        amount,
        data: txAmount,
        chainId: networkId,
        "token_name": name,
        "token_symbol": symbol,
        "status": "SUCCESS"
    };




    console.log(txData);
    // console.log(receipt.transactionHash);

}


// const deductUserCNGN = async (_userAddress, _address, _privateKey, _amount) => {

//     const web3 = new Web3(webb3);
//     const networkId = await web3.eth.net.getId();
//     let contract = new web3.eth.Contract(abiJSON, tokenContractAddress, { from: _address });
//     web3.eth.accounts.wallet.add(_privateKey);

//     // Get Name
//     let name = await contract.methods.name().call();
//     // Get Symbol
//     let symbol = await contract.methods.symbol().call();



//     const txAmount = contract.methods.transfer(_address, _amount).encodeABI();
//     const amount = web3.utils.toWei(_amount.toString(), 'ether');


//     // const gas = await txAmount.estimateGas({from: address});
//     const gasPrice = await web3.eth.getGasPrice();
//     const nonce = web3.eth.getTransactionCount(_userAddress);

//     const sendTrx = await contract.methods.transfer(_address, _amount).send({
//         from: _userAddress,
//         gas: 150000
//     });

//     const txData = {
//         from: _userAddress,
//         nonce,
//         gasPrice,
//         gasLimit: 21600,
//         fee: gasPrice * 21000,
//         to: _address,
//         tx_hash: sendTrx.transactionHash,
//         value: 0,
//         amount,
//         data: txAmount,
//         chainId: networkId,
//         "token_name": name,
//         "token_symbol": symbol,
//         "status": "SUCCESS"
//     };




//     console.log(txData);
//     // console.log(receipt.transactionHash);

// }


// const userTransferCNGN = async (_userAddress, _receiverAddress, _userPrivateKey, _amount) => {

//     const web3 = new Web3(webb3);
//     const networkId = await web3.eth.net.getId();
//     let contract = new web3.eth.Contract(abiJSON, tokenContractAddress, { from: _userAddress });
//     web3.eth.accounts.wallet.add(_userPrivateKey);

//     // Get Name
//     let name = await contract.methods.name().call();
//     // Get Symbol
//     let symbol = await contract.methods.symbol().call();



//     const txAmount = contract.methods.transfer(_receiverAddress, _amount).encodeABI();
//     const amount = web3.utils.toWei(_amount.toString(), 'ether');


//     // const gas = await txAmount.estimateGas({from: address});
//     const gasPrice = await web3.eth.getGasPrice();
//     const nonce = web3.eth.getTransactionCount(_userAddress);

//     const sendTrx = await contract.methods.transfer(_receiverAddress, _amount).send({
//         from: _userAddress,
//         gas: 150000
//     });

//     const txData = {
//         from: _userAddress,
//         nonce,
//         gasPrice,
//         gasLimit: 21600,
//         fee: gasPrice * 21000,
//         to: _receiverAddress,
//         tx_hash: sendTrx.transactionHash,
//         value: 0,
//         amount,
//         data: txAmount,
//         chainId: networkId,
//         "token_name": name,
//         "token_symbol": symbol,
//         "status": "SUCCESS"
//     };




//     console.log(txData);
//     // console.log(receipt.transactionHash);

// }


// // createAccountCNGNBSC();
// // getCNGNBSCBalance('0x765557244ddFe617C484731C146c2ba7Add7DEA1');
creditUserCNGN(address, toAddress, privateKey, 1000000000000000000n)
// deductUserCNGN(toAddress, address, UserPrivateKey, 200000000000000000000n)
// // userTransferCNGN(toAddress, receiverAddress, UserPrivateKey, 5000000000000000000000n);

























































// const Wallet = ethers.Wallet;
// const Utils = ethers.utils;
// const Contract = ethers.Contract;
// const Provider = ethers.providers;


// const setupBSCToken = async () => {
//     // console.green("https://speedy-nodes-nyc.moralis.io/857cf6fbe434fcbabf88601d/bsc/testnet", "BSC node");
//     const provider = new Provider.JsonRpcProvider(
//       "https://speedy-nodes-nyc.moralis.io/857cf6fbe434fcbabf88601d/bsc/testnet" // Moralis speedy BSC test node
//     );
//     const signer = new Wallet("0xfabef18b878549c12e8546873b6eeaf944f1e05d6d58ea307e0ad4ad881fa411", provider);
  
//     // The Contract object
//     const contractAddress = "0xC34761543AA8B9061EAc4fB0cB036c2348bA96a0";
//     const contract = new Contract(contractAddress, abiJSON, provider);
//     return { contract, signer, provider };
//   };


//    const transferAsset = async (amount, userSecretKey, recieverPublicKey, network) => {


//   const { contract, signer, provider } = await setupBSCToken();

//         const userSigner = new Wallet(userSecretKey, provider);

//         const contractWithSigner = contract.connect(userSigner);

//         // Each token has 9 decimal places
//         const bscCNGN = Utils.parseUnits(amount.toString(), 6);

//         // =============Remove user withdrawal fee and send back to admin address===========

//         // const result = await deductUserAssetBalance(
//         //   fee,
//         //   userSecretKey,
//         //   network
//         // );
//         // console.log(result, "Result after deducting user fee");
//         // if (!result) {
//         //   return false;
//         // }

//         // ===========================ADMIN FEE TRANSFER========================

//         // Transfer amount from user address to address
//         const tx = await contractWithSigner.transfer(
//           recieverPublicKey,
//           bscCNGN,
//           { gasPrice: Utils.parseUnits("100", "gwei"), gasLimit: 1000000 }
//           // { gasPrice: 150000, gasLimit: 200000 }
//         );
//         const receipt = tx.wait();
//         console.log(tx, receipt, "BSC transaction hash");
//         // return true;
//     //   } catch (err) {
//     //     console.log(err, "Error tranfering asset to user");
//     //     return false;
//     //   }

//         }

//         transferAsset(2, privateKey, toAddress);
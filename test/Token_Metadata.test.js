const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const provider = ganache.provider({
    gasLimit: 100000
});

const web3 = new Web3(provider);

const compiledToken = require('../ethereum/build/TokenERC721Metadata.json');
const compiledValidReceiver = require('../ethereum/build/ValidReceiver.json');
const compiledInvalidReceiver = require('../ethereum/build/InvalidReceiver.json');


let accounts;
let token;
const initialTokens = 10;

const _name = "SomeTokenName";
const _symbol = "STN";
const _uriBase = "someTokenName.uri/";

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    token = await new web3.eth.Contract(JSON.parse(compiledToken.interface))
        .deploy({
            data: compiledToken.bytecode,
            arguments: [initialTokens,_name,_symbol,_uriBase]
        })
         .send({from: accounts[0], gas:'80000'});
    token.setProvider(provider);
});




describe('Token Metadata Contract',() => {
    it('Correct token name is reported', async () => {
        const name_reported = await token.methods.name().call();

        assert(_name == name_reported);
    });
    it('Correct token symbol is reported', async () => {
        const symbol_reported = await token.methods.symbol().call();

        assert(_symbol == symbol_reported);
    });
    it('Correct tokenURI is reported',async() => {
        var tokenId = '1';
        const tokenURI_reported = await token.methods.tokenURI(tokenId).call();
        const tokenURI_expected = _uriBase+tokenId;
        assert(tokenURI_expected == tokenURI_reported);
    });



    it('deploys token contract',  async () => {
        assert.ok(token.options.address);
    });

    it('Balance of creator = initial token supply', async () => {
        const balance = await token.methods.balanceOf(accounts[0]).call();
        assert(balance == initialTokens);
    });

    it('Creator can issue tokens', async () => {
        const toIssue = 2;
        const owner = accounts[0];
        await token.methods.issueTokens(toIssue).send({
            from: owner,
            gas: '80000'
        });
        const finalBalance = await token.methods.balanceOf(owner).call();
        assert(String(initialTokens + toIssue) == finalBalance);
    });
    it('Can burn token', async () => {
        const owner = accounts[0];
        await token.methods.burnToken('1').send({
            from: owner,
            gas: '80000'
        });
        const finalBalance = await token.methods.balanceOf(accounts[0]).call();
        assert((initialTokens - 1) == finalBalance);
    });


    it('Can transferFrom your own coin', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const receiver = accounts[1];

        try{
            await token.methods.transferFrom(owner, receiver, tokenId).send({
                from: owner,
                gas: '80000'
            });
            assert(true);
        }catch(err){
            assert(false);
        }
    });
    it('Can safeTransferFrom your own coin to person', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const receiver = accounts[1];
        let gotReceiver;
        try{
            await token.methods.safeTransferFrom(owner, receiver, tokenId).send({
                from: owner,
                gas: '80000'
            });
            assert(true);
        }catch(err){
            assert(false);
        }
        gotReceiver = await token.methods.ownerOf(tokenId).call();
        assert(gotReceiver == receiver);

    });
    it('Can safeTransferFrom your own coin to valid contract', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        let gotReceiver;



        const receiver = await new web3.eth.Contract(JSON.parse(compiledValidReceiver.interface))
            .deploy({
                data: compiledValidReceiver.bytecode
            }).send({from: accounts[0], gas:'10000'});

        receiver.setProvider(provider);
        const receiverAddress = receiver.options.address;

        try{
            await token.methods.safeTransferFrom(owner, receiverAddress, tokenId).send({
                from: owner,
                gas: '80000'
            });
            assert(true);
        }catch(err){
            assert(false);
        }
        gotReceiver = await token.methods.ownerOf(tokenId).call();
        assert(gotReceiver == receiverAddress);

    });
    it('Can\'t safeTransferFrom your own coin to invalid contract', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const receiver = await new web3.eth.Contract(JSON.parse(compiledInvalidReceiver.interface))
            .deploy({
                data: compiledInvalidReceiver.bytecode
            })
            .send({from: accounts[0], gas:'100000'});
        receiver.setProvider(provider);
        const receiverAddress = receiver.options.address;

        let success = false;
        try{
            await token.methods.safeTransferFrom(owner, receiverAddress, tokenId).send({
                from: owner,
                gas: '80000'
            });
            success = true;
        }catch(err){
        }
        assert(!success);
    });
    it('Can safeTransferFrom coin with data', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const receiver = accounts[1];
        let gotReceiver;

        const bytes = web3.utils.asciiToHex("TEST");

        try{
            await token.methods.safeTransferFrom(owner, receiver, tokenId, bytes).send({
                from: owner,
                gas: '800000'
            });
            assert(true);
        }catch(err){
            assert(false);
        }
        gotReceiver = await token.methods.ownerOf(tokenId).call();
        assert(gotReceiver == receiver);
    });

    it('Can approve someone for your own token', async () => {
        const tokenId = 1;
        try{
            await token.methods.approve(accounts[1],tokenId).send({
                from: accounts[0]
            });
            assert(true);
        }catch(err){
            assert(false);
        }
    });
    it('Can\'t approve someone for not your token', async () => {
        const tokenId = 1;
        let success = false;
        try{
            await token.methods.approve(accounts[2],tokenId).send({
                from: accounts[1]
            });
            success = true;
        }catch(err){
        }
        assert(!success);
    });
    it('Person gets approved', async () => {
        const tokenId = 1;
        let approved;
        await token.methods.approve(accounts[1],tokenId).send({
            from: accounts[0]
        });
        approved = await token.methods.getApproved(tokenId).call();
        assert(approved == accounts[1]);
    });
    it('New approved overwrites old one', async () => {
        const tokenId = 1;
        let approved0, approved1;
        await token.methods.approve(accounts[1],tokenId).send({
            from: accounts[0]
        });
        approved0 = await token.methods.getApproved(tokenId).call();
        await token.methods.approve(accounts[2],tokenId).send({
            from: accounts[0]
        });
        approved1 = await token.methods.getApproved(tokenId).call();

        assert(approved1 == accounts[2]);
    });
    it('Can un-approve (set to 0x0)', async () => {
        const tokenId = 1;
        let approved0, approved1;
        await token.methods.approve(accounts[1],tokenId).send({
            from: accounts[0]
        });
        approved0 = await token.methods.getApproved(tokenId).call();
        await token.methods.approve(0x0,tokenId).send({
            from: accounts[0]
        });
        approved1 = await token.methods.getApproved(tokenId).call();

        assert(approved1 == 0x0);
    });
    it('Approved can transfer coin', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const approved = accounts[1];
        const receiver = accounts[2];

        await token.methods.approve(approved,tokenId).send({
            from: owner,
            gas: '80000'
        });
        try{
            await token.methods.transferFrom(owner,receiver,tokenId).send({
                from: approved,
                gas: '100000'
            });
            assert(true);
        }catch(err){
            assert(false);
        }
    });
    it('After sending, no longer approved', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const approved = accounts[1];
        const receiver = accounts[2];

        let gotApproved;

        await token.methods.approve(approved,tokenId).send({
            from: owner,
            gas: '100000'
        });
        await token.methods.transferFrom(owner,receiver,tokenId).send({
            from: approved,
            gas: '100000'
        });
        gotApproved = await token.methods.getApproved(tokenId).call();
        assert(approved != gotApproved);
    });

    it('Can make someone operator', async () => {
        const owner = accounts[0];
        const operator = accounts[1];
        let isOperator;
        await token.methods.setApprovalForAll(operator,true).send({
            from: owner
        });
        isOperator = await token.methods.isApprovedForAll(owner, operator).call();

        assert(isOperator);
    });
    it('can unmake someone operator', async () => {
        const owner = accounts[0];
        const operator = accounts[1];
        let isOperator;
        await token.methods.setApprovalForAll(operator,true).send({
            from: owner
        });
        await token.methods.setApprovalForAll(operator,false).send({
            from: owner
        });
        isOperator = await token.methods.isApprovedForAll(owner, operator).call();
        assert(!isOperator);
    });
    it('operator can send coin', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const operator = accounts[1];
        const receiver = accounts[2];
        let gotReceiver;
        await token.methods.setApprovalForAll(operator,true).send({
            from: owner,
            gas: '80000'
        });
        try {
            await token.methods.transferFrom(owner, receiver, tokenId).send({
                from: operator,
                gas: '80000'
            });
        }catch(err){
            assert(false);
        }
        gotReceiver = await token.methods.ownerOf(tokenId).call();
        assert(receiver == gotReceiver);
    });
    it('After sending token, operator can\'t send again', async () => {
        const tokenId = 1;
        const owner = accounts[0];
        const operator = accounts[1];
        const receiver = accounts[2];
        let gotReceiver;
        await token.methods.setApprovalForAll(operator,true).send({
            from: owner,
            gas: '80000'
        });
        await token.methods.transferFrom(owner, receiver, tokenId).send({
            from: operator,
            gas: '80000'
        });
        let success = false;
        try{
            await token.methods.transferFrom(receiver, owner, tokenId).send({
                from: operator,
                gas: '80000'
            });
            success = true;
        }catch(err){
        }
        assert(!success);
    });
});
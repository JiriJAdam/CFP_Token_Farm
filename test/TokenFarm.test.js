const CFPToken = artifacts.require('CFPToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n) {
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, cfpToken, tokenFarm;

    before(async () => {
        // Load Contracts
        daiToken = await DaiToken.new()
        cfpToken = await CFPToken.new()
        tokenFarm = await TokenFarm.new(cfpToken.address, daiToken.address)

        // Transfer all CFP Token to farm (1 million)
        await cfpToken.transfer(tokenFarm.address, tokens('1000000'))

        // Send Tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })

    // Writing Tests
    describe('Mock DAI deployment', async () => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('CFP Token deployment', async () => {
        it('has a name', async () => {
            const name = await cfpToken.name()
            assert.equal(name, 'CFP Token')
        })
    })

    describe('Token Farm deployment', async () => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'CFP Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await cfpToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming tokens', async () => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct before staking')

            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), { from: investor })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status correct after staking')

            await tokenFarm.issueToken({ from: owner })

            result = await cfpToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor CFP Token wallet balance correct after issuance')

            await tokenFarm.issueToken({ from: investor }).should.be.rejected;

            await tokenFarm.unstakeToken({ from: investor })

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking')
        })
    })
})
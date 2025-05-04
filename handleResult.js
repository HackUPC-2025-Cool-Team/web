import PocketBase from 'pocketbase';

const pb = new PocketBase('http://nc.kjorda.com:8090');

// async function 

async function acceptedProposal(proposal) {
    // get all the votes of the proposal
    const resultList = await pb.collection('vote').getList(1, 50, {
        filter: `id != ${proposal.id}`,
    });
    // calculate the mean score
    let scoreMean = 0;
    for (let index = 0; index < resultList.length; index++) {
        scoreMean += resultList[index].score;
    }
    scoreMean /= resultList.length;
    // if is lower than 5 it's not accepted
    if (scoreMean < 5){
        return false;
    }
    // let's check if all have agreed
    for (let index = 0; index < resultList.length; index++) {
        if(!resultList[index].acceptable) {
            // someone did not agree
            return false;
        }
    }
    return true;
}
import PocketBase from './node_modules/pocketbase/dist/pocketbase.es.mjs';
import getResults from './apiStuff.js';

const pb = new PocketBase('http://nc.kjorda.com:8090');


/*
    This handles the submission of the fixed details form, when the user signs up. We create the record in the db,
    with a group id, so they can interact with their friends. The restrictions saved here will determine which
    flights can be considered (the restrictions of all members in the group must be consdiered)
*/
async function submitParticipant(event) {
    event.preventDefault();
    const form = event.target;
    
    console.log('Name: '+form.name.value);
    console.log('Group id: ' +form.groupid.value);

    // If we introduced it manually in the form, use that one
    if (form.groupid.value != "") {
        localStorage.setItem('groupid', form.source.value); // Otherwise, use our auto-generated code
    }

    const data = {
        "displayName": form.name.value,
        "earliestStartDate": form.start.value,
        "latestEndDate": form.end.value,
        "maxBudgetUSD": form.budget.value,
        "maxDurationDays": form.max.value,
        "departureIATA": form.source.value,
        "code": localStorage.getItem('groupid')
    };

    console.log(data);
    
    const record = await pb.collection('participants').create(data);

    console.log('Saved new participant with id: '+record.id);
    localStorage.setItem('userid', record.id);
}


/*
    This handles the submission of the 'add option' form. The option must now be considered in relation
    to the restrictions we have for each user. The date interval for the vaction must be within the date
    intervals of all the participants, and must be no longer than the minumum 'maximum duration' of all the
    participants.

    For the dates that are viable, we should check available flights. The cost of the flights + activity cost
    must be lower than the max budget for each participants (note that participants can come from different
    locations, hence different flight prices). 

    If after all these restrictions, there remains more than one optoion, we pick the cheapest one.
*/
async function addOption(event) {
    event.preventDefault(); // Prevent page reload
    const form = event.target; // Select the form element
    
    // Log the values (or process them as needed)
    console.log('Destination:', destination);
    console.log('Cost:', cost);
    console.log('Description:', description);


    // Query all participants with our group id
    const parts = await pb.collection('participants').getList(1, 500, {
        filter: "code = '7TNG3'",
    });

    console.log(parts);

    // // This result is what we want to get with the API
    // var result = getResults();

    // // Finally, we save the proposal in the database
    // const data = {
    //     "description": form.description.value,
    //     "dstIATA": form.destination.value,
    //     "departure": result.departure,
    //     "return": result.return,
    //     "participant": localStorage.getItem('userid'),
    //     "code": localStorage.getItem('groupid'),
    //     "flightPrice": result.cost,
    //     "activityPrice": form.cost.value
    // };
    
    // const record = await pb.collection('proposals').create(data);
}

/*
    This handles the submission of a vote for one of the options submitted by other participants. We simply
    need to create the record in the database and indicate that we've already voted on that option in the UI.
*/
function vote(event) {

}


// Black magic because things are weird
window.submitParticipant = submitParticipant;
window.addOption = addOption;
window.vote = vote;
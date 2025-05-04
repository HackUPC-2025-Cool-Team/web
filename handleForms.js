import PocketBase from './node_modules/pocketbase/dist/pocketbase.es.mjs';
import { getResults, getFlightPrice } from './apiStuff.js';

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
        localStorage.setItem('groupid', form.groupid.value); // Otherwise, use our auto-generated code
    }

    const data = {
        "displayName": form.name.value,
        "startDate": form.start.value,
        "endDate": form.end.value,
        "maxBudgetUSD": form.budget.value,
        "maxDurationDays": form.max.value,
        "departureIATA": form.source.value,
        "code": localStorage.getItem('groupid')
    };

    console.log(data);
    
    const record = await pb.collection('participants').create(data);

    console.log('Saved new participant with id: '+record.id);
    localStorage.setItem('userid', record.id);
    window.location.href = "/vote.html";
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
    console.log('Destination:', form.destination.value);
    console.log('Cost:', form.cost.value);
    console.log('Description:', form.description.value);
    console.log('Start date:', form.start.value);
    console.log('End date:', form.end.value);

    // Query all participants with our group id
    const parts = await pb.collection('participants').getList(1, 500, {
        filter: `code = '${localStorage.getItem('groupid')}'`,
    });

    var us;
    for (let part of parts.items) {
        if (part.id == localStorage.getItem('userid')) {
            us = part;
        }
    }
    
    //const price = await getFlightPrice(new Date(form.start.value), new Date(form.end.value), us.departureIATA, form.destination.value);

    const adequate = getResults(form.cost.value, form.destination.value, new Date(form.start.value), new Date(form.end.value), parts.items);

    if (adequate) { // Option was adequate for consideration (voting)

        // Finally, we save the proposal in the database
        const data = {
            "description": form.description.value,
            "dstIATA": form.destination.value,
            "departure": new Date(form.start.value),
            "return": new Date(form.end.value),
            "participant": localStorage.getItem('userid'),
            "code": localStorage.getItem('groupid'),
            "activityPrice": form.cost.value
        };
        
        const record = await pb.collection('proposals').create(data);
    }
    else {
        console.log('SIUUUUUUUUUUUUUUUU');
    }
}

/*
    This handles the submission of a vote for one of the options submitted by other participants. We simply
    need to create the record in the database and indicate that we've already voted on that option in the UI.
*/
async function vote(event, userid, username, proposalid) {
    event.preventDefault();
    const form = event.target;
    
    // Get the value of the checked radio button in the group
    const radioGroup = form.elements[`${username}acc`];
    let accString = "true"; // Default value
    
    // Find which radio button is checked
    for(let i = 0; i < radioGroup.length; i++) {
        if(radioGroup[i].checked) {
            accString = radioGroup[i].value;
            break;
        }
    }
    
    // Convert string to boolean
    const acc = accString === "true";
    const rat = form.elements[`${username}rat`].value;

    document.getElementById(`${username}btn`).disabled = true;
    
    console.log(`Acceptable value for ${username}'s proposal: ${acc}`);
    console.log(`Score for ${username}'s proposal: ${rat}`);


    const data = {
        "participant": userid,
        "proposal": proposalid,
        "rating": rat,
        "acceptable": acc
    };
    
    const record = await pb.collection('vote').create(data);
}


function formatDate(dateString) {
    const date = new Date(dateString);
    
    // Create a formatter with the desired format
    const formatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    return formatter.format(date);
  }


//localStorage.setItem('groupid', 'UA85W'); // DEBUG!!! TODO: Remove



// TODO: GET PRICE FROM API
export async function renderAllProposals() {
    document.getElementById('proposals').innerHTML = `
    <div class="col-6 col-lg-3">
        <div class="p-3 border bg-success rounded">
            <h4 class="text-white mb-3">Add a new option</h4>
            <form onsubmit="addOption(event)">
                <div class="mb-2">
                    <input name="destination" class="form-control" type="text" placeholder="Destination IATA code"
                        aria-label="Destination">
                </div>
                <div class="mb-2">
                    <input name="cost" class="form-control" type="number" placeholder="Activity cost in USD"
                        aria-label="Activity cost in USD">
                </div>

                
                <input class="form-control mb-2" type="date" name="start">

                <input class="form-control mb-2" type="date" name="end">

                <div class="mb-3">
                    <textarea name="description" class="form-control" rows="4" placeholder="Activity description"
                        aria-label="Activity description"></textarea>
                </div>
                <button class="btn btn-light w-100 py-2">Add</button>
            </form>
        </div>
    </div>
    `;

    var proposals = await pb.collection('proposals').getList(1, 500, {
        filter: `code = '${localStorage.getItem('groupid')}'`,
    });
    proposals = proposals.items;
    
    console.log(proposals);
    
    for (let proposal of proposals) {
        console.log(proposal);
        renderProposal(proposal);
    }
}

export function updateRating(num, user) {
    document.getElementById(user+'punt').innerHTML = num.toLocaleString('es-ES');
}

/*
    Add proposal object to UI
*/
async function renderProposal(proposal) {
    var username = await pb.collection('participants').getFirstListItem(`id="${proposal.participant}"`, );    
    var userid = username.id;
    username = username.displayName;

    document.getElementById('proposals').innerHTML += `
    <div class="col-6 col-lg-3">
        <div class="p-3 border rounded">
            <h4 class="text-white mb-3">${username}</h4>

            <h6 class="text-white mb-3">Destination: ${proposal.dstIATA}</h6>
            <h6 class="text-white mb-3">Departure: ${formatDate(proposal.departure)}</h6>
            <h6 class="text-white mb-3">Return: ${formatDate(proposal.return)}</h6>
            <h6 class="text-white mb-3">Activity cost: ${proposal.activityPrice}</h6>
            <h6 class="text-white mb-3">Flight cost for you: ${proposal.flightPrice}</h6>
            <h5 class="text-white">Activity description</h4>
            <p class="text-white">${proposal.description}</p>

            <form onsubmit="vote(event, '${userid}', '${username}', '${proposal.id}')">

                <input id="slider" type="range" name="${username}rat" class="form-range w-75" min="0" max="10"
            step="0.1" value="5" oninput="updateRating(parseFloat(this.value), '${username}')">

                <span class="text-white align-top ms-3" id="${username}punt">4.7</span>
                <div class="d-flex justify-content-around mt-2">
                    <div class="btn-group" role="group" >
                        <input type="radio" class="btn-check" name="${username}acc" id="${username}1" value="true" autocomplete="off" checked>
                        <label class="btn btn-outline-primary" for="${username}1">Yes</label>
                        
                        <input type="radio" class="btn-check" name="${username}acc" id="${username}2" value="false" autocomplete="off">
                        <label class="btn btn-outline-primary" for="${username}2">No</label>
                        </div>
                    <button class="btn btn-light w-25 py-2" id="${username}btn">Vote</button>
                </div>
            </form>
        </div>
    </div>`
}


/*
    Adds new proposal to the UI when it is added to the database
*/
pb.collection('proposals').subscribe('*', function(e) {
    // The event contains information about what changed
    console.log('gggggggg');
    
    // Only process records that match our filter
    if (e.record.code === localStorage.getItem('groupid') && e.action === 'create') {
        console.log(e.record);
        renderProposal(e.record);

    }
});


// Black magic because things are weird
window.submitParticipant = submitParticipant;
window.addOption = addOption;
window.vote = vote;
window.updateRating = updateRating;
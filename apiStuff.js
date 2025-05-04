
export function getResults(activityCost, destination, startDate, endDate, participants) {
    console.log(participants);
    var results;

    // look for the dates to search
    for (let index = 0; index < participants.length; index++) {
        if (startDate < participants[index].startDate) {
            return false;
        }

        if (endDate > participants[index].endDate) {
            return false;
        }
    }

    for (let index = 0; participants < participants.length; index++) {

        var flightCost = getFlightPrice(startDate, endDate, participants[index].departureIATA, destination);

        if (activityCost + flightCost > participants[index].maxBudgetUSD) {
            return false; 
        }
    }

    return true;
}

export async function getFlightPrice(startDate, endDate, srcIata, dstIata) {
    // Extract date components from the Date objects
    const startDay = startDate.getDate();
    const startMonth = startDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const startYear = startDate.getFullYear();
    
    const endDay = endDate.getDate();
    const endMonth = endDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const endYear = endDate.getFullYear();
    
    // Call getFlightInfo with the extracted date components
    const flightInfo = await getFlightInfo(
      dstIata,
      srcIata,
      startDay,
      startMonth,
      startYear,
      endDay,
      endMonth,
      endYear
    );
    
    // Return just the minPrice from the flight info
    return flightInfo.minPrice;
}

async function getFlightInfo(
    destination, 
    currLocation, 
    travelDayStart,
    travelMonthStart, 
    travelYearStart,
    travelDayEnd,
    travelMonthEnd, 
    travelYearEnd
  ) {
    try {
      // Define the API endpoint (your backend server)
      const apiUrl = 'http://nc.kjorda.com:3000/api/flights/search';
      
      // Create request body
      const requestBody = {
        destination,
        currLocation,
        travelDayStart,
        travelMonthStart,
        travelYearStart,
        travelDayEnd,
        travelMonthEnd,
        travelYearEnd,
        market: 'ES',
        currency: 'EUR',
      };
      
      // Show loading state if needed
      console.log('Fetching flight information...');
      
      // Make the API call to your backend
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      // Process the data similar to your original function
      console.log("API Response:", data);
      
      // Check if we have quotes in the response
      if (data.content && 
          data.content.results && 
          data.content.results.quotes && 
          Object.keys(data.content.results.quotes).length > 0) {
        
        // Extract the first quote
        const quoteId = Object.keys(data.content.results.quotes)[0];
        const quote = data.content.results.quotes[quoteId];
        
        // Extract relevant information
        const minPrice = quote.minPrice.amount;
        
        // Information about outbound leg
        const outboundCarrierId = quote.outboundLeg.marketingCarrierId;
        const outboundCarrierName = data.content.results.carriers[outboundCarrierId].name;
        
        // Information about inbound leg if it exists
        let inboundCarrierName = null;
        if (quote.inboundLeg) {
          const inboundCarrierId = quote.inboundLeg.marketingCarrierId;
          inboundCarrierName = data.content.results.carriers[inboundCarrierId].name;
        }
        
        // Format information for display
        const outboundDate = `${travelYearStart}-${String(travelMonthStart).padStart(2, '0')}-${String(travelDayStart).padStart(2, '0')}`;
        const inboundDate = `${travelYearEnd}-${String(travelMonthEnd).padStart(2, '0')}-${String(travelDayEnd).padStart(2, '0')}`;
        
        // Log extracted information
        console.log("Minimum Price:", minPrice);
        console.log("Outbound Carrier:", outboundCarrierName);
        console.log("Outbound Date:", outboundDate);
        
        if (inboundCarrierName) {
          console.log("Inbound Carrier:", inboundCarrierName);
          console.log("Inbound Date:", inboundDate);
        }
        
        // Return formatted data
        return {
          minPrice,
          outboundCarrierName,
          outboundDate,
          inboundCarrierName,
          inboundDate,
          fullData: data // Include full data for additional processing if needed
        };
      } else {
        console.warn("No quotes found in the response");
        return {
          message: "No flight quotes available for the specified criteria",
          fullData: data
        };
      }
    } catch (error) {
      // Handle any errors that occurred during the fetch
      console.error("Error fetching flight information:", error);
      throw error; // Re-throw to allow handling by caller
    }
  }
  
//getFlightInfo("BCN", "AMS", 8, 9, 2025, 12, 9, 2025);
//destination, currLocation, travelDayStart, travelMonthStart, travelYearStart, travelDayEnd, travelMonthEnd, travelYearEnd

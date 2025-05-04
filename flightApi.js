// server.js - Node.js Backend API Proxy with Fixed Dates
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config(); // For managing environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// API key should be in environment variables for security
// const API_KEY = process.env.SKYSCANNER_API_KEY;
const API_KEY = 'sh967490139224896692439644109194'; // Only for demo, use env vars in production

// Skyscanner API proxy endpoint
app.post('/api/flights/search', async (req, res) => {
  try {
    // Extract parameters from request body
    const { 
      destination, 
      currLocation, 
      travelDayStart,
      travelMonthStart, 
      travelYearStart,
      travelDayEnd,
      travelMonthEnd, 
      travelYearEnd,
      // Additional parameters could be extracted here
      market = 'UK',
      locale = 'en-GB',
      currency = 'EUR',
      cabinClass = 'CABIN_CLASS_ECONOMY',
      adults = 1
    } = req.body;

    // Construct request body based on Skyscanner API requirements
    const data = {
      query: {
        market,
        locale,
        currency,
        queryLegs: [
          {
            originPlace: { queryPlace: { iata: currLocation } },
            destinationPlace: { queryPlace: { iata: destination } },
            fixedDate: {
              year: travelYearStart,
              month: travelMonthStart,
              day: travelDayStart
            }
          },
          {
            originPlace: { queryPlace: { iata: destination } },
            destinationPlace: { queryPlace: { iata: currLocation } },
            fixedDate: {
              year: travelYearEnd,
              month: travelMonthEnd,
              day: travelDayEnd
            }
          }
        ],
        cabinClass,
        adults
      }
    };

    console.log('Sending request to Skyscanner API:', JSON.stringify(data, null, 2));

    // Make request to Skyscanner API
    const response = await axios({
      method: 'POST',
      url: 'https://partners.api.skyscanner.net/apiservices/v3/flights/indicative/search',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data
    });

    // Log successful response and return data to client
    console.log('Skyscanner API response received successfully');
    res.json(response.data);
  } catch (error) {
    // Handle errors and log helpful information
    console.error('Error proxying to Skyscanner API:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
      
      res.status(error.response.status).json({
        error: 'API Error',
        details: error.response.data
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      res.status(500).json({
        error: 'No response from API',
        message: 'The request was made but no response was received'
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      res.status(500).json({
        error: 'Request Setup Error',
        message: error.message
      });
    }
  }
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
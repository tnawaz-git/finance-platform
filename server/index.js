const express = require("express");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require('express');
const mongoose = require('mongoose');
const request = require('request');

const axios = require('axios');

//get API key from Alpha Vantage, example symbol Apple Inc: 'AAPL'
const getStockData = async (req,res,next) => {
  var symbol = req.body.symbol; 
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=<YOUR_API_KEY>`;
  const response = await axios.get(url);
  const stockData = response.data['Global Quote'];
  return stockData;
}

//implementation for buying stocks
const robinAccessToken = 'your_access_token';
const symbol = 'AAPL';
const shares = 10;
const price = 200;

const robinUrl = `https://api.robinhood.com/orders/`;

const options = {
  method: 'POST',
  url: robinUrl,
  headers: {
    'Authorization': `Bearer ${robinAccessToken}`
  },
  form: {
    'account': 'your_account_number',
    'instrument': `https://api.robinhood.com/instruments/${symbol}/`,
    'price': price,
    'quantity': shares,
    'side': 'buy',
    'time_in_force': 'gtc',
    'type': 'limit'
  }
};

request(options, (error, response, body) => {
  if (error) {
    return console.error('Request failed:', error);
  }
  
  console.log('Order status:', response.statusCode);
  console.log('Order response:', body);
});



const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(401).send({ message: 'Unauthorized' });
  }
};

app.get('/admin', isAdmin, (req, res) => {
  res.send({ message: 'Welcome to the admin panel' });
});

const Transaction = mongoose.model('Transaction', {
  amount: Number,
  userId: String,
  fee: Number
});

app.post('/transactions', async (req, res) => {
  const { amount, userId } = req.body;
  const fee = amount * 0.05; // 5% transaction fee
  const transaction = new Transaction({ amount: amount + fee, userId, fee });
  await transaction.save();
  res.send({ message: 'Transaction created' });
});

app.get('/transactions', async (req, res) => {
  const transactions = await Transaction.find();
  res.send(transactions);
});

mongoose.connect('mongodb://localhost:27017/transactions', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



const transferMoney = async (senderId, receiverId, amount) => {
  // Find the sender and receiver in the database
  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  // Check if the sender has enough balance
  if (sender.balance < amount) {
    throw new Error("Sender has insufficient balance.");
  }

  // Create a new transfer from the sender to the receiver
  const transfer = await stripe.transfers.create({
    amount: amount * 100, // amount in cents
    currency: "usd",
    destination: receiver.stripeAccountId,
    description: `Transfer to ${receiver.email}`,
  });

  // Update the sender's and receiver's account balance in the database
  sender.balance -= amount;
  receiver.balance += amount;
  await sender.save();
  await receiver.save();

  return transfer;
}


const addCashToStripeAccount = async (userId, amount) => {
  // Find the user in the database
  const user = await User.findById(userId);

  // Create a new charge on the user's Stripe account
  const charge = await stripe.charges.create({
    amount: amount * 100, // amount in cents
    currency: "usd",
    customer: user.stripeCustomerId,
    description: "Adding cash to account",
  });

  // Update the user's account balance in the database
  user.balance += charge.amount / 100;
  await user.save();

  return charge;
}


async function createMerchantAccount(merchantData) {
  try {
    const account = await stripe.accounts.create({
      type: "custom",
      business_type: "individual",
      email: merchantData.email,
      individual: {
        first_name: merchantData.firstName,
        last_name: merchantData.lastName,
        id_number: merchantData.idNumber,
        ssn_last_4: merchantData.ssnLast4,
        address: {
          line1: merchantData.addressLine1,
          line2: merchantData.addressLine2,
          city: merchantData.city,
          state: merchantData.state,
          postal_code: merchantData.postalCode,
          country: merchantData.country,
        },
        dob: {
          day: merchantData.dobDay,
          month: merchantData.dobMonth,
          year: merchantData.dobYear,
        },
        verification: {
          document: {
            front: merchantData.verificationDocumentFront,
            back: merchantData.verificationDocumentBack,
          },
        },
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: merchantData.ip,
      },
    });
    return account;
  } catch (error) {
    console.log(error);
    throw error;
  }
}


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use(cors())

app.post("/payment", cors(), async (req, res) => {
	let { amount, id } = req.body
	try {
		const payment = await stripe.paymentIntents.create({
			amount,
			currency: "USD",
			description: "Spatula company",
			payment_method: id,
			confirm: true
		})
		console.log("Payment", payment)
		res.json({
			message: "Payment successful",
			success: true
		})
	} catch (error) {
		console.log("Error", error)
		res.json({
			message: "Payment failed",
			success: false
		})
	}
})

app.listen(process.env.PORT || 4000, () => {
	console.log("Sever is listening on port 4000")
})

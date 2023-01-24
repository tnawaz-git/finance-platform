import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { StripeProvider, Elements, Invoice } from "react-stripe-elements";
import { useState } from "react";


ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

class PaymentApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      customer: null,
      invoice: null,
    };
  }

 TransferMoney = ({ userId }) => {
  const [receiverEmail, setReceiverEmail] = useState("");
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);}

  handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      // Find the receiver in the database
      const receiver = await User.findOne({ email: receiverEmail });
      if (!receiver) {
        throw new Error("Receiver email not found.");
      }
      const transfer = await transferMoney(userId, receiver._id, amount);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  AddCash = ({ userId }) => {
    const [amount, setAmount] = useState(0);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);
      try {
        const charge = await addCashToStripeAccount(userId, amount);
        setSuccess(true);
      } catch (err) {
        setError(err.message);
      }
    };
  
    return (
      <form onSubmit={handleSubmit}>
        <label>
          Amount:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <button type="submit">Add Cash</button>
        {error && <p>{error}</p>}
        {success && <p>Cash added successfully!</p>}
      </form>
    );
  };

  // Create a new customer with Stripe
  createCustomer = async (token) => {
    const response = await fetch("/create-customer", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    const customer = await response.json();
    this.setState({ customer });
  };

  // Create an invoice with Stripe
  createInvoice = async (amount) => {
    const { customer } = this.state;
    const response = await fetch("/create-invoice", {
      method: "POST",
      body: JSON.stringify({ customer, amount }),
    });
    const invoice = await response.json();
    this.setState({ invoice });
  };

  // Send the invoice to the customer
  sendInvoice = async () => {
    const { invoice } = this.state;
    await fetch("/send-invoice", {
      method: "POST",
      body: JSON.stringify({ invoice }),
    });
  };

  render() {
    return (
      <StripeProvider apiKey={process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}>
        <Elements>
          <div className="checkout-form">
            <CardForm
              createCustomer={this.createCustomer}
              createInvoice={this.createInvoice}
            />
            {this.state.invoice && (
              <button onClick={this.sendInvoice}>Send Invoice</button>
            )}
          </div>
        </Elements>
      </StripeProvider>
    );
  }
}



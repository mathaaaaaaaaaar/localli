import express from 'express';

const app = express();

// Home route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Authentication routes
app.post('/auth/register', (req, res) => {
    res.send('Register a new user');
});
  
app.post('/auth/login', (req, res) => {
    res.send('Log in a user');
});
  
// Business routes
app.get('/businesses', (req, res) => {
    res.send('Fetch all businesses');
});
  
app.post('/businesses', (req, res) => {
    res.send('Create a new business');
});
  
app.get('/businesses/:id', (req, res) => {
    res.send(`Fetch details of business with ID: ${req.params.id}`);
});
  
// Service routes
app.get('/services', (req, res) => {
    res.send('Fetch all services');
});
  
app.post('/services', (req, res) => {
    res.send('Add a new service');
});
  
// Booking routes
app.get('/bookings', (req, res) => {
    res.send('Fetch all bookings');
});
  
app.post('/bookings', (req, res) => {
    res.send('Create a new booking');
});
  
app.get('/bookings/:id', (req, res) => {
    res.send(`Fetch details of booking with ID: ${req.params.id}`);
});
  
// Availability routes
app.get('/availabilities/:businessId', (req, res) => {
    res.send(`Fetch availability slots for business ID: ${req.params.businessId}`);
});
  
app.post('/availabilities', (req, res) => {
    res.send('Add availability slots for a business');
});  

app.listen(3001, () => {
    console.log('Server is running on port 3001 - looks good!');
});
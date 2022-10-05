const express = require('express')
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express()
// const stripe = require("stripe")(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

// middleware 
app.use(cors());
app.use(express.json()); 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lx750.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
    try {
      await client.connect();
      const database = client.db("partsix");
       const partscollection = database.collection("parts");
    //    const specialcollection = database.collection("special");
        const bookingcollection = database.collection("booking");

         const userCollection = database.collection("user");
         const paymentCollection = database.collection("payments");
    //      const reviewCollection = database.collection("reviews");
   
      // GET API FOR SHOWING ALL clocks
app.get('/parts', async(req, res) => {
    const cursor = partscollection.find({});
    const parts = await cursor.toArray();
    res.send(parts);
})
app.get('/user', verifyJWT, async (req, res) => {
  const users = await userCollection.find().toArray();
  res.send(users);
});
  


// GET API FOR my BOOKED ROOMS & all booked rooms
app.get('/booking', verifyJWT, async(req, res) => {
  let query = {};
  const email = req.query.email;
  const authorization = req.headers.authorization;
  console.log('auth header',authorization);
if(email){
  query = {email: email};
}
    const cursor = bookingcollection.find(query);
    const room = await cursor.toArray();
    res.send(room);
})


app.get('/booking/:id',  async(req,res)=>{
  const id = req.params.id;
  const query= {_id:ObjectId(id)};
  const booking = await bookingcollection.findOne(query);
  res.send(booking);
})

app.delete('/booking/:id', async(req,res) => {
  const id = req.params.id;
  const query = {_id:ObjectId(id)};
  const result = await bookingcollection.deleteOne(query);
  res.send(result);
  })

  

  app.patch('/booking/:id', async(req,res)=>{
    const id = req.params.id;
    const payment = req.body;
    const filter = {_id:ObjectId(id)};
    const updatedDoc = {
        $set:{
          paid:true,
          transactionId:payment.transactionId
        }
    }
    const result = await paymentCollection.insertOne(payment);
    const updatedbooking = await bookingcollection.updateOne(filter,updatedDoc);
    res.send(updatedDoc);
})
  app.put('/booking/:id', async(req,res)=>{
    const id = req.params.id;
    const updated = req.body;
    const filter = {_id:ObjectId(id)};
    const options = {upsert:true};
    const updatedDoc = {
        $set:updated
    }
    const result = await bookingcollection.updateOne(filter,updatedDoc,options);
    res.send(result);
})


app.post('/create-payment-intent', verifyJWT, async(req,res)=>{
  const service = req.body;
  const price = service.price;
  const amount = price * 100;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types:["card"]
    
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
})

// GET API FOR SHOWING INDIVIDUAL ROOM DETAILS 
app.get('/parts/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id:ObjectId(id)};
  const hotel = await partscollection.findOne(query);
  res.json(hotel);

})




// //   POST API TO ADD clock 
app.post('/parts', async(req, res) => {
    const newtool = req.body; 
    const result = await partscollection.insertOne(newtool);
    console.log('hitting the post',req.body);
    console.log('added hotel', result)
    res.json(result);
          
  })



  // POST API TO ADD BOOKING OF ANY ROOM 
app.post('/booking', async(req, res) => {
  const newroom = req.body; 
  const result = await bookingcollection.insertOne(newroom);
  console.log('hitting the post',req.body);      
  res.json(result);
        
}) 

app.put('/user/:email',  async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const filter = { email: email };
  const options = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await userCollection.updateOne(filter, updateDoc, options);
 const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '30d' })
  res.send({ result,token });
})

//        // post api for posting reviews 
// app.post('/reviews', async(req,res)=>{
//   const review = req.body;
//   console.log('hit the post api',review);

//   const result = await reviewCollection.insertOne(review);
//    res.json(result)

// }); 
      

app.get('/admin/:email', verifyJWT, async(req, res) =>{
  const email = req.params.email;
  const user = await userCollection.findOne({email: email});
  const isAdmin = user.role === 'admin';
  res.send({admin: isAdmin})
})


// // make an user admin 
app.put('/user/admin/:email', verifyJWT, async (req, res) => {
  const email = req.params.email;
  const requester = req.decoded.email;
  const requesterAccount = await userCollection.findOne({ email: requester });
  if (requesterAccount.role === 'admin') {
    const filter = { email: email };
    const updateDoc = {
      $set: { role: 'admin' },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  }
  else{
    res.status(403).send({message: 'forbidden'});
  }

})

// payment gateway 
// app.post('/create-payment-intent', async (req, res) => {
//   const paymentInfo = req.body;
// const amount = paymentInfo.price*100;
//   // Create a PaymentIntent with the order amount and currency
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: amount,
//     currency: 'usd',
//     payment_method_types: ['card']
//   });

//   res.json({clientSecret: paymentIntent.client_secret});
// });

    } 
    finally {
      
    }
  }
  run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
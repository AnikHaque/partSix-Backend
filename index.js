const express = require('express')
const { MongoClient } = require('mongodb');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const app = express()
// const stripe = require("stripe")(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;
h 
// middleware 
app.use(cors());
app.use(express.json()); 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lx750.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
      await client.connect();
      const database = client.db("partsix");
       const partscollection = database.collection("parts");
    //    const specialcollection = database.collection("special");
        const bookingcollection = database.collection("booking");

         const userCollection = database.collection("user");
    //      const reviewCollection = database.collection("reviews");
   
      // GET API FOR SHOWING ALL clocks
app.get('/parts', async(req, res) => {
    const cursor = partscollection.find({});
    const parts = await cursor.toArray();
    res.send(parts);
})
app.get('/user',  async (req, res) => {
  const users = await userCollection.find().toArray();
  res.send(users);
});
            // GET API FOR SHOWING ALL reservation
      // GET API FOR SHOWING ALL specials
// app.get('/special', async(req, res) => {
//     const cursor = specialcollection.find({});
//     const hotels = await cursor.toArray();
//     res.send(hotels);
// })
            // GET API FOR SHOWING ALL reservation
// app.get('/reserve', async(req, res) => {
//   const cursor = reservecollection.find({});
//   const hotels = await cursor.toArray();
//   res.send(hotels);
// })

// GET API FOR my BOOKED ROOMS & all booked rooms
app.get('/booking', async(req, res) => {
  let query = {};
  const email = req.query.email;
if(email){
  query = {email: email};
}
    const cursor = bookingcollection.find(query);
    const room = await cursor.toArray();
    res.send(room);
})



// GET API FOR SHOWING INDIVIDUAL ROOM DETAILS 
app.get('/parts/:id', async(req,res)=>{
  const id = req.params.id;
  const query = {_id:ObjectId(id)};
  const hotel = await partscollection.findOne(query);
  res.json(hotel);

})

// app.get('/cars/:id', async(req,res)=>{
//   const id = req.params.id;
//   const payment = req.body;
//   const filter = {_id:ObjectId(id)};
//   const updateDoc = {
//     $set:{
//       payment:payment
//     }
//   };

//   const result = await carscollection.findOne(updateDoc);
//   res.json(result);

// })
// // get api for all reviews 
// app.get('/reviews', async(req,res)=>{
//   const cursor = reviewCollection.find({});
//   const reviews = await cursor.toArray();
//   res.send(reviews);
// });

// post api for posting reviews 
// app.post('/reviews', async(req,res)=>{
//   const review = req.body;
//   console.log('hit the post api',review);

//   const result = await reviewCollection.insertOne(review);
//    res.json(result)

// });

// //   POST API TO ADD clock 
app.post('/parts', async(req, res) => {
    const newtool = req.body; 
    const result = await partscollection.insertOne(newtool);
    console.log('hitting the post',req.body);
    console.log('added hotel', result)
    res.json(result);
          
  })
// //   POST API TO ADD special 
// app.post('/special', async(req, res) => {
//     const newhotel = req.body; 
//     const result = await specialcollection.insertOne(newhotel);
//     console.log('hitting the post',req.body);
//     console.log('added hotel', result)
//     res.json(result);
          
//   })

// //   POST API TO ADD reservation
// app.post('/reserve', async(req, res) => {
//   const newhotel = req.body; 
//   const result = await reservecollection.insertOne(newhotel);
//   console.log('hitting the post',req.body);
//   console.log('added hotel', result)
//   res.json(result);
// })
  // POST API TO ADD BOOKING OF ANY ROOM 
app.post('/booking', async(req, res) => {
  const newroom = req.body; 
  const result = await bookingcollection.insertOne(newroom);
  console.log('hitting the post',req.body);      
  res.json(result);
        
}) 

app.put('/user/:email', async (req, res) => {
  const email = req.params.email;
  const user = req.body;
  const filter = { email: email };
  const options = { upsert: true };
  const updateDoc = {
    $set: user,
  };
  const result = await userCollection.updateOne(filter, updateDoc, options);
 
  res.send({ result });
})
//   // POST API FOR USERS 
// app.post('/users', async(req, res)=>{
//    const user = req.body;
//   const result = await userscollection.insertOne(user);
//   console.log('added user', result)
//    res.json(result);
//        })
//        // post api for posting reviews 
// app.post('/reviews', async(req,res)=>{
//   const review = req.body;
//   console.log('hit the post api',review);

//   const result = await reviewCollection.insertOne(review);
//    res.json(result)

// }); 
      
// // get users by their email address and make an user admin 
app.get('/users/:email', async(req,res)=>{
  const email = req.params.email;
  const query = {email:email};
  const user = await userCollection.findOne(query);
  let isAdmin= false;
  if(user?.role==='admin'){
isAdmin=true;
  }
  res.json({admin:isAdmin});
})

       // UPSERT USER 
// app.put('/users', async (req, res)=>{
//    const user = req.body;
//   const filter = {email: user.email};
//    const options = {upsert: true };
//    const updatedoc = {$set: user};
//    const result = await userscollection.updateOne(filter,updatedoc,options);
//    res.json(result);
//  })

// // make an user admin 
app.put('/users/admin', async (req, res)=>{
  const user = req.body;
  console.log('put', user);
  const filter = {email: user.email};
  const updateDoc = {$set: {role:'admin'}};
  const result = await userCollection.updateOne(filter,updateDoc);
  res.json(result);
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
const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// sTRIPE.......
const stripe=require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(cors())
app.use(express.json())
// kbIIm0smYatRo9U7
// mui_admin



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g48iulp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect()
        // console.log('database connected')
        const productsCollection=client.db('mui').collection('products')
        const usersCollection=client.db('mui').collection('users')
        const paymentCollection=client.db('mui').collection('payments')

        // Get/Read all prtoducts..
        app.get('/products',async(req,res)=>{
            const query={}
            const cursor=productsCollection.find(query)
            const products=await cursor.toArray()
            res.send(products)
        })

        // Add/Post a Product.....
        app.post('/products',async (req,res)=>{
            // console.log('SERVER ',req.body)
            const newDevice=req.body
            console.log('body',newDevice)
            const result=await productsCollection.insertOne(newDevice)
            res.send(result)
        })

        // Get/Read (single product) for payment....
        app.get('/productForPayment/:paymentId',async(req,res)=>{
            const paymentId=req.params.paymentId
            console.log(paymentId)
            const query={_id:ObjectId(paymentId)}
            const product=await productsCollection.findOne(query)
            res.send(product)

        })


        // PUT/Add/Create  (users)...
        app.put('/users/:email',async(req,res)=>{
            const email=req.params.email
            const user = req.body
            // const name = req.body.displayName
            // console.log('name',name)
            console.log('user information',user)
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result=await usersCollection.updateOne(filter,updateDoc,options);
            res.send(result)
        })

        // Get/Read (allUsers)....
        app.get('/allUsers',async(req,res)=>{
            const totalUsers=await usersCollection.find().toArray()
            res.send(totalUsers)
        })

        // payment method.....
        app.post('/create-payment-intent',async(req,res)=>{
            // const{price}=req.body

            const product=req.body
            const price=product.price
            const amount=price*100
            const paymentIntent=await stripe.paymentIntents.create({
                amount : amount,
                currency: 'usd',
                payment_method_types:['card']
            });
            res.send({clientSecret: paymentIntent.client_secret,})
        })

        // PATCH for payment (transactionID ) store to (database)..
        app.patch('/payment-transactionId/:id',async(req,res)=>{
            const id=req.params.id
            const payment=req.body;
            // const filter={_id:ObjectId(id)}
            // const options = { upsert: true };
            // const updateDoc = {
            //     $set: {
            //         transactionId:payment.transactionId
            //     }
            // };
            const result=await paymentCollection.insertOne(payment);
            res.send(result)
        })

    }
    finally{
        // await client.close()
    }

}
run().catch(console.dir)


app.get('/', (req, res) => {
    res.send('Hello From Material UI')
})

app.listen(port, () => {
    console.log(`listening to port ${port}`)
})
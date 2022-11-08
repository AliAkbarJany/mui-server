const express = require('express')
const cors = require('cors')
const app = express()

// JWT....
const jwt = require('jsonwebtoken');

require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

// sTRIPE.......
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

app.use(cors())
app.use(express.json())
// kbIIm0smYatRo9U7
// mui_admin



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g48iulp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    // console.log('abc')
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorize Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        console.log('inside decoded',decoded)
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect()
        // console.log('database connected')
        const productsCollection = client.db('mui').collection('products')
        const usersCollection = client.db('mui').collection('users')
        const paymentCollection = client.db('mui').collection('payments')

        // Get/Read all prtoducts..
        app.get('/products', async (req, res) => {
            const query = {}
            const cursor = productsCollection.find(query)
            const products = await cursor.toArray()
            res.send(products)
        })

        // Add/Post a Product.....
        app.post('/products', async (req, res) => {
            // console.log('SERVER ',req.body)
            const newDevice = req.body
            console.log('body', newDevice)
            const result = await productsCollection.insertOne(newDevice)
            res.send(result)
        })

        // Get/Read (single product) for payment....
        app.get('/productForPayment/:paymentId', async (req, res) => {
            const paymentId = req.params.paymentId
            console.log(paymentId)
            const query = { _id: ObjectId(paymentId) }
            const product = await productsCollection.findOne(query)
            res.send(product)

        })


        // PUT/Add/Create  (users)...
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            // const name = req.body.displayName
            // console.log('name',name)
            console.log('user information', user)
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            // res.send(result)

            //   JWT TOKEN generate....
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '200h' })
            res.send({ result, token })
        })


        // Create .... (ADMIN)
        app.put('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            // const options = { upsert: true };
            const updateDoc = {
                $set:{role:'admin'} ,
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            // res.send(result)

            res.send(result)
        })

        // for (useAdmin)....
        app.get('/admin/:email',async(req,res)=>{
            const email=req.params.email
            const user=await usersCollection.findOne({email:email})
            const isAdmin=user.role === 'admin'
            res.send({admin:isAdmin})
        })

        // Create .... (RESTAURANT VENDOR)
        app.put('/users/makeRestauranVendor/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const updateDoc = {
                $set:{vendor:'restaurantVendor'} ,
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        // Get/Read (allUsers)....
        app.get('/allUsers',async (req, res) => {
            // const authorization=req.headers.authorization
            // console.log('auth Header', authorization)
            const totalUsers = await usersCollection.find().toArray()
            res.send(totalUsers)
        })

        // Delete (user)
        app.delete('/deleteUsers/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

        // payment method.....
        app.post('/create-payment-intent', async (req, res) => {
            // const{price}=req.body

            const product = req.body
            const price = product.price
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret, })
        })

        // PATCH for payment (transactionID ) store to (database)..
        app.patch('/payment-transactionId/:id', async (req, res) => {
            const id = req.params.id
            const payment = req.body;
            // const filter={_id:ObjectId(id)}
            // const options = { upsert: true };
            // const updateDoc = {
            //     $set: {
            //         transactionId:payment.transactionId
            //     }
            // };
            const result = await paymentCollection.insertOne(payment);
            res.send(result)
        })

    }
    finally {
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
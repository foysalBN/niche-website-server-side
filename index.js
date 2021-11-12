const express = require('express')
const { MongoClient } = require('mongodb');
const cors = require('cors')
require('dotenv').config()
const ObjectId = require('mongodb').ObjectId


const port = process.env.PORT || 5000
const app = express()

// Middlewire
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3v5j.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect()
        console.log('DB connected')

        const database = client.db('drone-land')
        const usersCollecton = database.collection('users')
        const productsCollection = database.collection('products')
        const ordersCollection = database.collection('orders')


        // PUT API - set user info to db 
        app.put('/users', async (req, res) => {
            const user = req.body;
            console.log('user put hit: user - ', user)

            const result = await usersCollecton.updateOne({ email: user.email }, { $set: user }, { upsert: true })
            res.json(result)
        })

        // GET API - get user by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = await usersCollecton.findOne({ email })

            res.json(user)
        })

        // PUT API - set admin role by email
        app.put('/mkadmin/:email', async (req, res) => {
            const email = req.params.email
            const requester = req.body.requester

            const requesterAccount = await usersCollecton.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                const result = await usersCollecton.updateOne({ email }, { $set: { role: 'admin' } })

                res.json(result)
            }
            else (
                res.status(401).json({ message: 'you are not authorized to make admin' })
            )
        })




        // GET API - all products
        app.get('/products', async (req, res) => {
            const limit = parseInt(req?.query?.limit) || 0
            const products = await productsCollection.find({}).limit(limit).toArray()

            res.json(products)
        })

        //GET API - single product by id
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const product = await productsCollection.findOne({ _id: ObjectId(id) })

            res.json(product)
        })


        // POST API - place a single order 
        app.post('/orders', async (req, res) => {
            const order = req.body
            order.status = 'panding'
            const result = await ordersCollection.insertOne(order)
            res.json(result)

        })

        //GET API - get all orders
        app.get('/orders', async (req, res) => {
            const orders = await ordersCollection.find({}).toArray()

            res.json(orders)
        })

        // GET API - get orders by email
        app.get('/orders/:email', async (req, res) => {
            const email = req.params.email
            const orders = await ordersCollection.find({ email }).toArray()

            res.json(orders)
        })

        // DELETE API - delete order by id 
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id
            const result = await ordersCollection.deleteOne({ _id: ObjectId(id) })

            res.json(result)
        })




    }
    finally {
        // client.close();
    }
}
run().catch(console.dir)






//Default GET API
app.get('/', (req, res) => {
    res.send('Drone-land server is running')
})


app.listen(port, () => {
    console.log('Drone-land server is running on port', port)
})
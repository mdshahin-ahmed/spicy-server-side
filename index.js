const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mh2ii.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('spicy');
        const menusCollection = database.collection('menus');
        const usersCollection = database.collection('users');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');

        app.get('/menus', async (req, res) => {
            const cursor = menusCollection.find({});
            const menus = await cursor.toArray();
            res.json(menus);
        });

        // products for home page 
        app.get('/homeProducts', async (req, res) => {
            const cursor = menusCollection.find({});
            const products = await cursor.limit(6).toArray();
            res.json(products);
        });

        app.post('/menus', async (req, res) => {
            const name = req.body.name;
            const price = req.body.price;
            const description = req.body.description;
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString('base64');
            const imageBuffer = Buffer.from(encodedPic, 'base64');
            const menu = {
                name,
                price,
                description,
                image: imageBuffer
            }

            const result = await menusCollection.insertOne(menu)
            res.json(result)

        });



        app.get('/menus/:id', async (req, res) => {
            const id = req.params.id;
            // console.log('loaded user', id);
            const query = { _id: ObjectId(id) };
            const product = await menusCollection.findOne(query);
            res.send(product);
        });

        app.delete('/menus/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await menusCollection.deleteOne(query);

            // console.log('deleting', result);

            res.json(result);
        });


        //order part

        app.get('/orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const result = await cursor.toArray();
            res.json(result);
        });

        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log('hit api');            
            const result = await ordersCollection.insertOne(order);
            // console.log(result);
            res.json(result);
        });


        app.put('/orders/:id', async (req, res) => {
            // console.log('hit api'); 
            const id = req.params.id;
            const status = req.body;
            const approved = status.status;
            console.log(approved);
            const filter = {_id: ObjectId(id)};
            const updateDoc = {
                $set:{
                    status: approved
                }
            };

            const result = await ordersCollection.updateOne(filter, updateDoc)
            res.json(result)
        });

        

        app.get('/userOrders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            console.log(query);
            const cursor = ordersCollection.find(query);
            const products = await cursor.toArray();
            res.json(products);
        });

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);

            // console.log('deleting', result);

            res.json(result);
        });


        // review part 

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            // console.log('hit api', product);            
            const result = await reviewsCollection.insertOne(review);
            // console.log(result);
            res.json(result);
        });

        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        });

        // admin part

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            console.log('put', user);
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Spicy!')
});

app.listen(port, () => {
    console.log(`Listening at Port:${port}`)
});
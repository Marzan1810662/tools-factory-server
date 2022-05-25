const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();


const port = process.env.PORT || 5000;
// const corsConfig = {
//     origin: '*',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE']
// }

app.use(cors());
app.use(express.json());
// app.use(cors(corsConfig))
// app.options("*", cors(corsConfig))
// app.use(express.json())
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,authorization")
//     next()
// })


const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    console.log(token);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            console.log(err);
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded;
        next()
    });
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljpax.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const userCollection = client.db('tools-factory').collection('users');
        const toolCollection = client.db('tools-factory').collection('tools');
        const reviewCollection = client.db('tools-factory').collection('reviews');

        app.get('/tool', async (req, res) => {
            const tools = await toolCollection.find({}).sort({_id:-1}).toArray();
            res.send(tools);
        })

        //post to add tool
        app.post('/tool',verifyJWT,async(req,res) => {
            const newTool = req.body;
            const result = await toolCollection.insertOne(newTool);
            console.log(result);
            res.send(result);
        })


        //check admin role
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })

        //insert or update user
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token });
        })

        //add admin role
        app.put('/user/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const adminRequester = req.decoded.email;
            const adminQuery = { email: adminRequester };
            const adminRequesterAccount = await userCollection.findOne(adminQuery);
            if (adminRequesterAccount.role === 'admin') {
                const filter = { email: email };
                const updatedDoc = {
                    $set: { role: 'admin' },
                };
                const result = await userCollection.updateOne(filter, updatedDoc);
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access! Not Admin' })
            }
        })

        //get single user
        app.get('/user/:email',verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const user = await userCollection.findOne(query);
            console.log("user", user);
            res.send(user);
        })

        //update profile
        app.put('/user/updateProfile/:email',verifyJWT, async (req,res) => {
            const email = req.params.email;
            console.log(email);
            const userInformation = req.body;
            console.log(userInformation);
            const filter = { email: email };
            const updatedDoc = {
                $set: {
                    education: userInformation.education,
                    location: userInformation.location,
                    phone: userInformation.phone,
                    linkedIn: userInformation.linkedIn
                }
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);

        })

        //get all users
        app.get('/user', async (req, res) => {
            const users = await userCollection.find({}).toArray();
            res.send(users);
        })

        //add review
        app.post('/review',verifyJWT,async(req,res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            console.log(result);
            res.send(result);
        })

        //get all reviews
        app.get('/review', async (req, res) => {
            const reviews = await reviewCollection.find({}).sort({_id:-1}).toArray();
            res.send(reviews);
        })

    }
    finally { }
}

run().catch(console.dir);

//root api
app.get('/', (req, res) => {
    res.send('Hello from Tools factory Server')
})

app.listen(port, () => {
    console.log("Tools factory server running on port: ", port);
})

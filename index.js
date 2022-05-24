const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
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

        app.get('/tools', async (req, res) => {
            res.send("Tools factory server connected to MongoDB")
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
            const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
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
        app.get('/user/:email',async(req,res) => {
            const email = req.params.email;
            console.log(email);
            const query = {email:email};
            const user = await userCollection.findOne(query);
            console.log("user",user);
            res.send(user);
        })

        //update profile
        app.put('/user/updateProfile/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const userInformation = req.body;
            console.log(userInformation);
            const filter = { email: email };
            const updatedDoc = {
                $set: { 
                    education : userInformation.education,
                    location : userInformation.location,
                    phone: userInformation.phone,
                    linkedIn: userInformation.linkedIn
                }
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);

        })


        //get all users
        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find({}).toArray();
            res.send(users);
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

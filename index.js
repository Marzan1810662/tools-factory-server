const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljpax.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect();

        app.get('/tools', async(req,res) => {
            res.send("Tools factory server connected to MongoDB")
        })
    }
    finally{}
}

run().catch(console.dir);

//root api
app.get('/', (req, res) => {
    res.send('Hello from Tools factory Server')
})

app.listen(port, () => {
    console.log("Tools factory server running on port: ", port);
})

const express = require('express');

const app = express();

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.send('Hello from Tools factory Server')
})

app.listen(port, () => {
    console.log("Tools factory server running on port: ", port);
})

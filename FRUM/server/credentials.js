const express = require('express')
const app = express()

app.post('/api/signup', (req, res) => {
    if (req.body === undefined) {
        return res.status(400).json({ error: "Expected JSON body" });
    }
    res.send("Hello world");
})

app.listen(3000);

const express = require('express')
const app = express()
app.use(express.json());

app.post('/api/signup', (req, res) => {
    if (req.body === undefined) {
        return res.status(400).json({ error: "Expected JSON body" });
    }
    const username = req.body.username;
    const password = req.body.password;
    if (username.length === 0 || password.length === 0){
        return res.status(400).json({ error: "Fields can not be empty" });
    }
    res.send(req.body);
})

app.listen(3000);

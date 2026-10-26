const express = require('express')
const app = express()
app.use(express.json());

Users = {
	"username1": "DMAN",
	"password1": "****"
};

function isJSON(reqBody) {
	if (reqBody === undefined) { return false }
	else { return true }
}

function isUsernameEmpty(username) {
	if (username.length === 0) { return true }
	else { return false }
}

function isPasswordEmpty(password) {
	if (password.length === 0) { return true }
	else { return false }
}

app.post('/api/signup', (req, res) => {
    if (!isJSON(req.body)) {
        return res.status(400).json({ error: "Expected JSON body" });
    }
    const username = req.body.username;
    const password = req.body.password;
    if (isUsernameEmpty(username) || isPasswordEmpty(password)){
        return res.status(402).json({ error: "Fields can not be empty" });
    }
    if (username === Users["username1"]) {
	return res.status(402).json({ error: "Username is already taken" });
    }
    res.send(req.body);
})

app.listen(3000);

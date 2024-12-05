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

const { Mutex } = require('async-mutex');
const mutex = new Mutex();

// GET /key - รับข้อมูลตาม key ที่ระบุ
app.post('/make', async (req, res) => {
    const { key } = req.body;

    if (!key) {
        return res.status(400).send('Key is required');
    }

    const release = await mutex.acquire(); // ล็อกเริ่มต้น
    try {
        // ค้นหาและอัปเดตสถานะ
        const updatedCookie = await Cookie.findOneAndUpdate(
            { key, status: 0 },
            { $set: { status: 1 } },
            { new: true }
        );

        if (!updatedCookie) {
            return res.status(404).send('Key not found or already updated');
        }

        res.status(200).send(updatedCookie);
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        release(); // ปลดล็อกเมื่อสิ้นสุด
    }
});

app.get('/seto', async (req, res) => {
    try {
        // ดึงข้อมูลจาก MongoDB
        const cookies = await Cookie.find({ key: "abc123", status: 0 });

        // อัปเดตสถานะของเอกสารแต่ละรายการเป็น 0
        for (const cookie of cookies) {
            await Cookie.updateOne({ _id: cookie._id }, { $set: { status: 0 } });
        }

        console.log(cookies.length);

        // ส่งจำนวน cookie ที่พบกลับไป
        return res.send("Cookie : " + cookies.length);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/search-and-delete', async (req, res) => {
    try {
        let deletedCount = 0;

        while (true) {
            // ดึงข้อมูลมาเป็นกลุ่มเล็ก ๆ
            const batch = await Cookie.find({ key: "abc123" }).limit(100); // จำกัด 100 รายการต่อรอบ

            if (batch.length === 0) break; // หากไม่มีข้อมูลแล้ว ให้หยุด

            // ลบข้อมูลในกลุ่มที่ดึงมา
            await Cookie.deleteMany({ _id: { $in: batch.map(doc => doc._id) } });

            deletedCount += batch.length;
            console.log(`ลบข้อมูล: ${batch.length} รายการ`);
        }

        console.log(`ลบข้อมูลทั้งหมด: ${deletedCount} รายการ`);
        res.send(`ลบข้อมูลทั้งหมด: ${deletedCount} รายการ`);
    } catch (error) {
        console.error("เกิดข้อผิดพลาด:", error.message);
        res.status(500).send("เกิดข้อผิดพลาด: " + error.message);
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

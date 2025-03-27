// dbserver.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');

const app = express();

// 요청 크기 제한 증가 (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

const jobSchema = new mongoose.Schema({
    recrutPbancTtl: String,
    recrutSe: String,
    workRgnLst: String,
    acbgCondLst: String,
    hireTypeLst: String,
    ncsCdLst: String,
    pbancBgngYmd: String,
    pbancEndYmd: String,
});

const Job = mongoose.model("Job", jobSchema, "local"); // 'local' 컬렉션 사용

// 데이터를 JSON 파일로 저장하는 함수
const saveDataToFile = (data) => {
    fs.writeFileSync('jobDB.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('### Data saved to jobDB ###');
};

// 데이터를 청크(100개씩) 단위로 저장하는 함수
const saveDataInChunks = async (data, chunkSize = 100) => {
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        try {
            await Job.insertMany(chunk);
            console.log(`Saved ${chunk.length} records to MongoDB`);
        } catch (error) {
            console.error('Error saving chunk:', error);
        }
    }
    saveDataToFile(data);
};

// 데이터 저장 API (청크 단위로 저장)
app.post('/api/local', async (req, res) => {
    try {
        await saveDataInChunks(req.body);
        res.status(201).json({ message: 'Data saved successfully' });
    } catch (error) {
        console.error('Insert Error:', error.message);
        res.status(500).json({ error: 'Database insert failed' });
    }
});

// 데이터 조회 API (최신 limit 갯수 만큼의 데이터를 불러옴)
app.get('/api/local', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100; // 기본값 100
        const jobs = await Job.find().sort({ createdAt: -1 }).limit(limit);
        res.status(200).json(jobs);
    } catch (error) {
        console.error('Fetch Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;

// MongoDB 연결 후 서버 실행
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected ...");
        app.listen(PORT, () => console.log(`(Connected) Server running on port \'${PORT}\'`));
    })
    .catch(err => console.error("(Unconnected) MongoDB Connection Error:", err));

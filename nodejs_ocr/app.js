let express = require('express')
let cors = require('cors')
let unggah = require('express-fileupload')
const fs = require('fs');
const Tesseract = require('tesseract.js');

var app = express()
app.use(cors())
app.use(unggah())
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use('/img', express.static('storage'))

app.get('/', (req,res)=>{
    res.send('<h1>Node.js OCR</h1>')
})

const capturedImage = async (req, res, next) => {
    try {
        const path = './storage/ocr_image.jpeg'     // destination image path
        let imgdata = req.body.img;                 // get img as base64
        const base64Data = imgdata.replace(/^data:([A-Za-z-+/]+);base64,/, '');     // convert base64
        fs.writeFileSync(path, base64Data,  {encoding: 'base64'});                  // write img file

        Tesseract.recognize(
            'http://localhost:5000/img/ocr_image.jpeg',
            'eng',
            { logger: m => console.log(m) }
        )
        .then(({ data: { text } }) => {
            console.log(text)
            return res.send({
                image: imgdata,
                path: path,
                text: text
            });
        })

    } catch (e) {
        next(e);
    }
}
app.post('/capture', capturedImage)

app.post('/upload', (req, res)=>{
    if(req.files){
        console.log(req.files)
        var unggahFile = req.files.file
        var namaFile = unggahFile.name
        unggahFile.mv('./storage/'+namaFile, (err)=>{
            if(err){
                console.log(err)
                res.send(err)
            } else {
                // console.log(namaFile)
                // res.send(namaFile)
                Tesseract.recognize(
                    `./storage/${namaFile}`,
                    'eng',
                    { logger: m => console.log(m) }
                )
                .then(({ data: { text } }) => {
                    console.log(text)
                    return res.send({
                        image: `http://localhost:5000/img/${namaFile}`,
                        path: `http://localhost:5000/img/${namaFile}`,
                        text: text
                    });
                })
                .catch((err)=>{
                    console.log(err)
                })
            }
        })
    }
})

app.listen(5000, ()=>{
    console.log('Server aktif @port 5000!')
})
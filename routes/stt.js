var express = require('express');
var router = express.Router();
var sttController = require('../controllers/stt');
// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.post('/:clientId', upload.single('audio'), async (req, res) => {
    const { clientId } = req.params;
    const audioFile = req.file;

    if (!audioFile) {
        return res.status(400).json({ error: 'Audio file is required.' });
    }

    try {
        const result = await stt(clientId, audioFile.path);
        res.json({ transcription: result });
    } catch (err) {
        console.error('Erro no endpoint /stt:', err);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
});

module.exports = router;
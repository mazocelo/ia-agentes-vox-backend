const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const FfmpegCommand = require("fluent-ffmpeg");
const axios = require("axios");
const speech = require("@google-cloud/speech");

const client = new speech.SpeechClient({
    keyFilename: "dev-key.json",
});

const ensureDirExists = async (dirPath) => {
    try {
        await fsPromises.mkdir(dirPath, { recursive: true });
    } catch (err) {
        console.error("Erro ao criar diretório:", err);
        throw err;
    }
};

const convertToMonoWav = async (inputPath, clientId) => {
    const timestamp = Date.now();
    const originalName = path.parse(inputPath).name;
    const fileName = `${originalName}_${timestamp}_mono.wav`;

    const outputDir = path.join(process.cwd(), "public", "mono", clientId);
    const outputPath = path.join(outputDir, fileName);

    await ensureDirExists(outputDir);

    return new Promise((resolve, reject) => {
        FfmpegCommand(inputPath)
            .audioChannels(1)
            .audioFrequency(48000)
            .audioCodec("pcm_s16le")
            .format("wav")
            .on("end", () => {
                console.log("✅ Áudio convertido para mono:", outputPath);
                resolve(outputPath);
            })
            .on("error", (err) => {
                console.error("❌ Erro na conversão de áudio:", err);
                reject(err);
            })
            .save(outputPath);
    });
};

const transcribeAudio = async (filePath) => {
    try {
        const fileBuffer = await fsPromises.readFile(filePath);
        const audioBytes = fileBuffer.toString("base64");

        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: "LINEAR16",
                sampleRateHertz: 48000,
                languageCode: "pt-BR",
            },
        };

        const [response] = await client.recognize(request);
        const transcription = response.results
            ?.map((result) => result.alternatives[0].transcript)
            .join("\n");

        return transcription || null;
    } catch (err) {
        console.error("❌ Erro na transcrição:", err);
        return null;
    }
};

const downloadAudio = async (url, clientId) => {
    try {
        const audioId = path.parse(url.split("/").pop()).name;
        const audioDir = path.join("public", "audios", clientId);
        await ensureDirExists(audioDir);

        const outputPath = path.join(audioDir, `${audioId}.ogg`);
        const response = await axios.get(url, { responseType: "arraybuffer" });

        await fsPromises.writeFile(outputPath, response.data);
        console.log("📥 Áudio baixado e salvo:", outputPath);

        return outputPath;
    } catch (err) {
        console.error("❌ Erro ao baixar o áudio:", err);
        throw err;
    }
};

const handleAudio = async (clientId, url) => {
    try {
        const downloadedPath = await downloadAudio(url, clientId);
        const monoPath = await convertToMonoWav(downloadedPath, clientId);
        const transcription = await transcribeAudio(monoPath);

        if (transcription) {
            console.log("📝 Transcrição:", transcription);
        } else {
            console.log("⚠️ Nenhuma transcrição encontrada.");
        }

        return transcription;
    } catch (error) {
        console.error("❌ Erro ao processar o áudio:", error.message || error);
        return null;
    }
};

module.exports = {
    handleAudio,
    convertToMonoWav,
    transcribeAudio,
    downloadAudio,
};

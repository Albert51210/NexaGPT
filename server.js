const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
require("dotenv").config();

const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

let memory = {};

// Load memory
if (fs.existsSync("memory.json")) {
    memory = JSON.parse(fs.readFileSync("memory.json"));
}

// Save memory
function saveMemory() {
    fs.writeFileSync("memory.json", JSON.stringify(memory));
}

app.post("/ask", async (req, res) => {
    const userMessage = req.body.message;
    const userId = req.body.userId || "guest";

    // create memory if not exists
    if (!memory[userId]) {
        memory[userId] = [];
    }

    try {
        memory[userId].push({ role: "user", content: userMessage });

        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are NexaGPT, a helpful AI tutor that teaches coding, answers questions, and explains simply."
                },
                ...memory[userId]
            ]
        });

        const aiReply = response.choices[0].message.content;

        memory[userId].push({ role: "assistant", content: aiReply });

        saveMemory();

        res.json({ reply: aiReply });
    } catch (error) {
        res.json({ reply: "AI error: " + error.message });
    }
});

app.listen(PORT, () => {
    console.log("NexaGPT running on port " + PORT);
});

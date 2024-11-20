const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());

app.use(express.json());
app.post('/append', (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ statusCode: "1", message: "Invalid text input" });
    }

    const filePath = path.join(__dirname, 'assistant_responses.txt');
    fs.appendFile(filePath, text + '  ', (err) => {
        if (err) {
            console.error("Error appending to the file", err);
            return res.status(500).json({ statusCode: "1", message: "Error appending to the file" });
        }
        console.log("Text appended successfully to the file");
    });
});

app.post('/generate', async (req, res) => {
    const { messages } = req.body;

    const filePath = path.join(__dirname, 'assistant_responses.txt');

    const assistantContent = messages.find(msg => msg.role === 'assistant')?.content;
    // if (assistantContent) {
    //     fs.appendFile(filePath, assistantContent + '  ', (err) => {
    //         if (err) {
    //             console.error('Error saving the file', err);
    //             return res.status(500).json({ statusCode: "1", message: "Error saving the file" });
    //         }
    //         console.log('Assistant content saved to file');
    //     });
    // }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading the file', err);
            return res.status(500).json({ statusCode: "1", message: "Error reading the file" });
        }

        const updatedMessages = [...messages];
        const assistantIndex = updatedMessages.findIndex(msg => msg.role === 'assistant');
        if (assistantIndex !== -1) {
            updatedMessages[assistantIndex].content = "Generate cases based on this data"+data;
        }
        const payload = {
            metadata: {
                model: "gpt-3.5-turbo",
                temperature: 0.3,
                max_tokens: 3000,
                resultCount: 1
            },
            messages: updatedMessages
        };
console.log(updatedMessages);
        axios.post('http://services.test2.ff-services-test2.cluster.infoedge.com/prompt-execute-services/prompts/open-ai/chat/completions', payload, {
            headers: {
                "AppId": "123",
                "SystemId": "123",
                "templateCode": "OPENAI_HACKATHON_TEMPLATE_1",
                "key": "94fa171890ec607773c7119f6dc74fb3dceb41c51e9e97cb67cbb21d7d3f8072d3c145a7c0bb499ba17faea29e95a5a4",
                "Content-Type": "application/json",
                "Cookie": "_t_ds=164443871146842901-1686910913-1686910913-1686910913-1686910913"
            }
        })
        .then((response) => {
            console.log(JSON.stringify(payload, null, 2));
            const assistantResponse = response.data.data.results[0];
            res.json({ statusCode: "0", message: "Successful", data: { results: [assistantResponse] } });
        })
        .catch((error) => {
            console.error('Error interacting with the OpenAI API', error);
            res.status(500).json({ statusCode: "1", message: "Error generating test cases" });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

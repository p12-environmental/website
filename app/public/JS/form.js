import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(bodyParser.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, '../public')));


app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/form.html'));
});

app.post('/submit', (req, res) => {
    const { firstName, lastName, email, comments } = req.body;
    console.log('Form Submitted:', req.body);

    
    res.redirect('/success.html');
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


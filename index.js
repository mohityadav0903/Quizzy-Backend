const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const userRoute = require('./routes/users');
const adminRoute = require('./routes/admin');
const formRoute = require('./routes/forms');
app.use(cors());
app.use(express.json());
const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, 
    {
        useNewUrlParser: true,
         useUnifiedTopology: true,
        }
    ).then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.get('/', (req, res) => {
    res.send('Hello World!');
    }
);
app.use('/api/users', userRoute);
app.use('/api/admin', adminRoute);
app.use('/api/forms', formRoute);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    }
);

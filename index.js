const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const dotenv = require('dotenv');
const {Server} = require("socket.io");
const {createServer} = require("http");
const httpServer = createServer(app);
const cors = require('cors');
dotenv.config();
const userRoute = require('./routes/users');
const adminRoute = require('./routes/admin');
const formRoute = require('./routes/forms');
const responseRoute = require('./routes/responses');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const io = new Server(httpServer);
io.on("connection", (socket) => {
    const { id } = socket.client;
    console.log("a user connected, id: ", id);
    socket.on("disconnect", () => {
        console.log("user disconnected, id: ", id);
        });
   /* connect user to form room */
    socket.on("join", (formId) => {
        socket.join(formId);
        console.log("user joined room: ", formId);
    }
    );
    /* send response to form room */
    socket.on("responseAdded", (room) => {
        console.log("response received: ", room.response);
        console.log("sending response to room: ", room.formId);
        socket.to(room.formId).emit("newResponse", room.response);
    }
    );
  });

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
app.use('/api/responses', responseRoute);

httpServer.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
}
);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = __importDefault(require("./routes/sendEmail"));
const status_1 = __importDefault(require("./routes/status"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware for CORS
app.use((0, cors_1.default)({
    origin: 'http://nomadmeshop.com', // Allow your frontend's domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP method
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow cookies or auth headers
}));
// Middleware for parsing requests
app.use(body_parser_1.default.json());
// Handle preflight requests (OPTIONS)
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://nomadmeshop.com');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.sendStatus(200); // Respond with OK
});
// Routes
app.use('/api/sendEmail', sendEmail_1.default);
app.use('/api/status', status_1.default);
// Server Listening
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

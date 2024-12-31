"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const sendEmail_1 = __importDefault(require("./routes/sendEmail")); // Import the email sending route
const status_1 = __importDefault(require("./routes/status")); // Import the new route
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, cors_1.default)({
    origin: ['http://nomadmeshop.com'], // Replace with your frontend's domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add allowed HTTP methods
}));
app.options('*', (0, cors_1.default)({ origin: 'http://nomadmeshop.com', credentials: true }));
app.use(body_parser_1.default.json());
// Routes
app.use('/api/sendEmail', sendEmail_1.default); // Set up the route for sending emails
app.use('/api/status', status_1.default); // Set up the status route
// Server Listening
const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

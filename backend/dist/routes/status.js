"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Simple GET route to test service availability
router.get('/', (req, res) => {
    try {
        res.status(200).json({ message: 'Service is up and running' });
    }
    catch (error) {
        res.status(500).json({ message: 'Service is unavailable', error: error.message });
    }
});
exports.default = router;

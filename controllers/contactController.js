const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const mysql = require('mysql2/promise');
const path = require('path');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ssm = new SSMClient({ region: process.env.AWS_REGION });

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('attachment');

async function getParameter(parameterName) {
    const command = new GetParameterCommand({ Name: parameterName, WithDecryption: true });
    const response = await ssm.send(command);
    return response.Parameter.Value;
}

async function initializeDatabase(connection) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            attachment_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await connection.query(createTableQuery);
}

exports.submitForm = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send('Error uploading file.');
        }

        try {
            const dbUsername = await getParameter(process.env.DB_USERNAME_PARAMETER);
            const dbPassword = await getParameter(process.env.DB_PASSWORD_PARAMETER);
            const dbHost = await getParameter(process.env.DB_HOST_PARAMETER);
            const dbName = await getParameter(process.env.DB_NAME_PARAMETER);

            // Connect to the database
            const connection = await mysql.createConnection({
                host: dbHost,
                user: dbUsername,
                password: dbPassword,
                database: dbName
            });

            // Initialize the database (create table if it doesn't exist)
            await initializeDatabase(connection);

            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `uploads/${Date.now()}_${req.file.originalname}`,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read',
            };

            const data = await s3.send(new PutObjectCommand(params));

            // Insert the form data into the database
            const insertQuery = `
                INSERT INTO submissions (name, email, message, attachment_url)
                VALUES (?, ?, ?, ?)
            `;
            await connection.execute(insertQuery, [req.body.name, req.body.email, req.body.message, data.Location]);

            // Close the database connection
            await connection.end();

            res.send('Form submitted successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error processing form.');
        }
    });
};
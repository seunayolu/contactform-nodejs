const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const mysql = require('mysql2/promise');

const s3 = new S3Client({ region: process.env.AWS_REGION });
const ssm = new SSMClient({ region: process.env.AWS_REGION });

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('attachment');

async function getParameter(parameterName) {
    const command = new GetParameterCommand({ Name: parameterName, WithDecryption: true });
    const response = await ssm.send(command);
    return response.Parameter.Value;
}

async function getDatabaseConnection() {
    const dbUsername = await getParameter(process.env.DB_USERNAME_PARAMETER);
    const dbPassword = await getParameter(process.env.DB_PASSWORD_PARAMETER);
    const dbHost = await getParameter(process.env.DB_HOST_PARAMETER);
    const dbName = await getParameter(process.env.DB_NAME_PARAMETER);

    return mysql.createConnection({
        host: dbHost,
        user: dbUsername,
        password: dbPassword,
        database: dbName,
    });
}

exports.submitForm = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).send('Error uploading file.');
        }

        try {
            const connection = await getDatabaseConnection();

            // Check if table exists, create if it doesn't
            const tableName = 'contacts';
            await connection.query(`
                CREATE TABLE IF NOT EXISTS ${tableName} (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    attachment_url VARCHAR(512),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Insert form data into the database
            const { name, email, message } = req.body;
            const filePath = `uploads/${Date.now()}_${req.file.originalname}`;
            const params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: filePath,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
                ACL: 'public-read',
            };

            await s3.send(new PutObjectCommand(params));

            await connection.query(`
                INSERT INTO ${tableName} (name, email, message, attachment_url)
                VALUES (?, ?, ?, ?)
            `, [name, email, message, filePath]);

            res.send('Form submitted successfully.');
        } catch (error) {
            console.error(error);
            res.status(500).send('Error processing form.');
        }
    });
};

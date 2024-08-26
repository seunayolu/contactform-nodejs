const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const mysql = require('mysql2/promise');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure AWS SDK clients
const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

const getParameter = async (name) => {
  const command = new GetParameterCommand({
    Name: name,
    WithDecryption: true
  });
  const result = await ssmClient.send(command);
  return result.Parameter.Value;
};

const processForm = async (req, res) => {
  try {
    // Fetch DB credentials from AWS Parameter Store
    const db_host = await getParameter(process.env.PARAMETER_STORE_DB_HOST);
    const db_user = await getParameter(process.env.PARAMETER_STORE_DB_USER);
    const db_pass = await getParameter(process.env.PARAMETER_STORE_DB_PASS);
    const db_name = await getParameter(process.env.PARAMETER_STORE_DB_NAME);

    // Connect to the database
    const connection = await mysql.createConnection({
      host: db_host,
      user: db_user,
      password: db_pass,
      database: db_name
    });

    // Create table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        attachment VARCHAR(255) DEFAULT NULL
      )
    `);

    // Handle form data
    const { name, email, message } = req.body;
    let attachmentUrl = null;

    // Upload the file to S3 if an attachment is provided
    if (req.file) {
      const fileStream = fs.createReadStream(req.file.path);
      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `uploads/${path.basename(req.file.originalname)}`,
        Body: fileStream
      };

      const command = new PutObjectCommand(uploadParams);
      const uploadResult = await s3Client.send(command);
      attachmentUrl = `https://${uploadParams.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${uploadParams.Key}`;

      // Clean up local file after upload
      fs.unlinkSync(req.file.path);
    }

    // Insert data into the database
    await connection.query(
      "INSERT INTO contacts (name, email, message, attachment) VALUES (?, ?, ?, ?)",
      [name, email, message, attachmentUrl]
    );

    res.status(200).send("Message sent successfully!");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while processing your request.");
  }
};

module.exports = upload.single('attachment'), processForm;
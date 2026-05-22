const express = require('express');
const sql = require('mssql/msnodesqlv8'); // Forces the native Windows driver
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 1. Configure connection using native Windows Trusted Authentication
const config = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost\\SQLEXPRESS;Database=swagphdb;Trusted_Connection=yes;',
    options: {
        enableArithAbort: true
    }
};

// 2. Establish the connection using Promises
sql.connect(config)
    .then(() => console.log('Connected to SQL Database successfully!'))
    .catch(err => console.error('Database connection failed: ', err));

// 3. REGISTER ROUTE
app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        const pool = await sql.connect(config);
        
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already registered.' });
        }

        const countResult = await pool.request().query('SELECT COUNT(*) as count FROM users');
        const nextIdNumber = countResult.recordset[0].count + 1;
        const generatedUserId = 'USR' + String(nextIdNumber).padStart(3, '0');

        await pool.request()
            .input('user_id', sql.Char(6), generatedUserId)
            .input('full_name', sql.VarChar, fullName)
            .input('email', sql.VarChar, email)
            .input('password_hash', sql.VarChar, password) 
            .input('role', sql.VarChar, 'CLIENT')
            .query('INSERT INTO users (user_id, full_name, email, password_hash, role) VALUES (@user_id, @full_name, @email, @password_hash, @role)');

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// 4. LOGIN ROUTE (Fixed & Synchronized to match Frontend Expectations)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await sql.connect(config);
        
        // Query targets the exact database columns
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query('SELECT user_id, full_name, email, role FROM users WHERE email = @email AND password_hash = @password');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            
            // Nesting the keys accurately inside the user object to lock onto your frontend fields
            res.status(200).json({ 
                message: 'Login successful', 
                user: {
                    user_id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role // 👈 Placed directly inside user block to feed data.user.role
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken');

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', { email });

    // 1. Validate input
    if (!email || !password) {
      console.warn('Missing email or password');
      return res.status(400).json({ message: 'Email and password required.' });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`No user found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.authProvider !== 'local') {
      console.warn(`User exists but is registered with different auth provider: ${user.authProvider}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Check if email is verified
    if (!user.isVerified) {
      console.warn(`User email not verified for email: ${email}`);
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    // 4. Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.warn(`Password mismatch for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    console.log('Credentials validated successfully.');

    // 5. Generate tokens
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    console.log('JWT tokens generated.');

    // 6. Store refresh token
    await RefreshToken.create({ token: refreshToken, userId: user._id });
    console.log('Refresh token stored in DB.');

    // 7. Return response
    console.log(`User ${email} logged in successfully.`);
    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
    });
  } catch (err) {
    console.error('Unexpected login error:', err);
    next(err);
  }
};

module.exports = loginUser;


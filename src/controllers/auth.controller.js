// backend/src/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {User} = require('~/models');

async function generateHash() {
  const password = "admin123";
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log("Password hash:", hash);
  } catch (err) {
    console.error("Error generating hash:", err);
  }
}


const login = async (req, res) => {
  const { email, password } = req.body;
  generateHash()
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
   
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log(user)

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
        data:{ token,status:true ,role: user.role}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req,res) =>{
  try {
    const id = req.user.id
    console.log("ID:",id)

    const user = await User.findOne({
      where:{
        id
      },
      attributes: { exclude: ['password'] },
    })
    
    return res.json({
      data:{
        user
      }
    })
  } catch (error) {
    
  }
}

module.exports ={
   login,
   getMe
}
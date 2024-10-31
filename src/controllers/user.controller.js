const { User } = require('~/models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

  // Get all users with pagination and search
const getUsers = async(req, res) =>{
    try {
      const { page = 1, limit = 10, search = '', role } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };

      if (role) {
        whereClause.role = role;
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: { exclude: ['password'] }, // Don't send password in response
        order: [['createdAt', 'DESC']]
      });

      res.json({
        data:{
            rows
        }
        // total: count,
        // totalPages: Math.ceil(count / limit),
        // currentPage: parseInt(page),
      });
    } catch (error) {
      res.status(500).json({ 
        message: 'Error retrieving users',
        error: error.message 
      });
    }
  }

  // Get single user by ID
const getUserById = async(req, res) =>{
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ 
        message: 'Error retrieving user',
        error: error.message 
      });
    }
  }

  // Create new user
const createUser = async(req, res)=> {
    try {
      const { fullName, email, password, role, contract,phone } = req.body;

      // Validate required fields
      if ( !fullName || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        fullName,
        email,
        password: hashedPassword,
        role,
        contract,
        phone,
        status: true
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      res.status(201).json({data:userWithoutPassword});

    } catch (error) {
      res.status(500).json({ 
        message: 'Error creating user',
        error: error.message 
      });
    }
  }

  // Update user
  const updateUser = async(req, res)=> {
    try {
      const { id } = req.params;
      const { fullName, email, password, role, contact } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if email is being changed and if it's already taken
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already registered' });
        }
      }

      // Update user data
      const updateData = {
        fullName: fullName || user.fullName,
        email: email || user.email,
        role: role || user.role,
        contact: contact || user.contact
      };

      // Only update password if provided
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      await user.update(updateData);

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = user.toJSON();
      res.json({data:userWithoutPassword});

    } catch (error) {
      res.status(500).json({ 
        message: 'Error updating user',
        error: error.message 
      });
    }
  }

  // Delete user
 const deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.destroy();
      res.json({ message: 'User deleted successfully' });

    } catch (error) {
      res.status(500).json({ 
        message: 'Error deleting user',
        error: error.message 
      });
    }
  }

module.exports ={
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
}
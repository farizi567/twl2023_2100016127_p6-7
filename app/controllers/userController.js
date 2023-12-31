const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

//NOTE - registerUser
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username) {
    res.status(400);
    return res.json({
      message: "Tolong masukan username anda",
    });
  }
  if (!email) {
    res.status(400);
    return res.json({
      message: "Tolong masukan email anda",
    });
  }
  if (!password) {
    res.status(400);
    return res.json({
      message: "Tolong masukan password anda",
    });
  }

  // Check whether user exist
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    return res.json({
      message: "Email sudah digunakan oleh user lain",
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //NOTE -  Create User
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      status: 201,
      data: {
        _id: user.id,
        username: user.username,
        email: user.email,
      },
      message: "user berhasil ditambahkan",
    });
  } else {
    res.status(400);
    return res.json({
      status: 400,
      message: "gagal membuat data user",
    });
  }
});

//NOTE - loginUser
// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;

//   const user = await User.findOne({ email });

//   console.log(user);
//   if (user && user.password === password) {
//     res.status(200).json({
//       status: 200,
//       message: "Login successful",
//       data: {
//         ...user._doc,
//       },
//     });
//   } else {
//     res.status(400);
//     return res.json({ message: "Invalid login" });
//   }
// });

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      data: {
        ...user._doc,
      },
    });
  } else {
    res.status(400);
    return res.json({ message: "Invalid login" });
  }
});

const getDataUser = async (req, res) => {
  const token = req.headers.authorization;

  if (token) {
    try {
      // Menghapus awalan "Bearer " dari token
      const tokenWithoutBearer = token.replace("Bearer ", "");
      const decodedToken = jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET);
      const userId = decodedToken.userId;
      
      // Cari user berdasarkan userId
      const user = await User.findById(userId);
      
      if (user) {
        res.status(200).json({
          status: 200,
          message: "User data retrieved successfully",
          data: user,
        });
      } else {
        res.status(404).json({
          status: 404,
          message: "User not found",
        });
      }
    } catch (error) {
      res.status(401).json({
        status: 401,
        message: "Invalid token",
      });
    }
  } else {
    res.status(401).json({
      status: 401,
      message: "No token provided",
    });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getDataUser,
};

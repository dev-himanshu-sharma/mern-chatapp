import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";

//signup
export const signup = async (req, res) => {
    // 1. profilepic (lowercase 'p') ko req.body se extract karein
    const { fullName, email, password, bio, profilepic } = req.body; 
   
    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }
        
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: false, message: "User already exists" });
        }

        // 2. Image upload logic
        let imageUrl = "";
        if (profilepic) {
            const uploadResponse = await cloudinary.uploader.upload(profilepic);
            imageUrl = uploadResponse.secure_url;
            console.log("Cloudinary URL:", imageUrl);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio,
            profilepic: imageUrl // MongoDB field 'profilepic' match
        });

        const token = generateToken(newUser._id);
        res.json({
            success: true,
            userData: newUser, 
            token, 
            message: "Account created successfully"
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}
//login controller

export const login = async(req,res)=>{
    try {
        const{email,password} = req.body
        const userData = await User.findOne({email});

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect){
            return res.json({
                success:false,
                message:"Invalid credentials"
            })
        }
        const token = generateToken(userData._id);
        res.json({
            success:true,
            userData,token,
            message:"Login successful"
        })

    } catch (error) {
        console.log(error.message)
        res.json({
            success:false,
            message:error.message
        })

        
    }

}

//check user is authenticated

export const checkAuth = async (req, res) => {
    try {
        res.status(200).json({ 
            success: true, 
            user: req.user // 'user' key hi bhejein taaki frontend se match ho
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilepic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;

    if (!profilepic) {
      
      updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });
    } else {
      const upload = await cloudinary.uploader.upload(profilepic);
      
      updatedUser = await User.findByIdAndUpdate(userId, { 
        profilepic: upload.secure_url, 
        bio, 
        fullName 
      }, { new: true });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
}
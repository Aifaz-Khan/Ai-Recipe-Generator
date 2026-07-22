import User from "../models/User.js";
import UserPreferences from "../models/UserPreferences.js";

/* 
    get user profile
*/
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const preferences = await UserPreferences.findByUserId(req.user.id);
    res.json({
      success: true,
      data: {
        user,
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
    Update user profile
*/

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Update user information
    const user = await User.update(req.user.id, {
      name,
      email,
    });
    res.json({
      success: true,
      message: "Profile updated successfully.",

      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};


/* 
    update user preference
*/
export const updatePreferences = async(req,res,next)=>{
    try{
        const preferences = await UserPreferences.upsert(req.user.id,req.body);
        res.json({
            success:true,
            message:'Preferences updated successfully',
            data:{preferences}
        });
    }catch(error){
        next(error);
    }
};

/*
    Change user password
*/
export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required."
            });
        }

        // Get current user
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Verify current password
        const verifiedUser = await User.verifyPassword(
            user.email,
            currentPassword
        );

        if (!verifiedUser) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        // Update password
        await User.updatePassword(req.user.id, newPassword);

        res.json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        next(error);
    }
};

/*
    Delete user account
*/
export const deleteAccount = async (req, res, next) => {
    try {
        const user = await User.delete(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        res.json({
            success: true,
            message: "Account deleted successfully."
        });

    } catch (error) {
        next(error);
    }
};